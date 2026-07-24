import type { HerramientaEvaluada } from "@/lib/recommendationEngine";

/**
 * Puente entre el cuestionario y la pantalla de resultados a través de
 * `sessionStorage`, para no repetir la llamada a la API al navegar. Vive
 * fuera de `lib/recommendationEngine/` a propósito: es un detalle del
 * navegador, no del motor.
 */
export function claveResultadosGuardados(problemaId: string): string {
  return `atlas:resultados:${problemaId}`;
}

export function guardarResultados(problemaId: string, top: HerramientaEvaluada[]): void {
  try {
    sessionStorage.setItem(claveResultadosGuardados(problemaId), JSON.stringify(top));
  } catch {
    // sessionStorage no disponible (modo privado, etc.): la pantalla de
    // resultados mostrará su propio fallback si no encuentra nada guardado.
  }
}

/** Devuelve el top guardado, o `null` si no hay nada guardado o sessionStorage no está disponible (modo privado, etc.). */
export function leerResultadosGuardados(problemaId: string): HerramientaEvaluada[] | null {
  try {
    const guardado = sessionStorage.getItem(claveResultadosGuardados(problemaId));
    return guardado ? (JSON.parse(guardado) as HerramientaEvaluada[]) : null;
  } catch {
    return null;
  }
}
