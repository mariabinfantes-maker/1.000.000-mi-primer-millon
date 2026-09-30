import fs from "node:fs";
import path from "node:path";
import type {
  EvidenciaDeIdiomaRegistrada,
  Fuente,
  NivelConfianza,
  Profundidad,
  RegistroDeIdioma,
  RegistroDeRecorrido,
  RegistroDeUso,
  RegistroVerificacion,
  TipoFuente,
} from "./esquema";
import { getUso } from "./usos";

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
  /**
   * Los usos concretos de esta capacidad (tercera ronda). Sólo se piden de
   * las capacidades de la selección que tienen usos en la lista cerrada, y
   * sólo cuentan si la capacidad sale afirmada.
   */
  usos?: RespuestaDeUsoCruda[];
};

export type RespuestaDeUsoCruda = {
  usoId?: string;
  veredicto?: string;
  urlFuente?: string | null;
  cita?: string | null;
  nota?: string | null;
};

export type RespuestaDeRecorridoCruda = {
  recorridoId?: string;
  veredicto?: string;
  planMinimo?: string | null;
  urlFuente?: string | null;
  cita?: string | null;
  limites?: string | null;
  nota?: string | null;
};

/** Interfaz y soporte por separado: `null` en una lista significa que la página no lo dice. */
export type RespuestaDeIdiomaCruda = {
  interfaz?: string[] | null;
  interfazUrlFuente?: string | null;
  interfazCita?: string | null;
  soporte?: string[] | null;
  soporteUrlFuente?: string | null;
  soporteCita?: string | null;
  nota?: string | null;
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
  /** Tercera ronda: qué usos, recorridos e idioma se pidieron, y qué se contestó. */
  usosPedidos?: string[];
  recorridosPedidos?: string[];
  recorridos?: RespuestaDeRecorridoCruda[];
  idiomaPedido?: boolean;
  idioma?: RespuestaDeIdiomaCruda | null;
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
  /**
   * Cuando lo degradado es un uso, un recorrido o el idioma, y no la
   * capacidad. Van en `descartesDeUso`, aparte, para que la repesca de
   * capacidades no los confunda con un par a repetir.
   */
  usoId?: string;
  recorridoId?: string;
  idioma?: "interfaz" | "soporte";
};

