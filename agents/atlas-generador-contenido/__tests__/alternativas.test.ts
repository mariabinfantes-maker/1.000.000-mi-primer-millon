import { describe, expect, it } from "vitest";
import { getAlternativas } from "../alternativas";
import { getHerramienta } from "@/data/repositorio";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";

/** Contra el catálogo real, como el resto de módulos de este agente que no admiten `dirBase`. */
describe("getAlternativas", () => {
  it("devuelve otras herramientas reales de la misma categoría, nunca la propia", () => {
    const hubspot = getHerramienta("hubspot")!;

    const alternativas = getAlternativas(hubspot);

    expect(alternativas.length).toBeGreaterThan(0);
    expect(alternativas.every((h) => h.id !== "hubspot")).toBe(true);
    expect(alternativas.every((h) => h.categoriaId === hubspot.categoriaId)).toBe(true);
  });

  it("ordena por Puntuación Atlas descendente", () => {
    const hubspot = getHerramienta("hubspot")!;
    const alternativas = getAlternativas(hubspot);

    const puntuaciones = alternativas.map((h) => calcularPuntuacionAtlas(h)?.puntuacion ?? -1);
    const ordenadasDeVerdad = [...puntuaciones].sort((a, b) => b - a);
    expect(puntuaciones).toEqual(ordenadasDeVerdad);
  });
});
