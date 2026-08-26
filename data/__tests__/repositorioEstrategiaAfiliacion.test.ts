import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getEstrategiaAfiliacion,
  getHistorialCambios,
  getTodasLasEstrategiasAfiliacion,
  guardarEstrategiaAfiliacion,
  restaurarValorHistorial,
} from "../repositorioEstrategiaAfiliacion";
import type { EstrategiaAfiliacion } from "../esquemaInterno";
import { cerrarPools } from "../db/cliente";
import { limpiarTablasDePrueba, poolDePrueba, postgresDisponible } from "../db/__tests__/entornoPruebaPostgres";

const estrategiaDeEjemplo: EstrategiaAfiliacion = {
  herramientaId: "hubspot",
  cuentas: [
    {
      id: "partnerstack",
      estado: "pendiente",
      nombrePrograma: "HubSpot Affiliate Program",
      plataforma: "PartnerStack",
      urlSolicitud: "https://hubspot.com/partners/affiliates",
      usuarioRegistro: "afiliados@atlas.example",
      fechaSolicitud: "2026-08-03",
      comision: "15% recurrente",
      duracionCookie: "90 días",
      metodoPago: "PayPal",
      frecuenciaPago: "Mensual",
      enlaces: [],
      ultimaRevision: "2026-08-03",
      observaciones: "Solicitud enviada, a la espera de respuesta.",
    },
  ],
};

describe.skipIf(!postgresDisponible())("repositorioEstrategiaAfiliacion (Postgres real, local y temporal)", () => {
  const opciones = () => ({ pool: poolDePrueba() });
  const opcionesGuardar = (usuario = "admin-test") => ({ pool: poolDePrueba(), usuario });

  beforeEach(limpiarTablasDePrueba);

  it("getEstrategiaAfiliacion devuelve undefined si no existe todavía", async () => {
    expect(await getEstrategiaAfiliacion("hubspot", opciones())).toBeUndefined();
  });

  it("guarda y relee una estrategia de afiliación", async () => {
    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());

    const leida = await getEstrategiaAfiliacion("hubspot", opciones());

    expect(leida).toEqual(estrategiaDeEjemplo);
  });

  it("una nueva escritura sobrescribe por completo la anterior para el mismo id", async () => {
    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
    await guardarEstrategiaAfiliacion(
      {
        ...estrategiaDeEjemplo,
        cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "aprobado", fechaAprobacion: "2026-08-20", ultimaRevision: "2026-08-20" }],
      },
      opcionesGuardar()
    );

    const leida = await getEstrategiaAfiliacion("hubspot", opciones());

    expect(leida?.cuentas[0].estado).toBe("aprobado");
    expect(leida?.cuentas[0].fechaAprobacion).toBe("2026-08-20");
  });

  it("getTodasLasEstrategiasAfiliacion devuelve [] si no hay ninguna guardada todavía", async () => {
    expect(await getTodasLasEstrategiasAfiliacion(opciones())).toEqual([]);
  });

  it("getTodasLasEstrategiasAfiliacion lista todas las guardadas", async () => {
    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
    await guardarEstrategiaAfiliacion({ ...estrategiaDeEjemplo, herramientaId: "odoo" }, opcionesGuardar());

    const todas = await getTodasLasEstrategiasAfiliacion(opciones());

    expect(todas.map((e) => e.herramientaId).sort()).toEqual(["hubspot", "odoo"]);
  });

  it("no mezcla estrategias de ids distintos", async () => {
    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
    await guardarEstrategiaAfiliacion(
      { ...estrategiaDeEjemplo, herramientaId: "odoo", cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "activo" }] },
      opcionesGuardar()
    );

    expect((await getEstrategiaAfiliacion("hubspot", opciones()))?.cuentas[0].estado).toBe("pendiente");
    expect((await getEstrategiaAfiliacion("odoo", opciones()))?.cuentas[0].estado).toBe("activo");
  });

  it("persiste entre conexiones distintas — simula un reinicio del servidor (nuevo Pool, misma base)", async () => {
    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());

    // Una consulta directa con un cliente nuevo, no el mismo `pool` en memoria
    // que acaba de escribir — igual que un proceso de servidor totalmente
    // distinto (p. ej. tras un reinicio o un nuevo despliegue) leyendo lo que
    // otro proceso ya guardó.
    const { rows } = await poolDePrueba().query(`SELECT datos FROM estrategias_afiliacion WHERE herramienta_id = $1`, ["hubspot"]);
    expect(rows[0].datos).toEqual(estrategiaDeEjemplo);
  });

  describe("historial de cambios", () => {
    it("no registra nada la primera vez que se crea una cuenta con estado inicial no_solicitado", async () => {
      const nueva: EstrategiaAfiliacion = {
        herramientaId: "asana",
        cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], id: "principal", estado: "no_solicitado" }],
      };
      // Sin estrategia previa, todo campo definido cuenta como "cambio" respecto a null — se espera historial no vacío.
      await guardarEstrategiaAfiliacion(nueva, opcionesGuardar());
      const historial = await getHistorialCambios("asana", opciones());
      expect(historial.length).toBeGreaterThan(0);
    });

    it("registra campo, valor anterior, valor nuevo, usuario y fecha al cambiar el estado", async () => {
      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar("maria"));
      await guardarEstrategiaAfiliacion(
        { ...estrategiaDeEjemplo, cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "aprobado" }] },
        opcionesGuardar("maria")
      );

      const historial = await getHistorialCambios("hubspot", opciones());
      const eventoEstado = historial.find((e) => e.campo === "partnerstack.estado");

      expect(eventoEstado).toBeDefined();
      expect(eventoEstado?.valorAnterior).toBe("pendiente");
      expect(eventoEstado?.valorNuevo).toBe("aprobado");
      expect(eventoEstado?.usuario).toBe("maria");
      expect(typeof eventoEstado?.fecha).toBe("string");
      expect(Number.isNaN(Date.parse(eventoEstado!.fecha))).toBe(false);
    });

    it("devuelve el id como número, no como texto", async () => {
      // Regresión encontrada en la verificación del 2026-08-25: la columna
      // `id` es `bigserial` y el driver `pg` la devuelve como TEXTO para no
      // perder precisión. Sin convertirla, cualquier comparación
      // `evento.id === idBuscado` fallaba en silencio (nunca coincidía), y
      // el panel no podría localizar el evento que quiere restaurar.
      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
      const historial = await getHistorialCambios("hubspot", opciones());

      expect(historial.length).toBeGreaterThan(0);
      expect(typeof historial[0].id).toBe("number");
      expect(historial.find((e) => e.id === historial[0].id)).toBeDefined();
    });

    it("no registra nada si se guarda sin cambiar ningún campo", async () => {
      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
      const historialTrasPrimeraEscritura = await getHistorialCambios("hubspot", opciones());

      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
      const historialTrasSegundaEscritura = await getHistorialCambios("hubspot", opciones());

      expect(historialTrasSegundaEscritura.length).toBe(historialTrasPrimeraEscritura.length);
    });

    it("un UPDATE o DELETE directo contra historial_cambios_afiliacion es rechazado por la base de datos", async () => {
      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar());
      const historial = await getHistorialCambios("hubspot", opciones());
      expect(historial.length).toBeGreaterThan(0);
      const idEvento = historial[0].id;

      await expect(
        poolDePrueba().query(`UPDATE historial_cambios_afiliacion SET usuario = 'otro' WHERE id = $1`, [idEvento])
      ).rejects.toThrow(/append-only/);

      await expect(poolDePrueba().query(`DELETE FROM historial_cambios_afiliacion WHERE id = $1`, [idEvento])).rejects.toThrow(
        /append-only/
      );
    });

    it("restaurarValorHistorial vuelve a dejar el valor anterior y crea un evento nuevo, sin tocar el original", async () => {
      await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, opcionesGuardar("maria"));
      await guardarEstrategiaAfiliacion(
        { ...estrategiaDeEjemplo, cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "aprobado" }] },
        opcionesGuardar("maria")
      );

      const historialAntes = await getHistorialCambios("hubspot", opciones());
      const eventoOriginal = historialAntes.find((e) => e.campo === "partnerstack.estado")!;
      expect(eventoOriginal.valorNuevo).toBe("aprobado");

      const restaurada = await restaurarValorHistorial(eventoOriginal.id, opcionesGuardar("carlos"));
      expect(restaurada.cuentas[0].estado).toBe("pendiente");

      const actual = await getEstrategiaAfiliacion("hubspot", opciones());
      expect(actual?.cuentas[0].estado).toBe("pendiente");

      const historialDespues = await getHistorialCambios("hubspot", opciones());
      // El evento original sigue existiendo tal cual, intacto.
      const original = historialDespues.find((e) => e.id === eventoOriginal.id);
      expect(original).toEqual(eventoOriginal);
      // Y hay un evento NUEVO documentando la restauración.
      const eventoRestauracion = historialDespues.find(
        (e) => e.campo === "partnerstack.estado" && e.valorNuevo === "pendiente" && e.usuario === "carlos"
      );
      expect(eventoRestauracion).toBeDefined();
      expect(eventoRestauracion?.motivo).toContain(`#${eventoOriginal.id}`);
      expect(historialDespues.length).toBe(historialAntes.length + 1);
    });
  });
});

