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
  const urlPrecios = { pipedrive: PRECIOS };

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
    cita: "Gestiona tu embudo de ventas desde el plan Lite",
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

    it("una cita demasiado corta para sostener nada", () => {
      expect(motivo({ ...buena, cita: "Sí" })).toBe("sin cita literal suficiente");
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
});
