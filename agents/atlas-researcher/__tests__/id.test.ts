import { describe, expect, it } from "vitest";
import { generarId, idEsValido, idYaExiste } from "../id";

describe("generarId", () => {
  it("convierte un nombre simple a minúsculas", () => {
    expect(generarId("HubSpot")).toBe("hubspot");
  });

  it("une varias palabras con guiones", () => {
    expect(generarId("Zoho One")).toBe("zoho-one");
  });

  it("quita acentos y otros diacríticos", () => {
    expect(generarId("Ñandú Software")).toBe("nandu-software");
  });

  it("sustituye símbolos y puntuación por guiones", () => {
    expect(generarId("Odoo (ERP)")).toBe("odoo-erp");
    expect(generarId("HubSpot!")).toBe("hubspot");
  });

  it("no deja guiones al principio, al final, ni duplicados", () => {
    expect(generarId("  --Monday.com--  ")).toBe("monday-com");
  });

  it("reproduce los ids ya existentes en el catálogo real", () => {
    expect(generarId("Bitrix24")).toBe("bitrix24");
    expect(generarId("GoHighLevel")).toBe("gohighlevel");
  });
});

describe("idEsValido", () => {
  it("acepta ids en kebab-case bien formados", () => {
    expect(idEsValido("hubspot")).toBe(true);
    expect(idEsValido("zoho-one")).toBe(true);
  });

  it("rechaza mayúsculas, espacios, guiones sueltos o cadenas vacías", () => {
    expect(idEsValido("HubSpot")).toBe(false);
    expect(idEsValido("zoho one")).toBe(false);
    expect(idEsValido("-hubspot")).toBe(false);
    expect(idEsValido("hubspot-")).toBe(false);
    expect(idEsValido("hub--spot")).toBe(false);
    expect(idEsValido("")).toBe(false);
  });
});

describe("idYaExiste", () => {
  it("detecta una colisión con un id ya existente", () => {
    expect(idYaExiste("hubspot", ["odoo", "hubspot", "zoho-one"])).toBe(true);
  });

  it("devuelve false cuando no hay colisión", () => {
    expect(idYaExiste("monday-com", ["odoo", "hubspot", "zoho-one"])).toBe(false);
  });

  it("funciona igual con un Set que con un array", () => {
    expect(idYaExiste("hubspot", new Set(["hubspot"]))).toBe(true);
  });
});
