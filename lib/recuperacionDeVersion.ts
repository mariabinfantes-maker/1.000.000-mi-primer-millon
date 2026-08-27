/**
 * Recuperación ante una versión desactualizada en el navegador.
 *
 * El problema real, vivido en molnip.com el 2026-08-27: el navegador tenía
 * guardado el HTML de un despliegue anterior. Como los archivos de
 * JavaScript llevan un hash en el nombre, ese HTML pedía archivos que ya no
 * existían. La página se pintaba entera y ningún enlace funcionaba, sin un
 * solo error visible — los enlaces de Next interceptan la pulsación y luego
 * no pueden completar la navegación.
 *
 * La causa de raíz está corregida en `next.config.ts` (el HTML ya revalida
 * siempre). Esto es la red de seguridad para lo que se escape: un CDN
 * intermedio, un proxy corporativo, una pestaña abierta durante el
 * despliegue.
 *
 * Este módulo es lógica pura, sin `window` ni React, para poder probarlo
 * de verdad. Quien lo conecta al navegador es
 * `components/RecuperacionDeVersion.tsx`.
 *
 * Reglas, todas obligatorias:
 *  - solo actúa ante fallos CONFIRMADOS de carga de JavaScript de la propia
 *    aplicación; jamás ante errores de API, validación, red o del código;
 *  - una sola recarga automática por sesión del navegador, sin excepción;
 *  - si no se puede recordar que ya se recargó, NO se recarga — antes un
 *    aviso que un bucle;
 *  - si la recarga no lo arregla, se avisa a la persona con un botón para
 *    actualizar a mano.
 */

/** Marca en `sessionStorage` de que esta sesión ya gastó su recarga automática. */
export const CLAVE_RECARGA = "molnip:recarga-de-version";

/** Prefijo de los archivos que genera Next con hash en el nombre. Solo estos cuentan. */
const PREFIJO_ESTATICO = "/_next/static/";

/**
 * Mensajes con los que los navegadores comunican que un módulo de
 * JavaScript no se pudo cargar. Cada motor lo redacta a su manera, así que
 * hay que reconocer las tres familias.
 */
const MENSAJES_DE_CARGA_FALLIDA = [
  "loading chunk",
  "chunkloaderror",
  "failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "importing a module script failed",
  "'text/html' is not a valid javascript mime type",
];

/** Lo que hay que hacer ante un evento. */
export type Recuperacion =
  /** No tiene nada que ver con la versión: no se toca nada. */
  | "ignorar"
  /** Fallo de versión confirmado y queda la recarga de esta sesión: recargar. */
  | "recargar"
  /** Fallo de versión confirmado pero ya se recargó (o no se puede recordar): avisar a la persona. */
  | "avisar";

type ElementoConFuente = { tagName?: string; src?: string; href?: string };

/**
 * ¿Es este evento un fallo de carga de un archivo de JavaScript de la
 * propia aplicación?
 *
 * Dos formas de llegar, según cómo falle:
 *  - un `<script>` del documento que no se pudo descargar — llega como
 *    evento `error` con el elemento como objetivo;
 *  - un `import()` dinámico que no resolvió — llega como promesa
 *    rechazada, que es la forma habitual al navegar entre páginas.
 */
export function esFalloDeVersion(entrada: {
  objetivo?: ElementoConFuente | null;
  mensaje?: string;
  nombreDelError?: string;
}): boolean {
  const { objetivo, mensaje, nombreDelError } = entrada;

  // 1) Un recurso del documento que no cargó.
  if (objetivo && (objetivo.tagName === "SCRIPT" || objetivo.tagName === "LINK")) {
    const fuente = objetivo.src ?? objetivo.href ?? "";
    if (fuente.includes(PREFIJO_ESTATICO)) return true;
  }

  // 2) Un módulo que no se pudo importar.
  if (nombreDelError === "ChunkLoadError") return true;

  const texto = (mensaje ?? "").toLowerCase();
  if (texto.length === 0) return false;
  return MENSAJES_DE_CARGA_FALLIDA.some((frase) => texto.includes(frase));
}

/**
 * Qué hacer, sabiendo ya que el fallo es de versión.
 *
 * `yaSeRecargo` viene de `sessionStorage`; `sePuedeRecordar` es false
 * cuando ese almacén no está disponible (modo privado restringido, ajustes
 * del navegador). Sin memoria no se recarga: un bucle de recargas es peor
 * que un aviso.
 */
export function decidirRecuperacion(estado: { yaSeRecargo: boolean; sePuedeRecordar: boolean }): Recuperacion {
  if (!estado.sePuedeRecordar) return "avisar";
  return estado.yaSeRecargo ? "avisar" : "recargar";
}

/**
 * Punto de entrada: decide qué hacer ante un evento cualquiera.
 * Devuelve "ignorar" para todo lo que no sea, con certeza, un fallo de
 * versión — errores de API, de validación, de red o del propio código
 * incluidos.
 */
export function evaluarEvento(
  entrada: Parameters<typeof esFalloDeVersion>[0],
  estado: Parameters<typeof decidirRecuperacion>[0]
): Recuperacion {
  if (!esFalloDeVersion(entrada)) return "ignorar";
  return decidirRecuperacion(estado);
}

/**
 * Lo único que se registra. Texto fijo, sin URL, sin identificadores, sin
 * datos de la persona y sin nada de su formulario: un contador de que pasó,
 * no un rastro de quién.
 */
export const MENSAJE_REGISTRO = {
  recargar: "[molnip] Versión desactualizada en el navegador: se recarga una vez.",
  avisar: "[molnip] Versión desactualizada y la recarga no lo resolvió: se avisa a la persona.",
} as const;
