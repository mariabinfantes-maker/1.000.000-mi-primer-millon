import { describe, expect, it, vi } from "vitest";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";
import { construirPromptRequisitos, investigarRequisitosPrograma } from "../requisitos";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return { nombre: "proveedor-falso", generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)) };
}

describe("construirPromptRequisitos", () => {
  it("incluye el nombre de la herramienta y pide solo requisitos de entrada, nunca comisión", () => {
    const prompt = construirPromptRequisitos("HubSpot", "HubSpot para Partners");

    expect(prompt).toContain("HubSpot");
    expect(prompt).toContain("HubSpot para Partners");
    expect(prompt).toContain('"requisitos"');
    // No debe pedir que se investigue la comisión: eso es una pieza
    // separada, ya cubierta por la investigación de AffiliateData.
    expect(prompt).not.toContain('"comision"');
  });

  it("funciona sin nombre de programa", () => {
    const prompt = construirPromptRequisitos("HubSpot", undefined);
    expect(prompt).toContain("HubSpot");
  });
});

describe("investigarRequisitosPrograma", () => {
  it("devuelve ok:true con los requisitos cuando la IA responde con datos", async () => {
    const proveedor = proveedorFalso(() => ({ requisitos: "Mínimo 10k visitas/mes, solo empresas con web propia." }));

    const resultado = await investigarRequisitosPrograma("HubSpot", "PartnerStack", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.requisitos).toBe("Mínimo 10k visitas/mes, solo empresas con web propia.");
  });

  it("devuelve ok:false si la IA no encuentra información fiable (requisitos vacío)", async () => {
    const proveedor = proveedorFalso(() => ({ requisitos: "" }));

    const resultado = await investigarRequisitosPrograma("HubSpot", undefined, proveedor);

    expect(resultado.ok).toBe(false);
  });

  it("nunca lanza: si el proveedor falla, devuelve ok:false con el error", async () => {
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn(async () => {
        throw new Error("Timeout del proveedor");
      }),
    };

    const resultado = await investigarRequisitosPrograma("HubSpot", undefined, proveedor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("Timeout");
  });

  it("nunca lanza: si la respuesta no es JSON con 'requisitos', devuelve ok:false", async () => {
    const proveedor = proveedorFalso(() => ({ otraCosa: "x" }));

    const resultado = await investigarRequisitosPrograma("HubSpot", undefined, proveedor);

    expect(resultado.ok).toBe(false);
  });
});
