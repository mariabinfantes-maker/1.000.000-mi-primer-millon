import type {
  Fuente,
  NivelConfianza,
  Profundidad,
  RegistroVerificacion,
  TipoFuente,
} from "./esquema";

/**
 * De lo que contestó Gemini a lo que Molnip puede afirmar.
 *
 * El script `ejecutar-lote.ps1` no decide nada: guarda las respuestas tal cual.
 * Aquí es donde se decide, y por eso las reglas viven en el repositorio, con
 * pruebas, y no en un script suelto que nadie vuelve a leer.
 *
 * LA REGLA QUE LO GOBIERNA TODO: una afirmación sólo sobrevive si viene con una
 * cita literal Y de una dirección que el proveedor confirma haber descargado.
 * Sin las dos cosas es «desconocido». No es exceso de celo: el modelo conoce de
 * memoria casi todas estas herramientas, así que una respuesta segura y sin
 * fuente es exactamente lo que llenó las 62 fichas de datos que nadie comprobó.
 *
 * Degradar no es tirar. Todo lo que se degrada queda en `descartes` con su
 * motivo, para que el informe pueda decir cuánto se perdió y por qué, en vez de
 * presentar sólo lo que salió bien.
 */

export type RespuestaCruda = {
  capacidadId?: string;
  veredicto?: string;
  profundidad?: string | null;
  integraCon?: string | null;
  planMinimo?: string | null;
  urlFuente?: string | null;
  cita?: string | null;
  nota?: string | null;
};

export type SalidaHerramienta = {
  herramientaId: string;
  nombre?: string;
  fechaConsulta: string;
  urlsSolicitadas?: string[];
  urlsRecuperadas?: Array<{ url?: string; estado?: string; recuperada?: boolean }>;
  capacidadesPedidas?: string[];
  respuestas?: RespuestaCruda[];
  sinRespuesta?: string[];
  errores?: unknown[];
};

export type SalidaLote = {
  lote?: number;
  fecha?: string;
  modelo?: string;
  versionVocabulario?: string;
  herramientas?: SalidaHerramienta[];
};

export type Descarte = {
  herramientaId: string;
  capacidadId: string;
  motivo: string;
};

export type Resumen = {
  herramientas: number;
  paresEsperados: number;
  registros: number;
  verificados: number;
  noDisponibles: number;
  desconocidos: number;
  degradados: number;
  sinRespuesta: number;
};

export type Conversion = {
  registros: RegistroVerificacion[];
  descartes: Descarte[];
  resumen: Resumen;
};

/**
 * Una cita de tres palabras no demuestra nada, y sin embargo basta para que un
 * registro parezca fundado. El umbral es bajo a propósito —no es un juicio de
 * calidad—, pero corta el «Sí», el «Incluido» y el nombre del plan a secas.
 */
const CITA_MINIMA = 15;

const PROFUNDIDADES: Profundidad[] = ["nativa", "modulo", "integracion", "no_disponible"];

