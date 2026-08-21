import { describe, expect, it } from "vitest";
import { validarSuscripcion } from "../validarSuscripcion";

describe("validarSuscripcion", () => {
  it("acepta un email y origen válidos", () => {
    const resultado = validarSuscripcion({ email: "Ana@Ejemplo.com", origen: "pie-de-pagina" });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.email).toBe("ana@ejemplo.com"); // normalizado a minúsculas
      expect(resultado.origen).toBe("pie-de-pagina");
    }
  });

  it("rechaza un email con formato inválido", () => {
    const resultado = validarSuscripcion({ email: "no-es-un-email", origen: "pie-de-pagina" });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza cuando falta el email", () => {
    const resultado = validarSuscripcion({ origen: "pie-de-pagina" });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza un origen fuera del vocabulario fijo", () => {
    const resultado = validarSuscripcion({ email: "ana@ejemplo.com", origen: "sitio-inventado" });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza cuando el honeypot llega relleno (bot)", () => {
    const resultado = validarSuscripcion({
      email: "ana@ejemplo.com",
      origen: "pie-de-pagina",
      webComoTeLlamas: "soy un bot",
    });
    expect(resultado.ok).toBe(false);
  });

  it("acepta cuando el honeypot llega vacío (persona real)", () => {
    const resultado = validarSuscripcion({ email: "ana@ejemplo.com", origen: "pie-de-pagina", webComoTeLlamas: "" });
    expect(resultado.ok).toBe(true);
  });

  it("recoge categoriaId y problemaId cuando llegan como texto no vacío", () => {
    const resultado = validarSuscripcion({
      email: "ana@ejemplo.com",
      origen: "resultados",
      categoriaId: "crm",
      problemaId: "conseguir-clientes",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.categoriaId).toBe("crm");
      expect(resultado.problemaId).toBe("conseguir-clientes");
    }
  });

  it("ignora categoriaId y problemaId cuando llegan vacíos o con tipo incorrecto", () => {
    const resultado = validarSuscripcion({
      email: "ana@ejemplo.com",
      origen: "resultados",
      categoriaId: "",
      problemaId: 123,
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.categoriaId).toBeUndefined();
      expect(resultado.problemaId).toBeUndefined();
    }
  });
});
