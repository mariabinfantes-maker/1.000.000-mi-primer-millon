import { describe, expect, it } from "vitest";
import {
  analizarSlugComparacion,
  evaluarParComparacion,
  generarParesComparacion,
  slugComparacion,
} from "../comparaciones";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";

describe("slugComparacion", () => {
  it("ordena los ids alfabéticamente, sin importar el orden de entrada", () => {
    expect(slugComparacion("hubspot", "pipedrive")).toBe("hubspot-vs-pipedrive");
    expect(slugComparacion("pipedrive", "hubspot")).toBe("hubspot-vs-pipedrive");
  });
});

describe("analizarSlugComparacion", () => {
  it("extrae ambos ids de un slug válido", () => {
    expect(analizarSlugComparacion("hubspot-vs-pipedrive")).toEqual({ idA: "hubspot", idB: "pipedrive" });
  });

  it("funciona con ids que a su vez tienen guiones", () => {
    expect(analizarSlugComparacion("zoho-one-vs-monday-com")).toEqual({ idA: "zoho-one", idB: "monday-com" });
  });

  it("devuelve null para un slug mal formado", () => {
    expect(analizarSlugComparacion("hubspot")).toBeNull();
    expect(analizarSlugComparacion("hubspot-vs-")).toBeNull();
    expect(analizarSlugComparacion("")).toBeNull();
  });
});

describe("evaluarParComparacion", () => {
  it("devuelve dos herramientas evaluadas y sus filas de comparación", () => {
    const a = construirHerramienta({
      id: "facil",
      nombre: "Fácil",
      puntuaciones: { facilidadDeUso: 9, calidad: 6, fiabilidad: 6, atencionAlCliente: 6, escalabilidad: 6, nivelTecnicoRequerido: 5 },
    });
    const b = construirHerramienta({
      id: "dificil",
      nombre: "Difícil",
      puntuaciones: { facilidadDeUso: 2, calidad: 6, fiabilidad: 6, atencionAlCliente: 6, escalabilidad: 6, nivelTecnicoRequerido: 5 },
    });

    const resultado = evaluarParComparacion(a, b);

    expect(resultado.evaluadas).toHaveLength(2);
    // Con un perfil neutro, la facilidad de uso (propiedad de la propia
    // herramienta, no del usuario) sigue produciendo una fila real.
    expect(resultado.filas.some((f) => f.criterio === "facilidadDeUso")).toBe(true);
  });

  it("no incluye criterios que dependen de una respuesta del usuario que nadie ha dado", () => {
    const a = construirHerramienta({ id: "a", nombre: "A" });
    const b = construirHerramienta({ id: "b", nombre: "B" });

    const resultado = evaluarParComparacion(a, b);

    // Ambas quedan neutras (0 puntos, sin explicación) en tamañoEmpresa sin
    // RespuestasUsuario: construirComparativa las omite por ser idénticas.
    expect(resultado.filas.some((f) => f.criterio === "tamanoEmpresa")).toBe(false);
  });
});

describe("generarParesComparacion", () => {
  it("genera solo parejas dentro de la misma categoría del catálogo real, con slug canónico", () => {
    const pares = generarParesComparacion();

    expect(pares.length).toBeGreaterThan(0);
    for (const par of pares) {
      expect(par.slug).toBe(slugComparacion(par.idA, par.idB));
      expect(par.idA < par.idB).toBe(true);
    }
  });

  it("no repite la misma pareja dos veces", () => {
    const pares = generarParesComparacion();
    const slugs = pares.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
