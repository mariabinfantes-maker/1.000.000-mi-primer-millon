import { describe, expect, it } from "vitest";
import { elegirMejorFuenteReputacion } from "./reputacion";

describe("elegirMejorFuenteReputacion", () => {
  it("devuelve null si no hay objeto de reputación", () => {
    expect(elegirMejorFuenteReputacion(undefined)).toBeNull();
  });

  it("devuelve null si el objeto existe pero ninguna fuente tiene puntuación", () => {
    expect(elegirMejorFuenteReputacion({})).toBeNull();
  });

  it("devuelve G2 si es la única fuente con puntuación", () => {
    const resultado = elegirMejorFuenteReputacion({ g2Puntuacion: 4.6, g2NumeroResenas: 170 });
    expect(resultado).toEqual({ nombre: "G2", puntuacion: 4.6, numeroResenas: 170 });
  });

  it("devuelve Capterra si es la única fuente con puntuación", () => {
    const resultado = elegirMejorFuenteReputacion({ capterraPuntuacion: 4.8, capterraNumeroResenas: 50 });
    expect(resultado).toEqual({ nombre: "Capterra", puntuacion: 4.8, numeroResenas: 50 });
  });

  it("con las dos fuentes disponibles, elige la de más reseñas aunque tenga menor puntuación", () => {
    const resultado = elegirMejorFuenteReputacion({
      g2Puntuacion: 4.6,
      g2NumeroResenas: 170,
      capterraPuntuacion: 4.9,
      capterraNumeroResenas: 12,
    });
    expect(resultado?.nombre).toBe("G2");
  });

  it("trata un número de reseñas ausente como 0 al comparar", () => {
    const resultado = elegirMejorFuenteReputacion({
      g2Puntuacion: 4.6,
      capterraPuntuacion: 4.9,
      capterraNumeroResenas: 5,
    });
    expect(resultado?.nombre).toBe("Capterra");
  });
});
