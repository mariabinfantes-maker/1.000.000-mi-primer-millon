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

  it("exige cita literal para afirmar una ausencia, y dice expresamente que no encontrarlo no basta", () => {
    const prompt = construirPromptPrechequeo("HubSpot");

    expect(prompt).toContain('"citaAusencia"');
    expect(prompt).toContain('"fuenteAusencia"');
    expect(prompt).toContain("No basta con que no hayas encontrado el programa");
  });
});

describe("prechequearAfiliados", () => {
  it('"confirmada" cuando hay programa activo y confidenceLevel no es low', async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: true,
      affiliateStatus: "active",
      confidenceLevel: "medium",
      source: "https://hubspot.com/partners",
    }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.estado).toBe("confirmada");
      expect(resultado.datosAfiliados.hasAffiliateProgram).toBe(true);
    }
    expect(proveedor.generarJson).toHaveBeenCalledWith(expect.stringContaining("HubSpot"));
  });

  it('"hasAffiliateProgram: false" SIN cita es "no_consta", nunca una ausencia demostrada', async () => {
    const proveedor = proveedorFalso(() => ({ hasAffiliateProgram: false, affiliateStatus: "not_available" }));

    const resultado = await prechequearAfiliados("HerramientaSinAfiliados", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.estado).toBe("no_consta");
      expect(resultado.motivo).toContain("no consta");
      expect(resultado.pruebaDeAusencia).toBeUndefined();
    }
  });

  it('"ausencia_demostrada" solo con cita literal y fuente oficial', async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: false,
      affiliateStatus: "not_available",
      citaAusencia: "We do not offer an affiliate or referral program.",
      fuenteAusencia: "https://ejemplo.test/faq",
    }));

    const resultado = await prechequearAfiliados("SinPrograma", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.estado).toBe("ausencia_demostrada");
      expect(resultado.pruebaDeAusencia).toEqual({
        cita: "We do not offer an affiliate or referral program.",
        fuente: "https://ejemplo.test/faq",
      });
    }
  });

  it("una cita sin fuente no es prueba: se queda en no_consta", async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: false,
      citaAusencia: "No tenemos programa de afiliados.",
      fuenteAusencia: "   ",
    }));

    const resultado = await prechequearAfiliados("SinFuente", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.estado).toBe("no_consta");
  });

  it('un programa hallado con confidenceLevel "low" es "no_consta", no una ausencia', async () => {
    const proveedor = proveedorFalso(() => ({
      hasAffiliateProgram: true,
      affiliateStatus: "active",
      confidenceLevel: "low",
    }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.estado).toBe("no_consta");
  });

  it("no se penaliza la ausencia de confidenceLevel", async () => {
    const proveedor = proveedorFalso(() => ({ hasAffiliateProgram: true, affiliateStatus: "active" }));

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.estado).toBe("confirmada");
  });

  it("un fallo del proveedor NO es un estado de afiliación: es un fallo", async () => {
    const proveedor = proveedorFalso(() => {
      throw new Error("La API no está disponible.");
    });

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("La API no está disponible.");
  });

  it("una respuesta ilegible deja el estado en no_consta, no en ausencia", async () => {
    const proveedor = proveedorFalso(() => "esto no es un objeto");

    const resultado = await prechequearAfiliados("HubSpot", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.estado).toBe("no_consta");
  });
});
