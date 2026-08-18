import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { detectarHuecosEditoriales, MINIMO_VECINAS_PARA_COMPARAR } from "../completitud";

describe("detectarHuecosEditoriales", () => {
  it("no avisa cuando ninguna vecina de categoría tiene el campo tampoco", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm" }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm" }),
    ];

    expect(detectarHuecosEditoriales(herramientas)).toEqual([]);
  });

  it("avisa de un campo que le falta a una ficha pero sí tiene la mayoría de sus vecinas", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tieneAppMovil: undefined }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tieneAppMovil: true }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm", tieneAppMovil: true }),
    ];

    const avisos = detectarHuecosEditoriales(herramientas);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ herramientaId: "a", campo: "tieneAppMovil" });
    expect(avisos[0].mensaje).toContain("2 de sus 2 vecinas");
  });

  it("no avisa por debajo del mínimo de vecinas para comparar", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tieneAppMovil: undefined }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tieneAppMovil: true }),
    ];

    // Solo 1 vecina — por debajo de MINIMO_VECINAS_PARA_COMPARAR (2), no hay base suficiente.
    expect(MINIMO_VECINAS_PARA_COMPARAR).toBe(2);
    expect(detectarHuecosEditoriales(herramientas)).toEqual([]);
  });

  it("no avisa cuando el campo lo tiene menos de la mitad de las vecinas", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tieneApiPublica: undefined }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tieneApiPublica: true }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm", tieneApiPublica: undefined }),
      construirHerramienta({ id: "d", nombre: "D", categoriaId: "crm", tieneApiPublica: undefined }),
    ];

    // "a" tiene 3 vecinas (b, c, d), solo 1 con el campo → 33%, por debajo del 50% por defecto.
    expect(detectarHuecosEditoriales(herramientas)).toEqual([]);
  });

  it("nunca compara fichas de categorías distintas entre sí", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tieneAppMovil: undefined }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "asistentes-ia", tieneAppMovil: true }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "asistentes-ia", tieneAppMovil: true }),
    ];

    // "a" está sola en "crm" (0 vecinas): no se compara contra "asistentes-ia".
    expect(detectarHuecosEditoriales(herramientas)).toEqual([]);
  });

  it("ignora herramientas descontinuadas, tanto como candidatas a aviso como como vecinas", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", tieneAppMovil: undefined, estado: "descontinuado" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tieneAppMovil: true }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm", tieneAppMovil: true }),
    ];

    expect(detectarHuecosEditoriales(herramientas)).toEqual([]);
  });

  it("detecta la ausencia de reputación investigada usando g2Puntuacion o capterraPuntuacion", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" }), // sin reputacion
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", reputacion: { g2Puntuacion: 4.2 } }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm", reputacion: { capterraPuntuacion: 4.5 } }),
    ];

    const avisos = detectarHuecosEditoriales(herramientas);

    expect(avisos.some((a) => a.herramientaId === "a" && a.campo === "reputacion")).toBe(true);
  });
});
