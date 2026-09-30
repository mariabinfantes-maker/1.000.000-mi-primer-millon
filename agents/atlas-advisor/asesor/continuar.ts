import { getNecesidad, getNecesidades, type Importancia, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getDimensiones } from "@/data/vocabulario/asesor";
import { conLaRespuesta } from "./caso";
import type { LectorDeTexto } from "./entender";

/**
 * SEGUIR LA CONVERSACIÓN SIN EMPEZAR DE CERO.
 *
 * Propietaria, 2026-09-30: «cada nuevo mensaje del usuario debe interpretarse
 * dentro del caso que Molnip ya conoce, no como una consulta nueva».
 *
 * Antes la caja de abajo mandaba sólo la frase nueva. El servidor la leía como
 * una consulta desde cero y su respuesta sustituía entera a la anterior: a una
 * clínica dental que tenía «empezaría por Koibox» y escribía «Vale, pero yo
 * necesito también WhatsApp» se le vaciaba la pantalla —«He entendido que
 * necesitas .» y «No tengo nada que proponerte»— porque «también WhatsApp»,
 * sin lo anterior, no se puede entender.
 *
 * LA FORMA DEL CASO. No se concatenan mensajes ni se manda el historial al
 * motor. Se guarda un estado con tres piezas, y el caso que ve el motor se
 * CALCULA cada vez a partir de ellas:
 *
 *  - `necesidades`: lo que ella contó, con su palabra o eligiéndolo.
 *  - `respuestas`: lo que contestó a nuestras preguntas, UNA por pregunta.
 *  - `circunstancias`: datos sueltos de su negocio, que se guardan y hoy no
 *    usa el motor.
 *
 * Por qué las respuestas van aparte y no mezcladas con las necesidades: antes
 * «el paciente elige profesional» se convertía en «tener la agenda bajo
 * control» y se perdía de qué respuesta venía. Así no se podía corregir: con
 * «no, las citas las asignamos nosotros» habría que adivinar si la agenda la
 * trajo la respuesta o la había contado ella. Guardando la respuesta,
 * cambiarla deshace exactamente lo que ella trajo y nada más.
 *
 * Nada de esto toca cómo decide el motor: `aconsejar` recibe el mismo tipo de
 * caso que siempre.
 */

export type EstadoDelCaso = {
  necesidades: { id: string; importancia: Importancia }[];
  respuestas: { dimensionId: string; respuestaId: string }[];
  circunstancias: string[];
};

export const ESTADO_VACIO: EstadoDelCaso = { necesidades: [], respuestas: [], circunstancias: [] };

/** El estado de partida desde un caso ya entendido: lo que salió de una pregunta no es suyo. */
export function estadoDesde(delCaso: readonly NecesidadDelCaso[], circunstancias: readonly string[] = []): EstadoDelCaso {
  return {
    necesidades: delCaso
      .filter((n) => !n.salioDeUnaPregunta)
      .map((n) => ({ id: n.necesidad.id, importancia: n.importancia })),
    respuestas: [],
    circunstancias: [...circunstancias],
  };
}

/**
 * Un estado que llega del navegador no se cree: se limpia. Ids que no existen
 * se caen, lo repetido se quita y cada pregunta conserva una sola respuesta,
 * la última.
 */
export function estadoLimpio(crudo: unknown): EstadoDelCaso {
  const e = (crudo ?? {}) as Partial<EstadoDelCaso>;
  const vistas = new Set<string>();
  const necesidades: EstadoDelCaso["necesidades"] = [];
  for (const n of Array.isArray(e.necesidades) ? e.necesidades : []) {
    if (!n || typeof n.id !== "string" || vistas.has(n.id) || !getNecesidad(n.id)) continue;
    vistas.add(n.id);
    necesidades.push({ id: n.id, importancia: n.importancia === "deseable" ? "deseable" : "imprescindible" });
  }
  let respuestas: EstadoDelCaso["respuestas"] = [];
  for (const r of Array.isArray(e.respuestas) ? e.respuestas : []) {
    if (!r || typeof r.dimensionId !== "string" || typeof r.respuestaId !== "string") continue;
    if (!respuestaDe(r.dimensionId, r.respuestaId)) continue;
    respuestas = [...respuestas.filter((x) => x.dimensionId !== r.dimensionId), { dimensionId: r.dimensionId, respuestaId: r.respuestaId }];
  }
  const circunstancias = (Array.isArray(e.circunstancias) ? e.circunstancias : [])
    .filter((c): c is string => typeof c === "string" && c.trim() !== "")
    .slice(0, 12);
  return { necesidades, respuestas, circunstancias };
}

