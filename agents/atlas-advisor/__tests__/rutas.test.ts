import { describe, expect, it } from "vitest";
import { evaluarHerramienta, normalizarRuta, recomendarHerramientas } from "../motor";
import { CRITERIOS_ESPECIALIZADA, CRITERIOS_SUITE, modulosQueNecesita, rangoDeRuta } from "../criteriosRuta";
import { construirHerramienta } from "./fixtures";
import type { RespuestasUsuario } from "../tipos";

/**
 * Las dos rutas de evaluación. Estas pruebas son el contrato del sprint:
 * describen las dos injusticias que existían antes y fijan que no puedan
 * volver.
 *
 * Antes, una suite y una especializada compartían criterios, y eso hacía
 * que la amplitud sumara sola y que no ser suite restara solo. Aquí se
 * comprueba lo contrario en los dos sentidos.
 */

/** Suite que lo cubre todo y no hace nada especialmente bien. El caso que antes ganaba por acumulación. */
const suiteMediocre = construirHerramienta({
  id: "suite-mediocre",
  nombre: "Suite Mediocre",
  categoriaId: "plataformas-todo-en-uno",
  tipoProducto: "suite",
  problemasIds: ["conseguir-clientes"],
  modulosIncluidos: [
    "crm",
    "gestion_proyectos",
    "asistente_ia",
    "facturacion",
    "email_marketing",
    "atencion_cliente",
    "embudos_de_venta",
    "comercio_electronico",
    "creador_de_sitios_web",
    "recursos_humanos",
  ],
  funcionesPrincipales: ["Un poco de todo", "Y algo más", "Y también esto"],
  integraciones: ["Zapier", "Slack", "Gmail", "Stripe", "Shopify", "Trello"],
  puntuaciones: {
    facilidadDeUso: 4,
    calidad: 4,
    fiabilidad: 4,
    atencionAlCliente: 4,
    escalabilidad: 4,
    nivelTecnicoRequerido: 7,
  },
});

/** Especializada excelente en la única función que el usuario pide. */
const especializadaExcelente = construirHerramienta({
  id: "crm-excelente",
  nombre: "CRM Excelente",
  categoriaId: "crm",
  tipoProducto: "especializada",
  problemasIds: ["conseguir-clientes"],
  funcionesPrincipales: [
    "Embudo visual por etapas",
    "Automatización comercial",
    "Previsión de ventas",
    "Puntuación de oportunidades",
    "Informes avanzados",
  ],
  integraciones: ["Zapier", "Slack", "Gmail", "Stripe"],
  tieneApiPublica: true,
  puntuaciones: {
    facilidadDeUso: 9,
    calidad: 9,
    fiabilidad: 9,
    atencionAlCliente: 8,
    escalabilidad: 8,
    nivelTecnicoRequerido: 3,
  },
});

/** Otra especializada de la misma categoría, para que los criterios comparativos tengan con quién comparar. */
const crmCorriente = construirHerramienta({
  id: "crm-corriente",
  nombre: "CRM Corriente",
  categoriaId: "crm",
  tipoProducto: "especializada",
  problemasIds: ["conseguir-clientes"],
  funcionesPrincipales: ["Contactos", "Oportunidades", "Informes"],
  integraciones: ["Gmail"],
  puntuaciones: {
    facilidadDeUso: 6,
    calidad: 6,
    fiabilidad: 6,
    atencionAlCliente: 6,
    escalabilidad: 6,
    nivelTecnicoRequerido: 5,
  },
});

const buscaCrm: RespuestasUsuario = {
  problemaIdsCandidatos: ["conseguir-clientes"],
  tamanoEmpresa: "11-50",
  presupuesto: "medio",
};

