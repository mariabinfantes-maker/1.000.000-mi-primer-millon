import { describe, expect, it } from "vitest";
import type { Categoria, Herramienta } from "@/data/esquema";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { MINIMO_ALTERNATIVAS_POR_DEFECTO, construirColaInvestigacion, evaluarCobertura } from "../cobertura";

/**
 * Cobertura de categorías. La pregunta que faltaba: no "¿está repartido el
 * catálogo?" sino "¿tiene esta categoría suficientes alternativas para que
 * enseñarla sea honesto?".
 */

function categoria(id: string, estado?: Categoria["estado"]): Categoria {
  return { id, nombre: id, descripcion: `Categoría ${id}`, estado };
}

function herramientasEn(categoriaId: string, cuantas: number): Herramienta[] {
  return Array.from({ length: cuantas }, (_, i) =>
    construirHerramienta({ id: `${categoriaId}-${i}`, nombre: `${categoriaId} ${i}`, categoriaId })
  );
}

const estadoDe = (informe: ReturnType<typeof evaluarCobertura>, id: string) =>
  informe.categorias.find((c) => c.id === id)!.estado;

describe("evaluarCobertura", () => {
  it("una categoría sin ninguna herramienta está vacía", () => {
    const informe = evaluarCobertura([categoria("crm")], []);
    expect(estadoDe(informe, "crm")).toBe("vacia");
  });

  it("una categoría con UNA herramienta es insuficiente: un comparador con una opción no compara nada", () => {
    const informe = evaluarCobertura([categoria("crm")], herramientasEn("crm", 1));
    expect(estadoDe(informe, "crm")).toBe("insuficiente");
    expect(informe.categorias[0].faltanParaElMinimo).toBe(MINIMO_ALTERNATIVAS_POR_DEFECTO - 1);
  });

  it("con dos herramientas sigue siendo insuficiente: dos es un duelo, no una comparación", () => {
    const informe = evaluarCobertura([categoria("crm")], herramientasEn("crm", 2));
    expect(estadoDe(informe, "crm")).toBe("insuficiente");
  });

  it("con tres herramientas ya está preparada", () => {
    // Tres en una sola categoría serían el 100% del catálogo, así que se
    // reparten en dos para que no salte la sobrerrepresentación.
    const informe = evaluarCobertura(
      [categoria("crm"), categoria("otra")],
      [...herramientasEn("crm", 3), ...herramientasEn("otra", 4)]
    );
    expect(estadoDe(informe, "crm")).toBe("preparada");
    expect(informe.categorias.find((c) => c.id === "crm")!.faltanParaElMinimo).toBe(0);
  });

  it("una categoría que acapara más de la mitad del catálogo está sobrerrepresentada", () => {
    const informe = evaluarCobertura(
      [categoria("crm"), categoria("otra")],
      [...herramientasEn("crm", 9), ...herramientasEn("otra", 3)]
    );
    expect(estadoDe(informe, "crm")).toBe("sobrerrepresentada");
  });

  it("el mínimo es configurable: el número correcto puede subir cuando crezca el catálogo", () => {
    const herramientas = [...herramientasEn("crm", 3), ...herramientasEn("otra", 4)];
    expect(estadoDe(evaluarCobertura([categoria("crm"), categoria("otra")], herramientas), "crm")).toBe("preparada");
    expect(
      estadoDe(
        evaluarCobertura([categoria("crm"), categoria("otra")], herramientas, { minimoAlternativas: 5 }),
        "crm"
      )
    ).toBe("insuficiente");
  });

  it("no cuenta las herramientas retiradas: nadie las ve", () => {
    const activas = herramientasEn("crm", 2);
    const retirada = construirHerramienta({ id: "retirada", nombre: "Retirada", categoriaId: "crm", estado: "retirado" });
    const informe = evaluarCobertura([categoria("crm")], [...activas, retirada]);
    expect(informe.categorias[0].numeroHerramientas).toBe(2);
  });

  it("cuenta las herramientas que declaran la categoría como SECUNDARIA", () => {
    const secundaria = construirHerramienta({
      id: "suite",
      nombre: "Suite",
      categoriaId: "plataformas-todo-en-uno",
      categoriasSecundarias: ["crm"],
    });
    const informe = evaluarCobertura([categoria("crm")], [...herramientasEn("crm", 2), secundaria]);
    expect(informe.categorias[0].numeroHerramientas).toBe(3);
  });
});

