import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { Categoria, Problema } from "@/data/esquema";
import { detectarEquilibrioCategorias, detectarEquilibrioProblemas, PORCENTAJE_CONCENTRACION_POR_DEFECTO } from "../equilibrio";

function construirCategoria(overrides: Partial<Categoria> & Pick<Categoria, "id" | "nombre">): Categoria {
  return { descripcion: "Descripción de prueba.", ...overrides };
}

function construirProblema(overrides: Partial<Problema> & Pick<Problema, "id" | "titulo">): Problema {
  return { descripcion: "Descripción de prueba.", preguntaHerramienta: "¿Ya usas algo para esto?", ...overrides };
}

describe("detectarEquilibrioCategorias", () => {
  it("no avisa de un reparto equilibrado", () => {
    const categorias = [construirCategoria({ id: "crm", nombre: "CRM" }), construirCategoria({ id: "proyectos", nombre: "Proyectos" })];
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "proyectos" }),
    ];

    expect(detectarEquilibrioCategorias(categorias, herramientas)).toEqual([]);
  });

  it("avisa de una categoría huérfana (sin ninguna herramienta activa)", () => {
    const categorias = [construirCategoria({ id: "crm", nombre: "CRM" }), construirCategoria({ id: "vacia", nombre: "Vacía" })];
    const herramientas = [construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" })];

    const avisos = detectarEquilibrioCategorias(categorias, herramientas);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: "categoria", id: "vacia", numeroHerramientas: 0 });
  });

  it("no cuenta una herramienta descontinuada como huérfana ni como parte del total activo", () => {
    const categorias = [construirCategoria({ id: "crm", nombre: "CRM" })];
    const herramientas = [construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm", estado: "descontinuado" })];

    const avisos = detectarEquilibrioCategorias(categorias, herramientas);

    expect(avisos).toHaveLength(1);
    expect(avisos[0].numeroHerramientas).toBe(0);
  });

  it("avisa de concentración cuando una categoría supera el umbral del catálogo activo", () => {
    const categorias = [construirCategoria({ id: "todo-en-uno", nombre: "Todo en uno" }), construirCategoria({ id: "crm", nombre: "CRM" })];
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "todo-en-uno" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "todo-en-uno" }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "todo-en-uno" }),
      construirHerramienta({ id: "d", nombre: "D", categoriaId: "crm" }),
    ];

    const avisos = detectarEquilibrioCategorias(categorias, herramientas);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: "categoria", id: "todo-en-uno", numeroHerramientas: 3 });
    expect(avisos[0].mensaje).toContain("75%");
  });

  it("respeta un umbral de concentración personalizado (con catálogo suficiente para que la señal sea real)", () => {
    const categorias = [construirCategoria({ id: "crm", nombre: "CRM" }), construirCategoria({ id: "proyectos", nombre: "Proyectos" })];
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm" }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "proyectos" }),
      construirHerramienta({ id: "d", nombre: "D", categoriaId: "proyectos" }),
    ];

    // 50%/50%: con un umbral más exigente (30%) ambas destacan; con el umbral por defecto (50%, estrictamente mayor), ninguna.
    expect(detectarEquilibrioCategorias(categorias, herramientas, 0.3)).toHaveLength(2);
    expect(detectarEquilibrioCategorias(categorias, herramientas, PORCENTAJE_CONCENTRACION_POR_DEFECTO)).toEqual([]);
  });

  it("no avisa de concentración por debajo del mínimo de herramientas activas, aunque el porcentaje sea alto", () => {
    const categorias = [construirCategoria({ id: "crm", nombre: "CRM" }), construirCategoria({ id: "vacia", nombre: "Vacía" })];
    const herramientas = [construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" })];

    const avisos = detectarEquilibrioCategorias(categorias, herramientas);

    // Solo la huérfana: con 1 sola herramienta activa en todo el catálogo, "crm" sería
    // trivialmente el 100% — no es señal real de desequilibrio, solo falta de volumen.
    expect(avisos).toHaveLength(1);
    expect(avisos[0].tipo).toBe("categoria");
    expect(avisos[0].id).toBe("vacia");
  });
});

describe("detectarEquilibrioProblemas", () => {
  it("ignora herramientas sin problemasIds sin romper el conteo", () => {
    const problemas = [construirProblema({ id: "conseguir-clientes", titulo: "Conseguir clientes" })];
    const herramientas = [construirHerramienta({ id: "a", nombre: "A" })]; // sin problemasIds

    const avisos = detectarEquilibrioProblemas(problemas, herramientas);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: "problema", id: "conseguir-clientes", numeroHerramientas: 0 });
  });

  it("cuenta una herramienta en cada problema que resuelve", () => {
    const problemas = [
      construirProblema({ id: "conseguir-clientes", titulo: "Conseguir clientes" }),
      construirProblema({ id: "ahorrar-tiempo", titulo: "Ahorrar tiempo" }),
    ];
    const herramientas = [construirHerramienta({ id: "a", nombre: "A", problemasIds: ["conseguir-clientes", "ahorrar-tiempo"] })];

    expect(detectarEquilibrioProblemas(problemas, herramientas)).toEqual([]);
  });
});
