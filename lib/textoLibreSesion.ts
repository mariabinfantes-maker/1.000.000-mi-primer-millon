const CLAVE = "atlas:texto-libre";

/**
 * Puente entre la puerta "Cuéntanoslo" (texto libre) del selector de
 * entrada y `/libre/cuestionario` a través de `sessionStorage`, para no
 * pasar el texto por la URL. Mismo patrón que `lib/resultadosSesion.ts`.
 */
export function guardarTextoLibre(texto: string): void {
  try {
    sessionStorage.setItem(CLAVE, texto);
  } catch {
    // sessionStorage no disponible (modo privado, etc.): /libre/cuestionario
    // mostrará su propio fallback si no encuentra nada guardado.
  }
}

export function leerTextoLibre(): string | null {
  try {
    return sessionStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}