describe("equidad entre las dos rutas", () => {
  it("una suite mediocre NO supera a una especializada excelente solo por cubrir más áreas", () => {
    const { todas } = recomendarHerramientas(buscaCrm, [suiteMediocre, especializadaExcelente, crmCorriente]);

    const posicionSuite = todas.findIndex((e) => e.herramienta.id === "suite-mediocre");
    const posicionEspecializada = todas.findIndex((e) => e.herramienta.id === "crm-excelente");

    expect(posicionEspecializada).toBeLessThan(posicionSuite);
  });

  it("una especializada no recibe ninguna penalización por el hecho de no ser suite", () => {
    const catalogo = [especializadaExcelente, crmCorriente, suiteMediocre];
    const evaluada = evaluarHerramienta(especializadaExcelente, buscaCrm, catalogo);

    // Antes existía `criterioTipoSuite`, que restaba hasta 8 puntos por
    // no ser una plataforma todo en uno. Ningún criterio puede volver a
    // penalizar a una herramienta por su tipo de producto.
    const penalizacionPorTipo = evaluada.detalles.filter(
      (d) => d.criterio === "tipoSuite" || (d.puntos < 0 && d.explicacion.includes("es una plataforma todo en uno"))
    );
    expect(penalizacionPorTipo).toEqual([]);
  });

  it("la ruta suite y la ruta especializada aportan como máximo lo mismo", () => {
    // La equidad no está en tener el mismo número de criterios, sino en
    // que ninguna ruta pueda aportar más que la otra por su forma.
    const suite = evaluarHerramienta(suiteMediocre, buscaCrm, [suiteMediocre, especializadaExcelente]);
    const especializada = evaluarHerramienta(especializadaExcelente, buscaCrm, [
      suiteMediocre,
      especializadaExcelente,
      crmCorriente,
    ]);

    for (const evaluada of [suite, especializada]) {
      expect(evaluada.puntuacionRutaNormalizada).toBeGreaterThanOrEqual(-1);
      expect(evaluada.puntuacionRutaNormalizada).toBeLessThanOrEqual(1);
    }
  });

  it("cada herramienta se evalúa con los criterios de su ruta, no con los de la otra", () => {
    const catalogo = [suiteMediocre, especializadaExcelente, crmCorriente];
    const suite = evaluarHerramienta(suiteMediocre, buscaCrm, catalogo);
    const especializada = evaluarHerramienta(especializadaExcelente, buscaCrm, catalogo);

    const criteriosDe = (evaluada: typeof suite) => new Set(evaluada.detalles.map((d) => d.criterio));

    expect(criteriosDe(suite).has("coberturaUtil")).toBe(true);
    expect(criteriosDe(suite).has("superioridadFrenteAlModulo")).toBe(false);
    expect(criteriosDe(especializada).has("superioridadFrenteAlModulo")).toBe(true);
    expect(criteriosDe(especializada).has("coberturaUtil")).toBe(false);
  });
});

describe("la amplitud no puntúa sola", () => {
  it("solo cuentan los módulos que responden a lo que el usuario ha pedido", () => {
    // Dos suites idénticas salvo en amplitud: una cubre diez áreas, la
    // otra solo las que hacen falta. Para este usuario deben empatar en
    // cobertura, porque cubren lo mismo DE LO QUE PIDIÓ.
    const suiteJusta = construirHerramienta({
      ...suiteMediocre,
      id: "suite-justa",
      nombre: "Suite Justa",
      modulosIncluidos: ["crm", "email_marketing", "embudos_de_venta"],
    });

    const cobertura = (id: string, catalogo: ReturnType<typeof construirHerramienta>[]) =>
      evaluarHerramienta(
        catalogo.find((h) => h.id === id)!,
        buscaCrm,
        catalogo
      ).detalles.find((d) => d.criterio === "coberturaUtil")!.puntos;

    const catalogo = [suiteMediocre, suiteJusta];
    expect(cobertura("suite-justa", catalogo)).toBe(cobertura("suite-mediocre", catalogo));
  });

  it("la dependencia de un solo proveedor siempre resta, nunca suma", () => {
    const evaluada = evaluarHerramienta(suiteMediocre, buscaCrm, [suiteMediocre]);
    const dependencia = evaluada.detalles.find((d) => d.criterio === "riesgoDependencia")!;
    expect(dependencia.puntos).toBeLessThanOrEqual(0);
  });

  it("una suite que no cubre nada de lo pedido no obtiene puntos de cobertura", () => {
    const suiteDeOtraCosa = construirHerramienta({
      ...suiteMediocre,
      id: "suite-otra",
      modulosIncluidos: ["recursos_humanos", "facturacion", "comercio_electronico"],
    });
    const cobertura = evaluarHerramienta(suiteDeOtraCosa, buscaCrm, [suiteDeOtraCosa]).detalles.find(
      (d) => d.criterio === "coberturaUtil"
    )!;
    expect(cobertura.puntos).toBe(0);
  });
});

