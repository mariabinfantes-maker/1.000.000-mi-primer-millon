import { describe, expect, it } from "vitest";
import type { Categoria, Herramienta } from "@/data/esquema";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import {
  COMPROBACIONES_DISPONIBILIDAD_GEOGRAFICA,
  MINIMO_ALTERNATIVAS_POR_DEFECTO,
  construirColaInvestigacion,
  construirColaInvestigacionDeFichas,
  evaluarCobertura,
} from "../cobertura";

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
    const retirada = construirHerramienta({ id: "retirada", nombre: "Retirada", categoriaId: "crm", estado: "descontinuado" });
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

describe("cola de investigación por ficha", () => {
  const categorias = [
    categoria("crm"),
    categoria("plataformas-todo-en-uno"),
    categoria("gestion-proyectos"),
  ];

  /** Ficha completa salvo por lo que cada test quite. */
  function fichaCompleta(overrides: Partial<Herramienta> = {}): Herramienta {
    return construirHerramienta({
      id: "completa",
      nombre: "Completa",
      categoriaId: "crm",
      tipoProducto: "especializada",
      funcionesPrincipales: ["Una", "Dos", "Tres"],
      integraciones: ["Zapier"],
      idiomasDisponibles: ["español"],
      disponibleEnEspanol: true,
      disponibilidadGeografica: ["ES"],
      modulosIncluidos: ["crm"],
      puntuaciones: {
        facilidadDeUso: 7,
        calidad: 7,
        fiabilidad: 7,
        atencionAlCliente: 7,
        escalabilidad: 7,
        nivelTecnicoRequerido: 4,
        facilidadImplementacion: 7,
      },
      ...overrides,
    });
  }

  it("una ficha completa no genera ninguna tarea", () => {
    expect(construirColaInvestigacionDeFichas([fichaCompleta()], categorias)).toEqual([]);
  });

  it("la disponibilidad geográfica sin investigar es de prioridad ALTA aunque el campo sea opcional", () => {
    // No bloquea la ficha (sigue siendo válida y pública), pero condiciona
    // si la herramienta le sirve de verdad a una pyme española.
    const sinGeo = fichaCompleta({ disponibilidadGeografica: undefined });
    const tarea = construirColaInvestigacionDeFichas([sinGeo], categorias).find(
      (t) => t.campo === "disponibilidadGeografica"
    )!;
    expect(tarea.prioridad).toBe("alta");
  });

  it("la tarea geográfica trae las comprobaciones concretas: España, español, facturación, RGPD y límites", () => {
    const sinGeo = fichaCompleta({ disponibilidadGeografica: undefined });
    const tarea = construirColaInvestigacionDeFichas([sinGeo], categorias).find(
      (t) => t.campo === "disponibilidadGeografica"
    )!;
    expect(tarea.comprobaciones).toEqual(COMPROBACIONES_DISPONIBILIDAD_GEOGRAFICA);
    const texto = tarea.comprobaciones.join(" ");
    for (const esperado of ["España", "español", "Factura", "RGPD", "limitaciones"]) {
      expect(texto).toContain(esperado);
    }
  });

  it("una contradicción de clasificación entra en la cola con prioridad alta, sin corregir la ficha", () => {
    // El caso real de Pipedrive: declara 5 módulos y sus funciones son
    // todas comerciales. Curator lo registra; no toca los datos.
    const contradictoria = fichaCompleta({
      id: "contradictoria",
      tipoProducto: "especializada",
      modulosIncluidos: ["crm", "gestion_proyectos", "asistente_ia", "email_marketing"],
    });
    const tarea = construirColaInvestigacionDeFichas([contradictoria], categorias).find(
      (t) => t.campo === "clasificacion"
    )!;
    expect(tarea.prioridad).toBe("alta");
    expect(tarea.comprobaciones.length).toBeGreaterThan(0);
    // La ficha sigue exactamente igual: Curator no reclasifica nada.
    expect(contradictoria.tipoProducto).toBe("especializada");
    expect(contradictoria.modulosIncluidos).toHaveLength(4);
  });

  it("lo prioritario va primero", () => {
    const floja = fichaCompleta({
      disponibilidadGeografica: undefined,
      disponibleEnEspanol: undefined,
    });
    const cola = construirColaInvestigacionDeFichas([floja], categorias);
    expect(cola[0].prioridad).toBe("alta");
    expect(cola[cola.length - 1].prioridad).toBe("media");
  });

  it("no propone ningún valor: solo dice qué hay que averiguar", () => {
    const sinGeo = fichaCompleta({ disponibilidadGeografica: undefined });
    for (const tarea of construirColaInvestigacionDeFichas([sinGeo], categorias)) {
      expect(Object.keys(tarea).sort()).toEqual(
        ["campo", "comprobaciones", "herramientaId", "motivo", "prioridad"].sort()
      );
    }
  });
});
