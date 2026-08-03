import { describe, expect, it } from "vitest";
import { detectarCuentasActivasSinEnlace, detectarCuentasEstancadas } from "../consistencia";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";

function construirCuenta(overrides: Partial<CuentaAfiliado> & Pick<CuentaAfiliado, "id" | "estado">): CuentaAfiliado {
  return {
    plataforma: "PartnerStack",
    enlaces: [],
    ultimaRevision: "2026-08-03",
    ...overrides,
  };
}

function construirEstrategia(herramientaId: string, cuentas: CuentaAfiliado[]): EstrategiaAfiliacion {
  return { herramientaId, cuentas };
}

describe("detectarCuentasActivasSinEnlace", () => {
  it("no avisa si no hay ninguna estrategia", () => {
    expect(detectarCuentasActivasSinEnlace([])).toEqual([]);
  });

  it("no avisa de una cuenta activa que sí tiene enlace", () => {
    const estrategias = [
      construirEstrategia("hubspot", [
        construirCuenta({ id: "partnerstack", estado: "activo", enlaces: [{ segmento: "global", url: "https://x.com" }] }),
      ]),
    ];
    expect(detectarCuentasActivasSinEnlace(estrategias)).toEqual([]);
  });

  it("avisa de una cuenta activa sin ningún enlace", () => {
    const estrategias = [construirEstrategia("hubspot", [construirCuenta({ id: "partnerstack", estado: "activo", enlaces: [] })])];

    const avisos = detectarCuentasActivasSinEnlace(estrategias);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].herramientaId).toBe("hubspot");
    expect(avisos[0].cuentaId).toBe("partnerstack");
    expect(avisos[0].mensaje).toContain("sin ningún");
  });

  it("no avisa de cuentas sin enlace si no están activas", () => {
    const estrategias = [
      construirEstrategia("hubspot", [
        construirCuenta({ id: "pendiente", estado: "pendiente", enlaces: [] }),
        construirCuenta({ id: "rechazada", estado: "rechazado", enlaces: [] }),
        construirCuenta({ id: "no-solicitada", estado: "no_solicitado", enlaces: [] }),
      ]),
    ];
    expect(detectarCuentasActivasSinEnlace(estrategias)).toEqual([]);
  });

  it("detecta varias cuentas afectadas, en varias herramientas", () => {
    const estrategias = [
      construirEstrategia("hubspot", [construirCuenta({ id: "a", estado: "activo", enlaces: [] })]),
      construirEstrategia("odoo", [
        construirCuenta({ id: "b", estado: "activo", enlaces: [] }),
        construirCuenta({ id: "c", estado: "activo", enlaces: [{ segmento: "global", url: "https://x.com" }] }),
      ]),
    ];

    const avisos = detectarCuentasActivasSinEnlace(estrategias);

    expect(avisos).toHaveLength(2);
    expect(avisos.map((a) => `${a.herramientaId}/${a.cuentaId}`).sort()).toEqual(["hubspot/a", "odoo/b"]);
  });
});

describe("detectarCuentasEstancadas", () => {
  it("no avisa si no hay ninguna estrategia", () => {
    expect(detectarCuentasEstancadas([], "2026-08-03")).toEqual([]);
  });

  it("no avisa de una cuenta pendiente reciente", () => {
    const estrategias = [
      construirEstrategia("hubspot", [construirCuenta({ id: "a", estado: "pendiente", ultimaRevision: "2026-07-20" })]),
    ];
    expect(detectarCuentasEstancadas(estrategias, "2026-08-03")).toEqual([]);
  });

  it("avisa de una cuenta pendiente que supera el umbral por defecto (60 días)", () => {
    const estrategias = [
      construirEstrategia("hubspot", [construirCuenta({ id: "a", estado: "pendiente", ultimaRevision: "2026-01-01" })]),
    ];

    const avisos = detectarCuentasEstancadas(estrategias, "2026-08-03");

    expect(avisos).toHaveLength(1);
    expect(avisos[0].mensaje).toContain("pendiente desde hace");
  });

  it("respeta un umbral de días personalizado", () => {
    const estrategias = [
      construirEstrategia("hubspot", [construirCuenta({ id: "a", estado: "pendiente", ultimaRevision: "2026-07-20" })]),
    ];

    expect(detectarCuentasEstancadas(estrategias, "2026-08-03", 5)).toHaveLength(1);
    expect(detectarCuentasEstancadas(estrategias, "2026-08-03", 90)).toEqual([]);
  });

  it("ignora cuentas que no están en estado pendiente, sin importar la antigüedad", () => {
    const estrategias = [
      construirEstrategia("hubspot", [
        construirCuenta({ id: "activo", estado: "activo", ultimaRevision: "2020-01-01" }),
        construirCuenta({ id: "rechazado", estado: "rechazado", ultimaRevision: "2020-01-01" }),
        construirCuenta({ id: "no-solicitado", estado: "no_solicitado", ultimaRevision: "2020-01-01" }),
      ]),
    ];
    expect(detectarCuentasEstancadas(estrategias, "2026-08-03")).toEqual([]);
  });
});
