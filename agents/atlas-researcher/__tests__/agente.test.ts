import { describe, expect, it, vi } from "vitest";
import { investigarHerramienta } from "../agente";
import type { ProveedorIA } from "../proveedorIA";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return {
    nombre: "proveedor-falso",
    generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)),
  };
}

describe("investigarHerramienta", () => {
  it("en el camino feliz, envía un prompt al proveedor y devuelve una propuesta validada", async () => {
    const proveedor = proveedorFalso(() => ({
      datos: { nombre: "HubSpot", descripcion: "Un CRM." },
      fuentes: ["https://hubspot.com"],
    }));

    const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.propuesta.datos.nombre).toBe("HubSpot");
      expect(resultado.propuesta.fuentes).toEqual(["https://hubspot.com"]);
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

  it("si el proveedor devuelve algo que no es JSON válido para el esquema, no lanza y produce una propuesta con advertencias", async () => {
    const proveedor = proveedorFalso(() => "esto no es un objeto");

    const resultado = await investigarHerramienta({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.propuesta.confianza).toBe("baja");
      expect(resultado.propuesta.advertencias.length).toBeGreaterThan(0);
    }
  });

  it("no llama al proveedor si falta el nombre de la herramienta", async () => {
    const proveedor = proveedorFalso(() => ({ datos: {}, fuentes: [] }));

    const resultado = await investigarHerramienta({ nombreHerramienta: "   " }, proveedor);

    expect(resultado.ok).toBe(false);
    expect(proveedor.generarJson).not.toHaveBeenCalled();
  });
});