function respuestaDe(dimensionId: string, respuestaId: string) {
  return getDimensiones()
    .find((d) => d.id === dimensionId)
    ?.respuestas.find((r) => r.id === respuestaId);
}

/**
 * EL CASO QUE VE EL MOTOR, calculado. Lo que ella contó y, encima, lo que trae
 * cada respuesta, con la misma función que usaban los botones.
 */
export function casoDe(estado: EstadoDelCaso): NecesidadDelCaso[] {
  let caso: NecesidadDelCaso[] = estado.necesidades
    .map((n) => {
      const necesidad = getNecesidad(n.id);
      return necesidad ? { necesidad, importancia: n.importancia } : undefined;
    })
    .filter((n): n is NecesidadDelCaso => Boolean(n));
  for (const r of estado.respuestas) caso = conLaRespuesta(caso, r);
  return caso;
}

/** Una respuesta nueva sustituye a la anterior de la MISMA pregunta. Nunca se acumulan dos. */
export function conUnaRespuesta(estado: EstadoDelCaso, r: { dimensionId: string; respuestaId: string }): EstadoDelCaso {
  if (!respuestaDe(r.dimensionId, r.respuestaId)) return estado;
  return {
    ...estado,
    respuestas: [...estado.respuestas.filter((x) => x.dimensionId !== r.dimensionId), { dimensionId: r.dimensionId, respuestaId: r.respuestaId }],
  };
}

/** Las preguntas que ya no se hacen: las que tienen respuesta. */
export function preguntasContestadas(estado: EstadoDelCaso): string[] {
  return estado.respuestas.map((r) => r.dimensionId);
}

/** Lo que contestó por última vez, con sus palabras. «Te explico» no cuenta: no dice nada del negocio. */
export function ultimaRespuestaDicha(estado: EstadoDelCaso): string | null {
  for (let i = estado.respuestas.length - 1; i >= 0; i--) {
    const r = respuestaDe(estado.respuestas[i].dimensionId, estado.respuestas[i].respuestaId);
    if (r && !r.loCuentaElla) return r.texto;
  }
  return null;
}

// --- Leer el mensaje nuevo dentro del caso ---------------------------------

export type Cambios = {
  anadidas: string[];
  quitadas: string[];
  respuestas: { dimensionId: string; respuestaId: string; antes?: string }[];
};

export type Continuacion = {
  estado: EstadoDelCaso;
  cambios: Cambios;
  /** Lo que no se ha podido interpretar con seguridad. Nunca vacía el caso. */
  noEntendido: string[];
};

export function hayCambios(c: Cambios): boolean {
  return c.anadidas.length + c.quitadas.length + c.respuestas.length > 0;
}

