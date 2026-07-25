import { describe, expect, it } from "vitest";
import { construirPromptInvestigacion } from "../prompt";

describe("construirPromptInvestigacion", () => {
  it("incluye el nombre de la herramienta y pide un JSON con datos y fuentes", () => {
    const prompt = construirPromptInvestigacion({ nombreHerramienta: "HubSpot" });

    expect(prompt).toContain("HubSpot");
    expect(prompt).toContain('"datos"');
    expect(prompt).toContain('"fuentes"');
  });

  it("lista los campos investigables, pero no los que gestiona Atlas", () => {
    const prompt = construirPromptInvestigacion({ nombreHerramienta: "HubSpot" });

    expect(prompt).toContain('"descripcion"');
    expect(prompt).toContain('"curvaDeAprendizaje"');
    expect(prompt).not.toContain('"id":');
    expect(prompt).not.toContain('"estado":');
  });

  it("incluye la categoría y el contexto adicional solo cuando se indican", () => {
    const sinContexto = construirPromptInvestigacion({ nombreHerramienta: "HubSpot" });
    expect(sinContexto).not.toContain("Categoría conocida");
    expect(sinContexto).not.toContain("Contexto adicional");

    const conContexto = construirPromptInvestigacion({
      nombreHerramienta: "HubSpot",
      categoriaId: "plataformas-todo-en-uno",
      contextoAdicional: "Centrarse en el plan gratuito.",
    });
    expect(conContexto).toContain("plataformas-todo-en-uno");
    expect(conContexto).toContain("Centrarse en el plan gratuito.");
  });
});
