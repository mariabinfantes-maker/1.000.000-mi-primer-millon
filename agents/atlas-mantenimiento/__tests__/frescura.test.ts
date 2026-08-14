import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import {
  DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO,
  DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO,
  detectarCuentasActivasDesactualizadas,
  detectarHerramientasDesactualizadas,
} from "../frescura";

const HOY = "2026-08-06";

function construirCuenta(overrides: Partial<CuentaAfiliado> & Pick<CuentaAfiliado, "id" | "estado">): CuentaAfiliado {
  return { plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-08-01", ...overrides };
}

function construirEstrategia(herramientaId: string, cuentas: CuentaAfiliado[]): EstrategiaAfiliacion {
  return { herramientaId, cuentas };
}

describe("detectarHerramientasDesactualizadas", () => {
  it("no avisa de una herramienta revisada recientemente", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot", fechaUltimaRevision: "2026-08-01" });
    expect(detectarHerramientasDesactualizadas([herramienta], HOY)).toEqual([]);
  });

  it("avisa de una herramienta activa que supera el umbral de días", () => {
    const hace200Dias = "2026-01-18";
    const herramienta = construirHerramienta({
      id: "hubspot",
      nombre: "HubSpot",
      estado: "activo",
      fechaUltimaRevision: hace200Dias,
    });

    const avisos = detectarHerramientasDesactualizadas([herramienta], HOY);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].herramientaId).toBe("hubspot");
    expect(avisos[0].dias).toBeGreaterThanOrEqual(DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO);
    expect(avisos[0].mensaje).toContain("HubSpot");
  });

  it("ignora herramientas descontinuadas o en revisión, aunque lleven mucho tiempo sin revisarse", () => {
    const hace200Dias = "2026-01-18";
    const descontinuada = construirHerramienta({
      id: "descontinuada",
      nombre: "Descontinuada",
      estado: "descontinuado",
      fechaUltimaRevision: hace200Dias,
    });
    const enRevision = construirHerramienta({
      id: "en-revision",
      nombre: "En Revisión",
      estado: "en_revision",
      fechaUltimaRevision: hace200Dias,
    });

    expect(detectarHerramientasDesactualizadas([descontinuada, enRevision], HOY)).toEqual([]);
  });

  it("admite un umbral de días personalizado", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot", fechaUltimaRevision: "2026-08-01" });
    expect(detectarHerramientasDesactualizadas([herramienta], HOY, 3)).toHaveLength(1);
  });
});

describe("detectarCuentasActivasDesactualizadas", () => {
  it("no avisa de una cuenta activa revisada recientemente", () => {
    const estrategias = [
      construirEstrategia("hubspot", [construirCuenta({ id: "partnerstack", estado: "activo", ultimaRevision: "2026-08-01" })]),
    ];
    expect(detectarCuentasActivasDesactualizadas(estrategias, HOY)).toEqual([]);
  });

  it("avisa de una cuenta activa que supera el umbral de días sin revisión", () => {
    const hace200Dias = "2026-01-18";
    const estrategias = [
      construirEstrategia("hubspot", [
        construirCuenta({ id: "partnerstack", estado: "activo", ultimaRevision: hace200Dias }),
      ]),
    ];

    const avisos = detectarCuentasActivasDesactualizadas(estrategias, HOY);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ herramientaId: "hubspot", cuentaId: "partnerstack" });
    expect(avisos[0].dias).toBeGreaterThanOrEqual(DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO);
  });

  it("ignora cuentas que no están en estado activo, aunque lleven mucho tiempo sin revisión", () => {
    const hace200Dias = "2026-01-18";
    const estrategias = [
      construirEstrategia("hubspot", [
        construirCuenta({ id: "pendiente-vieja", estado: "pendiente", ultimaRevision: hace200Dias }),
        construirCuenta({ id: "no-solicitada", estado: "no_solicitado", ultimaRevision: hace200Dias }),
      ]),
    ];

    expect(detectarCuentasActivasDesactualizadas(estrategias, HOY)).toEqual([]);
  });
});
