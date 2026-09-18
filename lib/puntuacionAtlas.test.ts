import { describe, expect, it } from "vitest";
import type { Herramienta } from "@/data/esquema";
import { calcularPuntuacionAtlas } from "./puntuacionAtlas";

const puntuacionesCompletas: Herramienta["puntuaciones"] = {
  facilidadDeUso: 8,
  calidad: 8,
  fiabilidad: 8,
  atencionAlCliente: 8,
  escalabilidad: 8,
  nivelTecnicoRequerido: 3,
};

describe("calcularPuntuacionAtlas", () => {
  it("devuelve null si no hay ninguna señal disponible", () => {
    expect(calcularPuntuacionAtlas({})).toBeNull();
  });

  it("calcula la puntuación solo a partir de las puntuaciones internas cuando no hay reputación externa", () => {
    const resultado = calcularPuntuacionAtlas({ puntuaciones: puntuacionesCompletas });

    expect(resultado).not.toBeNull();
    expect(resultado!.puntuacion).toBe(80);
    expect(resultado!.motivos.some((m) => m.includes("internas"))).toBe(true);
  });

  it("combina puntuaciones internas y reputación externa a partes iguales", () => {
    const resultado = calcularPuntuacionAtlas({
      puntuaciones: puntuacionesCompletas, // media 8/10 -> 80
      reputacion: { g2Puntuacion: 4, capterraPuntuacion: 4 }, // media 4/5 -> 80
    });

    expect(resultado!.puntuacion).toBe(80);
    expect(resultado!.motivos.some((m) => m.includes("G2"))).toBe(true);
    expect(resultado!.motivos.some((m) => m.includes("Capterra"))).toBe(true);
  });

  it("incluye el número de reseñas en el motivo cuando está disponible", () => {
    const resultado = calcularPuntuacionAtlas({
      reputacion: { g2Puntuacion: 4.5, g2NumeroResenas: 320 },
    });

    expect(resultado!.motivos.some((m) => m.includes("320 reseñas"))).toBe(true);
  });

  it("añade un pequeño extra por API pública y app móvil", () => {
    const sinExtras = calcularPuntuacionAtlas({ puntuaciones: puntuacionesCompletas })!;
    const conExtras = calcularPuntuacionAtlas({
      puntuaciones: puntuacionesCompletas,
      tieneApiPublica: true,
      tieneAppMovil: true,
    })!;

    expect(conExtras.puntuacion).toBeGreaterThan(sinExtras.puntuacion);
    expect(conExtras.motivos).toContain("Ofrece una API pública.");
    expect(conExtras.motivos).toContain("Dispone de app móvil.");
  });

  /**
   * El plan gratuito ya NO puntúa, y esta prueba existe para que no vuelva.
   *
   * Lo tienen 64 de las 65 fichas del catálogo, así que no distinguía nada, y
   * estaba guardado como mérito —«Tiene plan gratuito.»— entre las notas de
   * calidad y la reputación, como si fuera una virtud de la herramienta.
   * Decisión de la propietaria (2026-09-18): «estamos endiosando lo gratis».
   * Sigue viéndose en la tarjeta y en la ficha; lo que no hace es ordenar.
   */
  it("el plan gratuito no suma ni aparece como mérito", () => {
    const sinPlan = calcularPuntuacionAtlas({ puntuaciones: puntuacionesCompletas })!;
    const conPlan = calcularPuntuacionAtlas({ puntuaciones: puntuacionesCompletas, tienePlanGratuito: true })!;

    expect(conPlan.puntuacion).toBe(sinPlan.puntuacion);
    expect(conPlan.motivos).not.toContain("Tiene plan gratuito.");
    expect(conPlan.motivos.join(" ")).not.toMatch(/gratuit/i);
  });

  it("calcula algo razonable a partir solo de señales de producto, sin puntuaciones ni reputación", () => {
    const resultado = calcularPuntuacionAtlas({ tieneApiPublica: true });

    expect(resultado).not.toBeNull();
    expect(resultado!.puntuacion).toBe(52); // base neutra (50) + 2 de la API pública
  });

  it("nunca devuelve una puntuación fuera de 0-100", () => {
    const resultado = calcularPuntuacionAtlas({
      puntuaciones: { ...puntuacionesCompletas, facilidadDeUso: 10, calidad: 10, fiabilidad: 10, atencionAlCliente: 10, escalabilidad: 10 },
      reputacion: { g2Puntuacion: 5, capterraPuntuacion: 5 },
      tienePlanGratuito: true,
      tieneApiPublica: true,
      tieneAppMovil: true,
    });

    expect(resultado!.puntuacion).toBeLessThanOrEqual(100);
    expect(resultado!.puntuacion).toBeGreaterThanOrEqual(0);
  });

  it("tiene en cuenta facilidadImplementacion cuando está presente", () => {
    const conImplementacionBaja = calcularPuntuacionAtlas({
      puntuaciones: { ...puntuacionesCompletas, facilidadImplementacion: 1 },
    })!;
    const sinImplementacion = calcularPuntuacionAtlas({ puntuaciones: puntuacionesCompletas })!;

    expect(conImplementacionBaja.puntuacion).toBeLessThan(sinImplementacion.puntuacion);
  });
});