export type CitaRevisada = {
  herramientaId: string;
  capacidadId: string;
  cita: string;
  veredicto: "vale" | "no_vale";
  motivo: string;
  /** Cuando la cita revisada es la de un uso y no la de la capacidad. */
  usoId?: string;
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
  /** Lo degradado de usos, recorridos e idioma: aparte, con el mismo formato. */
  descartesDeUso: Descarte[];
  recorridos: RegistroDeRecorrido[];
  idiomas: RegistroDeIdioma[];
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

import { getRecorrido as recorridoDe } from "./usos";

/**
 * La misma comprobación que `citaNombraElPlan` en el repositorio, repetida
 * aquí porque el repositorio importa este módulo y un ciclo entre los dos
 * dejaría a uno cargando al otro a medias. Hay una prueba que compara las dos
 * sobre los mismos casos.
 */
export function citaNombraElPlanLocal(cita: string | undefined, plan: string): boolean {
  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const p = normalizar(plan);
  if (!p) return false;
  return new RegExp(`(^| )${p}( |$)`).test(normalizar(cita ?? ""));
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
  const descartesDeUso: Descarte[] = [];
  const recorridos: RegistroDeRecorrido[] = [];
  const idiomas: RegistroDeIdioma[] = [];
  let paresEsperados = 0;
  let sinRespuesta = 0;

  const revisadaDe = (herramientaId: string, capacidadId: string, cita: string, usoId?: string) =>
    citasRevisadas.find(
      (c) =>
        c.herramientaId === herramientaId &&
        c.capacidadId === capacidadId &&
        (c.usoId ?? undefined) === usoId &&
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

    /**
     * UNA AFIRMACIÓN CONCRETA (uso, recorrido, idioma) PASA POR LAS MISMAS
     * PUERTAS QUE LA CAPACIDAD: dirección leída, mismo dominio, cita literal,
     * y cita breve sólo si alguien la revisó. Devuelve la fuente con cita o
     * el motivo por el que no vale.
     */
    const fuenteAfirmada = (
      urlCitada: string | null | undefined,
      citaCruda: string | null | undefined,
      revisada: (cita: string) => CitaRevisada | undefined
    ): { fuente: Fuente } | { motivo: string; cita?: string; url?: string } => {
      const url = (urlCitada ?? "").trim();
      const cita = (citaCruda ?? "").trim();
      const urlLeida = url ? resolver(url) : undefined;
      if (!urlLeida) return { motivo: "la dirección citada no consta como leída", cita, url: url || undefined };
      if (config.urlPrecios && !mismoDominio(urlLeida, config.urlPrecios)) return { motivo: "la cita viene de otro dominio", cita, url: urlLeida };
      if (!cita) return { motivo: "sin cita", url: urlLeida };
      if (cita.length < LONGITUD_QUE_SE_EXPLICA_SOLA) {
        const r = revisada(cita);
        if (!r) return { motivo: "cita breve sin revisar", cita, url: urlLeida };
        if (r.veredicto === "no_vale") return { motivo: "cita breve revisada y rechazada", cita, url: urlLeida };
      }
      return { fuente: { tipo: tipoDeFuente(urlLeida), url: urlLeida, fechaConsulta: h.fechaConsulta, cita } };
    };

    /**
     * Los usos de UNA capacidad afirmada. Un uso sin respuesta, o con una
     * afirmación que no se sostiene, queda como `no_consta` con el motivo en
     * la nota: nunca desaparece, y nunca sube a demostrado sin la frase.
     */
    const usosDe = (capacidadId: string, r: RespuestaCruda): RegistroDeUso[] | undefined => {
      const pedidos = (h.usosPedidos ?? []).filter((u) => getUso(u)?.capacidadId === capacidadId);
      if (!pedidos.length) return undefined;
      const resultado: RegistroDeUso[] = [];
      for (const usoId of pedidos) {
        const ru = (r.usos ?? []).find((x) => x.usoId === usoId);
        const noConsta = (nota: string, motivo?: string, cita?: string, url?: string): RegistroDeUso => {
          if (motivo) descartesDeUso.push({ herramientaId: h.herramientaId, capacidadId, usoId, motivo, cita: cita || undefined, urlCitada: url });
          return { usoId, estado: "no_consta", fuentes: fuentesConsultadas(), nota };
        };
        if (!ru) {
          resultado.push(noConsta("El modelo no llegó a responder por este uso.", "uso sin respuesta"));
          continue;
        }
        if (ru.veredicto === "no_documentado" || !ru.veredicto) {
          resultado.push({ usoId, estado: "no_consta", fuentes: fuentesConsultadas(), nota: ru.nota?.trim() || "No aparece en las páginas oficiales consultadas." });
          continue;
        }
        if (ru.veredicto !== "si" && ru.veredicto !== "no") {
          resultado.push(noConsta(`El modelo respondió "${ru.veredicto}", que no es un veredicto válido.`, "uso con veredicto desconocido"));
          continue;
        }
        const f = fuenteAfirmada(ru.urlFuente, ru.cita, (cita) => revisadaDe(h.herramientaId, capacidadId, cita, usoId));
        if ("motivo" in f) {
          resultado.push(noConsta(`Se afirmó "${ru.veredicto}" sin una cita que valga: ${f.motivo}.`, `uso: ${f.motivo}`, f.cita, f.url));
          continue;
        }
        resultado.push({
          usoId,
          estado: ru.veredicto === "si" ? "demostrado" : "no_lo_hace",
          fuentes: [f.fuente],
          ...(ru.nota?.trim() ? { nota: ru.nota.trim() } : {}),
        });
      }
      return resultado;
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

      /**
       * Cuando el plan NO se demuestra, se conserva igualmente dónde se fue a
       * buscarlo y en qué fecha, con el papel `plan_consultado`. No afirma
       * ningún plan —el registro no lleva `planMinimo`— pero deja el rastro:
       * sin él, un plan desconocido ni siquiera enseñaba qué tarifa se miró.
       */
      const dondeSeMiroElPlan: Fuente | undefined =
        !planVerificado && planEstado === "desconocido" && fuentePlan
          ? { ...fuentePlan, cita: undefined, rol: "plan_consultado" }
          : undefined;

      const fuentes: Fuente[] = prueba
        ? planVerificado
          ? [fuenteCapacidad, { ...(fuentePlan ?? fuente), rol: "plan" }]
          : [fuenteCapacidad, ...(dondeSeMiroElPlan ? [dondeSeMiroElPlan] : [])]
        : planVerificado && fuentePlan
          ? [{ ...fuente, rol: "capacidad" }, { ...fuentePlan, rol: "plan" }]
          : dondeSeMiroElPlan
            ? [{ ...fuente, rol: "capacidad" }, dondeSeMiroElPlan]
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
        // Los usos sólo cuelgan de una capacidad afirmada: aquí, y en ningún otro sitio.
        ...(usosDe(capacidadId, r) ? { usos: usosDe(capacidadId, r) } : {}),
      });
    }

    /**
     * LOS RECORRIDOS. Un recorrido sólo puede demostrarse si TODAS sus piezas
     * salieron afirmadas en esta misma salida: si falta una, el recorrido no
     * consta, diga lo que diga la cita, porque la evidencia de las piezas no
     * la tiene nadie. El plan sigue la misma regla que la capacidad: sólo se
     * nombra si viene de una fuente que sostiene planes y la cita lo nombra.
     */
    const afirmadas = new Set(
      registros
        .filter((x) => x.herramientaId === h.herramientaId && x.estado === "verificado" && x.profundidad !== "no_disponible")
        .map((x) => x.capacidadId)
    );
    for (const recorridoId of h.recorridosPedidos ?? []) {
      const rr = (h.recorridos ?? []).find((x) => x.recorridoId === recorridoId);
      const noConsta = (nota: string, motivo?: string, cita?: string, url?: string) => {
        if (motivo) descartesDeUso.push({ herramientaId: h.herramientaId, capacidadId: "", recorridoId, motivo, cita: cita || undefined, urlCitada: url });
        recorridos.push({ herramientaId: h.herramientaId, recorridoId, estado: "no_consta", fuentes: fuentesConsultadas(), nota, proximaRevision: proximaRevision(h.fechaConsulta, false) });
      };
      const definicion = recorridoDe(recorridoId);
      if (!definicion) {
        noConsta("El recorrido no existe en la lista cerrada.", "recorrido inexistente");
        continue;
      }
      if (!rr) {
        noConsta("El modelo no llegó a responder por este recorrido.", "recorrido sin respuesta");
        continue;
      }
      if (rr.veredicto === "no_documentado" || !rr.veredicto) {
        recorridos.push({ herramientaId: h.herramientaId, recorridoId, estado: "no_consta", fuentes: fuentesConsultadas(), nota: rr.nota?.trim() || "No aparece en las páginas oficiales consultadas.", proximaRevision: proximaRevision(h.fechaConsulta, false) });
        continue;
      }
      if (rr.veredicto !== "si" && rr.veredicto !== "no") {
        noConsta(`El modelo respondió "${rr.veredicto}", que no es un veredicto válido.`, "recorrido con veredicto desconocido");
        continue;
      }
      const f = fuenteAfirmada(rr.urlFuente, rr.cita, () => undefined);
      if ("motivo" in f) {
        noConsta(`Se afirmó "${rr.veredicto}" sin una cita que valga: ${f.motivo}.`, `recorrido: ${f.motivo}`, f.cita, f.url);
        continue;
      }
      if (rr.veredicto === "no") {
        recorridos.push({ herramientaId: h.herramientaId, recorridoId, estado: "no_lo_hace", fuentes: [f.fuente], ...(rr.nota?.trim() ? { nota: rr.nota.trim() } : {}), proximaRevision: proximaRevision(h.fechaConsulta, false) });
        continue;
      }
      const piezasSinAfirmar = definicion.piezas.filter((pieza) => !pieza.some((c) => afirmadas.has(c)));
      if (piezasSinAfirmar.length) {
        noConsta(
          `Se afirmó el recorrido pero ${piezasSinAfirmar.length} de sus piezas no salieron afirmadas en esta verificación: ${piezasSinAfirmar.map((p) => p.join(" o ")).join("; ")}.`,
          "recorrido con piezas sin afirmar",
          f.fuente.cita,
          f.fuente.url
        );
        continue;
      }
      const planMinimo = (rr.planMinimo ?? "").trim();
      const planVerificado = Boolean(planMinimo) && SOSTIENEN_UN_PLAN.includes(f.fuente.tipo) && citaNombraElPlanLocal(f.fuente.cita, planMinimo);
      if (planMinimo && !planVerificado) {
        descartesDeUso.push({ herramientaId: h.herramientaId, capacidadId: "", recorridoId, motivo: "recorrido: el plan no viene de una fuente que lo demuestre o la cita no lo nombra", cita: f.fuente.cita, urlCitada: f.fuente.url });
      }
      recorridos.push({
        herramientaId: h.herramientaId,
        recorridoId,
        estado: "demostrado",
        planEstado: planVerificado ? "verificado" : "desconocido",
        ...(planVerificado ? { planMinimo } : {}),
        fuentes: [f.fuente],
        ...(rr.limites?.trim() ? { limites: rr.limites.trim() } : {}),
        ...(rr.nota?.trim() ? { nota: rr.nota.trim() } : {}),
        proximaRevision: proximaRevision(h.fechaConsulta, planVerificado),
      });
    }

    /**
     * EL IDIOMA. Interfaz y soporte por separado; cada uno verificado sólo
     * con una cita que valga y una lista de códigos. Sin registro válido,
     * queda desconocido: la ficha no cuenta como verificación.
     */
    if (h.idiomaPedido) {
      const parte = (
        cual: "interfaz" | "soporte",
        lista: string[] | null | undefined,
        url: string | null | undefined,
        cita: string | null | undefined
      ): EvidenciaDeIdiomaRegistrada => {
        const desconocido = (nota: string, motivo?: string): EvidenciaDeIdiomaRegistrada => {
          if (motivo) descartesDeUso.push({ herramientaId: h.herramientaId, capacidadId: "", idioma: cual, motivo, cita: (cita ?? "").trim() || undefined, urlCitada: (url ?? "").trim() || undefined });
          return { estado: "desconocido", fuentes: fuentesConsultadas(), nota };
        };
        if (!h.idioma) return desconocido("El modelo no llegó a responder por el idioma.", "idioma sin respuesta");
        if (!lista?.length) return desconocido(h.idioma.nota?.trim() || "Las páginas oficiales consultadas no lo dicen.");
        const codigos = [...new Set(lista.map((c) => String(c).trim().toLowerCase()))];
        if (codigos.some((c) => !/^[a-z]{2}$/.test(c))) return desconocido(`Se afirmaron idiomas que no son códigos: ${codigos.join(", ")}.`, "idioma con códigos inválidos");
        const f = fuenteAfirmada(url, cita, () => undefined);
        if ("motivo" in f) return desconocido(`Se afirmaron idiomas sin una cita que valga: ${f.motivo}.`, `idioma: ${f.motivo}`);
        return { estado: "verificado", idiomas: codigos, fuentes: [f.fuente] };
      };
      idiomas.push({
        herramientaId: h.herramientaId,
        interfaz: parte("interfaz", h.idioma?.interfaz, h.idioma?.interfazUrlFuente, h.idioma?.interfazCita),
        soporte: parte("soporte", h.idioma?.soporte, h.idioma?.soporteUrlFuente, h.idioma?.soporteCita),
        proximaRevision: proximaRevision(h.fechaConsulta, false),
      });
    }
  }

  const verificados = registros.filter((r) => r.estado === "verificado" && r.profundidad !== "no_disponible").length;
  const noDisponibles = registros.filter((r) => r.profundidad === "no_disponible").length;

  return {
    registros,
    descartes,
    descartesDeUso,
    recorridos,
    idiomas,
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
