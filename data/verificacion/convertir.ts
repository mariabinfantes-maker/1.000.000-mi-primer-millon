import fs from "node:fs";
import path from "node:path";
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
 * El script que ejecuta la propietaria no decide nada: guarda las respuestas
 * tal cual. Aquí es donde se decide, y por eso las reglas viven en el
 * repositorio, con pruebas, y no en un script suelto que nadie vuelve a leer.
 *
 * LA REGLA QUE LO GOBIERNA TODO: una afirmación sólo sobrevive si viene con una
 * cita literal Y de una dirección que el proveedor confirma haber descargado.
 * Sin las dos cosas es «desconocido». No es exceso de celo: el modelo conoce de
 * memoria casi todas estas herramientas, así que una respuesta segura y sin
 * fuente es exactamente lo que llenó las 62 fichas de datos que nadie comprobó.
 *
 * Degradar no es tirar. Todo lo que se degrada queda en `descartes` con su
 * motivo y con la cita que se le dio, para que el informe pueda decir cuánto se
 * perdió y por qué, en vez de presentar sólo lo que salió bien.
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
  /**
   * La evidencia DEL PLAN, aparte de la de la capacidad. La repesca de plan la
   * trae —fila más encabezado de columna, o una frase que los relacione— y no
   * puede pisar la cita que demostró la capacidad, que ya estaba comprobada.
   */
  planCita?: string | null;
  planUrlFuente?: string | null;
};

/** Una redirección resuelta con el cliente HTTP, no supuesta. */
export type Redireccion = {
  solicitada: string;
  final: string;
  /** Los códigos de la cadena, en orden: [301, 200]. */
  codigos: number[];
  /**
   * `false` cuando no se pudo comprobar —el servidor devolvió 403, o la
   * petición ni siquiera llegó—. Sin esto, un bloqueo se guardaba como «final =
   * solicitada», es decir, como si constara que NO redirige. Una cadena sin
   * resolver no vale como prueba de nada.
   */
  resuelta?: boolean;
};

