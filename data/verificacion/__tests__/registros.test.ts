import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { ROLES_DE_FUENTE } from "../esquema";
import type { RegistroVerificacion, SeleccionPlausible } from "../esquema";
import {
  capacidadIdsDelVocabulario,
  erroresDeRegistro,
  erroresDeSeleccion,
  erroresDeFuenteDeCapacidad,
  erroresDeSustitucion,
  getFuentesDeCapacidad,
  getSustituciones,
  citaNombraElPlan,
  esFecha,
  getRegistros,
  getSelecciones,
} from "../repositorio";

/**
 * Las reglas que la propietaria fijó al autorizar F2, convertidas en
 * comprobaciones. Ninguna se puede saltar «por esta vez»: si el validador las
 * acepta, entran datos malos y el motor los creerá en F3.
 *
 * Los datos reales todavía no existen —F2 se detuvo antes de verificar—, así
 * que el validador se ejercita con casos inventados. Es a propósito: vale más
 * que funcione el día que haga falta que estrenarlo ese mismo día.
 */
describe("los registros de verificación", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();

  const valido: RegistroVerificacion = {
    herramientaId: "pipedrive",
    capacidadId: "cap.sales_pipeline",
    estado: "verificado",
    profundidad: "nativa",
    planMinimo: "Lite",
    planEstado: "verificado",
    fuentes: [
      {
        tipo: "pagina_oficial",
        url: "https://ejemplo.test/precios",
        fechaConsulta: "2026-09-03",
        // La cita nombra el plan: sin eso, el plan no queda demostrado.
        cita: "Embudo de ventas — Lite",
      },
    ],
    confianza: "alta",
    proximaRevision: "2027-02-01",
  };
  const e = (cambios: Partial<RegistroVerificacion>) =>
    erroresDeRegistro({ ...valido, ...cambios }, herramientas, capacidades).join(" | ");

  it("los registros que existan hoy son todos válidos", () => {
    const rotos = getRegistros().flatMap((r) => erroresDeRegistro(r, herramientas, capacidades));
    expect(rotos).toEqual([]);
  });

  it("acepta un registro bien hecho", () => {
    expect(e({})).toBe("");
  });

  describe("identidad", () => {
    it("rechaza una herramienta que no existe", () => {
      expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
    });
    it("rechaza una capacidad que no existe", () => {
      expect(e({ capacidadId: "cap.inventada" })).toContain("la capacidad no existe");
    });
  });

  describe("fuentes", () => {
    it("rechaza un registro sin ninguna fuente", () => {
      expect(e({ fuentes: [] })).toContain("no tiene ninguna fuente");
    });
    it("rechaza una URL que no lo es", () => {
      expect(
        e({ fuentes: [{ tipo: "pagina_oficial", url: "pipedrive.com", fechaConsulta: "2026-09-03" }] })
      ).toContain("URL inválida");
    });
    it("rechaza una fecha de consulta que no existe", () => {
      expect(
        e({
          fuentes: [
            { tipo: "pagina_oficial", url: "https://a.test/b", fechaConsulta: "2026-02-30" },
          ],
        })
      ).toContain("fechaConsulta inválida");
    });
    it("una fuente secundaria NUNCA sostiene confianza alta", () => {
      expect(
        e({
          fuentes: [
            { tipo: "fuente_secundaria", url: "https://blog.test/x", fechaConsulta: "2026-09-03" },
          ],
        })
      ).toContain("confianza alta sin ninguna fuente de primera mano");
    });
    it("pero sí sostiene confianza media", () => {
      expect(
        e({
          confianza: "media",
          fuentes: [
            { tipo: "fuente_secundaria", url: "https://blog.test/x", fechaConsulta: "2026-09-03", cita: "Embudo de ventas — Lite" },
          ],
        })
      ).toBe("");
    });
    it("las cuatro fuentes de primera mano sí valen para confianza alta", () => {
      for (const tipo of ["pagina_oficial", "documentacion", "tarifa_oficial", "prueba_directa"] as const) {
        expect(
          e({
            fuentes: [{ tipo, url: "https://a.test/b", fechaConsulta: "2026-09-03", cita: "Embudo de ventas — Lite" }],
          }),
          tipo
        ).toBe("");
      }
    });
  });

  describe("«no está documentado» no es «no disponible»", () => {
    it("un desconocido no puede llevar profundidad", () => {
      expect(e({ estado: "desconocido", planMinimo: undefined, planEstado: undefined, nota: "buscado en precios y ayuda" })).toContain(
        "no puede llevar profundidad"
      );
    });
    it("un desconocido tiene que explicar qué se buscó", () => {
      expect(e({ estado: "desconocido", profundidad: undefined, planMinimo: undefined, planEstado: undefined })).toContain(
        "tiene que explicar por qué"
      );
    });
    it("un desconocido bien hecho se acepta", () => {
      expect(
        e({
          estado: "desconocido",
          profundidad: undefined,
          planMinimo: undefined,
          planEstado: undefined,
          nota: "No aparece ni en la página de producto ni en la tabla de precios; no hay evidencia de que exista ni de que falte.",
          confianza: "baja",
        })
      ).toBe("");
    });
    it("un descartado también tiene que motivarse", () => {
      expect(e({ estado: "descartado", profundidad: undefined, planMinimo: undefined, planEstado: undefined })).toContain(
        "tiene que explicar por qué"
      );
    });
  });

  describe("profundidad y plan", () => {
    it("verificado sin profundidad se rechaza", () => {
      expect(e({ profundidad: undefined })).toContain("verificado sin profundidad");
    });
    it("una integración tiene que decir con qué se integra", () => {
      expect(e({ profundidad: "integracion", planMinimo: undefined, planEstado: undefined })).toContain(
        "tiene que decir con qué se integra"
      );
    });
    it("una integración bien declarada se acepta", () => {
      expect(e({ profundidad: "integracion", planMinimo: undefined, planEstado: undefined, integraCon: "Zapier" })).toBe("");
    });
    it("nativa y módulo tienen que decir qué saben del plan", () => {
      for (const profundidad of ["nativa", "modulo"] as const) {
        expect(
          e({ profundidad, planMinimo: undefined, planEstado: undefined }),
          profundidad
        ).toContain("no dice si el plan está verificado o es desconocido");
      }
    });
    it("una función sólo del plan caro conserva ESE plan, no el más barato", () => {
      expect(
        e({
          planMinimo: "Ultimate",
          fuentes: [
            {
              tipo: "tarifa_oficial",
              url: "https://ejemplo.test/precios",
              fechaConsulta: "2026-09-03",
              cita: "Embudo de ventas — Ultimate",
            },
          ],
        })
      ).toBe("");
    });

    /**
     * Son dos certezas distintas y antes iban pegadas: no poder demostrar el
     * plan tumbaba también la capacidad, aunque su evidencia fuera impecable.
     * Se midió con el lote 1 delante — de 241 planes afirmados, sólo 23 tenían
     * una cita que nombrara el plan— y decir «no sabemos si lo hace» era falso:
     * lo que no sabíamos era el plan.
     */
    describe("la certeza del plan es suya, no de la capacidad", () => {
      it("una capacidad verificada con el plan sin demostrar es válida", () => {
        expect(e({ planEstado: "desconocido", planMinimo: undefined })).toBe("");
      });

      it("y sigue siendo verificada: el plan desconocido no la arrastra", () => {
        const r: RegistroVerificacion = { ...valido, planEstado: "desconocido", planMinimo: undefined };
        expect(r.estado).toBe("verificado");
        expect(erroresDeRegistro(r, herramientas, capacidades)).toEqual([]);
      });

      it("un plan desconocido NO puede nombrar ningún plan: nombrarlo sería afirmarlo", () => {
        expect(e({ planEstado: "desconocido", planMinimo: "Business" })).toContain(
          'el plan es desconocido y aun así nombra "Business"'
        );
      });

      it("un plan verificado tiene que decir cuál", () => {
        expect(e({ planEstado: "verificado", planMinimo: undefined })).toContain(
          "el plan se da por verificado pero no dice cuál"
        );
      });

      it("un desconocido no puede opinar sobre el plan", () => {
        expect(
          e({
            estado: "desconocido",
            profundidad: undefined,
            planMinimo: undefined,
            planEstado: "desconocido",
            nota: "no aparece en las páginas consultadas",
            confianza: "baja",
          })
        ).toContain("no puede opinar sobre el plan");
      });

      it("ni nombrar un plan", () => {
        expect(
          e({
            estado: "desconocido",
            profundidad: undefined,
            planEstado: undefined,
            planMinimo: "Business",
            nota: "no aparece en las páginas consultadas",
            confianza: "baja",
          })
        ).toContain("no puede nombrar un plan");
      });

      /**
       * Los dos huecos que encontró la revisión independiente: el campo se
       * validaba por su presencia, no por su contenido, y nadie cruzaba lo que
       * decía el registro con lo que decían sus fuentes. Cada prueba reproduce
       * el fallo tal cual se encontró.
       */
      describe("los dos huecos que dejó la primera versión", () => {
        it("un planEstado que no es ninguno de los dos valores ya no cuela", () => {
          expect(e({ planEstado: "masomenos" as never, planMinimo: undefined })).toContain(
            'planEstado "masomenos" no es ni verificado ni desconocido'
          );
        });

        it("un plan desconocido no puede arrastrar una fuente que diga demostrarlo", () => {
          expect(
            e({
              planEstado: "desconocido",
              planMinimo: undefined,
              fuentes: [
                { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", rol: "plan" },
              ],
            })
          ).toContain("el plan es desconocido pero trae una fuente que dice demostrarlo");
        });

        it("no puede haber dos fuentes diciendo que demuestran el plan", () => {
          const fuente = {
            tipo: "tarifa_oficial" as const,
            url: "https://a.test/precios",
            fechaConsulta: "2026-09-03",
            rol: "plan" as const,
          };
          expect(e({ fuentes: [fuente, { ...fuente }] })).toContain(
            "2 fuentes dicen demostrar el plan, y sólo puede haber una"
          );
        });

        it("pero una sola fuente sin rol sigue valiendo para las dos cosas", () => {
          expect(
            e({
              fuentes: [
                { tipo: "tarifa_oficial", url: "https://a.test/p", fechaConsulta: "2026-09-03", cita: "Embudo de ventas — Lite" },
              ],
            })
          ).toBe("");
        });
      });

      /**
       * Lo que encontró la auditoría del lote 1: tres reglas que se daban por
       * puestas y no lo estaban. Las tres dejaban pasar un registro que afirma
       * más de lo que su evidencia sostiene, que es justo lo que F2 existe
       * para impedir.
       */
      describe("lo que encontró la auditoría", () => {
        it("un plan verificado sin NINGUNA fuente que lo demuestre ya no cuela", () => {
          expect(
            e({
              planEstado: "verificado",
              planMinimo: "Growth",
              fuentes: [
                {
                  tipo: "pagina_oficial",
                  url: "https://a.test/producto",
                  fechaConsulta: "2026-09-03",
                  cita: "Automatiza tus flujos",
                  rol: "capacidad",
                },
              ],
            })
          ).toContain("el plan se da por verificado y ninguna fuente lo demuestra");
        });

        it("y con su fuente de plan, el mismo registro se acepta", () => {
          expect(
            e({
              planEstado: "verificado",
              planMinimo: "Growth",
              fuentes: [
                {
                  tipo: "pagina_oficial",
                  url: "https://a.test/producto",
                  fechaConsulta: "2026-09-03",
                  cita: "Automatiza tus flujos",
                  rol: "capacidad",
                },
                {
                  tipo: "tarifa_oficial",
                  url: "https://a.test/precios",
                  fechaConsulta: "2026-09-03",
                  cita: "Workflow Automations — Growth",
                  rol: "plan",
                },
              ],
            })
          ).toBe("");
        });

        it("los planes verificados de hoy traen su fuente, ni cero ni dos", () => {
          for (const r of getRegistros()) {
            if (r.planEstado !== "verificado") continue;
            const marcadas = (r.fuentes ?? []).filter((f) => f.rol === "plan");
            const sinRol = (r.fuentes ?? []).filter((f) => !f.rol);
            const demuestran = marcadas.length ? marcadas : sinRol;
            expect(demuestran.length, `${r.herramientaId}/${r.capacidadId}`).toBe(1);
          }
        });

        it("un rol que no existe se rechaza en vez de colar como «sin rol»", () => {
          expect(
            e({
              fuentes: [
                {
                  tipo: "tarifa_oficial",
                  url: "https://a.test/precios",
                  fechaConsulta: "2026-09-03",
                  rol: "plan_verificado" as never,
                },
              ],
            })
          ).toContain('rol de fuente "plan_verificado" desconocido');
        });

        it("los tres roles del esquema sí se aceptan", () => {
          expect(ROLES_DE_FUENTE).toEqual(["capacidad", "plan", "plan_consultado"]);
          expect(
            e({
              planEstado: "desconocido",
              planMinimo: undefined,
              fuentes: [
                { tipo: "pagina_oficial", url: "https://a.test/p", fechaConsulta: "2026-09-03", cita: "x", rol: "capacidad" },
                { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", rol: "plan_consultado" },
              ],
            })
          ).toBe("");
        });

        /**
         * `plan_consultado` es el rastro de dónde se miró, no una prueba. Con
         * cita se lee como si demostrara el plan que precisamente no demostró.
         */
        it("«dónde se miró» no puede llevar cita", () => {
          expect(
            e({
              planEstado: "desconocido",
              planMinimo: undefined,
              fuentes: [
                { tipo: "pagina_oficial", url: "https://a.test/p", fechaConsulta: "2026-09-03", cita: "x", rol: "capacidad" },
                {
                  tipo: "tarifa_oficial",
                  url: "https://a.test/precios",
                  fechaConsulta: "2026-09-03",
                  cita: "Plan Growth",
                  rol: "plan_consultado",
                },
              ],
            })
          ).toContain("la fuente de dónde se consultó el plan no puede llevar cita");
        });

        it("y ninguno de los rastros que hay hoy la lleva", () => {
          const rastros = getRegistros().flatMap((r) =>
            (r.fuentes ?? [])
              .filter((f) => f.rol === "plan_consultado")
              .map((f) => ({ donde: `${r.herramientaId}/${r.capacidadId}`, cita: f.cita }))
          );
          // Hoy son 63. La cuenta exacta cambiará con el lote 2; que no sea
          // cero es lo que impide que esta prueba pase sin mirar nada.
          expect(rastros.length).toBeGreaterThan(0);
          expect(rastros.filter((x) => x.cita !== undefined)).toEqual([]);
        });
      });

      /**
       * Que el plan no se demuestre no puede borrar el rastro de dónde se
       * buscó: sin él, repescarlo obliga a averiguarlo otra vez.
       */
      describe("un plan desconocido conserva dónde se miró", () => {
        const conRastro = (cambios: Record<string, unknown> = {}) =>
          e({
            planEstado: "desconocido",
            planMinimo: undefined,
            fuentes: [
              { tipo: "pagina_oficial", url: "https://a.test/producto", fechaConsulta: "2026-09-03", cita: "x", rol: "capacidad" },
              { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", rol: "plan_consultado" },
            ],
            ...cambios,
          });

        it("se acepta la fuente de dónde se consultó la tarifa", () => {
          expect(conRastro()).toBe("");
        });

        it("pero sólo cuando el plan es desconocido", () => {
          expect(
            e({
              planEstado: "verificado",
              planMinimo: "Business",
              fuentes: [
                { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", rol: "plan" },
                { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", rol: "plan_consultado" },
              ],
            })
          ).toContain("sólo un plan desconocido puede llevar la fuente de dónde se consultó");
        });

        it("y en los datos de hoy no enseña ningún plan sin demostrar", () => {
          for (const r of getRegistros()) {
            const consultada = (r.fuentes ?? []).find((f) => f.rol === "plan_consultado");
            if (!consultada) continue;
            expect(r.planEstado, `${r.herramientaId}/${r.capacidadId}`).toBe("desconocido");
            expect(r.planMinimo, `${r.herramientaId}/${r.capacidadId}`).toBeUndefined();
            expect(consultada.url, `${r.herramientaId}/${r.capacidadId}`).toMatch(/^https?:\/\//);
            expect(consultada.fechaConsulta, `${r.herramientaId}/${r.capacidadId}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        });
      });

      /**
       * La revisión global del 9 de septiembre encontró doce registros que
       * daban un plan por verificado con una cita que no lo nombraba: la
       * evidencia hablaba de la función, no del plan. El nombre salía del
       * modelo, no de la página. Afirmar «Free» o «Enterprise» sin que la cita
       * lo diga es exactamente el error que F2 existe para impedir, así que
       * ahora lo para el validador.
       */
      describe("un plan verificado se nombra en su propia cita", () => {
        const conCita = (cita: string, plan = "Business") =>
          e({
            planEstado: "verificado",
            planMinimo: plan,
            fuentes: [
              { tipo: "pagina_oficial", url: "https://a.test/producto", fechaConsulta: "2026-09-03", cita: "Graba y transcribe", rol: "capacidad" },
              { tipo: "tarifa_oficial", url: "https://a.test/precios", fechaConsulta: "2026-09-03", cita, rol: "plan" },
            ],
          });

        it("rechaza una cita que habla de la función pero no del plan", () => {
          expect(conCita("Registro de auditoría disponible para tu equipo")).toContain(
            'la cita que dice demostrar el plan no nombra "Business"'
          );
        });

        it("acepta la que sí lo nombra", () => {
          expect(conCita("Registro de auditoría — plan Business")).toBe("");
        });

        it("no le vale que el nombre aparezca dentro de otra palabra", () => {
          expect(conCita("Pensado para freelance", "Free")).toContain(
            'la cita que dice demostrar el plan no nombra "Free"'
          );
          expect(conCita("Incluido en el plan Free", "Free")).toBe("");
        });

        it("compara sin distinguir mayúsculas, tildes ni signos", () => {
          expect(citaNombraElPlan("Incluido en el plan BUSINESS.", "Business")).toBe(true);
          expect(citaNombraElPlan("Disponible en Básico", "basico")).toBe(true);
          expect(citaNombraElPlan("Incluido en Business Plus", "Business Plus")).toBe(true);
        });

        it("una cita vacía no demuestra nada", () => {
          expect(citaNombraElPlan(undefined, "Business")).toBe(false);
          expect(citaNombraElPlan("", "Business")).toBe(false);
        });

        it("y en los datos de hoy ningún plan verificado se queda sin nombrar", () => {
          const sinNombrar = getRegistros().filter((r) => {
            if (r.planEstado !== "verificado" || !r.planMinimo) return false;
            const fuentes = r.fuentes ?? [];
            const dePlan = fuentes.filter((f) => f.rol === "plan");
            const demuestran = dePlan.length ? dePlan : fuentes.filter((f) => !f.rol);
            return !demuestran.some((f) => citaNombraElPlan(f.cita, r.planMinimo!));
          });
          expect(sinNombrar.map((r) => `${r.herramientaId}/${r.capacidadId}`)).toEqual([]);
        });
      });

      it("los datos de hoy respetan la separación", () => {
        const registros = getRegistros();
        const fantasmas = registros.filter((r) => r.planEstado === "desconocido" && r.planMinimo);
        expect(fantasmas.map((r) => `${r.herramientaId}/${r.capacidadId}`)).toEqual([]);

        const mudos = registros.filter(
          (r) =>
            r.estado === "verificado" &&
            (r.profundidad === "nativa" || r.profundidad === "modulo") &&
            !r.planEstado
        );
        expect(mudos.map((r) => `${r.herramientaId}/${r.capacidadId}`)).toEqual([]);
      });
    });
    it("no disponible no puede llevar plan", () => {
      expect(e({ profundidad: "no_disponible", planMinimo: "Lite", planEstado: "verificado" })).toContain(
        "no disponible no puede tener plan"
      );
    });
  });

  describe("fechas de revisión", () => {
    it("rechaza una próxima revisión que no existe", () => {
      expect(e({ proximaRevision: "2027-02-30" })).toContain("proximaRevision inválida");
    });
    it("rechaza revisar antes de haber consultado", () => {
      expect(e({ proximaRevision: "2026-01-01" })).toContain("no puede ser anterior a la consulta");
    });
    it("lo que depende del plan se revisa a los 6 meses, no a los 12", () => {
      expect(e({ proximaRevision: "2027-09-03" })).toContain("más allá de 6 meses");
    });
    it("lo que no depende del plan admite 12", () => {
      expect(
        e({ profundidad: "integracion", planMinimo: undefined, planEstado: undefined, integraCon: "Zapier", proximaRevision: "2027-08-01" })
      ).toBe("");
    });
    it("esFecha descarta el 30 de febrero y acierta con los bisiestos", () => {
      expect(esFecha("2024-02-29")).toBe(true);
      expect(esFecha("2025-02-29")).toBe(false);
      expect(esFecha("2026-02-30")).toBe(false);
      expect(esFecha("2026-9-3")).toBe(false);
    });
  });
});

describe("las selecciones de capacidades plausibles", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();
  const valida: SeleccionPlausible = {
    herramientaId: "pipedrive",
    criterio: "CRM especializado: se comprueban las capacidades de clientes, presupuestos y datos.",
    capacidadIds: ["cap.sales_pipeline", "cap.customer_contact_records"],
    fecha: "2026-09-03",
    lote: 1,
  };
  const e = (cambios: Partial<SeleccionPlausible>) =>
    erroresDeSeleccion({ ...valida, ...cambios }, herramientas, capacidades).join(" | ");

  it("las selecciones que existan hoy son todas válidas", () => {
    const rotas = getSelecciones().flatMap((s) => erroresDeSeleccion(s, herramientas, capacidades));
    expect(rotas).toEqual([]);
  });

  it("acepta una selección bien hecha", () => {
    expect(e({})).toBe("");
  });

  it("exige criterio escrito: sin él, la lista se estrecha luego a conveniencia", () => {
    expect(e({ criterio: "  " })).toContain("sin criterio escrito");
  });

  it("rechaza una selección vacía", () => {
    expect(e({ capacidadIds: [] })).toContain("selección vacía");
  });

  it("rechaza capacidades repetidas", () => {
    expect(e({ capacidadIds: ["cap.sales_pipeline", "cap.sales_pipeline"] })).toContain(
      "capacidades repetidas"
    );
  });

  it("rechaza una capacidad inventada", () => {
    expect(e({ capacidadIds: ["cap.no_existe"] })).toContain('la capacidad "cap.no_existe" no existe');
  });

  it("rechaza una herramienta inventada", () => {
    expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
  });

  it("rechaza una fecha imposible", () => {
    expect(e({ fecha: "2026-02-30" })).toContain("fecha inválida");
  });
});

/**
 * Las direcciones del catálogo son datos de producto. Si la de una herramienta
 * lleva a otro sitio, eso es una incidencia del catálogo y la decide la
 * propietaria: no se arregla en silencio para que salga mejor una verificación.
 * Por eso una sustitución sin motivo escrito no vale.
 */
describe("las sustituciones de direcciones", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const valida = {
    herramientaId: "insightly",
    urlPrecios: "https://www.insightly.com/pricing-plans/",
    motivo: "La dirección de la ficha redirige aquí, comprobado con la cadena HTTP.",
    fecha: "2026-09-07",
  };
  const e = (cambios: Record<string, unknown>) =>
    erroresDeSustitucion({ ...valida, ...cambios } as never, herramientas).join(" | ");

  it("las que existan hoy son válidas", () => {
    expect(getSustituciones().flatMap((s) => erroresDeSustitucion(s, herramientas))).toEqual([]);
  });

  it("acepta una sustitución bien hecha", () => {
    expect(e({})).toBe("");
  });

  it("rechaza una herramienta que no existe", () => {
    expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
  });

  it("rechaza una sustitución sin motivo escrito", () => {
    expect(e({ motivo: "   " })).toContain("sin motivo escrito");
  });

  it("rechaza una fecha inventada", () => {
    expect(e({ fecha: "2026-02-30" })).toContain("fecha inválida");
  });

  it("rechaza una sustitución que no sustituye nada", () => {
    expect(e({ urlPrecios: undefined, documentacion: [] })).toContain("no sustituye ni añade nada");
  });

  it("rechaza una dirección que no es una dirección", () => {
    expect(e({ urlPrecios: "insightly.com" })).toContain("URL inválida");
  });

  it("admite declarar documentación oficial", () => {
    expect(e({ urlPrecios: undefined, documentacion: ["https://support.insightly.com/planes"] })).toBe("");
  });

  /**
   * Cuando la portada de la ficha redirige, Gemini lee la dirección final y
   * cita la que se le pidió, y la afirmación cae por la regla de
   * redirecciones aunque la equivalencia sea real. Declararla aquí es lo que
   * la convierte en comprobada — y por eso se guardan las DOS direcciones: la
   * prueba de la equivalencia es el par, no la de destino sola.
   */
  describe("redirecciones de la portada", () => {
    const conPortada = (paginaOficial: unknown) =>
      e({ urlPrecios: undefined, paginaOficial });

    it("acepta una portada redirigida bien declarada", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com/en/" })
      ).toBe("");
    });

    it("declarar sólo la portada ya es sustituir algo", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com/en/" })
      ).not.toContain("no sustituye ni añade nada");
    });

    it("rechaza que falte la dirección que se pidió", () => {
      expect(conPortada({ solicitada: "", resuelta: "https://zenkit.com/en/" })).toContain(
        "no dice qué dirección se pidió"
      );
    });

    it("rechaza que falte la dirección a la que llevó", () => {
      expect(conPortada({ solicitada: "https://zenkit.com", resuelta: "" })).toContain(
        "no dice a dónde llevó"
      );
    });

    it("rechaza direcciones que no son direcciones", () => {
      expect(conPortada({ solicitada: "zenkit.com", resuelta: "https://zenkit.com/en/" })).toContain(
        "URL inválida"
      );
    });

    it("rechaza una redirección que no redirige: no habría nada que declarar", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://zenkit.com" })
      ).toContain("no redirige a ninguna parte");
    });

    it("y la misma página escrita de otra forma tampoco es una redirección", () => {
      expect(
        conPortada({ solicitada: "https://zenkit.com", resuelta: "https://www.zenkit.com/" })
      ).toContain("no redirige a ninguna parte");
    });
  });
});

/**
 * Una capacidad y su plan casi nunca se demuestran en la misma página. Estas
 * fuentes declaran la mitad que la tarifa no puede dar: que la capacidad
 * existe. Y como abren la puerta a direcciones que no son la ficha, la puerta
 * tiene cerradura: el dominio del fabricante, sus subdominios, y nada más sin
 * que él mismo lo enlace.
 */
describe("las fuentes que demuestran una capacidad", () => {
  const herramientas = getTodasLasHerramientas();
  const herramientaIds = herramientas.map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();
  const dominioOficialDe = (id: string) => herramientas.find((h) => h.id === id)?.paginaOficial;

  const valida = {
    herramientaId: "teamwork-com",
    capacidadId: "cap.public_api",
    url: "https://apidocs.teamwork.com/",
    tipo: "documentacion" as const,
    cita: "Use our API to integrate Teamwork.com with the tools you love.",
    motivo: "Documentación oficial del fabricante, en un subdominio suyo.",
    fecha: "2026-09-08",
  };
  const e = (cambios: Record<string, unknown>) =>
    erroresDeFuenteDeCapacidad(
      { ...valida, ...cambios } as never,
      herramientaIds,
      capacidades,
      dominioOficialDe
    ).join(" | ");

  it("las que existan hoy son válidas", () => {
    expect(
      getFuentesDeCapacidad().flatMap((f) =>
        erroresDeFuenteDeCapacidad(f, herramientaIds, capacidades, dominioOficialDe)
      )
    ).toEqual([]);
  });

  it("acepta una fuente bien declarada en un subdominio del fabricante", () => {
    expect(e({})).toBe("");
  });

  it("acepta también el dominio principal", () => {
    expect(e({ url: "https://www.teamwork.com/algo" })).toBe("");
  });

  it("rechaza una herramienta o una capacidad inventadas", () => {
    expect(e({ herramientaId: "inventada" })).toContain("la herramienta no existe");
    expect(e({ capacidadId: "cap.inventada" })).toContain("la capacidad no existe");
  });

  it("exige cita: sin ella no hay prueba, sólo una dirección", () => {
    expect(e({ cita: "   " })).toContain("sin cita que lo demuestre");
  });

  it("exige motivo escrito", () => {
    expect(e({ motivo: "" })).toContain("sin motivo escrito");
  });

  describe("la regla de dominio", () => {
    it("rechaza un dominio ajeno que no declara vinculación", () => {
      expect(e({ url: "https://github.com/paymoapp/api" })).toContain(
        "está fuera del dominio oficial y no declara vinculación"
      );
    });

    it("lo acepta si el propio fabricante lo enlaza, y consta dónde lo dice", () => {
      expect(
        e({
          url: "https://github.com/teamwork/api",
          vinculacionOficial: {
            url: "https://www.teamwork.com/developers",
            cita: "Our open-source libraries live on GitHub.",
          },
        })
      ).toBe("");
    });

    it("no vale una vinculación que no venga del fabricante", () => {
      expect(
        e({
          url: "https://github.com/paymoapp/api",
          vinculacionOficial: { url: "https://un-blog.example.com/x", cita: "lo dice un blog" },
        })
      ).toContain("la vinculación no viene de una página del fabricante");
    });

    it("no vale una vinculación sin decir dónde lo pone", () => {
      expect(
        e({
          url: "https://github.com/teamwork/api",
          vinculacionOficial: { url: "https://www.teamwork.com/developers", cita: "  " },
        })
      ).toContain("no dice dónde lo pone");
    });

    it("un dominio que sólo se le parece no cuela", () => {
      expect(e({ url: "https://teamwork.com.malicioso.example/api" })).toContain(
        "está fuera del dominio oficial"
      );
    });
  });
});
