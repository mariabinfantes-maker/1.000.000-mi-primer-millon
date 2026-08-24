import type { Problema } from "@/data/esquema";
import { contieneTexto } from "./utilidades";

/** Menos de esto no cuenta como señal — un texto sin ninguna palabra clave reconocida no debe forzar ningún objetivo. */
const MINIMO_COINCIDENCIAS = 1;

/**
 * Detecta a qué objetivo(s) del catálogo (`Problema.id`) corresponde un
 * texto libre, comparando frase a frase contra las palabras clave
 * editoriales de cada `Problema` (`Problema.palabrasClave`).
 *
 * Es la contraparte de la puerta "por objetivo" (donde el usuario elige el
 * `Problema` explícitamente) para la puerta "Cuéntanoslo": mismo mecanismo
 * de filtrado en `motor.ts` (`problemaIdsCandidatos`), pero la intención se
 * infiere del texto en vez de venir dada. Coincidencia por subcadena
 * literal contra una lista editorial curada — nunca semántica ni
 * probabilística — así que es determinista y fácil de auditar: mismo texto,
 * mismo resultado siempre.
 *
 * Puede devolver varios ids si empatan al mayor número de coincidencias (el
 * texto toca más de un objetivo con la misma fuerza): el motor evalúa la
 * unión de herramientas de todos ellos, más amplio que uno solo pero mucho
 * más acotado que el catálogo completo. Devuelve un array vacío cuando
 * ninguna palabra clave aparece en el texto — nunca fuerza una relación que
 * no está en los datos editoriales.
 */
export function detectarProblemasPorTexto(texto: string, problemas: Problema[]): string[] {
  if (!texto.trim()) return [];

  const puntuaciones = problemas.map((problema) => ({
    problemaId: problema.id,
    coincidencias: (problema.palabrasClave ?? []).filter((clave) => contieneTexto(texto, clave)).length,
  }));

  const maximo = Math.max(...puntuaciones.map((p) => p.coincidencias));
  if (maximo < MINIMO_COINCIDENCIAS) return [];

  return puntuaciones.filter((p) => p.coincidencias === maximo).map((p) => p.problemaId);
}