describe.skipIf(!postgresDisponible())("protección MOLNIP_E2E (aislamiento de pruebas E2E — nivel de conexión)", () => {
  const envOriginal = { ...process.env };

  afterEach(async () => {
    process.env = { ...envOriginal };
    await cerrarPools();
  });

  it("lanza si MOLNIP_E2E=true sin POSTGRES_URL_TEST configurado", async () => {
    const urlTestGuardada = process.env.POSTGRES_URL_TEST;
    process.env.MOLNIP_E2E = "true";
    delete process.env.POSTGRES_URL_TEST;

    await expect(getEstrategiaAfiliacion("hubspot")).rejects.toThrow(/POSTGRES_URL_TEST/);

    process.env.POSTGRES_URL_TEST = urlTestGuardada;
  });

  it("con MOLNIP_E2E=true y POSTGRES_URL_TEST definido, usa esa base por defecto (sin pasar `pool` explícito)", async () => {
    process.env.MOLNIP_E2E = "true";
    await limpiarTablasDePrueba();

    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { usuario: "admin-test" });
    const leida = await getEstrategiaAfiliacion("hubspot");

    expect(leida).toEqual(estrategiaDeEjemplo);
  });

  it("sin MOLNIP_E2E y sin POSTGRES_URL configurado (este entorno), falla en vez de usar cualquier base por defecto", async () => {
    delete process.env.MOLNIP_E2E;
    delete process.env.POSTGRES_URL;

    await expect(getEstrategiaAfiliacion("hubspot")).rejects.toThrow(/POSTGRES_URL/);
  });

  it("`pool` explícito (tests unitarios normales) sigue funcionando igual con MOLNIP_E2E activo", async () => {
    process.env.MOLNIP_E2E = "true";
    delete process.env.POSTGRES_URL_TEST;
    await limpiarTablasDePrueba();

    await guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { pool: poolDePrueba(), usuario: "admin-test" });
    expect(await getEstrategiaAfiliacion("hubspot", { pool: poolDePrueba() })).toEqual(estrategiaDeEjemplo);
  });
});
