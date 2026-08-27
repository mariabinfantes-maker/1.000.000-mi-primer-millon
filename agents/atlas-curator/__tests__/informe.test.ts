import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { Categoria, Problema } from "@/data/esquema";
import { construirDatosInforme, generarInformeCuratorHtml } from "../informe";

const CATEGORIAS: Categoria[] = [{ id: "crm", nombre: "CRM", descripcion: "Descripción de prueba." }];
const PROBLEMAS: Problema[] = [
  { id: "conseguir-clientes", titulo: "Conseguir clientes", descripcion: "Descripción de prueba.", preguntaHerramienta: "¿Ya usas algo?" },
];

describe("construirDatosInforme", () => {
  it("combina equilibrio de categorías, de problemas y huecos editoriales", () => {
    const herramientas = [
      construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" }),
      construirHerramienta({ id: "b", nombre: "B", categoriaId: "crm", tieneAppMovil: true }),
      construirHerramienta({ id: "c", nombre: "C", categoriaId: "crm", tieneAppMovil: true }),
    ];

    const datos = construirDatosInforme(CATEGORIAS, PROBLEMAS, herramientas);

    expect(datos.categorias).toEqual([]); // solo una categoría, sin huérfanas ni concentración con este umbral
    expect(datos.problemas.some((p) => p.id === "conseguir-clientes")).toBe(true); // huérfano: ninguna herramienta lo referencia
    expect(datos.huecosEditoriales.some((h) => h.herramientaId === "a" && h.campo === "tieneAppMovil")).toBe(true);
  });
});

describe("generarInformeCuratorHtml", () => {
  it("genera HTML autocontenido que incluye los avisos y deja claro que es solo informativo", () => {
    const datos = construirDatosInforme(CATEGORIAS, PROBLEMAS, [construirHerramienta({ id: "a", nombre: "A", categoriaId: "crm" })]);

    const html = generarInformeCuratorHtml(datos);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Conseguir clientes");
    expect(html).toContain("Solo informativo");
  });

  it("muestra un mensaje explícito de 'nada que revisar' cuando no hay avisos, en vez de una tabla vacía", () => {
    const html = generarInformeCuratorHtml({
      categorias: [],
      problemas: [],
      huecosEditoriales: [],
      cobertura: { categorias: [], ausentes: [], listasParaPublicar: [], publicadasSinRespaldo: [] },
      colaInvestigacion: [],
      colaInvestigacionFichas: [],
      validez: [],
      coherencia: [],
      desactualizadasSegunMantenimiento: 0,
    });

    expect(html).toContain("Nada que revisar");
  });
});
