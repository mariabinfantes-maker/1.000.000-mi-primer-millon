import { describe, it, expect } from "vitest";
import { Pool } from "pg";
import { poolDePrueba, postgresDisponible } from "./entornoPruebaPostgres";
import { SENTENCIAS_ESQUEMA } from "../esquema";
import { tablasEsperadas, triggersEsperados, verificarEsquema } from "../verificarEsquema";

describe("lo que se espera del esquema se deduce del propio esquema", () => {
  it("encuentra las cuatro tablas con sus columnas", () => {
    const tablas = tablasEsperadas();
    expect(tablas.map((t) => t.tabla).sort()).toEqual([
      "clics_salientes",
      "estrategias_afiliacion",
      "historial_cambios_afiliacion",
      "ingresos_afiliacion",
    ]);
    const clics = tablas.find((t) => t.tabla === "clics_salientes")!;
    expect(clics.columnas).toEqual([
      "id", "herramienta_id", "categoria_id", "tipo_enlace", "origen", "ruta_origen", "fecha",
    ]);
  });

  it("no confunde un PRIMARY KEY de tabla con una columna", () => {
    const tablas = tablasEsperadas([
      `CREATE TABLE IF NOT EXISTS ejemplo (
         a text,
         b timestamptz NOT NULL DEFAULT now(),
         PRIMARY KEY (a, b)
       )`,
    ]);
    expect(tablas[0].columnas).toEqual(["a", "b"]);
  });

  it("encuentra los dos triggers y la tabla de cada uno", () => {
    expect(triggersEsperados().sort((x, y) => x.trigger.localeCompare(y.trigger))).toEqual([
      { trigger: "historial_solo_insertar", tabla: "historial_cambios_afiliacion" },
      { trigger: "ingresos_solo_insertar", tabla: "ingresos_afiliacion" },
    ]);
  });
});

describe.skipIf(!postgresDisponible())("verificarEsquema contra un Postgres real", () => {
  const pool = () => poolDePrueba();

  it("una base vacía se señala como incompleta, nombrando lo que falta", async () => {
    const esquema = `verif_${Date.now()}`;
    await pool().query(`CREATE SCHEMA ${esquema}`);
    const aislado = new Pool({ connectionString: process.env.POSTGRES_URL_TEST });
    try {
      const problemas = await verificarEsquema({
        query: (texto) => aislado.query(texto.replace(/'public'/g, `'${esquema}'`)),
      });
      expect(problemas).toContain("falta la tabla clics_salientes");
      expect(problemas).toContain("falta la tabla ingresos_afiliacion");
      expect(problemas.some((p) => p.includes("historial_solo_insertar"))).toBe(true);
    } finally {
      await aislado.end();
      await pool().query(`DROP SCHEMA ${esquema} CASCADE`);
    }
  });

  it("tras aplicar el esquema no queda ningún problema", async () => {
    const problemas = await verificarEsquema(pool());
    expect(problemas).toEqual([]);
  });

  it("detecta que una tabla ha perdido su trigger de solo-inserción", async () => {
    await pool().query("DROP TRIGGER ingresos_solo_insertar ON ingresos_afiliacion");
    try {
      const problemas = await verificarEsquema(pool());
      expect(problemas).toEqual([
        "falta el trigger ingresos_solo_insertar sobre ingresos_afiliacion (la tabla quedaría modificable)",
      ]);
    } finally {
      await pool().query(SENTENCIAS_ESQUEMA.find((s) => /CREATE TRIGGER ingresos_solo_insertar/.test(s))!);
    }
    expect(await verificarEsquema(pool())).toEqual([]);
  });
});

describe.skipIf(!postgresDisponible())("el aprovisionamiento no puede dejar una tabla desprotegida", () => {
  /**
   * Dos triggers se recrean en cada pasada: primero DROP, después CREATE.
   * Sin transacción, un fallo entre esas dos sentencias —un corte de red
   * contra Neon a mitad— dejaría `historial_cambios_afiliacion`, que ya
   * está en producción y con datos, aceptando UPDATE y DELETE. Y el aviso
   * saldría como un error de aprovisionamiento cualquiera, sin mencionar
   * que además ha quedado desprotegida.
   */
  it("un fallo a mitad lo deshace todo y los triggers siguen en su sitio", async () => {
    const cliente = await poolDePrueba().connect();
    try {
      await cliente.query("BEGIN");
      for (const sentencia of SENTENCIAS_ESQUEMA) await cliente.query(sentencia);
      // El corte, justo después de haber recreado los triggers.
      await expect(cliente.query("SELECT * FROM tabla_que_no_existe")).rejects.toThrow();
      await cliente.query("ROLLBACK");
    } finally {
      cliente.release();
    }

    expect(await verificarEsquema(poolDePrueba())).toEqual([]);
  });

  it("sin transacción, ese mismo corte SÍ dejaría la tabla desprotegida (control negativo)", async () => {
    const pool = poolDePrueba();
    const indiceDrop = SENTENCIAS_ESQUEMA.findIndex((s) =>
      /DROP TRIGGER IF EXISTS historial_solo_insertar/.test(s)
    );
    expect(indiceDrop).toBeGreaterThan(-1);

    // Se reproduce el comportamiento anterior: sentencia a sentencia, sin
    // transacción, cortando justo después del DROP.
    for (const sentencia of SENTENCIAS_ESQUEMA.slice(0, indiceDrop + 1)) await pool.query(sentencia);

    const problemas = await verificarEsquema(pool);
    expect(problemas).toContain(
      "falta el trigger historial_solo_insertar sobre historial_cambios_afiliacion (la tabla quedaría modificable)"
    );

    // Se restaura para no dejar el entorno de pruebas a medias.
    for (const sentencia of SENTENCIAS_ESQUEMA.slice(indiceDrop + 1)) await pool.query(sentencia);
    expect(await verificarEsquema(pool)).toEqual([]);
  });
});
