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

describe("protección MOLNIP_E2E (aislamiento de pruebas E2E)", () => {
  const envOriginal = { ...process.env };

  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("lanza si MOLNIP_E2E=true sin ESTRATEGIA_AFILIACION_DIR configurado", () => {
    process.env.MOLNIP_E2E = "true";
    delete process.env.ESTRATEGIA_AFILIACION_DIR;

    expect(() => getEstrategiaAfiliacion("hubspot")).toThrow(/ESTRATEGIA_AFILIACION_DIR/);
    expect(() => guardarEstrategiaAfiliacion(estrategiaDeEjemplo)).toThrow(/ESTRATEGIA_AFILIACION_DIR/);
  });

  it("lanza si ESTRATEGIA_AFILIACION_DIR apunta exactamente al directorio real", () => {
    process.env.MOLNIP_E2E = "true";
    process.env.ESTRATEGIA_AFILIACION_DIR = path.join(process.cwd(), "data", "estrategia-afiliados");

    expect(() => getEstrategiaAfiliacion("hubspot")).toThrow(/no puede apuntar al directorio real/);
  });

  it("con MOLNIP_E2E=true y un directorio de prueba válido, lee y escribe solo ahí — nunca en el real", () => {
    const dirPruebaAislado = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-e2e-aislado-"));
    process.env.MOLNIP_E2E = "true";
    process.env.ESTRATEGIA_AFILIACION_DIR = dirPruebaAislado;

    guardarEstrategiaAfiliacion(estrategiaDeEjemplo);

    // Se escribió en el directorio aislado...
    expect(fs.existsSync(path.join(dirPruebaAislado, "hubspot.json"))).toBe(true);
    // ...nunca en el directorio real del repositorio.
    const rutaReal = path.join(process.cwd(), "data", "estrategia-afiliados", "hubspot.json");
    const contenidoRealAntes = fs.existsSync(rutaReal) ? fs.readFileSync(rutaReal, "utf-8") : null;
    guardarEstrategiaAfiliacion(estrategiaDeEjemplo);
    const contenidoRealDespues = fs.existsSync(rutaReal) ? fs.readFileSync(rutaReal, "utf-8") : null;
    expect(contenidoRealDespues).toBe(contenidoRealAntes);

    fs.rmSync(dirPruebaAislado, { recursive: true, force: true });
  });

  it("dirBase explícito (tests unitarios normales) sigue funcionando igual con MOLNIP_E2E activo", () => {
    process.env.MOLNIP_E2E = "true";
    process.env.ESTRATEGIA_AFILIACION_DIR = "/una/ruta/que/no/se/usa/porque/dirBase/gana";
    const dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-dirbase-explicito-"));

    guardarEstrategiaAfiliacion(estrategiaDeEjemplo, { dirBase: dirTemporal });
    expect(getEstrategiaAfiliacion("hubspot", { dirBase: dirTemporal })).toEqual(estrategiaDeEjemplo);

    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("sin MOLNIP_E2E (desarrollo o producción normales), sigue usando el directorio real por defecto", () => {
    delete process.env.MOLNIP_E2E;
    delete process.env.ESTRATEGIA_AFILIACION_DIR;

    // No debe lanzar — el comportamiento por defecto de siempre.
    expect(() => getEstrategiaAfiliacion("una-herramienta-que-no-existe")).not.toThrow();
  });
});
