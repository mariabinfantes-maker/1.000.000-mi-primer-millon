import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { detectarCasiDuplicados } from "../duplicados";

describe("detectarCasiDuplicados", () => {
  it("no avisa cuando el candidato no se parece a nada del catálogo", () => {
    const catalogo = [construirHerramienta({ id: "hubspot", nombre: "HubSpot" })];
    const candidato = { id: "notion", nombre: "Notion", paginaOficial: "https://notion.so" };

    expect(detectarCasiDuplicados(candidato, catalogo)).toEqual([]);
  });

  it("avisa cuando el candidato tiene el mismo nombre que una herramienta existente", () => {
    const catalogo = [construirHerramienta({ id: "hubspot-crm", nombre: "HubSpot" })];
    const candidato = { id: "hubspot-marketing", nombre: "HubSpot", paginaOficial: "https://hubspot.com/marketing" };

    const avisos = detectarCasiDuplicados(candidato, catalogo);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].herramientaExistenteId).toBe("hubspot-crm");
    expect(avisos[0].motivo).toContain("mismo nombre");
  });

  it("ignora mayúsculas, acentos y puntuación al comparar nombres", () => {
    const catalogo = [construirHerramienta({ id: "notion-ai", nombre: "Notion AI" })];
    const candidato = { id: "notion-ai-2", nombre: "  NOTION, AI!  ", paginaOficial: "https://otro-dominio.test" };

    const avisos = detectarCasiDuplicados(candidato, catalogo);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].herramientaExistenteId).toBe("notion-ai");
  });

  it("avisa cuando el candidato comparte dominio en la página oficial, aunque el nombre sea distinto", () => {
    const catalogo = [
      construirHerramienta({ id: "acme-crm", nombre: "Acme CRM", paginaOficial: "https://www.acme.com/crm" }),
    ];
    const candidato = { id: "acme-suite", nombre: "Acme Suite", paginaOficial: "https://acme.com/suite" };

    const avisos = detectarCasiDuplicados(candidato, catalogo);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].motivo).toContain("mismo dominio");
  });

  it("avisa cuando el nombre de uno está contenido en el nombre del otro", () => {
    const catalogo = [construirHerramienta({ id: "notion", nombre: "Notion" })];
    const candidato = { id: "notion-ai", nombre: "Notion AI", paginaOficial: "https://notion-ai-clone.test" };

    const avisos = detectarCasiDuplicados(candidato, catalogo);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].motivo).toContain("parecidos");
  });

  it("no aplica la regla de subcadena a nombres cortos, para evitar ruido", () => {
    const catalogo = [construirHerramienta({ id: "go", nombre: "Go" })];
    const candidato = { id: "google-workspace", nombre: "Google Workspace", paginaOficial: "https://workspace.google.com" };

    expect(detectarCasiDuplicados(candidato, catalogo)).toEqual([]);
  });

  it("nunca se compara consigo mismo cuando el candidato ya está en el catálogo pasado", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot" });

    expect(detectarCasiDuplicados(herramienta, [herramienta])).toEqual([]);
  });

  it("no falla con una paginaOficial mal formada, solo la deja fuera de la comparación por dominio", () => {
    const catalogo = [construirHerramienta({ id: "hubspot", nombre: "HubSpot", paginaOficial: "no-es-una-url" })];
    const candidato = { id: "salesforce", nombre: "Salesforce", paginaOficial: "tampoco-es-una-url" };

    expect(detectarCasiDuplicados(candidato, catalogo)).toEqual([]);
  });
});
