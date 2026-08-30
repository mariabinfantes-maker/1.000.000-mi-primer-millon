import { describe, expect, it } from "vitest";
import {
  construirIdentificadoresValidos,
  construirRutaOrigen,
  esRutaConocida,
  normalizarRutaOrigen,
  partirRutaOrigen,
  LARGO_MAXIMO_RUTA,
} from "../rutaOrigen";

/**
 * La etiqueta de recorrido es el único campo de texto libre que llega desde
 * el navegador hasta la tabla de clics. Por eso el vocabulario es cerrado:
 * lo que importa aquí no es que acepte lo válido, sino que **no acepte nada
 * más** — ni un identificador colado en la dirección, ni un texto largo, ni
 * nada que sirva para reconocer a una persona.
 */

describe("acepta el vocabulario declarado", () => {
  it("los cuatro tipos de recorrido", () => {
    for (const [tipo, id] of [
      ["objetivo", "conseguir-clientes"],
      ["categoria", "crm"],
      ["subtipo", "escritura"],
      ["libre", "texto-libre"],
    ] as const) {
      expect(normalizarRutaOrigen(construirRutaOrigen(tipo, id))).toBe(`${tipo}:${id}`);
    }
  });

  it("normaliza mayúsculas y espacios", () => {
    expect(normalizarRutaOrigen("  Categoria:CRM  ")).toBe("categoria:crm");
  });
});

describe("rechaza todo lo demás", () => {
  it("un tipo que no existe", () => {
    expect(normalizarRutaOrigen("usuario:maria")).toBeUndefined();
    expect(normalizarRutaOrigen("email:maria@ejemplo.com")).toBeUndefined();
  });

  it("algo que parezca un identificador de persona", () => {
    for (const intento of [
      "categoria:crm?uid=12345",
      "objetivo:conseguir-clientes#sesion-abc",
      "categoria:192.168.1.1",
      "<script>alert(1)</script>",
      "categoria:crm; DROP TABLE clics_salientes",
    ]) {
      expect(normalizarRutaOrigen(intento), intento).toBeUndefined();
    }
  });

  it("un texto largo, aunque empiece bien", () => {
    expect(normalizarRutaOrigen("categoria:" + "a".repeat(LARGO_MAXIMO_RUTA))).toBeUndefined();
  });

  it("lo que no es texto", () => {
    for (const v of [undefined, null, 42, {}, [], true]) expect(normalizarRutaOrigen(v)).toBeUndefined();
  });
});

describe("se puede agrupar en los informes", () => {
  it("parte tipo e identificador", () => {
    expect(partirRutaOrigen("subtipo:escritura")).toEqual({ tipo: "subtipo", id: "escritura" });
  });

  it("no parte lo que no es válido", () => {
    expect(partirRutaOrigen("usuario:maria")).toBeUndefined();
  });
});

describe("la forma no basta: hay que existir en el catálogo", () => {
  const validos = construirIdentificadoresValidos({
    objetivos: ["conseguir-clientes", "ahorrar-tiempo"],
    categorias: ["crm", "asistentes-ia"],
    subtipos: ["escritura", "video"],
  });

  it("acepta lo que existe de verdad", () => {
    for (const r of ["objetivo:conseguir-clientes", "categoria:crm", "subtipo:escritura", "libre:texto-libre"])
      expect(esRutaConocida(r, validos), r).toBe(true);
  });

  it("RECHAZA un identificador de sesión bien formado", () => {
    // El caso que destapó la prueba: 32 caracteres hexadecimales encajan en
    // el formato de slug sin ningún problema. Contra el catálogo, no.
    expect(esRutaConocida("categoria:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", validos)).toBe(false);
  });

  it("rechaza cualquier identificador inventado, por bien formado que venga", () => {
    for (const r of ["categoria:no-existe", "objetivo:inventado", "subtipo:cualquiera", "libre:otra-cosa"])
      expect(esRutaConocida(r, validos), r).toBe(false);
  });
});
