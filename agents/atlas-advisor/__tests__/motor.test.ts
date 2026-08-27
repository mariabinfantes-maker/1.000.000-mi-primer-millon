import { describe, expect, it } from "vitest";
import { evaluarHerramienta, recomendarHerramientas } from "../motor";
import type { RespuestasUsuario } from "../tipos";
import { catalogoDePrueba, construirHerramienta, crmFacil, erpComplejo, generalistaMedio, nichoVertical } from "./fixtures";

describe("recomendarHerramientas", () => {
  it("recomienda la herramienta sencilla para una startup pequeña, sin equipo técnico y con presupuesto ajustado", () => {
    const respuestas: RespuestasUsuario = {
      tamanoEmpresa: "1-10",
      presupuesto: "ajustado",
      requierePlanGratuito: true,
      nivelTecnicoEquipo: "ninguno",
      prioridadFacilidadDeUso: "alta",
      toleranciaCurvaAprendizaje: "facil",
    };

    const resultado = recomendarHerramientas(respuestas, catalogoDePrueba);

    expect(resultado.top[0].herramienta.id).toBe("crm-facil");
    expect(resultado.top).toHaveLength(3);

    const erpEvaluado = resultado.todas.find((h) => h.herramienta.id === "erp-complejo");
    expect(erpEvaluado?.tieneAdvertencia).toBe(true);
    expect(erpEvaluado!.puntuacionTotal).toBeLessThan(resultado.top[0].puntuacionTotal);
  });

  it("recomienda el ERP para una empresa grande con equipo técnico avanzado y presupuesto alto", () => {
    const respuestas: RespuestasUsuario = {
      tamanoEmpresa: "200+",
      presupuesto: "alto",
      nivelTecnicoEquipo: "avanzado",
      toleranciaCurvaAprendizaje: "dificil",
      prioridadFacilidadDeUso: "baja",
    };

    const resultado = recomendarHerramientas(respuestas, catalogoDePrueba);

    expect(resultado.top[0].herramienta.id).toBe("erp-complejo");

    const erpEvaluado = resultado.todas.find((h) => h.herramienta.id === "erp-complejo")!;
    expect(erpEvaluado.tieneAdvertencia).toBe(false);
  });

  it("penaliza con fuerza una herramienta cuando el perfil del usuario coincide con un caso no recomendado", () => {
    const respuestas: RespuestasUsuario = {
      tamanoEmpresa: "1-10",
      nivelTecnicoEquipo: "ninguno",
      presupuesto: "ajustado",
    };

    const evaluado = evaluarHerramienta(erpComplejo, respuestas);
    const detalleCasos = evaluado.detalles.find((d) => d.criterio === "casosNoRecomendados")!;

    expect(evaluado.tieneAdvertencia).toBe(true);
    expect(detalleCasos.puntos).toBeLessThanOrEqual(-40);
    expect(evaluado.razones.some((razon) => razon.includes("recursos técnicos"))).toBe(true);
  });

  it("no penaliza por casosNoRecomendados cuando el perfil no coincide con ninguno", () => {
    const respuestas: RespuestasUsuario = {
      tamanoEmpresa: "200+",
      nivelTecnicoEquipo: "avanzado",
      presupuesto: "alto",
    };

    const evaluado = evaluarHerramienta(erpComplejo, respuestas);
    const detalleCasos = evaluado.detalles.find((d) => d.criterio === "casosNoRecomendados")!;

    expect(evaluado.tieneAdvertencia).toBe(false);
    expect(detalleCasos.puntos).toBe(0);
  });

  it("detecta coincidencias con casosNoRecomendados a partir de las notas libres del usuario", () => {
    const respuestas: RespuestasUsuario = {
      notasAdicionales: "Tenemos inventario físico repartido en varios almacenes distintos",
    };

    const evaluado = evaluarHerramienta(nichoVertical, respuestas);
    const detalleCasos = evaluado.detalles.find((d) => d.criterio === "casosNoRecomendados")!;

    expect(evaluado.tieneAdvertencia).toBe(true);
    expect(detalleCasos.puntos).toBeLessThan(0);
  });

  it("premia las integraciones que sí necesita el usuario y penaliza cuando no las encuentra", () => {
    const respuestas: RespuestasUsuario = { integracionesNecesarias: ["Stripe"] };

    const conStripe = evaluarHerramienta(crmFacil, respuestas);
    const sinStripe = evaluarHerramienta(erpComplejo, respuestas);

    const detalleConStripe = conStripe.detalles.find((d) => d.criterio === "integraciones")!;
    const detalleSinStripe = sinStripe.detalles.find((d) => d.criterio === "integraciones")!;

    expect(detalleConStripe.puntos).toBeGreaterThan(0);
    expect(detalleConStripe.explicacion).toContain("Stripe");
    expect(detalleSinStripe.puntos).toBeLessThan(0);
  });

  it("reconoce un idioma disponible de forma explícita y marca como incierto uno que no aparece listado", () => {
    const respuestas: RespuestasUsuario = { idiomaNecesario: "español" };
    const evaluado = evaluarHerramienta(crmFacil, respuestas);
    const detalleIdioma = evaluado.detalles.find((d) => d.criterio === "idioma")!;

    expect(detalleIdioma.puntos).toBeGreaterThan(0);
    expect(detalleIdioma.explicacion).toContain("español");

    const respuestasFrances: RespuestasUsuario = { idiomaNecesario: "francés" };
    const evaluadoFrances = evaluarHerramienta(crmFacil, respuestasFrances);
    const detalleFrances = evaluadoFrances.detalles.find((d) => d.criterio === "idioma")!;
    expect(detalleFrances.puntos).toBeLessThan(0);
  });

  it("da un beneficio menor a una herramienta cuya disponibilidad de idioma es solo probable ('más de N idiomas')", () => {
    const respuestas: RespuestasUsuario = { idiomaNecesario: "francés" };
    const evaluado = evaluarHerramienta(generalistaMedio, respuestas);
    const detalleIdioma = evaluado.detalles.find((d) => d.criterio === "idioma")!;

    expect(detalleIdioma.puntos).toBeGreaterThan(0);
    expect(detalleIdioma.explicacion).toContain("francés");
  });

  it("no penaliza ningún criterio cuando la pregunta correspondiente no fue respondida", () => {
    const evaluado = evaluarHerramienta(crmFacil, {});
    const criteriosDependientesDeRespuesta = [
      "tamanoEmpresa",
      "industria",
      "nivelTecnico",
      "curvaDeAprendizaje",
      "integraciones",
      "idioma",
    ];

    for (const criterio of criteriosDependientesDeRespuesta) {
      const detalle = evaluado.detalles.find((d) => d.criterio === criterio)!;
      expect(detalle.puntos).toBe(0);
      expect(detalle.explicacion).toBe("");
    }
  });

  it("sigue devolviendo un ranking completo y una explicación legible incluso sin ninguna respuesta", () => {
    const resultado = recomendarHerramientas({}, catalogoDePrueba);

    expect(resultado.top).toHaveLength(3);
    expect(resultado.todas).toHaveLength(catalogoDePrueba.length);
    for (const evaluado of resultado.top) {
      expect(evaluado.explicacion.length).toBeGreaterThan(0);
    }
  });

  it("filtra por categoría cuando se indica, y devuelve listas vacías si ninguna herramienta pertenece a ella", () => {
    const resultado = recomendarHerramientas({ categoriaId: "categoria-inexistente" }, catalogoDePrueba);

    expect(resultado.top).toEqual([]);
    expect(resultado.todas).toEqual([]);
  });

  it("filtra por problemaIdsCandidatos cuando no hay categoriaId, devolviendo solo herramientas con ese objetivo", () => {
    const resultado = recomendarHerramientas(
      { problemaIdsCandidatos: ["conseguir-clientes"] },
      catalogoDePrueba
    );

    expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["crm-facil"]);
  });

  it("evalúa la unión de herramientas cuando problemaIdsCandidatos trae varios ids (empate de la detección por texto)", () => {
    const resultado = recomendarHerramientas(
      { problemaIdsCandidatos: ["conseguir-clientes", "organizar-empresa"] },
      catalogoDePrueba
    );

    expect(resultado.todas.map((e) => e.herramienta.id).sort()).toEqual(["crm-facil", "erp-complejo"]);
  });

  it("ignora problemaIdsCandidatos y evalúa el catálogo completo si ninguna herramienta lo tiene asignado (hueco editorial, no elección del usuario)", () => {
    const resultado = recomendarHerramientas(
      { problemaIdsCandidatos: ["objetivo-sin-herramientas-todavia"] },
      catalogoDePrueba
    );

    expect(resultado.todas).toHaveLength(catalogoDePrueba.length);
  });

  it("da prioridad a categoriaId sobre problemaIdsCandidatos cuando llegan los dos a la vez", () => {
    const resultado = recomendarHerramientas(
      { categoriaId: "plataformas-todo-en-uno", problemaIdsCandidatos: ["conseguir-clientes"] },
      catalogoDePrueba
    );

    // Las 4 herramientas de prueba comparten categoriaId "plataformas-todo-en-uno" (valor por defecto de
    // construirHerramienta); si problemaIdsCandidatos ganara la prioridad, el resultado se quedaría solo en
    // crm-facil (la única con ese problemaId).
    expect(resultado.todas).toHaveLength(catalogoDePrueba.length);
  });

  it("respeta la opción `cantidad` para devolver un top distinto de 3", () => {
    const resultado = recomendarHerramientas({}, catalogoDePrueba, { cantidad: 2 });
    expect(resultado.top).toHaveLength(2);
  });

  it("no lanza excepciones ni devuelve un catálogo vacío al evaluar un único candidato", () => {
    const resultado = recomendarHerramientas({ tamanoEmpresa: "1-10" }, [crmFacil]);
    expect(resultado.top).toHaveLength(1);
    expect(resultado.top[0].herramienta.id).toBe("crm-facil");
  });

  describe("preferenciaSuite (pregunta explícita del cuestionario)", () => {
    const suiteTodoEnUno = construirHerramienta({ id: "suite-1", nombre: "Suite 1", categoriaId: "plataformas-todo-en-uno" });
    const crmEspecializado = construirHerramienta({ id: "crm-1", nombre: "CRM 1", categoriaId: "crm" });
    const catalogoMixto = [suiteTodoEnUno, crmEspecializado];

    it('filtra solo a "plataformas-todo-en-uno" cuando el usuario elige explícitamente esa preferencia', () => {
      const resultado = recomendarHerramientas({ preferenciaSuite: "todo_en_uno" }, catalogoMixto);
      expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["suite-1"]);
    });

    it("excluye las suites todo en uno cuando el usuario elige explícitamente herramientas especializadas", () => {
      const resultado = recomendarHerramientas({ preferenciaSuite: "especializada" }, catalogoMixto);
      expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["crm-1"]);
    });

    it("categoriaId sigue teniendo prioridad sobre preferenciaSuite si llegan los dos a la vez", () => {
      const resultado = recomendarHerramientas(
        { categoriaId: "crm", preferenciaSuite: "todo_en_uno" },
        catalogoMixto
      );
      expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["crm-1"]);
    });

    it("ignora preferenciaSuite si vacía el catálogo (hueco editorial, no elección real posible todavía)", () => {
      const soloEspecializadas = [crmEspecializado];
      const resultado = recomendarHerramientas({ preferenciaSuite: "todo_en_uno" }, soloEspecializadas);
      expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["crm-1"]);
    });

    it("combina preferenciaSuite con problemaIdsCandidatos: primero el tipo de suite, luego el objetivo", () => {
      const suiteConProblema = construirHerramienta({
        id: "suite-2",
        nombre: "Suite 2",
        categoriaId: "plataformas-todo-en-uno",
        problemasIds: ["conseguir-clientes"],
      });
      const especializadaConProblema = construirHerramienta({
        id: "crm-2",
        nombre: "CRM 2",
        categoriaId: "crm",
        problemasIds: ["conseguir-clientes"],
      });

      const resultado = recomendarHerramientas(
        { preferenciaSuite: "todo_en_uno", problemaIdsCandidatos: ["conseguir-clientes"] },
        [suiteConProblema, especializadaConProblema]
      );

      expect(resultado.todas.map((e) => e.herramienta.id)).toEqual(["suite-2"]);
    });
  });

  describe("señales indirectas de tipo de producto, sin elección explícita", () => {
    const suiteTodoEnUno = construirHerramienta({
      id: "suite-1",
      nombre: "Suite 1",
      categoriaId: "plataformas-todo-en-uno",
      tipoProducto: "suite",
      modulosIncluidos: ["crm", "email_marketing", "facturacion"],
    });
    const crmEspecializado = construirHerramienta({
      id: "crm-1",
      nombre: "CRM 1",
      categoriaId: "crm",
      tipoProducto: "especializada",
    });

    it("no filtra el catálogo por señales indirectas: ambos tipos siguen evaluándose", () => {
      const respuestas: RespuestasUsuario = { tamanoEmpresa: "1-10", presupuesto: "ajustado", nivelTecnicoEquipo: "ninguno" };
      const resultado = recomendarHerramientas(respuestas, [suiteTodoEnUno, crmEspecializado]);
      expect(resultado.todas).toHaveLength(2);
    });

    it("las señales indirectas ya no restan puntos a nadie: solo redactan la comparación", () => {
      // Antes, este perfil (equipo pequeño, presupuesto ajustado, sin
      // capacidad técnica) hacía perder 8 puntos a toda especializada por
      // el mero hecho de no ser una suite. Ahora orienta el texto, y la
      // decisión sigue siendo del usuario.
      const respuestas: RespuestasUsuario = { tamanoEmpresa: "1-10", presupuesto: "ajustado", nivelTecnicoEquipo: "ninguno" };
      const evaluadaCrm = evaluarHerramienta(crmEspecializado, respuestas, [suiteTodoEnUno, crmEspecializado]);

      expect(evaluadaCrm.detalles.find((d) => d.criterio === "tipoSuite")).toBeUndefined();

      const { comparativaDeRutas } = recomendarHerramientas(respuestas, [suiteTodoEnUno, crmEspecializado]);
      expect(comparativaDeRutas?.beneficioDeCentralizar).toContain("centralizar te encajaría mejor");
    });

    it("con el perfil contrario, la comparación matiza hacia la especializada", () => {
      const respuestas: RespuestasUsuario = { tamanoEmpresa: "200+", presupuesto: "alto", nivelTecnicoEquipo: "avanzado" };
      const { comparativaDeRutas } = recomendarHerramientas(respuestas, [suiteTodoEnUno, crmEspecializado]);
      expect(comparativaDeRutas?.beneficioDeEspecializar).toContain("especializar te encajaría mejor");
    });

    it("cuando las señales se cancelan, no se inclina hacia ningún lado", () => {
      const respuestas: RespuestasUsuario = { tamanoEmpresa: "1-10", presupuesto: "alto" };
      const { comparativaDeRutas } = recomendarHerramientas(respuestas, [suiteTodoEnUno, crmEspecializado]);
      expect(comparativaDeRutas?.beneficioDeCentralizar).not.toContain("te encajaría mejor");
      expect(comparativaDeRutas?.beneficioDeEspecializar).not.toContain("te encajaría mejor");
    });

    it("si ya hubo elección explícita, no se devuelve comparación: sería repetir una pregunta ya respondida", () => {
      const respuestas: RespuestasUsuario = { categoriaId: "plataformas-todo-en-uno", tamanoEmpresa: "1-10" };
      const resultado = recomendarHerramientas(respuestas, [suiteTodoEnUno, crmEspecializado]);
      expect(resultado.comparativaDeRutas).toBeUndefined();
    });
  });
});
