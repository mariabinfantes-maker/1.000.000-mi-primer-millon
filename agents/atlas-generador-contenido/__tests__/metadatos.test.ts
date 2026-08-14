import { describe, expect, it } from "vitest";
import { metadataAlternativas, metadataCategoria, metadataComparacion, metadataFlujo, metadataHerramienta, metadataProblema } from "../metadatos";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { Categoria, Problema } from "@/data/esquema";

describe("metadataHerramienta", () => {
  it("usa el nombre y la descripción real de la herramienta, sin robots (indexable)", () => {
    const herramienta = construirHerramienta({ id: "crm-facil", nombre: "CRM Fácil", descripcion: "Un CRM sencillo para pymes." });

    const metadata = metadataHerramienta(herramienta);

    expect(metadata.title).toContain("CRM Fácil");
    expect(metadata.description).toBe("Un CRM sencillo para pymes.");
    expect(metadata.robots).toBeUndefined();
    expect(metadata.openGraph?.title).toBe(`${metadata.title} | Molnip`);
  });
});

describe("metadataCategoria", () => {
  it("usa el nombre y la descripción real de la categoría, indexable", () => {
    const categoria: Categoria = { id: "crm", nombre: "CRM y ventas", descripcion: "Organiza tu pipeline." };

    const metadata = metadataCategoria(categoria);

    expect(metadata.title).toContain("CRM y ventas");
    expect(metadata.description).toBe("Organiza tu pipeline.");
    expect(metadata.robots).toBeUndefined();
  });
});

describe("metadataProblema", () => {
  it("usa el título y la descripción real del problema, indexable", () => {
    const problema: Problema = {
      id: "conseguir-clientes",
      titulo: "Conseguir más clientes",
      descripcion: "Atrae y convierte más leads.",
      preguntaHerramienta: "¿Ya usas un CRM?",
    };

    const metadata = metadataProblema(problema);

    expect(metadata.title).toContain("Conseguir más clientes");
    expect(metadata.description).toBe("Atrae y convierte más leads.");
    expect(metadata.robots).toBeUndefined();
  });
});

describe("metadataComparacion", () => {
  it("nombra ambas herramientas en el título, indexable", () => {
    const a = construirHerramienta({ id: "hubspot", nombre: "HubSpot" });
    const b = construirHerramienta({ id: "pipedrive", nombre: "Pipedrive" });

    const metadata = metadataComparacion(a, b);

    expect(metadata.title).toContain("HubSpot");
    expect(metadata.title).toContain("Pipedrive");
    expect(metadata.robots).toBeUndefined();
  });
});

describe("metadataAlternativas", () => {
  it("nombra la herramienta de referencia en el título, indexable", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot" });

    const metadata = metadataAlternativas(herramienta);

    expect(metadata.title).toContain("HubSpot");
    expect(metadata.robots).toBeUndefined();
  });
});

describe("metadataFlujo", () => {
  it("marca la página como no indexable pero sí rastreable", () => {
    const metadata = metadataFlujo("Cuestionario: CRM y ventas", "Responde unas preguntas rápidas.");

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.title).toBe("Cuestionario: CRM y ventas");
  });
});
