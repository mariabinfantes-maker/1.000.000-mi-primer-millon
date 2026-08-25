import { describe, expect, it, vi } from "vitest";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";
import { construirPromptBorrador, generarBorradorSolicitud } from "../borradorSolicitud";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return { nombre: "proveedor-falso", generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)) };
}

describe("construirPromptBorrador", () => {
  it("incluye la herramienta, el programa y pide marcar los datos que dependen de la persona", () => {
    const prompt = construirPromptBorrador({ nombreHerramienta: "HubSpot", nombrePrograma: "PartnerStack" });

    expect(prompt).toContain("HubSpot");
    expect(prompt).toContain("PartnerStack");
    expect(prompt).toContain("[COMPLETAR");
    expect(prompt).toContain('"borrador"');
  });

  it("incluye los requisitos ya conocidos si se pasan", () => {
    const prompt = construirPromptBorrador({ nombreHerramienta: "HubSpot", requisitosPrograma: "Mínimo 10k visitas/mes" });
    expect(prompt).toContain("Mínimo 10k visitas/mes");
  });
});

describe("generarBorradorSolicitud", () => {
  it("devuelve ok:true con el borrador cuando la IA responde con un texto válido", async () => {
    const textoLargo = "Estimado equipo de PartnerStack, ".repeat(3) + "escribimos desde Molnip para solicitar el alta.";
    const proveedor = proveedorFalso(() => ({ borrador: textoLargo }));

    const resultado = await generarBorradorSolicitud({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.borrador).toBe(textoLargo);
  });

  it("nunca lanza: si el proveedor falla, devuelve ok:false", async () => {
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn(async () => {
        throw new Error("Sin cuota disponible");
      }),
    };

    const resultado = await generarBorradorSolicitud({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("Sin cuota");
  });

  it("rechaza un borrador demasiado corto (probable respuesta vacía o rota)", async () => {
    const proveedor = proveedorFalso(() => ({ borrador: "Hola." }));

    const resultado = await generarBorradorSolicitud({ nombreHerramienta: "HubSpot" }, proveedor);

    expect(resultado.ok).toBe(false);
  });
});
