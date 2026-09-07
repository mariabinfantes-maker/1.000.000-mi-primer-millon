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
  if (urlPrecios && normalizarUrl(url) === normalizarUrl(urlPrecios)) return "tarifa_oficial";
  return "pagina_oficial";
}

function dominio(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function mismoDominio(a: string, b: string): boolean {
  const x = dominio(a);
  return x !== null && x === dominio(b);
}

/**
 * La misma página escrita de otra forma sigue siendo la misma página.
 *
 * Gemini devuelve la dirección que descargó de verdad, y casi nunca coincide
 * carácter a carácter con la que se le pidió: sobra o falta la barra final,
 * está o no está el «www», el esquema cambia tras una redirección. Comparar en
 * crudo tiraba 88 afirmaciones bien fundadas en el primer lote — evidencia
 * buena, perdida por un detalle de escritura.
 *
 * Lo que NO se toca es la ruta: «/pricing» y «/signup» son páginas distintas y
 * deben seguir sin coincidir. Citar una página que no se ha leído es
 * exactamente el error que este módulo existe para atrapar, y aflojar aquí lo
 * dejaría pasar.
 */
export function normalizarUrl(u: string): string {
  try {
    const url = new URL(u.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const ruta = url.pathname.replace(/\/+$/, "");
    return `${host}${ruta}${url.search}`;
  } catch {
    return u.trim().toLowerCase();
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

    /**
     * Se guarda la dirección tal y como el proveedor dice haberla descargado,
     * no la que escribió el modelo al citar: la evidencia es la que se leyó.
     */
    const leidas = new Map<string, string>();
    for (const u of h.urlsRecuperadas ?? []) {
      if (u.recuperada && u.url) leidas.set(normalizarUrl(u.url), u.url);
    }
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
      const urls = solicitadas
        .map((u) => leidas.get(normalizarUrl(u)))
        .filter((u): u is string => Boolean(u));
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

      const urlLeida = url ? leidas.get(normalizarUrl(url)) : undefined;
      if (!urlLeida) {
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

      const fuente: Fuente = {
        tipo: tipoDeFuente(urlLeida, urlPrecios),
        url: urlLeida,
        fechaConsulta: h.fechaConsulta,
        cita,
      };
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
      if (profundidad !== "integracion") {
        if (!planMinimo) {
          degradar(
            capacidadId,
            "sin plan mínimo",
            "Se afirmó que la tiene, pero no en qué plan. Una función del plan caro no le sirve a quien busca el barato."
          );
          continue;
        }
        /**
         * El plan sólo lo demuestra la página de tarifas.
         *
         * Decisión de la propietaria el 2026-09-07, con el lote 1 delante: 38
         * de 144 planes venían de una portada. Un eslogan comercial —«Agile CRM
         * es gratis para diez usuarios»— no dice en qué plan está una función
         * concreta, y su regla exige el plan donde la capacidad existe DE
         * VERDAD. Sin esto, el motor mandaría a alguien al plan barato a buscar
         * algo que sólo está en el caro.
         */
        if (fuente.tipo !== "tarifa_oficial") {
          degradar(
            capacidadId,
            "el plan no viene de la página de tarifas",
            `Se sitúa en el plan "${planMinimo}" citando ${urlLeida}, que no es la página de tarifas oficial.`
          );
          continue;
        }
      }

      registros.push({
        herramientaId: h.herramientaId,
        capacidadId,
        estado: "verificado",
        profundidad,
        /**
         * Una integración no necesita plan, pero si trae uno se le exige la
         * misma prueba que a las demás: la tarifa oficial. Sin esto, la regla
         * tenía una puerta lateral —bastaba responder «integracion» para que un
         * plan sacado de la portada sobreviviera—, y una la cruzó.
         */
        planMinimo: planMinimo && fuente.tipo === "tarifa_oficial" ? planMinimo : undefined,
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
