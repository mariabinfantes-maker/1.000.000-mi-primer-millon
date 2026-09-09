import { describe, expect, it } from "vitest";
import {
  getCapacidades,
  getDominios,
  getRestricciones,
  getVocabulario,
  compactar,
  erroresDeMenciones,
  normalizar,
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

  const identificadores = [...capacidades.map((c) => c.id), ...restricciones.map((r) => r.id)];

  it("ninguna capacidad se apropia de lo que es una restricción", () => {
    const problemas = capacidades.flatMap((c) =>
      erroresDeMenciones(c, restricciones, identificadores).map((e) => `${c.id}: ${e}`)
    );
    expect(
      problemas,
      "Un criterio no puede contar dos veces, como capacidad y como restricción. " +
        "Si una capacidad necesita nombrarlo para trazar su frontera, tiene que declararlo."
    ).toEqual([]);
  });

  it("las cuatro fronteras legítimas están declaradas y siguen valiendo", () => {
    const esperadas: Record<string, [string, string]> = {
      "cap.field_job_capture": ["sin cobertura", "req.offline_capable"],
      "cap.translation": ["interfaz en español", "req.language_es"],
      "cap.customer_interaction_history": ["datos de salud", "cap.clinical_record"],
      "cap.case_file_management": ["datos de salud", "cap.clinical_record"],
    };
    for (const [id, [termino, remiteA]] of Object.entries(esperadas)) {
      const c = capacidades.find((x) => x.id === id);
      expect(c?.mencionesDeclaradas, `${id} debería declarar «${termino}»`).toEqual([
        { termino, remiteA },
      ]);
      expect(erroresDeMenciones(c!, restricciones, identificadores)).toEqual([]);
    }
  });

  it("sólo esas cuatro declaran menciones", () => {
    const conDeclaracion = capacidades.filter((c) => c.mencionesDeclaradas?.length).map((c) => c.id);
    expect(conDeclaracion.sort()).toEqual([
      "cap.case_file_management",
      "cap.customer_interaction_history",
      "cap.field_job_capture",
      "cap.translation",
    ]);
  });

  /**
   * Controles del guardián, no del dato.
   *
   * La versión anterior deducía el permiso de la redacción, y dos frases con la
   * negación desplazada seguían colándose. Ninguna regla léxica separaba «no es
   * X, que tiene Y» de «no es X y tiene Y». Ahora el permiso se declara, así
   * que ninguna redacción puede concedérselo a sí misma: estos casos lo fijan.
   */
  describe("el guardián de términos reservados", () => {
    const OFF = restricciones.filter((r) => r.id === "req.offline_capable");
    const base = {
      id: "cap.prueba",
      etiqueta: "Prueba",
      dominioId: "citas",
      estado: "activa" as const,
      definicion: "Hace algo inofensivo.",
      noEs: "No es otra cosa.",
    };
    const cap = (cambios: Partial<typeof base> & { mencionesDeclaradas?: unknown }) =>
      erroresDeMenciones({ ...base, ...cambios } as never, OFF, [
        ...identificadores,
        "cap.prueba",
      ]);

    it("acepta un texto que no menciona nada", () => {
      expect(cap({})).toEqual([]);
    });

    it("acepta la mención declarada correctamente", () => {
      expect(
        cap({
          noEs: "Que funcione sin cobertura es una restricción (req.offline_capable), no parte de esta capacidad.",
          mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.offline_capable" }],
        })
      ).toEqual([]);
    });

    it("RECHAZA la mención sin declarar", () => {
      expect(
        cap({ noEs: "Que funcione sin cobertura es una restricción (req.offline_capable)." }).join()
      ).toContain("sin declararlo");
    });

    it("RECHAZA la negación desplegada, hueco 1 de la versión anterior", () => {
      expect(cap({ noEs: "No es cap.point_of_sale y funciona offline" }).join()).toContain(
        "sin declararlo"
      );
    });

    it("RECHAZA la negación lejana, hueco 2 de la versión anterior", () => {
      expect(
        cap({ noEs: "No es un CRM, es otra cosa (cap.point_of_sale) y funciona offline" }).join()
      ).toContain("sin declararlo");
    });

    it("RECHAZA nombrar de pasada una capacidad que sí la declara", () => {
      expect(
        cap({ noEs: "Funciona offline, a diferencia del TPV (cap.point_of_sale)." }).join()
      ).toContain("sin declararlo");
    });

    it("ninguna redacción consigue permiso: sólo la declaración lo da", () => {
      // Cuatro formas distintas de escribir la misma apropiación. Todas caen.
      const redacciones = [
        "Funciona offline.",
        "No es nada raro: funciona offline.",
        "Tampoco es cap.point_of_sale, y funciona offline.",
        "A diferencia de otras (cap.point_of_sale), no falla y funciona offline.",
      ];
      for (const noEs of redacciones) {
        expect(cap({ noEs }).join(), noEs).toContain("sin declararlo");
      }
    });

    it("RECHAZA declarar el término en la definición, esté declarado o no", () => {
      const e = cap({
        definicion: "Recoge el parte y funciona sin cobertura.",
        mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.offline_capable" }],
      });
      expect(e.join()).toContain("definicion usa «sin cobertura»");
    });

    it("RECHAZA una declaración que remite a algo inexistente", () => {
      expect(
        cap({
          noEs: "Funciona sin cobertura, ver req.inventada.",
          mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.inventada" }],
        }).join()
      ).toContain("no existe");
    });

    it("RECHAZA una declaración cuyo destino no aparece en el texto", () => {
      expect(
        cap({
          noEs: "Funciona sin cobertura y ya está.",
          mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.offline_capable" }],
        }).join()
      ).toContain("no aparece en noEs");
    });

    it("RECHAZA remitir a la propia capacidad", () => {
      expect(
        cap({
          noEs: "Funciona sin cobertura, ver cap.prueba.",
          mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "cap.prueba" }],
        }).join()
      ).toContain("no puede remitir a la propia capacidad");
    });

    it("RECHAZA una declaración que ya no se usa", () => {
      expect(
        cap({
          noEs: "No es otra cosa.",
          mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.offline_capable" }],
        }).join()
      ).toContain("no la usa");
    });

    it("no se acusa a sí misma por nombrar la restricción", () => {
      // `req.offline_capable` contiene literalmente «offline»: sin quitar los
      // identificadores, toda frontera bien escrita se delataría sola.
      expect(cap({ noEs: "Ver la restricción req.offline_capable para esto." })).toEqual([]);
    });

    /**
     * Condición A de `CONDICIONES-PARA-F3.md`. Los siete casos son los que
     * encontró la revisión independiente sobre la versión anterior, más otros
     * que salen del mismo agujero. Los dos primeros no son ataques: se
     * escriben solos al teclear.
     */
    describe("las variaciones de espacios no apagan la guarda", () => {
      const VARIANTES: [string, string][] = [
        ["doble espacio", "funciona sin  cobertura."],
        ["salto de línea", "funciona sin\ncobertura."],
        ["tabulador", "funciona sin\tcobertura."],
        ["espacio duro", "funciona sin\u00a0cobertura."],
        ["guion", "funciona sin-cobertura."],
        ["espacio de ancho cero", "funciona sin\u200bcobertura."],
        ["triple espacio y salto", "funciona sin \n  cobertura."],
        ["guion largo", "funciona sin\u2014cobertura."],
        ["barra baja", "funciona sin_cobertura."],
        ["espacio fino", "funciona sin\u202fcobertura."],
        ["MAYÚSCULAS con doble espacio", "FUNCIONA SIN  COBERTURA."],
        ["con tilde intrusa y salto", "fúnciona sin\ncobértura."],
      ];

      it.each(VARIANTES)("detecta «sin cobertura» escrito con %s", (_n, noEs) => {
        expect(cap({ noEs }).join()).toContain("sin declararlo");
      });

      it("el séptimo caso: «off-line» es «offline»", () => {
        expect(cap({ noEs: "funciona off-line." }).join()).toContain("sin declararlo");
      });

      it("también en la definición, donde nunca se admite", () => {
        expect(cap({ definicion: "Recoge el parte y funciona sin  cobertura." }).join()).toContain(
          "definicion usa"
        );
      });

      it("y una declaración con el término espaciado distinto sigue casando", () => {
        expect(
          cap({
            noEs: "Que funcione sin  cobertura es una restricción (req.offline_capable).",
            mencionesDeclaradas: [{ termino: "sin cobertura", remiteA: "req.offline_capable" }],
          })
        ).toEqual([]);
      });

      it("normalizar colapsa, compactar elimina", () => {
        expect(normalizar("sin  \n\tcobertura")).toBe("sin cobertura");
        expect(compactar("sin  \n\tcobertura")).toBe("sincobertura");
        expect(compactar("off-line")).toBe("offline");
      });

      it("no inventa coincidencias donde no las hay", () => {
        expect(cap({ noEs: "No es un servicio de mensajería sin costes añadidos." })).toEqual([]);
      });
    });

    /** Condición B de `CONDICIONES-PARA-F3.md`. */
    describe("las declaraciones duplicadas se rechazan en cualquier orden", () => {
      const noEs = "Funciona sin cobertura, ver req.offline_capable.";
      const buena = { termino: "sin cobertura", remiteA: "req.offline_capable" };
      const inexistente = { termino: "sin cobertura", remiteA: "req.no_existe" };
      const propia = { termino: "sin cobertura", remiteA: "cap.prueba" };

      it("RECHAZA la duplicada detrás de una válida", () => {
        // Éste es el caso exacto que pasaba antes: `find` devolvía la primera.
        const e = cap({ noEs, mencionesDeclaradas: [buena, inexistente] }).join();
        expect(e).toContain("declara 2 veces");
        expect(e).toContain('remite a "req.no_existe", que no existe');
      });

      it("RECHAZA la duplicada delante de la válida, mismo resultado", () => {
        const e = cap({ noEs, mencionesDeclaradas: [inexistente, buena] }).join();
        expect(e).toContain("declara 2 veces");
        expect(e).toContain('remite a "req.no_existe", que no existe');
      });

      it("RECHAZA tres duplicadas y señala TODOS los defectos, no sólo el primero", () => {
        const e = cap({ noEs, mencionesDeclaradas: [buena, inexistente, propia] }).join();
        expect(e).toContain("declara 3 veces");
        expect(e).toContain("que no existe");
        expect(e).toContain("no puede remitir a la propia capacidad");
        expect(e).toContain("no aparece en noEs");
      });

      it("RECHAZA duplicadas que sólo difieren en mayúsculas o espacios", () => {
        for (const gemela of [
          { termino: "SIN COBERTURA", remiteA: "req.offline_capable" },
          { termino: "sin  cobertura", remiteA: "req.offline_capable" },
          { termino: "sin-cobertura", remiteA: "req.offline_capable" },
        ]) {
          expect(cap({ noEs, mencionesDeclaradas: [buena, gemela] }).join(), gemela.termino).toContain(
            "declara 2 veces"
          );
        }
      });

      it("ninguna declaración queda sin validar por su posición", () => {
        // Cuatro declaraciones, la última rota: tiene que salir igualmente.
        const e = cap({
          noEs: "Funciona sin cobertura y en español, ver req.offline_capable.",
          mencionesDeclaradas: [buena, { termino: "interfaz en español", remiteA: "req.no_existe_2" }],
        }).join();
        expect(e).toContain("req.no_existe_2");
      });

      it("una sola declaración correcta sigue valiendo", () => {
        expect(cap({ noEs, mencionesDeclaradas: [buena] })).toEqual([]);
      });

      it("rechaza una declaración sin término", () => {
        expect(
          cap({ noEs, mencionesDeclaradas: [buena, { termino: "  ", remiteA: "req.offline_capable" }] }).join()
        ).toContain("sin término");
      });
    });

    it("no se le escapa una mención escrita con otras tildes", () => {
      const salud = restricciones.filter((r) => r.id === "req.health_special_category");
      const e = erroresDeMenciones(
        { ...base, noEs: "Guarda datos de categoría especial." } as never,
        salud,
        identificadores
      );
      expect(e.join()).toContain("sin declararlo");
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
