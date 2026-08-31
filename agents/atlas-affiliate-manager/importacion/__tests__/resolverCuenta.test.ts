import { describe, it, expect } from "vitest";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { resolverCuentaId, fijarCuentas } from "../resolverCuenta";

function conCuentas(...cuentas: { id: string; plataforma?: string }[]): EstrategiaAfiliacion {
  return {
    herramientaId: "x",
    cuentas: cuentas.map((c) => ({
      id: c.id,
      plataforma: c.plataforma ?? "Programa propio",
      estado: "aprobado",
      enlaces: [],
      ultimaRevision: "2026-08-30",
    })) as EstrategiaAfiliacion["cuentas"],
  };
}

describe("resolverCuentaId", () => {
  it("si la fila nombra la cuenta, manda esa", () => {
    expect(resolverCuentaId({ id: "x", cuenta: "impact", plataforma: "Otra" }, conCuentas({ id: "principal" }))).toBe("impact");
  });

  it("con una sola cuenta existente, actualiza ESA aunque venga la plataforma", () => {
    // El caso que rompía: un CSV con columna plataforma rellena creaba una
    // cuenta paralela en cada herramienta en vez de actualizar la de siempre.
    const existente = conCuentas({ id: "principal", plataforma: "Programa propio" });
    expect(resolverCuentaId({ id: "x", plataforma: "PartnerStack" }, existente)).toBe("principal");
  });

  it("con varias cuentas, elige la que corresponde a esa plataforma", () => {
    const existente = conCuentas({ id: "principal", plataforma: "Programa propio" }, { id: "ps", plataforma: "PartnerStack" });
    expect(resolverCuentaId({ id: "x", plataforma: "partnerstack" }, existente)).toBe("ps");
  });

  it("con varias cuentas y una plataforma nueva, deriva una cuenta nueva", () => {
    const existente = conCuentas({ id: "principal", plataforma: "Programa propio" }, { id: "ps", plataforma: "PartnerStack" });
    expect(resolverCuentaId({ id: "x", plataforma: "Impact" }, existente)).not.toBe("principal");
  });

  it("sin nada guardado y sin plataforma, «principal»", () => {
    expect(resolverCuentaId({ id: "x" }, undefined)).toBe("principal");
  });
});

describe("fijarCuentas", () => {
  it("deja la cuenta escrita en la entrada, para que previa y aplicación coincidan", () => {
    const existentes = new Map([["asana", conCuentas({ id: "principal" })]]);
    const [entrada] = fijarCuentas([{ id: "asana", plataforma: "PartnerStack" }], existentes);
    expect(entrada.cuenta).toBe("principal");
  });
});