describe("modulosQueNecesita", () => {
  it("deduce los módulos del objetivo elegido", () => {
    expect(modulosQueNecesita({ problemaIdsCandidatos: ["conseguir-clientes"] })).toEqual(
      expect.arrayContaining(["crm", "email_marketing", "embudos_de_venta"])
    );
  });

  it("deduce los módulos de la categoría elegida", () => {
    expect(modulosQueNecesita({ categoriaId: "gestion-proyectos" })).toEqual(["gestion_proyectos"]);
  });

  it("no inventa necesidades cuando el usuario no ha dicho nada", () => {
    expect(modulosQueNecesita({})).toEqual([]);
  });
});

describe("elección explícita de ruta", () => {
  it("si el usuario pide todo en uno, solo compiten suites", () => {
    const { todas } = recomendarHerramientas(
      { ...buscaCrm, preferenciaSuite: "todo_en_uno" },
      [suiteMediocre, especializadaExcelente, crmCorriente]
    );
    expect(todas.every((e) => e.tipoProducto === "suite")).toBe(true);
  });

  it("si el usuario pide especializadas, ninguna suite compite", () => {
    const { todas } = recomendarHerramientas(
      { ...buscaCrm, preferenciaSuite: "especializada" },
      [suiteMediocre, especializadaExcelente, crmCorriente]
    );
    expect(todas.every((e) => e.tipoProducto === "especializada")).toBe(true);
  });

  it("no devuelve comparativa de rutas si el usuario ya eligió: sería devolverle una pregunta ya respondida", () => {
    const resultado = recomendarHerramientas({ ...buscaCrm, preferenciaSuite: "todo_en_uno" }, [
      suiteMediocre,
      especializadaExcelente,
    ]);
    expect(resultado.comparativaDeRutas).toBeUndefined();
  });
});

describe("sin preferencia: comparación normalizada y explicada", () => {
  const catalogo = [suiteMediocre, especializadaExcelente, crmCorriente];

  it("enfrenta la mejor de cada ruta", () => {
    const { comparativaDeRutas } = recomendarHerramientas(buscaCrm, catalogo);
    expect(comparativaDeRutas?.mejorSuite?.tipoProducto).toBe("suite");
    expect(comparativaDeRutas?.mejorEspecializada?.tipoProducto).toBe("especializada");
  });

  it("explica el beneficio Y el sacrificio de cada enfoque, no solo lo bueno", () => {
    const { comparativaDeRutas } = recomendarHerramientas(buscaCrm, catalogo);
    expect(comparativaDeRutas?.beneficioDeCentralizar).toContain("A cambio");
    expect(comparativaDeRutas?.beneficioDeEspecializar).toContain("A cambio");
  });

  it("las dos rutas siguen compitiendo: no se filtra ninguna", () => {
    const { todas } = recomendarHerramientas(buscaCrm, catalogo);
    expect(new Set(todas.map((e) => e.tipoProducto))).toEqual(new Set(["suite", "especializada"]));
  });
});