export function construirPromptDeContinuacion(texto: string, estado: EstadoDelCaso, preguntaAbierta?: string): string {
  const caso = casoDe(estado);
  const suyas = caso.filter((n) => !n.salioDeUnaPregunta).map((n) => `[${n.necesidad.id}] ${n.necesidad.titulo}`);
  const contestadas = estado.respuestas
    .map((r) => {
      const d = getDimensiones().find((x) => x.id === r.dimensionId);
      const resp = d?.respuestas.find((x) => x.id === r.respuestaId);
      return d && resp && !resp.loCuentaElla ? `[${d.id}] «${d.pregunta}» → [${resp.id}] «${resp.texto}»` : undefined;
    })
    .filter(Boolean);
  const abierta = preguntaAbierta ? getDimensiones().find((d) => d.id === preguntaAbierta) : undefined;
  const catalogo = getNecesidades()
    .map((n) => `[${n.id}] ${n.titulo} — lo dice así: ${n.loQueDice.join(" / ")}`)
    .join("\n");
  const preguntas = getDimensiones()
    .map((d) => `[${d.id}] «${d.pregunta}» — respuestas: ${d.respuestas.filter((r) => !r.loCuentaElla).map((r) => `[${r.id}] «${r.texto}»`).join(" / ")}`)
    .join("\n");

  return `Eres la parte de Molnip que ESCUCHA. No recomiendas nada y no nombras ninguna herramienta.

Estás en mitad de una conversación. Esto es lo que YA sabes de su negocio:

Necesidades que ha contado:
${suyas.length ? suyas.map((s) => `- ${s}`).join("\n") : "- (ninguna)"}

Preguntas que ya ha contestado:
${contestadas.length ? contestadas.map((s) => `- ${s}`).join("\n") : "- (ninguna)"}
${abierta ? `\nAcaba de decir que te va a explicar esto con sus palabras: «${abierta.pregunta}» [${abierta.id}]. Si su mensaje lo contesta, devuelve la respuesta de esa pregunta que le corresponda.\n` : ""}
Ahora escribe esto:

"""
${texto}
"""

Tu trabajo: decir SÓLO qué aporta o cambia este mensaje nuevo respecto a lo que ya sabes. Lo que ya sabes se conserva solo; no lo repitas.

Necesidades posibles (lista cerrada):
${catalogo}

Preguntas posibles y sus respuestas (lista cerrada):
${preguntas}

Devuelve SÓLO este JSON, sin nada alrededor:
{"anade":[{"id":"<id de necesidad>","porQue":"la parte de SU mensaje que lo dice"}],
 "quita":[{"id":"<id de una necesidad que YA ha contado>","porQue":"la parte de SU mensaje donde dice que no la necesita"}],
 "respuestas":[{"dimensionId":"<id de pregunta>","respuestaId":"<id de respuesta>","porQue":"la parte de SU mensaje que lo dice"}],
 "noEntendido":["partes de su mensaje que no sabes convertir en nada de las listas"],
 "circunstancias":["datos nuevos de su negocio: oficio, cuánta gente, dónde..."]}

REGLAS QUE MANDAN:
- "porQue" es un trozo LITERAL de su mensaje. Si no puedes citarlo, no lo incluyas.
- Si corrige algo que contestó antes («no, en realidad...»), devuelve la respuesta NUEVA de esa misma pregunta.
- "quita" sólo si dice claramente que ya no necesita algo que había contado. Nunca lo deduzcas.
- No le atribuyas nada que no diga este mensaje. Si dudas, va a "noEntendido": es un resultado válido.
- No inventes ids. No escribas consejos ni nombres de productos.`;
}

/** Para comprobar que la cita es suya: sin tildes, sin mayúsculas y sin signos. */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function esCitaSuya(porQue: unknown, texto: string): boolean {
  if (typeof porQue !== "string") return false;
  const cita = normalizar(porQue);
  return cita.length > 0 && normalizar(texto).includes(cita);
}

/**
 * Convierte la lectura cruda en cambios sobre el estado, tirando lo que no se
 * sostenga. «Suficiente seguridad» se mide así: cada cambio trae un trozo
 * literal de su mensaje, y los ids existen. Lo que no cumple, no cambia nada.
 */
