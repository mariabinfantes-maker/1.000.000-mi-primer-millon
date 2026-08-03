import type { HerramientaEvaluada } from "@/agents/atlas-advisor";

/**
 * Puente entre el cuestionario y la pantalla de resultados a través de
 * `sessionStorage`, para no repetir la llamada a la API al navegar. Vive
 * fuera de `agents/atlas-advisor/` a propósito: es un detalle del
 * navegador, no del motor.
 *
 * `clave` identifica de forma única el origen del diagnóstico (ver
 * `lib/origenDiagnostico.ts` → `claveOrigen`) — ya no es solo un
 * `problemaId`: las puertas de categoría y texto libre usan el mismo
 * puente con su propia clave.
 */
export function claveResultadosGuardados(clave: string): string {
  return `atlas:resultados:${clave}`;
}

export function guardarResultados(clave: string, top: HerramientaEvaluada[]): void {
  try {
    sessionStorage.setItem(claveResultadosGuardados(clave), JSON.stringify(top));
  } catch {
    // sessionStorage no disponible (modo privado, etc.): la pantalla de
    // resultados mostrará su propio fallback si no encuentra nada guardado.
  }
}

/** Devuelve el top guardado, o `null` si no hay nada guardado o sessionStorage no está disponible (modo privado, etc.). */
export function leerResultadosGuardados(clave: string): HerramientaEvaluada[] | null {
  try {
    const guardado = sessionStorage.getItem(claveResultadosGuardados(clave));
    return guardado ? (JSON.parse(guardado) as HerramientaEvaluada[]) : null;
  } catch {
    return null;
  }
}