describe("categorías ausentes", () => {
  it("detecta categorías del marco mínimo que ni siquiera están declaradas", () => {
    const informe = evaluarCobertura([categoria("crm")], herramientasEn("crm", 3));
    const ids = informe.ausentes.map((c) => c.id);
    expect(ids).toContain("facturacion-contabilidad");
    expect(ids).toContain("atencion-cliente");
    expect(ids).not.toContain("crm");
  });

  it("no hay ausentes cuando el marco completo está declarado", () => {
    const todas = [
      "plataformas-todo-en-uno",
      "crm",
      "gestion-proyectos",
      "asistentes-ia",
      "facturacion-contabilidad",
      "reservas-citas",
      "atencion-cliente",
      "comercio-electronico",
      "automatizacion-integraciones",
      "marketing-email",
      "recursos-humanos",
      "inventario-operaciones",
      "creacion-web-hosting",
      "firma-gestion-documental",
      "software-sectorial",
    ].map((id) => categoria(id));
    expect(evaluarCobertura(todas, []).ausentes).toEqual([]);
  });
});

describe("propuestas para una persona", () => {
  it("propone publicar una categoría interna que ya cumple el mínimo, sin publicarla", () => {
    const informe = evaluarCobertura(
      [categoria("crm", "pendiente"), categoria("otra", "publica")],
      [...herramientasEn("crm", 3), ...herramientasEn("otra", 4)]
    );
    expect(informe.listasParaPublicar.map((c) => c.id)).toEqual(["crm"]);
    // Curator propone: la categoría sigue marcada como interna.
    expect(informe.categorias.find((c) => c.id === "crm")!.publica).toBe(false);
  });

  it("avisa de una categoría publicada que se ha quedado sin respaldo", () => {
    const informe = evaluarCobertura([categoria("crm", "publica")], herramientasEn("crm", 1));
    expect(informe.publicadasSinRespaldo.map((c) => c.id)).toEqual(["crm"]);
  });

  it("una categoría sin estado declarado se considera pública, como las cuatro históricas", () => {
    const informe = evaluarCobertura([categoria("crm")], herramientasEn("crm", 1));
    expect(informe.categorias[0].publica).toBe(true);
  });
});

describe("cola de investigación para Researcher", () => {
  it("pone primero lo que está más cerca de poder publicarse", () => {
    const informe = evaluarCobertura(
      [categoria("casi", "pendiente"), categoria("vacia", "pendiente"), categoria("otra")],
      [...herramientasEn("casi", 2), ...herramientasEn("otra", 6)]
    );
    const cola = construirColaInvestigacion(informe);
    expect(cola[0].categoriaId).toBe("casi");
    expect(cola[0].herramientasQueFaltan).toBe(1);
  });

  it("incluye las categorías ausentes, con el mínimo entero por investigar", () => {
    const cola = construirColaInvestigacion(evaluarCobertura([categoria("crm")], herramientasEn("crm", 3)));
    const facturacion = cola.find((t) => t.categoriaId === "facturacion-contabilidad");
    expect(facturacion?.herramientasQueFaltan).toBe(MINIMO_ALTERNATIVAS_POR_DEFECTO);
  });

  it("no nombra ninguna herramienta concreta: proponer candidatas sin investigarlas sería inventarlas", () => {
    const cola = construirColaInvestigacion(evaluarCobertura([categoria("crm")], []));
    for (const tarea of cola) {
      expect(Object.keys(tarea)).toEqual(["categoriaId", "nombre", "herramientasQueFaltan", "motivo"]);
    }
  });

  it("está vacía si nada falta", () => {
    const todas = ["plataformas-todo-en-uno", "crm", "gestion-proyectos", "asistentes-ia"].map((id) => categoria(id));
    const herramientas = todas.flatMap((c) => herramientasEn(c.id, 3));
    const cola = construirColaInvestigacion(evaluarCobertura(todas, herramientas));
    // Las 11 categorías del marco que no están declaradas siguen faltando.
    expect(cola.every((t) => t.motivo.includes("ni siquiera está declarada"))).toBe(true);
  });
});
