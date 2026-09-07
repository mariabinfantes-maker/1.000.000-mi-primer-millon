import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { convertirSalida, type SalidaLote } from "../convertir";
import { capacidadIdsDelVocabulario, erroresDeRegistro } from "../repositorio";

/**
 * El conversor es donde se decide qué puede afirmar Molnip, así que lo que se
 * prueba aquí no es que funcione: es que NO deje pasar lo que no debe.
 *
 * Cada caso de abajo es una forma concreta de colar un dato sin fundamento —la
 * cita que no sostiene nada, la dirección que nunca se descargó, la función sin
 * plan— y las 62 fichas actuales existen porque ninguna de esas puertas estaba
 * cerrada.
 */
describe("convertir la salida cruda en registros", () => {
  const herramientas = getTodasLasHerramientas().map((h) => h.id);
  const capacidades = capacidadIdsDelVocabulario();
  const PRECIOS = "https://www.pipedrive.com/es/pricing";
  const PORTADA = "https://www.pipedrive.com";
  const urlPrecios = { pipedrive: { urlPrecios: PRECIOS } };

  const salida = (respuesta: Record<string, unknown>, extra: Record<string, unknown> = {}): SalidaLote => ({
    herramientas: [
      {
        herramientaId: "pipedrive",
        fechaConsulta: "2026-09-07",
        urlsSolicitadas: [PRECIOS, PORTADA],
        urlsRecuperadas: [
          { url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
          { url: PORTADA, estado: "URL_RETRIEVAL_STATUS_ERROR", recuperada: false },
        ],
        capacidadesPedidas: ["cap.sales_pipeline"],
        respuestas: [{ capacidadId: "cap.sales_pipeline", ...respuesta }],
        ...extra,
      },
    ],
  });

  const buena = {
    veredicto: "si",
    profundidad: "nativa",
    planMinimo: "Lite",
    urlFuente: PRECIOS,
    cita: "Gestiona tu embudo de ventas visual desde el plan Lite, con etapas propias",
  };

  const uno = (respuesta: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
    convertirSalida(salida(respuesta, extra), urlPrecios);

  it("un caso bien fundado sale verificado y con confianza alta", () => {
    const { registros, descartes } = uno(buena);
    expect(descartes).toEqual([]);
    expect(registros[0]).toMatchObject({
      estado: "verificado",
      profundidad: "nativa",
      planMinimo: "Lite",
      confianza: "alta",
    });
    expect(registros[0].fuentes[0]).toMatchObject({ tipo: "tarifa_oficial", url: PRECIOS });
  });

  it("todo lo que produce pasa el validador de registros", () => {
    const casos = [
      buena,
      { ...buena, profundidad: "integracion", integraCon: "Zapier", planMinimo: null },
      { veredicto: "no", urlFuente: PRECIOS, cita: "Pipedrive no incluye facturación electrónica" },
      { veredicto: "no_documentado", nota: "Busqué en precios y portada y no aparece" },
      { ...buena, cita: "corta" },
      { ...buena, cita: "" },
      { ...buena, urlFuente: PORTADA },
      { ...buena, planMinimo: null },
    ];
    for (const caso of casos) {
      const { registros } = uno(caso);
      const errores = registros.flatMap((r) => erroresDeRegistro(r, herramientas, capacidades));
      expect(errores, JSON.stringify(caso)).toEqual([]);
    }
  });

  describe("lo que degrada a desconocido", () => {
    const motivo = (respuesta: Record<string, unknown>) => uno(respuesta).descartes[0]?.motivo;

    it("una cita breve manda a revisión en vez de caer por corta", () => {
      expect(motivo({ ...buena, cita: "Sí" })).toBe("cita breve sin revisar");
    });

    it("una dirección que el proveedor no confirma haber leído", () => {
      expect(motivo({ ...buena, urlFuente: PORTADA })).toBe("la dirección citada no consta como leída");
    });

    /**
     * Con la dirección ajena marcada como leída, la regla de «no consta como
     * leída» ya no la para: sólo queda la comprobación de dominio. Si no
     * existiera, una reseña de Capterra descargada de verdad sostendría
     * confianza alta, que es justo lo que la propietaria prohibió.
     */
    it("una cita traída de otro dominio, aunque se haya descargado", () => {
      const ajena = "https://www.capterra.com/pipedrive";
      const r = convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, ajena],
              urlsRecuperadas: [
                { url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
                { url: ajena, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
              ],
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [{ capacidadId: "cap.sales_pipeline", ...buena, urlFuente: ajena }],
            },
          ],
        },
        urlPrecios
      );
      expect(r.descartes[0].motivo).toBe("la cita viene de otro dominio");
      expect(r.registros[0].confianza).toBe("baja");
    });

    it("una dirección que ni se pidió ni se leyó", () => {
      expect(motivo({ ...buena, urlFuente: "https://www.capterra.com/pipedrive" })).toBe(
        "la dirección citada no consta como leída"
      );
    });

    it("afirmar que la tiene sin decir en qué plan", () => {
      expect(motivo({ ...buena, planMinimo: "  " })).toBe("sin plan mínimo");
    });

    it("una integración sin decir con qué se integra", () => {
      expect(motivo({ ...buena, profundidad: "integracion", integraCon: "" })).toBe(
        "integración sin decir con qué"
      );
    });

    it("afirmar que la tiene sin decir cómo", () => {
      expect(motivo({ ...buena, profundidad: null })).toBe("sin profundidad válida");
    });

    it("un veredicto que no existe", () => {
      expect(motivo({ ...buena, veredicto: "quizas" })).toBe("veredicto desconocido");
    });

    it("una capacidad por la que nunca respondió", () => {
      const r = convertirSalida(
        salida({}, { respuestas: [], sinRespuesta: ["cap.sales_pipeline"] }),
        urlPrecios
      );
      expect(r.descartes[0].motivo).toBe("sin respuesta");
      expect(r.resumen.sinRespuesta).toBe(1);
    });

    it("degradar conserva el registro, no lo borra", () => {
      const { registros } = uno({ ...buena, cita: "Sí" });
      expect(registros).toHaveLength(1);
      expect(registros[0].estado).toBe("desconocido");
      expect(registros[0].nota).toBeTruthy();
    });
  });

  it("«no» se guarda como evidencia de que no lo hace, no como desconocido", () => {
    const { registros } = uno({
      veredicto: "no",
      urlFuente: PRECIOS,
      cita: "La facturación electrónica no está disponible en ningún plan",
    });
    expect(registros[0]).toMatchObject({ estado: "verificado", profundidad: "no_disponible" });
    expect(registros[0].planMinimo).toBeUndefined();
  });

  it("un desconocido también lleva la fuente que se llegó a mirar", () => {
    const { registros } = uno({ veredicto: "no_documentado", nota: "no aparece" });
    expect(registros[0].fuentes).toHaveLength(1);
    expect(registros[0].fuentes[0].url).toBe(PRECIOS);
    expect(registros[0].fuentes[0].cita).toBeUndefined();
  });

  it("lo que depende de un plan se revisa a los seis meses, lo demás a los doce", () => {
    expect(uno(buena).registros[0].proximaRevision).toBe("2027-03-07");
    expect(
      uno({ veredicto: "no", urlFuente: PRECIOS, cita: "No ofrece facturación en ningún plan" }).registros[0]
        .proximaRevision
    ).toBe("2027-09-07");
  });

  it("el resumen cuadra con lo que hay", () => {
    const { resumen, registros, descartes } = uno(buena);
    expect(resumen.paresEsperados).toBe(1);
    expect(resumen.registros).toBe(registros.length);
    expect(resumen.verificados).toBe(1);
    expect(resumen.degradados).toBe(descartes.length);
  });

  /**
   * Estos casos no salieron de imaginar qué podría fallar: salieron del primer
   * lote real. Comparando direcciones en crudo se tiraron 88 afirmaciones bien
   * fundadas porque el proveedor devolvía la misma página con la barra final,
   * sin «www» o tras una redirección.
   */
  describe("la misma página escrita de otra forma", () => {
    const conLeidas = (leidas: string[], urlFuente: string) =>
      convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, PORTADA],
              urlsRecuperadas: leidas.map((url) => ({
                url,
                estado: "URL_RETRIEVAL_STATUS_SUCCESS",
                recuperada: true,
              })),
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [{ capacidadId: "cap.sales_pipeline", ...buena, urlFuente }],
            },
          ],
        },
        urlPrecios
      );

    it("acepta la barra final de más", () => {
      const r = conLeidas([`${PRECIOS}/`], PRECIOS);
      expect(r.descartes).toEqual([]);
      expect(r.registros[0].estado).toBe("verificado");
    });

    it("acepta que falte o sobre el www", () => {
      const r = conLeidas(["https://pipedrive.com/es/pricing"], PRECIOS);
      expect(r.descartes).toEqual([]);
    });

    it("acepta el cambio de esquema tras una redirección", () => {
      const r = conLeidas(["http://www.pipedrive.com/es/pricing"], PRECIOS);
      expect(r.descartes).toEqual([]);
    });

    it("guarda la dirección que el proveedor dice haber leído, no la que citó el modelo", () => {
      const real = "https://pipedrive.com/es/pricing/";
      const r = conLeidas([real], PRECIOS);
      expect(r.registros[0].fuentes[0].url).toBe(real);
      expect(r.registros[0].fuentes[0].tipo).toBe("tarifa_oficial");
    });

    /**
     * El caso que impide aflojar de más: en el lote real, capsule-crm citó
     * «/pricing/» habiendo leído sólo «/» y «/signup/». Son páginas distintas.
     */
    it("sigue rechazando una ruta distinta del mismo dominio", () => {
      const r = conLeidas(["https://capsulecrm.com/", "https://capsulecrm.com/signup/"], "https://capsulecrm.com/pricing/");
      expect(r.descartes[0].motivo).toBe("la dirección citada no consta como leída");
    });

    it("una ruta más profunda no cuela como la de arriba", () => {
      const r = conLeidas([PORTADA], "https://www.pipedrive.com/es/pricing");
      expect(r.descartes[0].motivo).toBe("la dirección citada no consta como leída");
    });
  });


  /**
   * Decisión de la propietaria del 2026-09-07, con el lote 1 delante: 38 de
   * 144 planes se apoyaban en una portada. Un eslogan no dice en qué plan está
   * una función, y mandar a alguien al plan barato a buscar algo que sólo está
   * en el caro es justo el daño que F2 existe para evitar.
   */
  describe("el plan sólo lo sostiene la página de tarifas", () => {
    it("rechaza un plan apoyado en la portada", () => {
      const { registros, descartes } = uno({
        ...buena,
        urlFuente: PORTADA,
        planMinimo: "FREE",
      });
      // La portada de este caso no consta leída; se prueba con una que sí.
      expect(registros[0].estado).toBe("desconocido");
      expect(descartes).toHaveLength(1);
    });

    it("rechaza el plan cuando la portada sí se leyó pero no es la tarifa", () => {
      const r = convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, PORTADA],
              urlsRecuperadas: [
                { url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
                { url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
              ],
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [
                {
                  capacidadId: "cap.sales_pipeline",
                  ...buena,
                  urlFuente: PORTADA,
                  planMinimo: "FREE",
                  cita: "Cierra más tratos con la gestión de contactos en una sola página",
                },
              ],
            },
          ],
        },
        urlPrecios
      );
      expect(r.descartes[0].motivo).toBe("el plan no viene de una fuente que lo demuestre");
      expect(r.registros[0].estado).toBe("desconocido");
      expect(r.registros[0].confianza).toBe("baja");
    });

    it("una integración no necesita plan, así que la portada le vale", () => {
      const r = convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, PORTADA],
              urlsRecuperadas: [
                { url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
              ],
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [
                {
                  capacidadId: "cap.sales_pipeline",
                  veredicto: "si",
                  profundidad: "integracion",
                  integraCon: "Zapier",
                  planMinimo: null,
                  urlFuente: PORTADA,
                  cita: "Conecta Pipedrive con más de 400 aplicaciones a través de Zapier",
                },
              ],
            },
          ],
        },
        urlPrecios
      );
      expect(r.descartes).toEqual([]);
      expect(r.registros[0]).toMatchObject({ estado: "verificado", profundidad: "integracion" });
    });

    /**
     * La puerta lateral: bastaba responder «integracion» para que un plan de la
     * portada sobreviviera sin pasar por la tarifa. En el lote 1 la cruzó una,
     * zoho-projects con cap.invoicing.
     */
    it("una integración tampoco conserva un plan sacado de la portada", () => {
      const r = convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, PORTADA],
              urlsRecuperadas: [
                { url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true },
              ],
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [
                {
                  capacidadId: "cap.sales_pipeline",
                  veredicto: "si",
                  profundidad: "integracion",
                  integraCon: "Zapier",
                  planMinimo: "FREE",
                  urlFuente: PORTADA,
                  cita: "Conecta Pipedrive con más de 400 aplicaciones a través de Zapier",
                },
              ],
            },
          ],
        },
        urlPrecios
      );
      expect(r.registros[0].estado).toBe("verificado");
      expect(r.registros[0].planMinimo).toBeUndefined();
    });

    it("la tarifa oficial sigue valiendo", () => {
      const { registros, descartes } = uno(buena);
      expect(descartes).toEqual([]);
      expect(registros[0].fuentes[0].tipo).toBe("tarifa_oficial");
      expect(registros[0].planMinimo).toBe("Lite");
    });
  });


  /**
   * Decisiones de la propietaria del 2026-09-07, con el lote 1 delante.
   */
  describe("las tres decisiones de la propietaria", () => {
    const conTodo = (extra: Record<string, unknown>, respuesta: Record<string, unknown>, revisadas: any[] = []) =>
      convertirSalida(
        {
          herramientas: [
            {
              herramientaId: "pipedrive",
              fechaConsulta: "2026-09-07",
              urlsSolicitadas: [PRECIOS, PORTADA],
              urlsRecuperadas: [{ url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
              capacidadesPedidas: ["cap.sales_pipeline"],
              respuestas: [{ capacidadId: "cap.sales_pipeline", ...respuesta }],
              ...extra,
            },
          ],
        },
        urlPrecios,
        revisadas
      );

    describe("una redirección sólo cuenta si está demostrada", () => {
      const FINAL = "https://www.pipedrive.com/es/pricing-plans";

      it("sin cadena resuelta, la afirmación cae", () => {
        const r = conTodo(
          { urlsRecuperadas: [{ url: FINAL, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }] },
          buena
        );
        expect(r.descartes[0].motivo).toBe("la dirección citada no consta como leída");
      });

      it("con la cadena resuelta, la afirmación se sostiene y la fuente es la que se leyó", () => {
        const r = conTodo(
          {
            urlsRecuperadas: [{ url: FINAL, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
            redirecciones: [{ solicitada: PRECIOS, final: FINAL, codigos: [301, 200] }],
          },
          buena
        );
        expect(r.descartes).toEqual([]);
        expect(r.registros[0].fuentes[0].url).toBe(FINAL);
        expect(r.registros[0].fuentes[0].tipo).toBe("tarifa_oficial");
      });

      /**
       * Salió de los datos: seis servidores devolvieron 403 a la comprobación
       * y la cadena se guardó como «final = solicitada», o sea, como si
       * constara que no redirige. Afirmar eso es justo lo que no se puede
       * hacer, así que una cadena sin resolver no vale para nada.
       */
      it("una cadena que no se pudo comprobar no sirve de prueba", () => {
        const r = conTodo(
          {
            urlsRecuperadas: [{ url: FINAL, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
            redirecciones: [{ solicitada: PRECIOS, final: FINAL, codigos: [403], resuelta: false }],
          },
          buena
        );
        expect(r.descartes[0].motivo).toBe("la dirección citada no consta como leída");
      });

      it("una cadena que lleve a otra página no vale como coartada", () => {
        const r = conTodo(
          {
            urlsRecuperadas: [{ url: PORTADA, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
            redirecciones: [{ solicitada: PRECIOS, final: "https://www.pipedrive.com/es/signup", codigos: [302, 200] }],
          },
          buena
        );
        expect(r.descartes[0].motivo).toBe("la dirección citada no consta como leída");
      });
    });

    describe("la cita de la portada se conserva como pista", () => {
      it("un plan apoyado en la portada se degrada pero no pierde la cita", () => {
        const r = conTodo({}, {
          ...buena,
          urlFuente: PORTADA,
          planMinimo: "FREE",
          cita: "Cierra más tratos con la gestión de contactos en una sola página",
        });
        expect(r.descartes[0].motivo).toBe("el plan no viene de una fuente que lo demuestre");
        expect(r.descartes[0].cita).toContain("Cierra más tratos");
        expect(r.registros[0].estado).toBe("desconocido");
        expect(r.registros[0].fuentes[0].cita).toContain("Cierra más tratos");
        expect(r.registros[0].fuentes[0].url).toBe(PORTADA);
      });

      it("la documentación oficial sí puede sostener un plan", () => {
        const DOCS = "https://www.pipedrive.com/es/docs/planes";
        const r = convertirSalida(
          {
            herramientas: [
              {
                herramientaId: "pipedrive",
                fechaConsulta: "2026-09-07",
                urlsSolicitadas: [DOCS],
                urlsRecuperadas: [{ url: DOCS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
                capacidadesPedidas: ["cap.sales_pipeline"],
                respuestas: [{ capacidadId: "cap.sales_pipeline", ...buena, urlFuente: DOCS }],
              },
            ],
          },
          { pipedrive: { urlPrecios: PRECIOS, documentacion: [DOCS] } }
        );
        expect(r.descartes).toEqual([]);
        expect(r.registros[0].fuentes[0].tipo).toBe("documentacion");
        expect(r.registros[0].planMinimo).toBe("Lite");
      });
    });

    describe("las citas breves se revisan, no se miden", () => {
      const breve = { ...buena, urlFuente: PRECIOS, cita: "SSO" };
      const conPrecios = (respuesta: Record<string, unknown>, revisadas: any[] = []) =>
        convertirSalida(
          {
            herramientas: [
              {
                herramientaId: "pipedrive",
                fechaConsulta: "2026-09-07",
                urlsSolicitadas: [PRECIOS],
                urlsRecuperadas: [{ url: PRECIOS, estado: "URL_RETRIEVAL_STATUS_SUCCESS", recuperada: true }],
                capacidadesPedidas: ["cap.sales_pipeline"],
                respuestas: [{ capacidadId: "cap.sales_pipeline", ...respuesta }],
              },
            ],
          },
          urlPrecios,
          revisadas
        );

      const revisada = (veredicto: "vale" | "no_vale") => [
        {
          herramientaId: "pipedrive",
          capacidadId: "cap.sales_pipeline",
          cita: "SSO",
          veredicto,
          motivo: "porque sí",
        },
      ];

      it("una cita vacía cae siempre", () => {
        expect(conPrecios({ ...buena, cita: "   " }).descartes[0].motivo).toBe("sin cita");
      });

      it("una cita breve sin revisar no pasa, pero tampoco se rechaza por corta", () => {
        const r = conPrecios(breve);
        expect(r.descartes[0].motivo).toBe("cita breve sin revisar");
      });

      it("una cita breve revisada y aceptada vale", () => {
        const r = conPrecios(breve, revisada("vale"));
        expect(r.descartes).toEqual([]);
        expect(r.registros[0].estado).toBe("verificado");
      });

      it("una cita breve revisada y rechazada cae con el motivo escrito", () => {
        const r = conPrecios(breve, revisada("no_vale"));
        expect(r.descartes[0].motivo).toBe("cita breve revisada y rechazada");
        expect(r.registros[0].nota).toBe("porque sí");
      });

      it("una cita larga no necesita revisión", () => {
        const r = conPrecios(buena);
        expect(r.descartes).toEqual([]);
      });
    });
  });

});
