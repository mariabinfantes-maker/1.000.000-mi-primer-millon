import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getEstrategiaAfiliacion,
  getTodasLasEstrategiasAfiliacion,
  guardarEstrategiaAfiliacion,
} from "../repositorioEstrategiaAfiliacion";
import type { EstrategiaAfiliacion } from "../esquemaInterno";

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

describe("repositorioEstrategiaAfiliacion", () => {
  let dirTemporal: string;

  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-estrategia-afiliacion-"));
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("getEstrategiaAfiliacion devuelve undefined si no existe todavía", () => {
    expect(getEstrategiaAfiliacion("hubspot", { dirBase: dirTemporal })).toBeUndefined();
  });

  it("guarda y relee una estrategia de afiliación", () => {
    guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { dirBase: dirTemporal });

    const leida = getEstrategiaAfiliacion("hubspot", { dirBase: dirTemporal });

    expect(leida).toEqual(estrategiaDeEjemplo);
  });

  it("una nueva escritura sobrescribe por completo la anterior para el mismo id", () => {
    guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { dirBase: dirTemporal });
    guardarEstrategiaAfiliacion(
      {
        ...estrategiaDeEjemplo,
        cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "aprobado", fechaAprobacion: "2026-08-20", ultimaRevision: "2026-08-20" }],
      },
      { dirBase: dirTemporal }
    );

    const leida = getEstrategiaAfiliacion("hubspot", { dirBase: dirTemporal });

    expect(leida?.cuentas[0].estado).toBe("aprobado");
    expect(leida?.cuentas[0].fechaAprobacion).toBe("2026-08-20");
  });

  it("getTodasLasEstrategiasAfiliacion devuelve [] si el directorio no existe todavía", () => {
    expect(getTodasLasEstrategiasAfiliacion({ dirBase: dirTemporal })).toEqual([]);
  });

  it("getTodasLasEstrategiasAfiliacion lista todas las guardadas", () => {
    guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { dirBase: dirTemporal });
    guardarEstrategiaAfiliacion({ ...estrategiaDeEjemplo, herramientaId: "odoo" }, { dirBase: dirTemporal });

    const todas = getTodasLasEstrategiasAfiliacion({ dirBase: dirTemporal });

    expect(todas.map((e) => e.herramientaId).sort()).toEqual(["hubspot", "odoo"]);
  });

  it("no mezcla estrategias de ids distintos", () => {
    guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { dirBase: dirTemporal });
    guardarEstrategiaAfiliacion(
      { ...estrategiaDeEjemplo, herramientaId: "odoo", cuentas: [{ ...estrategiaDeEjemplo.cuentas[0], estado: "activo" }] },
      { dirBase: dirTemporal }
    );

    expect(getEstrategiaAfiliacion("hubspot", { dirBase: dirTemporal })?.cuentas[0].estado).toBe("pendiente");
    expect(getEstrategiaAfiliacion("odoo", { dirBase: dirTemporal })?.cuentas[0].estado).toBe("activo");
  });
});
