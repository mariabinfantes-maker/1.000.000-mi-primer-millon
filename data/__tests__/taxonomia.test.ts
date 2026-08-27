import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Herramienta } from "../esquema";
import { RANGOS_EMPLEADOS } from "@/lib/cuestionario";
import { validarHerramienta } from "../repositorio";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { categoriasDe, cubreCategoria, esCategoriaPublica, esSuite, tipoProductoDe } from "../taxonomia";

/**
 * Los dos ejes de la taxonomía y las garantías de datos que los sostienen.
 */

describe("esSuite", () => {
  it("hace caso al campo explícito por encima de todo", () => {
    expect(esSuite({ categoriaId: "crm", tipoProducto: "suite" })).toBe(true);
    expect(esSuite({ categoriaId: "plataformas-todo-en-uno", tipoProducto: "especializada" })).toBe(false);
  });

  it("cuando falta el campo, cae a la categoría histórica sin romper las fichas antiguas", () => {
    expect(esSuite({ categoriaId: "plataformas-todo-en-uno" })).toBe(true);
    expect(esSuite({ categoriaId: "crm" })).toBe(false);
  });

  it("tipoProductoDe siempre responde algo, aunque la ficha no lo declare", () => {
    expect(tipoProductoDe({ categoriaId: "crm" })).toBe("especializada");
    expect(tipoProductoDe({ categoriaId: "plataformas-todo-en-uno" })).toBe("suite");
  });
});

describe("categorías principal y secundarias", () => {
  it("la principal va siempre primero", () => {
    expect(categoriasDe({ categoriaId: "gestion-proyectos", categoriasSecundarias: ["crm"] })).toEqual([
      "gestion-proyectos",
      "crm",
    ]);
  });

  it("no repite si la principal aparece también entre las secundarias", () => {
    expect(categoriasDe({ categoriaId: "crm", categoriasSecundarias: ["crm", "asistentes-ia"] })).toEqual([
      "crm",
      "asistentes-ia",
    ]);
  });

  it("una herramienta cubre tanto su categoría principal como las secundarias", () => {
    const monday = { categoriaId: "gestion-proyectos", categoriasSecundarias: ["plataformas-todo-en-uno", "crm"] };
    expect(cubreCategoria(monday, "gestion-proyectos")).toBe(true);
    expect(cubreCategoria(monday, "crm")).toBe(true);
    expect(cubreCategoria(monday, "asistentes-ia")).toBe(false);
  });

  it("sin secundarias sigue funcionando", () => {
    expect(categoriasDe({ categoriaId: "crm" })).toEqual(["crm"]);
  });
});

describe("estado de una categoría", () => {
  it("sin estado declarado es pública: así eran las cuatro históricas", () => {
    expect(esCategoriaPublica({ id: "crm", nombre: "CRM", descripcion: "" })).toBe(true);
  });

  it("una categoría pendiente no es pública", () => {
    expect(esCategoriaPublica({ id: "x", nombre: "X", descripcion: "", estado: "pendiente" })).toBe(false);
  });
});

describe("tramos de tamaño de empresa", () => {
  const validos = RANGOS_EMPLEADOS.map((r) => r.valor);

  it("rechaza una ficha con un tramo inventado", () => {
    // Un tramo como "2-10" no rompe nada visible: simplemente nunca
    // coincide con la respuesta del cuestionario, así que la herramienta
    // pierde puntos en silencio. Por eso tiene que fallar la validación.
    const ficha = { ...construirHerramienta({ id: "x", nombre: "X" }), segmentosIdeales: ["2-10"] };
    expect(() => validarHerramienta(ficha, "x.json")).toThrow(/segmentosIdeales/);
  });

  it("acepta los cuatro tramos reales", () => {
    const ficha = { ...construirHerramienta({ id: "x", nombre: "X", integraciones: ["Zapier"] }), segmentosIdeales: validos };
    expect(() => validarHerramienta(ficha, "x.json")).not.toThrow();
  });

  it("NINGUNA ficha del catálogo real usa un tramo inválido", () => {
    const dir = path.join(process.cwd(), "data", "herramientas");
    const problemas: string[] = [];
    for (const archivo of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      const ficha = JSON.parse(readFileSync(path.join(dir, archivo), "utf-8")) as Herramienta;
      for (const segmento of ficha.segmentosIdeales) {
        if (!validos.includes(segmento)) problemas.push(`${ficha.id}: "${segmento}"`);
      }
    }
    expect(problemas).toEqual([]);
  });
});

describe("validación de los campos nuevos", () => {
  const base = () => construirHerramienta({ id: "x", nombre: "X", integraciones: ["Zapier"] });

  it("rechaza un tipoProducto que no existe", () => {
    expect(() => validarHerramienta({ ...base(), tipoProducto: "hibrida" }, "x.json")).toThrow(/tipoProducto/);
  });

  it("rechaza repetir la categoría principal entre las secundarias", () => {
    expect(() =>
      validarHerramienta({ ...base(), categoriaId: "crm", categoriasSecundarias: ["crm"] }, "x.json")
    ).toThrow(/categoriasSecundarias/);
  });

  it("rechaza una disponibilidad geográfica mal escrita", () => {
    expect(() => validarHerramienta({ ...base(), disponibilidadGeografica: ["españa"] }, "x.json")).toThrow(
      /disponibilidadGeografica/
    );
  });

  it("acepta códigos ISO y GLOBAL", () => {
    expect(() =>
      validarHerramienta({ ...base(), disponibilidadGeografica: ["ES", "MX", "GLOBAL"] }, "x.json")
    ).not.toThrow();
  });

  it("los tres campos nuevos son opcionales: las fichas que no los declaran siguen siendo válidas", () => {
    expect(() => validarHerramienta(base(), "x.json")).not.toThrow();
  });
});
