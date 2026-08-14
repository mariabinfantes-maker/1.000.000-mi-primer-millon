import { describe, expect, it } from "vitest";
import { evaluarHerramienta } from "@/agents/atlas-advisor";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { construirPromptRecomendacion } from "../prompt";

describe("construirPromptRecomendacion", () => {
  const herramienta = construirHerramienta({
    id: "crm-facil",
    nombre: "CRM Fácil",
    descripcion: "Un CRM sencillo pensado para pymes.",
    puntuaciones: {
      facilidadDeUso: 9,
      calidad: 7,
      fiabilidad: 7,
      atencionAlCliente: 7,
      escalabilidad: 5,
      nivelTecnicoRequerido: 2,
    },
  });

  it("incluye el nombre, la descripción y los motivos ya calculados por la Capa 1", () => {
    const evaluada = evaluarHerramienta(herramienta, { nivelTecnicoEquipo: "ninguno" });
    const prompt = construirPromptRecomendacion(evaluada, { nivelTecnicoEquipo: "ninguno" });

    expect(prompt).toContain("CRM Fácil");
    expect(prompt).toContain("Un CRM sencillo pensado para pymes.");
    for (const razon of evaluada.razones) {
      expect(prompt).toContain(razon);
    }
  });

  it("incluye solo las líneas de contexto del usuario que sí están presentes", () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const prompt = construirPromptRecomendacion(evaluada, {
      industria: "restauración",
      tamanoEmpresa: "1-10",
      presupuesto: "ajustado",
    });

    expect(prompt).toContain("restauración");
    expect(prompt).toContain("1-10 empleados");
    expect(prompt).toContain("presupuesto ajustado");
    // Campos no aportados por el usuario no deben aparecer como líneas de contexto.
    expect(prompt).not.toContain("Nivel técnico del equipo");
    expect(prompt).not.toContain("Idioma necesario");
  });

  it("deja explícito que la IA no decide el ranking ni puede inventar datos", () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const prompt = construirPromptRecomendacion(evaluada, {});

    expect(prompt).toMatch(/no decides el ranking/i);
    expect(prompt).toMatch(/no inventes/i);
  });

  it("cuando no hay ningún contexto de usuario, lo dice explícitamente en vez de dejarlo en blanco", () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const prompt = construirPromptRecomendacion(evaluada, {});

    expect(prompt).toContain("(sin contexto adicional disponible)");
  });
});
