import { describe, expect, it } from "vitest";
import { elegirEnlaceAfiliado } from "../seleccionarEnlace";
import type { CuentaAfiliado } from "@/data/esquemaInterno";

function construirCuenta(overrides: Partial<CuentaAfiliado> & Pick<CuentaAfiliado, "id" | "estado">): CuentaAfiliado {
  return {
    plataforma: "PartnerStack",
    enlaces: [],
    ultimaRevision: "2026-08-03",
    ...overrides,
  };
}

describe("elegirEnlaceAfiliado", () => {
  it("devuelve undefined si no hay ninguna cuenta", () => {
    expect(elegirEnlaceAfiliado([], "global")).toBeUndefined();
  });

  it("ignora cuentas que no están activas, aunque tengan un enlace que coincida", () => {
    const cuentas = [
      construirCuenta({ id: "pendiente", estado: "pendiente", enlaces: [{ segmento: "global", url: "https://ejemplo.com/pendiente" }] }),
      construirCuenta({ id: "rechazada", estado: "rechazado", enlaces: [{ segmento: "global", url: "https://ejemplo.com/rechazada" }] }),
      construirCuenta({ id: "no-solicitada", estado: "no_solicitado", enlaces: [{ segmento: "global", url: "https://ejemplo.com/ns" }] }),
    ];

    expect(elegirEnlaceAfiliado(cuentas, "global")).toBeUndefined();
  });

  it("devuelve el enlace del segmento exacto de una cuenta activa", () => {
    const cuentas = [
      construirCuenta({
        id: "partnerstack",
        estado: "activo",
        enlaces: [
          { segmento: "global", url: "https://ejemplo.com/global" },
          { segmento: "ES", url: "https://ejemplo.com/es" },
        ],
      }),
    ];

    expect(elegirEnlaceAfiliado(cuentas, "ES")).toBe("https://ejemplo.com/es");
  });

  it("cae al segmento global si no hay coincidencia exacta", () => {
    const cuentas = [
      construirCuenta({
        id: "partnerstack",
        estado: "activo",
        enlaces: [{ segmento: "global", url: "https://ejemplo.com/global" }],
      }),
    ];

    expect(elegirEnlaceAfiliado(cuentas, "LatAm")).toBe("https://ejemplo.com/global");
  });

  it("devuelve undefined si la única cuenta activa no tiene ningún enlace", () => {
    const cuentas = [construirCuenta({ id: "partnerstack", estado: "activo", enlaces: [] })];

    expect(elegirEnlaceAfiliado(cuentas, "global")).toBeUndefined();
  });

  it("prioriza el segmento exacto sobre 'global', sin importar en qué cuenta esté cada uno", () => {
    const cuentas = [
      construirCuenta({ id: "global-primero", estado: "activo", enlaces: [{ segmento: "global", url: "https://ejemplo.com/global" }] }),
      construirCuenta({ id: "es-segundo", estado: "activo", enlaces: [{ segmento: "ES", url: "https://ejemplo.com/es" }] }),
    ];

    expect(elegirEnlaceAfiliado(cuentas, "ES")).toBe("https://ejemplo.com/es");
  });

  it("busca entre todas las cuentas activas hasta encontrar una coincidencia", () => {
    const cuentas = [
      construirCuenta({ id: "sin-enlaces", estado: "activo", enlaces: [] }),
      construirCuenta({ id: "con-global", estado: "activo", enlaces: [{ segmento: "global", url: "https://ejemplo.com/global" }] }),
    ];

    expect(elegirEnlaceAfiliado(cuentas, "LatAm")).toBe("https://ejemplo.com/global");
  });
});