export type SalidaHerramienta = {
  herramientaId: string;
  nombre?: string;
  fechaConsulta: string;
  urlsSolicitadas?: string[];
  urlsRecuperadas?: Array<{ url?: string; estado?: string; recuperada?: boolean }>;
  redirecciones?: Redireccion[];
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

/**
 * Qué papel tiene cada dirección de una herramienta.
 *
 * Decisión de la propietaria (2026-09-07): el plan puede sostenerse en la
 * página de tarifas, en una tabla comparativa de planes o en documentación
 * oficial que vincule expresamente capacidad y plan. Una portada NO.
 */
export type FuentesDeHerramienta = {
  urlPrecios?: string;
  /** Direcciones que son documentación oficial y pueden sostener un plan. */
  documentacion?: string[];
};

export type Descarte = {
  herramientaId: string;
  capacidadId: string;
  motivo: string;
  /** Se conserva la cita para no perder la pista, aunque no sirva de prueba. */
  cita?: string;
  urlCitada?: string;
};

export type CitaRevisada = {
  herramientaId: string;
  capacidadId: string;
  cita: string;
  veredicto: "vale" | "no_vale";
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
 * Longitud a partir de la cual una cita se da por explicada sola.
 *
 * NO es un mínimo automático: por debajo de esta raya la cita no se rechaza,
 * se manda a revisión. La propietaria lo pidió así el 2026-09-07 y los datos le
 * daban la razón — la regla de longitud que había antes rechazaba «SSO», «Audit
 * logs» y «Kanban board», que no son ambiguas en absoluto, y aceptaba etiquetas
 * genéricas más largas. La longitud sirve para decidir QUÉ SE MIRA, nunca qué
 * se acepta.
 */
const LONGITUD_QUE_SE_EXPLICA_SOLA = 30;

const PROFUNDIDADES: Profundidad[] = ["nativa", "modulo", "integracion", "no_disponible"];

/** Papeles de fuente que pueden situar una capacidad en un plan concreto. */
const SOSTIENEN_UN_PLAN: TipoFuente[] = ["tarifa_oficial", "documentacion"];

/** Meses de vigencia: lo que depende de un plan cambia antes que lo demás. */
function proximaRevision(fechaConsulta: string, dependeDePlan: boolean): string {
  const d = new Date(`${fechaConsulta}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + (dependeDePlan ? 6 : 12));
  return d.toISOString().slice(0, 10);
}

function dominio(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * ¿Las dos direcciones son del mismo fabricante?
 *
 * Cuenta el dominio Y sus subdominios: la documentación casi nunca vive en el
 * dominio principal —`apidocs.teamwork.com`, `api.scoro.com`— y compararlo en
 * plano rechazaba evidencia buena del propio fabricante. Lo que sigue fuera es
 * un dominio ajeno, que es lo que esta comprobación existe para frenar.
 */
function mismoDominio(a: string, b: string): boolean {
  const x = dominio(a);
  const y = dominio(b);
  if (x === null || y === null) return false;
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
}

/**
 * La misma página escrita de otra forma sigue siendo la misma página.
 *
 * Gemini devuelve la dirección que descargó de verdad, y casi nunca coincide
 * carácter a carácter con la que se le pidió: sobra o falta la barra final,
 * está o no está el «www», el esquema cambia. Comparar en crudo tiraba 88
 * afirmaciones bien fundadas en el primer lote.
 *
 * Lo que NO se toca es la ruta: «/pricing» y «/signup» son páginas distintas y
 * deben seguir sin coincidir. Para eso están las redirecciones resueltas.
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

export function getCitasRevisadas(): CitaRevisada[] {
  const ruta = path.join(process.cwd(), "data", "verificacion", "citas-revisadas.json");
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
}

/**
 * Una dirección oficial que demuestra la capacidad, declarada aparte porque no
 * sale de la misma página que el plan. Se pasa ya validada desde el repositorio.
 */
export type PruebaDeCapacidad = {
  herramientaId: string;
  capacidadId: string;
  url: string;
  tipo: TipoFuente;
  cita: string;
  fecha: string;
};

export function convertirSalida(
  salida: SalidaLote,
  fuentesPorHerramienta: Record<string, FuentesDeHerramienta> = {},
  citasRevisadas: CitaRevisada[] = [],
  pruebasDeCapacidad: PruebaDeCapacidad[] = []
): Conversion {
  const registros: RegistroVerificacion[] = [];
  const descartes: Descarte[] = [];
  let paresEsperados = 0;
  let sinRespuesta = 0;

  const revisadaDe = (herramientaId: string, capacidadId: string, cita: string) =>
    citasRevisadas.find(
      (c) =>
        c.herramientaId === herramientaId &&
        c.capacidadId === capacidadId &&
        c.cita.trim() === cita.trim()
    );

  const pruebaDe = (herramientaId: string, capacidadId: string) =>
    pruebasDeCapacidad.find((p) => p.herramientaId === herramientaId && p.capacidadId === capacidadId);

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

    /**
     * Redirecciones DEMOSTRADAS con el cliente HTTP, no supuestas.
     *
     * Sin esto, pedir «insightly.com/pricing/» y que Google leyera
     * «insightly.com/pricing-plans/» hacía caer la afirmación aunque fuese la
     * misma página. La propietaria autorizó aceptarlas sólo con la cadena
     * resuelta delante: la equivalencia se demuestra, no se supone.
     */
    const destinoDe = new Map<string, string>();
    for (const r of h.redirecciones ?? []) {
      if (r.resuelta === false) continue;
      if (r.solicitada && r.final) destinoDe.set(normalizarUrl(r.solicitada), normalizarUrl(r.final));
    }
    const resolver = (url: string): string | undefined => {
      const n = normalizarUrl(url);
      return leidas.get(n) ?? leidas.get(destinoDe.get(n) ?? "");
    };

    const config = fuentesPorHerramienta[h.herramientaId] ?? {};
    const documentacion = new Set((config.documentacion ?? []).map(normalizarUrl));
    const solicitadas = h.urlsSolicitadas ?? [];

    const tipoDeFuente = (url: string): TipoFuente => {
      const n = normalizarUrl(url);
      if (documentacion.has(n)) return "documentacion";
      if (config.urlPrecios && n === normalizarUrl(config.urlPrecios)) return "tarifa_oficial";
      if (config.urlPrecios && destinoDe.get(normalizarUrl(config.urlPrecios)) === n) return "tarifa_oficial";
      return "pagina_oficial";
    };

    /**
     * Un «desconocido» también necesita fuente: sin ella no se distingue «lo
     * miré y no estaba» de «no lo miré», y esa diferencia es justo la que F2
     * existe para conservar.
     */
    const fuentesConsultadas = (): Fuente[] => {
      const urls = solicitadas.map(resolver).filter((u): u is string => Boolean(u));
      const elegidas = urls.length ? urls : solicitadas.slice(0, 1);
      return elegidas.map((url) => ({ tipo: tipoDeFuente(url), url, fechaConsulta: h.fechaConsulta }));
    };

    const degradar = (capacidadId: string, motivo: string, nota: string, pista?: Fuente, cita?: string) => {
      descartes.push({
        herramientaId: h.herramientaId,
        capacidadId,
        motivo,
        // La cita se conserva venga suelta o dentro de la pista: es lo que la
        // propietaria pidió guardar para no perder el rastro.
        cita: (cita ?? pista?.cita)?.trim() || undefined,
        urlCitada: pista?.url,
      });
      registros.push({
        herramientaId: h.herramientaId,
        capacidadId,
        estado: "desconocido",
        // La pista se conserva CON su cita: no prueba nada, pero no se pierde.
        fuentes: pista ? [pista] : fuentesConsultadas(),
        confianza: "baja",
        proximaRevision: proximaRevision(h.fechaConsulta, false),
        nota,
      });
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
      const urlLeida = url ? resolver(url) : undefined;

      if (!urlLeida) {
        degradar(
          capacidadId,
          "la dirección citada no consta como leída",
          `Se afirmó "${r.veredicto}" citando ${url || "ninguna dirección"}, sin que conste que se descargara ni que redirigiera a algo que sí se leyó.`,
          undefined,
          cita
        );
        continue;
      }
      if (config.urlPrecios && !mismoDominio(urlLeida, config.urlPrecios)) {
        degradar(
          capacidadId,
          "la cita viene de otro dominio",
          `La dirección citada (${urlLeida}) no pertenece al dominio oficial de la herramienta.`,
          undefined,
          cita
        );
        continue;
      }

      const fuente: Fuente = { tipo: tipoDeFuente(urlLeida), url: urlLeida, fechaConsulta: h.fechaConsulta, cita };

      if (!cita) {
        degradar(capacidadId, "sin cita", `Se afirmó "${r.veredicto}" sin citar nada.`, undefined);
        continue;
      }
      if (cita.length < LONGITUD_QUE_SE_EXPLICA_SOLA) {
        const revisada = revisadaDe(h.herramientaId, capacidadId, cita);
        if (!revisada) {
          degradar(
            capacidadId,
            "cita breve sin revisar",
            `La cita "${cita}" es demasiado corta para darse por explicada sola y nadie la ha revisado todavía.`,
            fuente
          );
          continue;
        }
        if (revisada.veredicto === "no_vale") {
          degradar(capacidadId, "cita breve revisada y rechazada", revisada.motivo, fuente);
          continue;
        }
      }

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
        degradar(
          capacidadId,
          "veredicto desconocido",
          `El modelo respondió "${r.veredicto}", que no es un veredicto válido.`,
          fuente
        );
        continue;
      }

      const profundidad = PROFUNDIDADES.find((p) => p === r.profundidad && p !== "no_disponible");
      if (!profundidad) {
        degradar(
          capacidadId,
          "sin profundidad válida",
          `Se afirmó que la tiene, pero "${r.profundidad ?? "nada"}" no dice cómo.`,
          fuente
        );
        continue;
      }
      if (profundidad === "integracion" && !r.integraCon?.trim()) {
        degradar(
          capacidadId,
          "integración sin decir con qué",
          "Se afirmó que es una integración sin decir con qué se integra.",
          fuente
        );
        continue;
      }

      /**
       * EL PLAN SE DECIDE APARTE, Y NO ARRASTRA A LA CAPACIDAD.
       *
       * Antes, no poder demostrar el plan degradaba el par entero a
       * «desconocido»: se perdía una capacidad con evidencia impecable por no
       * saber en qué plan estaba. Eso decía algo falso —«no sabemos si lo
       * hace»— cuando lo que no sabíamos era otra cosa.
       *
       * Ahora la capacidad se queda verificada y el plan se marca desconocido.
       * Un plan desconocido NO nombra ningún plan: nombrarlo sería afirmarlo.
       * El motivo se sigue anotando en los descartes, para poder contar cuánto
       * plan falta y repescarlo.
       */
      const planMinimo = (r.planMinimo ?? "").trim();
      const planCita = (r.planCita ?? "").trim();
      const planUrl = (r.planUrlFuente ?? "").trim();
      const fuentePlan: Fuente | undefined = planUrl
        ? { tipo: tipoDeFuente(planUrl), url: planUrl, fechaConsulta: h.fechaConsulta, cita: planCita }
        : undefined;
      // Si la repesca de plan trajo su propia fuente, es ésa la que lo sostiene.
      const laSostieneUnPlan = SOSTIENEN_UN_PLAN.includes((fuentePlan ?? fuente).tipo);

      let planEstado: "verificado" | "desconocido" | undefined;
      let motivoDelPlan: string | undefined;
      if (profundidad !== "integracion") {
        if (!planMinimo) {
          planEstado = "desconocido";
          motivoDelPlan = "sin plan mínimo";
        } else if (!laSostieneUnPlan) {
          planEstado = "desconocido";
          motivoDelPlan = "el plan no viene de una fuente que lo demuestre";
        } else {
          planEstado = "verificado";
        }
      }

      if (motivoDelPlan) {
        descartes.push({
          herramientaId: h.herramientaId,
          capacidadId,
          motivo: motivoDelPlan,
          cita: cita || undefined,
          urlCitada: urlLeida,
        });
      }

      /**
       * LAS DOS EVIDENCIAS, Y NINGUNA SE TIRA.
       *
       * Cuando hay una prueba de capacidad declarada aparte —la documentación
       * del fabricante—, el registro guarda las dos direcciones con su papel:
       * una demuestra que la capacidad existe y otra en qué plan está. Antes
       * sólo cabía una, y el resultado era un «verificado» de confianza alta
       * sostenido por dos palabras de una tabla de precios, con la
       * documentación que lo justificaba fuera del registro.
       *
       * Sin prueba declarada no cambia nada: una sola fuente, sin `rol`, que
       * es el caso corriente.
       */
      const prueba = pruebaDe(h.herramientaId, capacidadId);
      const fuenteCapacidad: Fuente = prueba
        ? { tipo: prueba.tipo, url: prueba.url, fechaConsulta: prueba.fecha, cita: prueba.cita, rol: "capacidad" }
        : fuente;

      /**
       * La evidencia de la capacidad NO se pisa nunca con la del plan. Cuando
       * la repesca de plan trae su propia cita, se guardan las dos con su
       * papel; si no, queda la única que hay, sin `rol`, como siempre.
       */
      const planVerificado = planEstado === "verificado";
      const fuentes: Fuente[] = prueba
        ? planVerificado
          ? [fuenteCapacidad, { ...(fuentePlan ?? fuente), rol: "plan" }]
          : [fuenteCapacidad]
        : planVerificado && fuentePlan
          ? [{ ...fuente, rol: "capacidad" }, { ...fuentePlan, rol: "plan" }]
          : [fuente];

      registros.push({
        herramientaId: h.herramientaId,
        capacidadId,
        estado: "verificado",
        profundidad,
        // Un plan que no se ha demostrado no se nombra.
        planMinimo: planVerificado ? planMinimo : undefined,
        planEstado,
        integraCon: profundidad === "integracion" ? r.integraCon!.trim() : undefined,
        fuentes,
        confianza,
        proximaRevision: proximaRevision(h.fechaConsulta, planVerificado),
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
