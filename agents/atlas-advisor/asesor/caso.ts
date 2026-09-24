import { getNecesidad, getNecesidades, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";

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