describe("rangos declarados de cada criterio de ruta", () => {
  it("ningún criterio declara un rango imposible", () => {
    for (const criterio of [...CRITERIOS_SUITE, ...CRITERIOS_ESPECIALIZADA]) {
      expect(criterio.max).toBeGreaterThanOrEqual(criterio.min);
    }
  });

  it("los puntos que devuelve cada criterio caben dentro del rango que declara", () => {
    // Si un criterio se saliera de su rango, la normalización daría un
    // valor fuera de 0..1 y una ruta podría colarse por encima de la otra.
    const catalogo = [suiteMediocre, especializadaExcelente, crmCorriente];
    const perfiles: RespuestasUsuario[] = [
      buscaCrm,
      { categoriaId: "crm", industria: "retail" },
      { problemaIdsCandidatos: ["conseguir-clientes", "organizar-empresa"], tamanoEmpresa: "200+" },
      {},
    ];

    for (const herramienta of catalogo) {
      for (const respuestas of perfiles) {
        const evaluada = evaluarHerramienta(herramienta, respuestas, catalogo);
        expect(evaluada.puntuacionRutaNormalizada).toBeGreaterThanOrEqual(-1);
        expect(evaluada.puntuacionRutaNormalizada).toBeLessThanOrEqual(1);
      }
    }
  });

  it("el rango total de una ruta nunca es cero: si no, no habría nada que normalizar", () => {
    expect(rangoDeRuta(CRITERIOS_SUITE).max).toBeGreaterThan(rangoDeRuta(CRITERIOS_SUITE).min);
    expect(rangoDeRuta(CRITERIOS_ESPECIALIZADA).max).toBeGreaterThan(rangoDeRuta(CRITERIOS_ESPECIALIZADA).min);
  });
});

describe("una categoría secundaria no da ventaja automática", () => {
  /**
   * El caso que motivó estas pruebas: monday.com aparecía la primera en
   * las tres categorías que declara, y había que demostrar si ganaba por
   * mérito o por figurar en la lista.
   *
   * La respuesta fue las dos cosas, y se corrigieron los dos agujeros que
   * la producían — sin escribir ninguna excepción para monday.com:
   *  - `coberturaUtil` regalaba sus 14 puntos por "cubrir 1 de 1" al
   *    navegar por una categoría concreta, que es justo cuando centralizar
   *    no aporta nada;
   *  - la normalización repartía el rango entero entre 0 y 1, y como las
   *    dos rutas tienen rangos distintos, una herramienta NEUTRA valía más
   *    siendo suite que siendo especializada.
   */
  const suiteAmplia = construirHerramienta({
    id: "suite-amplia",
    nombre: "Suite Amplia",
    categoriaId: "gestion-proyectos",
    tipoProducto: "suite",
    categoriasSecundarias: ["crm"],
    modulosIncluidos: ["crm", "gestion_proyectos", "asistente_ia", "atencion_cliente"],
    funcionesPrincipales: ["Tableros", "Automatizaciones", "Formularios"],
  });

  const crmNativo = construirHerramienta({
    id: "crm-nativo",
    nombre: "CRM Nativo",
    categoriaId: "crm",
    tipoProducto: "especializada",
    funcionesPrincipales: ["Embudo", "Contactos", "Informes", "Previsión", "Automatización comercial"],
  });
  const otroCrmNativo = construirHerramienta({
    ...crmNativo,
    id: "crm-nativo-2",
    nombre: "CRM Nativo 2",
  });

  const catalogo = [suiteAmplia, crmNativo, otroCrmNativo];

  it("declarar una categoría secundaria no otorga puntos de cobertura por sí solo", () => {
    // Al navegar por "crm" solo hay UNA necesidad, así que no hay nada que
    // consolidar y la amplitud no puntúa.
    const evaluada = evaluarHerramienta(suiteAmplia, { categoriaId: "crm" }, catalogo);
    const cobertura = evaluada.detalles.find((d) => d.criterio === "coberturaUtil")!;
    expect(cobertura.puntos).toBe(0);
  });

  it("una suite más superficial que los nativos de esa categoría pierde puntos al entrar en ella", () => {
    const enCategoriaAjena = evaluarHerramienta(suiteAmplia, { categoriaId: "crm" }, catalogo);
    const relevancia = enCategoriaAjena.detalles.find((d) => d.criterio === "relevanciaEnCategoriaAjena")!;
    expect(relevancia.puntos).toBeLessThan(0);
  });

  it("en su categoría PRINCIPAL no se le exige ese peaje: está en su sitio", () => {
    const enSuCategoria = evaluarHerramienta(suiteAmplia, { categoriaId: "gestion-proyectos" }, catalogo);
    const relevancia = enSuCategoria.detalles.find((d) => d.criterio === "relevanciaEnCategoriaAjena")!;
    expect(relevancia.puntos).toBe(0);
  });

  it("una suite CON tanta profundidad como los nativos puede ganar en una categoría secundaria", () => {
    // Molnip no debe empeorar una recomendación para repartir visibilidad:
    // si los datos la respaldan, la suite gana.
    const suiteProfunda = construirHerramienta({
      ...suiteAmplia,
      id: "suite-profunda",
      nombre: "Suite Profunda",
      funcionesPrincipales: ["Embudo", "Contactos", "Informes", "Previsión", "Automatización", "Segmentación"],
      puntuaciones: { ...suiteAmplia.puntuaciones, calidad: 10, fiabilidad: 10, escalabilidad: 10 },
    });
    const conProfunda = [suiteProfunda, crmNativo, otroCrmNativo];
    const { todas } = recomendarHerramientas({ categoriaId: "crm" }, conProfunda);

    expect(todas[0].herramienta.id).toBe("suite-profunda");
    expect(
      evaluarHerramienta(suiteProfunda, { categoriaId: "crm" }, conProfunda).detalles.find(
        (d) => d.criterio === "relevanciaEnCategoriaAjena"
      )!.puntos
    ).toBe(0);
  });

  it("cubrir una sola necesidad nunca puntúa como consolidación, sea cual sea la suite", () => {
    for (const categoriaId of ["crm", "gestion-proyectos"]) {
      const cobertura = evaluarHerramienta(suiteAmplia, { categoriaId }, catalogo).detalles.find(
        (d) => d.criterio === "coberturaUtil"
      )!;
      expect(cobertura.puntos, `categoría ${categoriaId}`).toBe(0);
    }
  });

  it("con VARIAS necesidades reales sí puntúa: ahí centralizar significa algo", () => {
    const cobertura = evaluarHerramienta(
      suiteAmplia,
      { problemaIdsCandidatos: ["organizar-empresa"] },
      catalogo
    ).detalles.find((d) => d.criterio === "coberturaUtil")!;
    // "organizar-empresa" necesita gestion_proyectos + crm, y las cubre las dos.
    expect(cobertura.puntos).toBeGreaterThan(0);
  });
});