export function leerContinuacion(
  texto: string,
  cruda: unknown,
  estado: EstadoDelCaso,
  preguntaAbierta?: string
): Continuacion {
  const d = (cruda ?? {}) as {
    anade?: { id?: string; porQue?: string }[];
    quita?: { id?: string; porQue?: string }[];
    respuestas?: { dimensionId?: string; respuestaId?: string; porQue?: string }[];
    noEntendido?: unknown[];
    circunstancias?: unknown[];
  };
  let nuevo: EstadoDelCaso = {
    necesidades: [...estado.necesidades],
    respuestas: [...estado.respuestas],
    circunstancias: [...estado.circunstancias],
  };
  const cambios: Cambios = { anadidas: [], quitadas: [], respuestas: [] };
  const noEntendido: string[] = (Array.isArray(d.noEntendido) ? d.noEntendido : [])
    .filter((s): s is string => typeof s === "string" && s.trim() !== "")
    .slice(0, 4);

  // Respuestas primero: corregir una respuesta puede quitar lo que trajo.
  for (const r of Array.isArray(d.respuestas) ? d.respuestas : []) {
    if (!r?.dimensionId || !r.respuestaId || !esCitaSuya(r.porQue, texto)) continue;
    const resp = respuestaDe(r.dimensionId, r.respuestaId);
    if (!resp || resp.loCuentaElla) continue;
    const antes = nuevo.respuestas.find((x) => x.dimensionId === r.dimensionId)?.respuestaId;
    if (antes === r.respuestaId) continue;
    nuevo = conUnaRespuesta(nuevo, { dimensionId: r.dimensionId, respuestaId: r.respuestaId });
    cambios.respuestas.push({ dimensionId: r.dimensionId, respuestaId: r.respuestaId, ...(antes ? { antes } : {}) });
  }

  const enElCaso = () => new Set(casoDe(nuevo).map((n) => n.necesidad.id));
  for (const n of Array.isArray(d.anade) ? d.anade : []) {
    if (!n?.id || !getNecesidad(n.id) || !esCitaSuya(n.porQue, texto) || enElCaso().has(n.id)) continue;
    // Lo que ella cuenta entra como imprescindible: la misma regla que al principio.
    nuevo = { ...nuevo, necesidades: [...nuevo.necesidades, { id: n.id, importancia: "imprescindible" }] };
    cambios.anadidas.push(n.id);
  }

  for (const n of Array.isArray(d.quita) ? d.quita : []) {
    if (!n?.id || !esCitaSuya(n.porQue, texto)) continue;
    if (!nuevo.necesidades.some((x) => x.id === n.id)) {
      // Pide quitar algo que no contó ella —lo trajo una respuesta— o que no
      // está. No se adivina: se le dice y el caso queda igual.
      if (typeof n.porQue === "string") noEntendido.push(n.porQue);
      continue;
    }
    nuevo = { ...nuevo, necesidades: nuevo.necesidades.filter((x) => x.id !== n.id) };
    cambios.quitadas.push(n.id);
  }

  // «Te explico cómo lo hacemos» y luego lo explica: si su texto no contesta
  // la pregunta, la pregunta queda contestada con «te lo explico», para no
  // volver a hacérsela, y lo que no se entendió se le dice.
  if (preguntaAbierta && !nuevo.respuestas.some((x) => x.dimensionId === preguntaAbierta)) {
    const teExplico = getDimensiones().find((x) => x.id === preguntaAbierta)?.respuestas.find((r) => r.loCuentaElla);
    if (teExplico) nuevo = conUnaRespuesta(nuevo, { dimensionId: preguntaAbierta, respuestaId: teExplico.id });
  }

  const circunstancias = (Array.isArray(d.circunstancias) ? d.circunstancias : [])
    .filter((s): s is string => typeof s === "string" && s.trim() !== "" && !nuevo.circunstancias.includes(s))
    .slice(0, 4);
  nuevo = { ...nuevo, circunstancias: [...nuevo.circunstancias, ...circunstancias].slice(0, 12) };

  // Nada que cambie el caso y nada señalado: el mensaje entero queda sin
  // entender. Callarlo sería fingir que se ha tenido en cuenta.
  if (!hayCambios(cambios) && noEntendido.length === 0) noEntendido.push(texto);

  return { estado: nuevo, cambios, noEntendido: [...new Set(noEntendido)] };
}

export async function continuar(
  texto: string,
  estado: EstadoDelCaso,
  leer: LectorDeTexto,
  preguntaAbierta?: string
): Promise<Continuacion> {
  const cruda = await leer(construirPromptDeContinuacion(texto, estado, preguntaAbierta)).catch(() => ({}));
  return leerContinuacion(texto, cruda, estado, preguntaAbierta);
}

/**
 * Lo que Molnip le dice de lo que ha cambiado, con sus palabras y sin jerga.
 * Vive aquí porque nombrar una necesidad o una pregunta es leer el vocabulario.
 */
export function describirCambios(c: Cambios): string[] {
  const titulo = (id: string) => getNecesidad(id)?.titulo.toLowerCase() ?? id;
  const lineas: string[] = [];
  if (c.anadidas.length) lineas.push(`Añado ${c.anadidas.map((id) => `«${titulo(id)}»`).join(" y ")}.`);
  for (const r of c.respuestas) {
    const d = getDimensiones().find((x) => x.id === r.dimensionId);
    const nueva = d?.respuestas.find((x) => x.id === r.respuestaId)?.texto;
    const vieja = r.antes ? d?.respuestas.find((x) => x.id === r.antes) : undefined;
    if (!nueva) continue;
    lineas.push(
      vieja && !vieja.loCuentaElla
        ? `Cambio lo que me dijiste: ahora «${nueva.toLowerCase()}», en vez de «${vieja.texto.toLowerCase()}».`
        : `Apunto que ${nueva.charAt(0).toLowerCase() + nueva.slice(1)}.`
    );
  }
  if (c.quitadas.length) lineas.push(`Quito ${c.quitadas.map((id) => `«${titulo(id)}»`).join(" y ")}.`);
  return lineas;
}