/** Meses de vigencia: lo que depende de un plan cambia antes que lo demás. */
function proximaRevision(fechaConsulta: string, dependeDePlan: boolean): string {
  const d = new Date(`${fechaConsulta}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + (dependeDePlan ? 6 : 12));
  return d.toISOString().slice(0, 10);
}

/**
 * Qué clase de fuente es la dirección.
 *
 * La página de tarifas es la única que puede sostener un plan mínimo, así que
 * se distingue. Una portada es `pagina_oficial`: de primera mano, sí, pero no
 * demuestra por sí sola en qué plan está una función.
 */
function tipoDeFuente(url: string, urlPrecios?: string): TipoFuente {
  if (urlPrecios && url === urlPrecios) return "tarifa_oficial";
  return "pagina_oficial";
}

function mismoDominio(a: string, b: string): boolean {
  try {
    const limpio = (u: string) => new URL(u).hostname.replace(/^www\./, "").toLowerCase();
    return limpio(a) === limpio(b);
  } catch {
    return false;
  }
}

/**
 * Convierte la salida cruda de un lote en registros de verificación.
 *
 * `urlPreciosPorHerramienta` viene de las fichas: sirve para marcar cuál de las
 * direcciones es la tarifa oficial y para comprobar que la cita no venga de un
 * dominio ajeno.
 */
export function convertirSalida(
  salida: SalidaLote,
  urlPreciosPorHerramienta: Record<string, string | undefined> = {}
): Conversion {
  const registros: RegistroVerificacion[] = [];
  const descartes: Descarte[] = [];
  let paresEsperados = 0;
  let sinRespuesta = 0;

  for (const h of salida.herramientas ?? []) {
    const pedidas = h.capacidadesPedidas ?? [];
    paresEsperados += pedidas.length;
    sinRespuesta += (h.sinRespuesta ?? []).length;

    const leidas = new Set(
      (h.urlsRecuperadas ?? []).filter((u) => u.recuperada && u.url).map((u) => u.url as string)
    );
    const urlPrecios = urlPreciosPorHerramienta[h.herramientaId];
    const solicitadas = h.urlsSolicitadas ?? [];

    const degradar = (capacidadId: string, motivo: string, nota: string) => {
      descartes.push({ herramientaId: h.herramientaId, capacidadId, motivo });
      registros.push({
        herramientaId: h.herramientaId,
        capacidadId,
        estado: "desconocido",
        fuentes: fuentesConsultadas(),
        confianza: "baja",
        proximaRevision: proximaRevision(h.fechaConsulta, false),
        nota,
      });
    };

    /**
     * Un «desconocido» también necesita fuente: sin ella no se distingue «lo
     * miré y no estaba» de «no lo miré», y esa diferencia es justo la que F2
     * existe para conservar.
     */
    const fuentesConsultadas = (): Fuente[] => {
      const urls = solicitadas.filter((u) => leidas.has(u));
      const elegidas = urls.length ? urls : solicitadas.slice(0, 1);
      return elegidas.map((url) => ({
        tipo: tipoDeFuente(url, urlPrecios),
        url,
        fechaConsulta: h.fechaConsulta,
      }));
    };

    for (const capacidadId of pedidas) {
      const r = (h.respuestas ?? []).find((x) => x.capacidadId === capacidadId);

      if (!r) {
        degradar(capacidadId, "sin respuesta", "El modelo no llegó a responder por esta capacidad.");
        continue;
      }

      if (r.veredicto === "no_documentado" || !r.veredicto) {
        registros.push({
          herramientaId: h.herramientaId,
          capacidadId,
          estado: "desconocido",
          fuentes: fuentesConsultadas(),
          confianza: "baja",
          proximaRevision: proximaRevision(h.fechaConsulta, false),
          nota: r.nota?.trim() || "No aparece en las páginas oficiales consultadas.",
        });
        continue;
      }

      const url = (r.urlFuente ?? "").trim();
      const cita = (r.cita ?? "").trim();

      if (!url || !leidas.has(url)) {
        degradar(
          capacidadId,
          "la dirección citada no consta como leída",
          `Se afirmó "${r.veredicto}" citando ${url || "ninguna dirección"}, que el proveedor no confirma haber descargado.`
        );
        continue;
      }
      if (urlPrecios && !mismoDominio(url, urlPrecios)) {
        degradar(
          capacidadId,
          "la cita viene de otro dominio",
          `La dirección citada (${url}) no pertenece al dominio oficial de la herramienta.`
        );
        continue;
      }
      if (cita.length < CITA_MINIMA) {
        degradar(
          capacidadId,
          "sin cita literal suficiente",
          `Se afirmó "${r.veredicto}" sin una cita literal que lo sostenga por sí sola.`
        );
        continue;
      }

      const fuente: Fuente = { tipo: tipoDeFuente(url, urlPrecios), url, fechaConsulta: h.fechaConsulta, cita };
      const confianza: NivelConfianza = "alta";

      if (r.veredicto === "no") {
        registros.push({
          herramientaId: h.herramientaId,
          capacidadId,
          estado: "verificado",
          profundidad: "no_disponible",
          fuentes: [fuente],
          confianza,
          proximaRevision: proximaRevision(h.fechaConsulta, false),
          nota: r.nota?.trim() || undefined,
        });
        continue;
      }

      if (r.veredicto !== "si") {
        degradar(capacidadId, "veredicto desconocido", `El modelo respondió "${r.veredicto}", que no es un veredicto válido.`);
        continue;
      }

      const profundidad = PROFUNDIDADES.find((p) => p === r.profundidad && p !== "no_disponible");
      if (!profundidad) {
        degradar(capacidadId, "sin profundidad válida", `Se afirmó que la tiene, pero "${r.profundidad ?? "nada"}" no dice cómo.`);
        continue;
      }
      if (profundidad === "integracion" && !r.integraCon?.trim()) {
        degradar(capacidadId, "integración sin decir con qué", "Se afirmó que es una integración sin decir con qué se integra.");
        continue;
      }

      const planMinimo = (r.planMinimo ?? "").trim();
      if (profundidad !== "integracion" && !planMinimo) {
        degradar(
          capacidadId,
          "sin plan mínimo",
          "Se afirmó que la tiene, pero no en qué plan. Una función del plan caro no le sirve a quien busca el barato."
        );
        continue;
      }

      registros.push({
        herramientaId: h.herramientaId,
        capacidadId,
        estado: "verificado",
        profundidad,
        planMinimo: planMinimo || undefined,
        integraCon: profundidad === "integracion" ? r.integraCon!.trim() : undefined,
        fuentes: [fuente],
        confianza,
        proximaRevision: proximaRevision(h.fechaConsulta, Boolean(planMinimo)),
        nota: r.nota?.trim() || undefined,
      });
    }
  }

  const verificados = registros.filter((r) => r.estado === "verificado" && r.profundidad !== "no_disponible").length;
  const noDisponibles = registros.filter((r) => r.profundidad === "no_disponible").length;

  return {
    registros,
    descartes,
    resumen: {
      herramientas: (salida.herramientas ?? []).length,
      paresEsperados,
      registros: registros.length,
      verificados,
      noDisponibles,
      desconocidos: registros.filter((r) => r.estado === "desconocido").length,
      degradados: descartes.length,
      sinRespuesta,
    },
  };
}