describe("normalización centrada en cero", () => {
  it("una herramienta neutra vale exactamente lo mismo en las dos rutas", () => {
    // Sin esto, el rango asimétrico de cada ruta regalaba ventaja a la
    // suite: 0,446 frente a 0,310 para dos herramientas igual de neutras.
    const neutra = {
      facilidadDeUso: 5,
      calidad: 5,
      fiabilidad: 5,
      atencionAlCliente: 5,
      escalabilidad: 5,
      nivelTecnicoRequerido: 5,
      facilidadImplementacion: 5,
    } as const;

    const suiteNeutra = construirHerramienta({
      id: "s-neutra",
      nombre: "S",
      categoriaId: "plataformas-todo-en-uno",
      tipoProducto: "suite",
      modulosIncluidos: ["crm", "email_marketing", "facturacion"],
      puntuaciones: { ...neutra },
    });
    const especializadaNeutra = construirHerramienta({
      id: "e-neutra",
      nombre: "E",
      categoriaId: "crm",
      tipoProducto: "especializada",
      puntuaciones: { ...neutra },
    });

    const catalogo = [suiteNeutra, especializadaNeutra];
    const s = evaluarHerramienta(suiteNeutra, {}, catalogo);
    const e = evaluarHerramienta(especializadaNeutra, {}, catalogo);

    expect(s.puntuacionRutaNormalizada).toBe(0);
    expect(e.puntuacionRutaNormalizada).toBe(0);
    expect(s.puntuacionTotal).toBe(e.puntuacionTotal);
  });

  it("normalizarRuta mantiene el cero y respeta los topes de cada lado", () => {
    const rango = { min: -50, max: 62 };
    expect(normalizarRuta(0, rango)).toBe(0);
    expect(normalizarRuta(62, rango)).toBe(1);
    expect(normalizarRuta(-50, rango)).toBe(-1);
    expect(normalizarRuta(31, rango)).toBeCloseTo(0.5);
    expect(normalizarRuta(-25, rango)).toBeCloseTo(-0.5);
  });
});
