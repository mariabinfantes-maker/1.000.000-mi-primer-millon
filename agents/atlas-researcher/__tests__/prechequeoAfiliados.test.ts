import { describe, expect, it, vi } from "vitest";
import { construirPromptPrechequeo, prechequearAfiliados } from "../prechequeoAfiliados";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return {
    nombre: "proveedor-falso",
    generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)),
  };
}

describe("construirPromptPrechequeo", () => {
  it("incluye el nombre de la herramienta y pide solo los campos del prechequeo", () => {
    const prompt = construirPromptPrechequeo("HubSpot");

    expect(prompt).toContain("HubSpot");
    expect(prompt).toContain('"hasAffiliateProgram"');
    expect(prompt).toContain('"confidenceLevel"');
    // No debe pedir datos públicos ni el resto de campos de afiliación: es un filtro previo, no la investigación completa.
    expect(prompt).not.toContain('"descripcion"');
    expect(prompt).not.toContain('"commission"');
    expect(prompt).not.toContain('"cookieDuration"');
  });
});

describe("prechequearAfiliados", () => {
  it("acepta cuando hay programa activo y confidenceLevel no es low", async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: true,
      affiliateStatus: "active",
      confidenceLevel: "medium",
      source: "https://hubspot.com/partners",
    }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(true);
    if (resultado.tieneProgramaFiable) {
      expect(resultado.datosAfiliados.hasAffiliateProgram).toBe(true);
    }
    expect(proveedor.generarJson).toHaveBeenCalledWith(expect.stringContaining("HubSpot"));
  });

  it("descarta cuando no tiene programa de afiliados", async () => {
    const proveedor = proveedorFalso(() => ({ hasAffiliateProgram: false, affiliateStatus: "not_available" }));

    const resultado = await prechequearAfiliados("HerramientaSinAfiliados", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(false);
    if (!resultado.tieneProgramaFiable) {
      expect(resultado.motivo).toContain("prechequeo");
    }
  });

  it("descarta cuando el programa existe pero confidenceLevel es low", async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: true,
      affiliateStatus: "active",
      confidenceLevel: "low",
    }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(false);
  });

  it("acepta cuando no se declara confidenceLevel (no se penaliza por ausencia, igual que la regla de agente.ts)", async () => {
    const proveedor = proveedorFalso(() => ({ hasAffiliateProgram: true, affiliateStatus: "active" }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(true);
  });

  it("no lanza si el proveedor falla: lo trata como no fiable", async () => {
    const proveedor = proveedorFalso(() => {
      throw new Error("La API no está disponible.");
    });

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(false);
    if (!resultado.tieneProgramaFiable) {
      expect(resultado.motivo).toContain("La API no está disponible.");
    }
  });

  it("no lanza si la respuesta no es un objeto JSON utilizable", async () => {
    const proveedor = proveedorFalso(() => "esto no es un objeto");

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.tieneProgramaFiable).toBe(false);
  });
});
