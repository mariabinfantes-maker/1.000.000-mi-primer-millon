import { describe, expect, it } from "vitest";
import { getAlternativas } from "../alternativas";
import { cubreCategoria } from "@/data/taxonomia";
import { getHerramienta } from "@/data/repositorio";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";

/** Contra el catálogo real, como el resto de módulos de este agente que no admiten `dirBase`. */
describe("getAlternativas", () => {
  it("devuelve otras herramientas reales de la misma categoría, nunca la propia", () => {
    const hubspot = getHerramienta("hubspot")!;

    const alternativas = getAlternativas(hubspot);

    expect(alternativas.length).toBeGreaterThan(0);
    expect(alternativas.every((h) => h.id !== "hubspot")).toBe(true);
    // Una alternativa es una herramienta que CUBRE la misma categoría, no
    // necesariamente una cuya categoría PRINCIPAL coincida: monday.com es
    // una plataforma todo en uno legítima aunque su función principal sea
    // la gestión de proyectos (ver `data/taxonomia.ts`).
    expect(alternativas.every((h) => cubreCategoria(h, hubspot.categoriaId))).toBe(true);
  });

  it("ordena por Puntuación Atlas descendente", () => {
    const hubspot = getHerramienta("hubspot")!;
    const alternativas = getAlternativas(hubspot);

    const puntuaciones = alternativas.map((h) => calcularPuntuacionAtlas(h)?.puntuacion ?? -1);
    const ordenadasDeVerdad = [...puntuaciones].sort((a, b) => b - a);
    expect(puntuaciones).toEqual(ordenadasDeVerdad);
  });
});
