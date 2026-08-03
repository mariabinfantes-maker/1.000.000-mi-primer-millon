import { describe, expect, it } from "vitest";
import {
  contarPalabrasComunes,
  contieneTexto,
  estimarPrecioMensualEUR,
  nivelCurva,
  normalizar,
} from "../utilidades";

describe("normalizar", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizar("Español, Ágil, MUY fácil")).toBe("espanol, agil, muy facil");
  });
});

describe("contieneTexto", () => {
  it("compara ignorando acentos y mayúsculas", () => {
    expect(contieneTexto("Más de 40 idiomas, incluyendo francés", "Frances")).toBe(true);
    expect(contieneTexto("Solo inglés", "francés")).toBe(false);
  });

  it("nunca da como coincidencia una cadena vacía", () => {
    expect(contieneTexto("cualquier cosa", "")).toBe(false);
  });
});

describe("estimarPrecioMensualEUR", () => {
  it("extrae el primer número seguido de € del texto", () => {
    expect(estimarPrecioMensualEUR("Desde 15€ mes por asiento")).toBe(15);
    expect(estimarPrecioMensualEUR("Gratis / Desde 24,90€/usuario/mes")).toBe(24.9);
  });

  it("devuelve null si no hay ningún precio en el texto", () => {
    expect(estimarPrecioMensualEUR("Gratis (1 app)")).toBeNull();
  });
});

describe("nivelCurva", () => {
  it("ordena las curvas de aprendizaje de menor a mayor exigencia", () => {
    expect(nivelCurva("muy_facil")).toBeLessThan(nivelCurva("facil"));
    expect(nivelCurva("facil")).toBeLessThan(nivelCurva("media"));
    expect(nivelCurva("media")).toBeLessThan(nivelCurva("dificil"));
  });
});

describe("contarPalabrasComunes", () => {
  it("cuenta las palabras significativas compartidas entre dos textos", () => {
    expect(
      contarPalabrasComunes(
        "Negocios que gestionan inventario físico en varios almacenes",
        "Tenemos inventario físico en varios almacenes"
      )
    ).toBeGreaterThanOrEqual(2);
  });

  it("ignora palabras vacías y coincidencias triviales", () => {
    expect(contarPalabrasComunes("para que con los", "de la el en")).toBe(0);
  });
});
