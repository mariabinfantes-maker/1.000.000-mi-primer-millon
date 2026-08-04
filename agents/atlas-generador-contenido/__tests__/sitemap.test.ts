import { describe, expect, it } from "vitest";
import { generarEntradasSitemap } from "../sitemap";
import { generarParesComparacion } from "../comparaciones";
import { getCategorias, getHerramientas, getProblemas } from "@/data/repositorio";

describe("generarEntradasSitemap", () => {
  it("incluye la home", () => {
    const entradas = generarEntradasSitemap();
    expect(entradas.some((e) => e.ruta === "/")).toBe(true);
  });

  it("incluye una entrada por cada categoría y cada problema reales", () => {
    const entradas = generarEntradasSitemap();
    const rutas = entradas.map((e) => e.ruta);

    for (const categoria of getCategorias()) {
      expect(rutas).toContain(`/categoria/${categoria.id}`);
    }
    for (const problema of getProblemas()) {
      expect(rutas).toContain(`/problema/${problema.id}`);
    }
  });

  it("incluye la ficha y las alternativas de cada herramienta real, con su fecha de última revisión", () => {
    const entradas = generarEntradasSitemap();

    for (const herramienta of getHerramientas()) {
      const ficha = entradas.find((e) => e.ruta === `/herramienta/${herramienta.id}`);
      const alternativas = entradas.find((e) => e.ruta === `/herramienta/${herramienta.id}/alternativas`);

      expect(ficha?.ultimaModificacion).toBe(herramienta.fechaUltimaRevision);
      expect(alternativas?.ultimaModificacion).toBe(herramienta.fechaUltimaRevision);
    }
  });

  it("incluye todos los pares de comparación reales", () => {
    const entradas = generarEntradasSitemap();
    const rutas = new Set(entradas.map((e) => e.ruta));

    for (const par of generarParesComparacion()) {
      expect(rutas.has(`/comparar/${par.slug}`)).toBe(true);
    }
  });

  it("nunca incluye una ruta de flujo (cuestionario, comparar de sesión, recomendación, ir)", () => {
    const entradas = generarEntradasSitemap();

    for (const entrada of entradas) {
      expect(entrada.ruta).not.toMatch(/\/(cuestionario|recomendacion|ir)$/);
    }
  });

  it("no repite ninguna ruta", () => {
    const entradas = generarEntradasSitemap();
    const rutas = entradas.map((e) => e.ruta);
    expect(new Set(rutas).size).toBe(rutas.length);
  });
});
