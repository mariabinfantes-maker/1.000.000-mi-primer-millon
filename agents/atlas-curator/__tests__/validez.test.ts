import { describe, expect, it } from "vitest";
import type { Categoria, Herramienta } from "@/data/esquema";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import { detectarProblemasDeValidez, detectarProblemasDeValidezEnCatalogo } from "../validez";
import { detectarIncoherenciasDeClasificacion } from "../coherencia";

/**
 * Validez de los VALORES (no de su presencia) y coherencia entre lo que
 * una ficha declara ser y lo que sus propios datos respaldan.
 */

/** Ficha completa y sana: cualquier aviso que salga aquí viene del cambio que haga cada test. */
function fichaSana(overrides: Partial<Herramienta> = {}): Herramienta {
  return construirHerramienta({
    id: "sana",
    nombre: "Sana",
    categoriaId: "crm",
    tipoProducto: "especializada",
    funcionesPrincipales: ["Una", "Dos", "Tres"],
    integraciones: ["Zapier", "Slack"],
    idiomasDisponibles: ["español"],
    disponibleEnEspanol: true,
    disponibilidadGeografica: ["ES", "GLOBAL"],
    precioInicial: "Desde 20€/mes",
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

const campos = (herramienta: Herramienta) => detectarProblemasDeValidez(herramienta).map((a) => a.campo);

describe("una ficha sana no genera ruido", () => {
  it("no avisa de nada", () => {
    expect(detectarProblemasDeValidez(fichaSana())).toEqual([]);
  });
});

describe("valores inválidos: hay dato y no sirve", () => {
  it("un precio sin cifra ni mención a gratuito no sirve para comparar presupuestos", () => {
    const avisos = detectarProblemasDeValidez(fichaSana({ precioInicial: "Consultar" }));
    expect(avisos).toContainEqual(expect.objectContaining({ campo: "precioInicial", gravedad: "invalido" }));
  });

  it('acepta "Gratis" aunque no lleve ninguna cifra', () => {
    expect(campos(fichaSana({ precioInicial: "Gratis para siempre" }))).not.toContain("precioInicial");
  });

  it("menos de tres funciones no distingue la herramienta de sus vecinas", () => {
    expect(campos(fichaSana({ funcionesPrincipales: ["Una", "Dos"] }))).toContain("funcionesPrincipales");
  });

  it("una lista con entradas en blanco cuenta como vacía: pasa la validación de presencia y no dice nada", () => {
    expect(campos(fichaSana({ integraciones: ["  ", ""] }))).toContain("integraciones");
    expect(campos(fichaSana({ idiomasDisponibles: [""] }))).toContain("idiomasDisponibles");
  });

  it("una puntuación fuera de la escala 1-10 es un error, no un dato que falta", () => {
    const avisos = detectarProblemasDeValidez(
      fichaSana({ puntuaciones: { ...fichaSana().puntuaciones, facilidadImplementacion: 42 } })
    );
    expect(avisos).toContainEqual(
      expect.objectContaining({ campo: "puntuaciones.facilidadImplementacion", gravedad: "invalido" })
    );
  });
});

describe("pendiente de investigar: no hay dato y no se inventa", () => {
  it("la disponibilidad geográfica sin investigar se marca pendiente, no inválida", () => {
    const avisos = detectarProblemasDeValidez(fichaSana({ disponibilidadGeografica: undefined }));
    expect(avisos).toContainEqual(
      expect.objectContaining({ campo: "disponibilidadGeografica", gravedad: "pendiente" })
    );
  });

  it("sin confirmar el español se marca pendiente", () => {
    const avisos = detectarProblemasDeValidez(fichaSana({ disponibleEnEspanol: undefined }));
    expect(avisos).toContainEqual(expect.objectContaining({ campo: "disponibleEnEspanol", gravedad: "pendiente" }));
  });

  it("una ficha sin tipoProducto queda pendiente: hoy se deduce de la categoría histórica", () => {
    const avisos = detectarProblemasDeValidez(fichaSana({ tipoProducto: undefined }));
    expect(avisos).toContainEqual(expect.objectContaining({ campo: "tipoProducto", gravedad: "pendiente" }));
  });
});

describe("recorrido del catálogo", () => {
  it("no revisa las fichas retiradas: nadie las ve", () => {
    const retirada = fichaSana({ id: "retirada", estado: "retirado", precioInicial: "Consultar" });
    expect(detectarProblemasDeValidezEnCatalogo([retirada])).toEqual([]);
  });
});

describe("coherencia de clasificación", () => {
  const categorias: Categoria[] = [
    { id: "crm", nombre: "CRM", descripcion: "" },
    { id: "plataformas-todo-en-uno", nombre: "Todo en uno", descripcion: "" },
    { id: "gestion-proyectos", nombre: "Proyectos", descripcion: "" },
  ];
  const motivos = (h: Herramienta) => detectarIncoherenciasDeClasificacion(h, categorias).map((a) => a.motivo);

  it("una ficha coherente no genera avisos", () => {
    expect(motivos(fichaSana({ modulosIncluidos: ["crm"] }))).toEqual([]);
  });

  it("declararse suite sin módulos reales detrás es reclamar amplitud que no se tiene", () => {
    const falsaSuite = fichaSana({
      categoriaId: "plataformas-todo-en-uno",
      tipoProducto: "suite",
      modulosIncluidos: ["crm"],
    });
    expect(motivos(falsaSuite).join(" ")).toMatch(/se declara suite/i);
  });

  it("declararse especializada enumerando muchos módulos también es una contradicción", () => {
    const contradictoria = fichaSana({
      tipoProducto: "especializada",
      modulosIncluidos: ["crm", "gestion_proyectos", "facturacion", "email_marketing"],
    });
    expect(motivos(contradictoria).join(" ")).toMatch(/se declara especializada/i);
  });

  it("detecta una categoría secundaria que no existe", () => {
    const inventada = fichaSana({
      tipoProducto: "suite",
      modulosIncluidos: ["crm", "gestion_proyectos", "facturacion"],
      categoriasSecundarias: ["categoria-que-no-existe"],
    });
    expect(motivos(inventada).join(" ")).toContain("no existe en el catálogo de categorías");
  });

  it("una especializada que se añade categorías secundarias tiene que justificarlo", () => {
    const oportunista = fichaSana({ tipoProducto: "especializada", categoriasSecundarias: ["gestion-proyectos"] });
    expect(motivos(oportunista).join(" ")).toMatch(/especializada y aun así declara/i);
  });

  it("aparecer en más categorías de las que respaldan sus módulos se detecta", () => {
    const inflada = fichaSana({
      tipoProducto: "suite",
      modulosIncluidos: ["crm", "gestion_proyectos", "facturacion"],
      categoriasSecundarias: ["gestion-proyectos", "plataformas-todo-en-uno"],
    });
    expect(motivos(inflada).join(" ")).not.toContain("más sitios de los que su propia ficha respalda");
  });

  it("una ficha sin tipoProducto avisa de que se está deduciendo", () => {
    expect(motivos(fichaSana({ tipoProducto: undefined, modulosIncluidos: ["crm"] })).join(" ")).toContain(
      'No declara "tipoProducto"'
    );
  });
});
