import { describe, expect, it } from "vitest";
import { construirDatosEstructuradosHerramienta } from "../datosEstructurados";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";

describe("construirDatosEstructuradosHerramienta", () => {
  it("usa el nombre, la descripción y la web oficial reales de la herramienta", () => {
    const herramienta = construirHerramienta({
      id: "crm-facil",
      nombre: "CRM Fácil",
      descripcion: "Un CRM sencillo para pymes.",
      paginaOficial: "https://crmfacil.example.com",
    });

    const datos = construirDatosEstructuradosHerramienta(herramienta);

    expect(datos["@context"]).toBe("https://schema.org");
    expect(datos["@type"]).toBe("SoftwareApplication");
    expect(datos.name).toBe("CRM Fácil");
    expect(datos.description).toBe("Un CRM sencillo para pymes.");
    expect(datos.sameAs).toBe("https://crmfacil.example.com");
    expect(datos.url).toContain("/herramienta/crm-facil");
  });

  it("nunca incluye aggregateRating, ofertas ni precio, tenga o no plan gratuito o reputación investigada", () => {
    const conTodo = construirHerramienta({
      id: "con-todo",
      nombre: "Con Todo",
      tienePlanGratuito: true,
      reputacion: { g2Puntuacion: 4.5, g2NumeroResenas: 120 },
    });

    const datos = construirDatosEstructuradosHerramienta(conTodo);

    expect(datos.aggregateRating).toBeUndefined();
    expect(datos.offers).toBeUndefined();
    expect(datos.price).toBeUndefined();
    expect(Object.keys(datos).sort()).toEqual(
      ["@context", "@type", "applicationCategory", "description", "name", "sameAs", "url"].sort()
    );
  });
});
