import { describe, expect, it } from "vitest";
import {
  getCapacidades,
  getDominios,
  getRestricciones,
  getVocabulario,
  seApropiaDelTermino,
} from "../repositorio";

/**
 * Que el vocabulario se sostenga por dentro: que nada apunte al vacío, que
 * nada se defina dos veces y que ninguna capacidad se coma una restricción.
 *
 * La última comprobación existe por un fallo real. `cap.field_job_capture`
 * llegó a definirse como «parte en el móvil: fotos, firma y sin cobertura»,
 * mientras el resto del diseño decía que el funcionamiento sin conexión vivía
 * en `req.offline_capable`. El mismo criterio contaba dos veces —una como
 * capacidad y otra como restricción— y lo detectó la propietaria leyendo, no
 * el sistema. Ahora lo detecta el sistema.
 */
describe("la coherencia interna del vocabulario", () => {
  const capacidades = getCapacidades();
  const dominios = getDominios();
  const restricciones = getRestricciones();
  const idsCapacidad = new Set(capacidades.map((c) => c.id));
  const idsDominio = new Set(dominios.map((d) => d.id));
  const idsRestriccion = new Set(restricciones.map((r) => r.id));

  it("las cifras aprobadas son exactamente estas", () => {
    // Fijadas a propósito: el vocabulario puede crecer, pero que crezca tiene
    // que ser una decisión, no un descuido. Cambiar estos números obliga a
    // tocar esta prueba, y eso obliga a explicar por qué.
    expect({
      areas: getVocabulario().areas.length,
      dominios: dominios.length,
      capacidades: capacidades.length,
    }).toEqual({ areas: 5, dominios: 23, capacidades: 146 });
  });

  it("cada dominio pertenece a un área que existe", () => {
    const areas = new Set(getVocabulario().areas.map((a) => a.id));
    expect(dominios.filter((d) => !areas.has(d.areaId)).map((d) => d.id)).toEqual([]);
  });

  it("cada capacidad vive en un dominio que existe", () => {
    expect(capacidades.filter((c) => !idsDominio.has(c.dominioId)).map((c) => c.id)).toEqual([]);
  });

  it("ningún dominio se queda vacío", () => {
    const ocupados = new Set(capacidades.map((c) => c.dominioId));
    expect(dominios.filter((d) => !ocupados.has(d.id)).map((d) => d.id)).toEqual([]);
  });

  it("toda capacidad dice qué es y qué no es", () => {
    const incompletas = capacidades
      .filter((c) => !c.definicion?.trim() || !c.noEs?.trim())
      .map((c) => c.id);
    expect(
      incompletas,
      "`noEs` es lo que evita que el vocabulario se degrade: sin frontera escrita, " +
        "cada capacidad nueva se solapa un poco con dos existentes y en un año nadie sabe cuál usar."
    ).toEqual([]);
  });

  it("`requiere` apunta siempre a una capacidad que existe", () => {
    const rotas = capacidades.flatMap((c) =>
      (c.requiere ?? []).filter((r) => !idsCapacidad.has(r)).map((r) => `${c.id} → ${r}`)
    );
    expect(rotas).toEqual([]);
  });

  it("ninguna capacidad se requiere a sí misma ni forma un ciclo", () => {
    const requiere = new Map(capacidades.map((c) => [c.id, c.requiere ?? []]));
    const ciclos: string[] = [];
    for (const inicio of requiere.keys()) {
      const visto = new Set<string>();
      const pila = [inicio];
      while (pila.length) {
        const actual = pila.pop()!;
        for (const siguiente of requiere.get(actual) ?? []) {
          if (siguiente === inicio) ciclos.push(inicio);
          else if (!visto.has(siguiente)) {
            visto.add(siguiente);
            pila.push(siguiente);
          }
        }
      }
    }
    expect(ciclos).toEqual([]);
  });

  it("`restriccionesTipicas` apunta siempre a una restricción que existe", () => {
    const rotas = capacidades.flatMap((c) =>
      (c.restriccionesTipicas ?? []).filter((r) => !idsRestriccion.has(r)).map((r) => `${c.id} → ${r}`)
    );
    expect(rotas).toEqual([]);
  });

  it("ninguna capacidad se apropia de lo que es una restricción", () => {
    const invasiones: string[] = [];
    for (const capacidad of capacidades) {
      for (const restriccion of restricciones) {
        for (const termino of restriccion.terminosReservados) {
          // La definición nunca puede mencionarlo: ahí describiría la
          // restricción como si fuera parte de la función.
          if (capacidad.definicion.toLowerCase().includes(termino.toLowerCase())) {
            invasiones.push(`${capacidad.id}.definicion reclama «${termino}» (${restriccion.id})`);
          }
          if (seApropiaDelTermino(capacidad.noEs, termino, restriccion.id)) {
            invasiones.push(`${capacidad.id}.noEs se apropia de «${termino}» (${restriccion.id})`);
          }
        }
      }
    }
    expect(
      invasiones,
      "Un criterio no puede contar dos veces, como capacidad y como restricción. " +
        "Si la capacidad lo nombra, tiene que ser para decir que vive fuera de ella."
    ).toEqual([]);
  });

  /**
   * Controles del guardián, no del dato.
   *
   * La primera versión de esta comprobación admitía la mención si el texto
   * citaba la restricción o CUALQUIER capacidad que la llevara declarada. La
   * revisión independiente encontró la puerta trasera: bastaba nombrar de
   * pasada al TPV para poder escribir «funciona offline» y pasar el control.
   * Estos casos fijan lo que se admite y lo que no, para que nadie vuelva a
   * abrirla al relajar la regla.
   */
  describe("el guardián de términos reservados", () => {
    const OFF = "req.offline_capable";

    it("admite la frontera canónica: nombrar la restricción", () => {
      const texto =
        "No es firmar un contrato a distancia (cap.electronic_signature). " +
        "Que funcione sin cobertura es una restricción (req.offline_capable), no parte de esta capacidad.";
      expect(seApropiaDelTermino(texto, "sin cobertura", OFF)).toBe(false);
    });

    it("admite atribuir el término a otra capacidad, negándolo", () => {
      // El caso real de cap.customer_interaction_history frente a la historia clínica.
      const texto =
        "No es la ficha del cliente, que es estática. " +
        "Tampoco es una historia clínica (cap.clinical_record): esto es trato comercial, no datos de salud.";
      expect(seApropiaDelTermino(texto, "datos de salud", "req.health_special_category")).toBe(false);
    });

    it("RECHAZA quedarse el término citando otra capacidad de pasada", () => {
      // La puerta trasera exacta que encontró la revisión independiente.
      const texto = "Funciona offline, a diferencia del TPV (cap.point_of_sale).";
      expect(seApropiaDelTermino(texto, "offline", OFF)).toBe(true);
    });

    it("RECHAZA colar el término delante de la referencia, aunque haya negación", () => {
      const texto = "No es como el TPV, pero funciona offline (cap.point_of_sale).";
      expect(seApropiaDelTermino(texto, "offline", OFF)).toBe(true);
    });

    it("RECHAZA la negación puesta después del término", () => {
      const texto = "Funciona offline, no como el TPV (cap.point_of_sale).";
      expect(seApropiaDelTermino(texto, "offline", OFF)).toBe(true);
    });

    it("RECHAZA reclamarlo sin citar nada", () => {
      expect(seApropiaDelTermino("Funciona sin cobertura en el sótano.", "sin cobertura", OFF)).toBe(true);
    });

    it("no se deja engañar por una frase vecina que sí remite", () => {
      // La coartada de una frase no vale para la de al lado.
      const texto =
        "Que funcione sin conexión es una restricción (req.offline_capable). " +
        "Además funciona sin cobertura estando en marcha.";
      expect(seApropiaDelTermino(texto, "sin cobertura", OFF)).toBe(true);
    });

    it("una capacidad que declare la restricción no autoriza a las demás", () => {
      // `cap.point_of_sale` lleva req.offline_capable en restriccionesTipicas.
      // Eso no puede convertirse en licencia para nadie más.
      const tpv = capacidades.find((c) => c.id === "cap.point_of_sale");
      expect(tpv?.restriccionesTipicas).toContain("req.offline_capable");
      expect(seApropiaDelTermino("Trabaja offline como cap.point_of_sale.", "offline", OFF)).toBe(true);
    });
  });

  /**
   * La condicionalidad tiene que sobrevivir en el dato, no sólo en la prosa.
   *
   * `req.data_residency_eu` marcada como `dura` a secas haría que un consumidor
   * que lea sólo `tipo` excluyera herramientas para todo el mundo. Es el mismo
   * error que ya se corrigió en el diseño —presentar «clínica» como causa
   * automática de datos en la UE— entrando por la puerta del esquema.
   */
  describe("las restricciones condicionales", () => {
    it("las dos que lo son están marcadas como tales", () => {
      for (const id of ["req.data_residency_eu", "req.esignature_qualified"]) {
        const r = restricciones.find((x) => x.id === id);
        expect(r, `falta ${id}`).toBeDefined();
        expect(r!.tipo, `${id} no puede ser "dura" a secas: excluiría a todo el mundo`).toBe(
          "dura_condicional"
        );
      }
    });

    it("ninguna condicional se queda sin decir cuándo se activa", () => {
      const mudas = restricciones
        .filter((r) => r.tipo === "dura_condicional" && !r.condicionDeActivacion?.trim())
        .map((r) => r.id);
      expect(mudas, "Una condicional sin condición es una dura disfrazada.").toEqual([]);
    });

    it("ninguna NO condicional lleva condición de activación", () => {
      const sobrantes = restricciones
        .filter((r) => r.tipo !== "dura_condicional" && "condicionDeActivacion" in r)
        .map((r) => r.id);
      expect(sobrantes).toEqual([]);
    });

    it("sólo existen los tres tipos previstos", () => {
      const tipos = [...new Set(restricciones.map((r) => r.tipo))].sort();
      expect(tipos.every((t) => ["dura", "dura_condicional", "blanda"].includes(t))).toBe(true);
    });

    it("la condición dice explícitamente que sin exigencia no filtra", () => {
      // Evita que alguien escriba una condición vaga que reintroduzca la
      // exclusión universal por la puerta de atrás.
      for (const r of restricciones.filter((x) => x.tipo === "dura_condicional")) {
        expect(r.condicionDeActivacion!.toLowerCase()).toContain("no filtra nada");
      }
    });
  });

  it("toda restricción dice quién la impone de verdad", () => {
    const sinDueno = restricciones.filter((r) => !r.quienLaImpone?.trim()).map((r) => r.id);
    expect(
      sinDueno,
      "Sin este campo se acaba deduciendo la restricción del sector. Ya pasó: " +
        "presentar «clínica» como causa automática de datos en la UE habría descartado " +
        "herramientas perfectamente válidas para una consulta dental."
    ).toEqual([]);
  });

  it("las capacidades salidas de un borrador dejan constancia de dónde venían", () => {
    const sinOrigen = capacidades.filter((c) => !c.origenBorrador).map((c) => c.id);
    expect(sinOrigen).toEqual([]);
  });
});
