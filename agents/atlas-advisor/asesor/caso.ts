import { getNecesidad, getNecesidades, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getDimensiones } from "@/data/vocabulario/asesor";

/**
 * Lo que el asesor deja ver del vocabulario hacia fuera.
 *
 * Nadie más traduce un id de necesidad: si esto viviera en la ruta de la API,
 * el vocabulario tendría dos lectores y la guarda dejaría de significar algo.
 */

export type CasoDeUnaPersona = readonly NecesidadDelCaso[];

/** Lo que ella puede elegir cuando no hay IA que lea su texto. */
export function necesidadesQueSePuedenElegir(): { id: string; titulo: string; loQueDice: string[] }[] {
  return getNecesidades().map((n) => ({ id: n.id, titulo: n.titulo, loQueDice: n.loQueDice }));
}

/**
 * De una lista de ids a necesidades del caso. Todo lo que ella elige entra
 * como imprescindible: lo trajo ella. Los ids que no existan se tiran.
 */
export function necesidadesDeLaLista(ids: readonly string[]): NecesidadDelCaso[] {
  return ids
    .map((id) => getNecesidad(id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .map((necesidad) => ({ necesidad, importancia: "imprescindible" as const }));
}

/**
 * LO QUE TRAE UNA RESPUESTA, aplicado sobre lo que ya se sabía.
 *
 * Es lo que convierte la pregunta en conversación. Antes la pregunta salía en
 * pantalla y contestarla no movía nada, porque ninguna respuesta decía qué
 * significaba. Propietaria, 2026-09-25: «al responder, Molnip continúa desde
 * ahí».
 *
 * Una respuesta que no trae nada —«lo asignamos nosotros»— no añade nada, y
 * eso también es una respuesta: se sigue con lo que ella contó. No se deduce
 * lo contrario, que es el error que ella corrigió el mismo día.
 *
 * Vive aquí y no en la ruta porque el vocabulario sólo lo lee el asesor: la
 * ruta pide y recibe, no interpreta.
 */
export function conLaRespuesta(
  delCaso: readonly NecesidadDelCaso[],
  respondida?: { dimensionId?: string; respuestaId?: string }
): NecesidadDelCaso[] {
  if (!respondida?.dimensionId || !respondida.respuestaId) return [...delCaso];
  const dimension = getDimensiones().find((d) => d.id === respondida.dimensionId);
  const respuesta = dimension?.respuestas.find((r) => r.id === respondida.respuestaId);
  if (!respuesta?.traeNecesidades?.length) return [...delCaso];
  const ya = new Set(delCaso.map((n) => n.necesidad.id));
  const nuevas: NecesidadDelCaso[] = [];
  for (const trae of respuesta.traeNecesidades) {
    if (ya.has(trae.id)) continue;
    const necesidad = getNecesidad(trae.id);
    // Un id que ya no existe en el vocabulario se cae aquí, igual que en el
    // resto del asesor: no se inventa una necesidad para poder seguir.
    if (necesidad) nuevas.push({ necesidad, importancia: trae.importancia, salioDeUnaPregunta: true });
  }
  return [...delCaso, ...nuevas];
}
