import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cerrarPools } from "@/data/db/cliente";
import { limpiarTablasDePrueba, poolDePrueba, postgresDisponible } from "@/data/db/__tests__/entornoPruebaPostgres";
import {
  anotarIngreso,
  contarClicsPorHerramienta,
  contarClicsPorRuta,
  registrarClicSaliente,
  sumarIngresosConfirmados,
} from "../repositorio";

/**
 * Atlas Revenue contra Postgres de verdad.
 *
 * Dos cosas se demuestran aquí y las dos importan por motivos distintos: que
 * el clic **se guarda** (sin eso el piloto no puede responder a su propia
 * pregunta) y que **no se guarda nada más** — la promesa de privacidad no es
 * una intención, es la forma de la tabla.
 */

const hayPostgres = postgresDisponible();
const describeSiHay = hayPostgres ? describe : describe.skip;

describeSiHay("registro del clic saliente", () => {
  const pool = () => poolDePrueba();
  beforeEach(limpiarTablasDePrueba);
  afterEach(cerrarPools);

  const clic = {
    herramientaId: "systeme-io",
    categoriaId: "plataformas-todo-en-uno",
    tipoEnlace: "afiliado" as const,
    origen: "resultado" as const,
  };

  it("un clic queda guardado, no perdido en un log", async () => {
    expect(await registrarClicSaliente(clic, { pool: pool() })).toBe(true);
    const filas = await contarClicsPorHerramienta({ pool: pool() });
    expect(filas).toEqual([{ herramientaId: "systeme-io", total: 1, porAfiliado: 1, porOficial: 0 }]);
  });

  it("distingue el clic que pudo cobrar del que se fue por la URL oficial", async () => {
    await registrarClicSaliente(clic, { pool: pool() });
    await registrarClicSaliente({ ...clic, tipoEnlace: "oficial" }, { pool: pool() });
    await registrarClicSaliente({ ...clic, tipoEnlace: "oficial" }, { pool: pool() });
    const [fila] = await contarClicsPorHerramienta({ pool: pool() });
    expect(fila).toEqual({ herramientaId: "systeme-io", total: 3, porAfiliado: 1, porOficial: 2 });
  });

  it("agrupa por recorrido de entrada", async () => {
    await registrarClicSaliente({ ...clic, rutaOrigen: "categoria:crm" }, { pool: pool() });
    await registrarClicSaliente({ ...clic, rutaOrigen: "categoria:crm" }, { pool: pool() });
    await registrarClicSaliente({ ...clic, rutaOrigen: "objetivo:ahorrar-tiempo" }, { pool: pool() });
    await registrarClicSaliente(clic, { pool: pool() });
    expect(await contarClicsPorRuta({ pool: pool() })).toEqual([
      { rutaOrigen: "categoria:crm", total: 2 },
      { rutaOrigen: "objetivo:ahorrar-tiempo", total: 1 },
      { rutaOrigen: "sin-ruta", total: 1 },
    ]);
  });

  it("una etiqueta de recorrido inválida no se guarda, pero el clic sí", async () => {
    await registrarClicSaliente({ ...clic, rutaOrigen: "usuario:maria" }, { pool: pool() });
    expect(await contarClicsPorRuta({ pool: pool() })).toEqual([{ rutaOrigen: "sin-ruta", total: 1 }]);
    expect((await contarClicsPorHerramienta({ pool: pool() }))[0].total).toBe(1);
  });

  it("NUNCA lanza: una base de datos caída no puede romper la salida del usuario", async () => {
    const poolRoto = { query: async () => { throw new Error("conexión caída"); } } as never;
    await expect(registrarClicSaliente(clic, { pool: poolRoto })).resolves.toBe(false);
  });

  it("la tabla no tiene NINGUNA columna que identifique a una persona", async () => {
    const { rows } = await pool().query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'clics_salientes'`
    );
    const columnas = rows.map((r) => r.column_name).sort();
    // La lista completa, escrita a mano: si alguien añade una columna, esta
    // prueba falla y obliga a justificarla.
    expect(columnas).toEqual([
      "categoria_id",
      "fecha",
      "herramienta_id",
      "id",
      "origen",
      "ruta_origen",
      "tipo_enlace",
    ]);
    for (const prohibida of ["ip", "direccion_ip", "user_agent", "referer", "sesion", "session_id", "cookie", "usuario", "email"])
      expect(columnas, `apareció "${prohibida}"`).not.toContain(prohibida);
  });
});

describeSiHay("ingresos anotados a mano", () => {
  const pool = () => poolDePrueba();
  beforeEach(limpiarTablasDePrueba);
  afterEach(cerrarPools);

  const asiento = {
    herramientaId: "systeme-io",
    periodo: "2026-08",
    conversiones: 2,
    importeCentimos: 4700,
    moneda: "EUR",
    estado: "confirmado" as const,
    fuente: "Panel de Systeme.io",
  };

  it("suma lo confirmado", async () => {
    await anotarIngreso(asiento, { pool: pool(), usuario: "propietaria" });
    expect(await sumarIngresosConfirmados({ pool: pool() })).toEqual([
      { herramientaId: "systeme-io", moneda: "EUR", conversiones: 2, importeCentimos: 4700 },
    ]);
  });

  it("lo pendiente NO cuenta como ingreso: el proveedor todavía puede retirarlo", async () => {
    await anotarIngreso({ ...asiento, estado: "pendiente" }, { pool: pool(), usuario: "propietaria" });
    expect(await sumarIngresosConfirmados({ pool: pool() })).toEqual([
      { herramientaId: "systeme-io", moneda: "EUR", conversiones: 0, importeCentimos: 0 },
    ]);
  });

  it("una reversión por reembolso resta, y deja rastro", async () => {
    await anotarIngreso(asiento, { pool: pool(), usuario: "propietaria" });
    await anotarIngreso({ ...asiento, estado: "revertido", conversiones: 1, importeCentimos: 2350 },
      { pool: pool(), usuario: "propietaria" });
    expect(await sumarIngresosConfirmados({ pool: pool() })).toEqual([
      { herramientaId: "systeme-io", moneda: "EUR", conversiones: 1, importeCentimos: 2350 },
    ]);
    const { rows } = await pool().query(`SELECT count(*)::int AS n FROM ingresos_afiliacion`);
    expect(rows[0].n, "los dos asientos siguen ahí").toBe(2);
  });

  it("es append-only a nivel de base de datos, no por disciplina", async () => {
    await anotarIngreso(asiento, { pool: pool(), usuario: "propietaria" });
    await expect(pool().query(`UPDATE ingresos_afiliacion SET importe_centimos = 999999`)).rejects.toThrow(/append-only/);
    await expect(pool().query(`DELETE FROM ingresos_afiliacion`)).rejects.toThrow(/append-only/);
  });
});
