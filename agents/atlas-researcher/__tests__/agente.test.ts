import { describe, expect, it, vi } from "vitest";
import { investigarHerramienta } from "../agente";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return {
    nombre: "proveedor-falso",
    generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)),
  };
}

/** AffiliateData que sí cumple la regla obligatoria de Atlas: programa activo y no marcado como confidenceLevel "low". */
const affiliateDataFiable = {
  hasAffiliateProgram: true,
  affiliateUrl: "https://hubspot.com/partners/affiliates",
  affiliateStatus: "active" as const,
  confidenceLevel: "medium" as const,
};

describe("investigarHerramienta", () => {
  it("en el camino feliz, envía un prompt al proveedor y devuelve una propuesta validada, con datos y datosAfiliados separados", async () => {
    const proveedor = proveedorFalso(() => ({
      datos: { nombre: "HubSpot", descripcion: "Un CRM." },
      affiliateData: affiliateDataFiable,
      fuentes: ["https://hubspot.com"],
    }));

    const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.propuesta.datos.nombre).toBe("HubSpot");
      expect(resultado.propuesta.fuentes).toEqual(["https://hubspot.com"]);
      expect(resultado.propuesta.datosAfiliados.hasAffiliateProgram).toBe(true);
      // datos (público) nunca debe llevar ningún campo de afiliación mezclado.
      expect(resultado.propuesta.datos).not.toHaveProperty("affiliateUrl");
      expect(resultado.propuesta.datos).not.toHaveProperty("hasAffiliateProgram");
    }
    expect(proveedor.generarJson).toHaveBeenCalledTimes(1);
    expect(proveedor.generarJson).toHaveBeenCalledWith(expect.stringContaining("HubSpot"));
  });

  it("si el proveedor lanza un error, lo devuelve como resultado ok:false sin propagarlo", async () => {
    const proveedor = proveedorFalso(() => {
      throw new Error("La API de Gemini no está disponible.");
    });

    const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toBe("La API de Gemini no está disponible.");
    }
  });

  it("si el proveedor devuelve algo que no es JSON válido para el esquema, no lanza (y se descarta, al no poder confirmar programa de afiliados)", async () => {
    const proveedor = proveedorFalso(() => "esto no es un objeto");

    const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(false);
  });

  describe("regla obligatoria del programa de afiliados", () => {
    it("descarta la herramienta si no tiene programa de afiliados (hasAffiliateProgram: false)", async () => {
      const proveedor = proveedorFalso(() => ({
        datos: { nombre: "HubSpot" },
        affiliateData: { hasAffiliateProgram: false, affiliateStatus: "not_available" },
        fuentes: ["https://hubspot.com"],
      }));

      const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

      expect(resultado.ok).toBe(false);
      if (!resultado.ok) {
        expect(resultado.error).toContain("Descartada");
        expect(resultado.error).toContain("programa de afiliados");
      }
    });

    it("descarta la herramienta si no investigó ningún affiliateData en absoluto", async () => {
      const proveedor = proveedorFalso(() => ({
        datos: { nombre: "HubSpot", descripcion: "Un CRM." },
        fuentes: ["https://hubspot.com"],
      }));

      const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

      expect(resultado.ok).toBe(false);
    });

    it("descarta la herramienta si el programa de afiliados existe pero su confidenceLevel es low", async () => {
      const proveedor = proveedorFalso(() => ({
        datos: { nombre: "HubSpot" },
        affiliateData: { ...affiliateDataFiable, confidenceLevel: "low" },
        fuentes: ["https://hubspot.com"],
      }));

      const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

      expect(resultado.ok).toBe(false);
    });

    it("acepta la herramienta cuando el programa de afiliados está disponible y no tiene confidenceLevel low", async () => {
      const proveedor = proveedorFalso(() => ({
        datos: { nombre: "HubSpot" },
        affiliateData: affiliateDataFiable,
        fuentes: ["https://hubspot.com"],
      }));

      const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

      expect(resultado.ok).toBe(true);
    });

    it("acepta la herramienta cuando el programa de afiliados no declara confidenceLevel (no se penaliza por ausencia)", async () => {
      const sinConfianza = {
        hasAffiliateProgram: affiliateDataFiable.hasAffiliateProgram,
        affiliateUrl: affiliateDataFiable.affiliateUrl,
        affiliateStatus: affiliateDataFiable.affiliateStatus,
      };
      const proveedor = proveedorFalso(() => ({
        datos: { nombre: "HubSpot" },
        affiliateData: sinConfianza,
        fuentes: ["https://hubspot.com"],
      }));

      const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

      expect(resultado.ok).toBe(true);
    });
  });

  it("no llama al proveedor si falta el nombre de la herramienta", async () => {
    const proveedor = proveedorFalso(() => ({ datos: {}, fuentes: [] }));

    const resultado = await investigarHerramienta({ nombreHerramienta: "   " }, proveedor);

    expect(resultado.ok).toBe(false);
    expect(proveedor.generarJson).not.toHaveBeenCalled();
  });
});
