/**
 * Las dos reglas que decide la pantalla de gestión antes de dejar guardar.
 *
 * Viven aquí, fuera del componente, porque son reglas de negocio y no de
 * presentación: si mañana se guarda un enlace desde el CLI o desde una
 * importación en bloque, deben aplicarse igual. Y sueltas se pueden probar,
 * que dentro de un componente sin DOM de prueba no.
 */

/**
 * Un enlace pegado a medias es el fallo más caro y más silencioso de todo
 * el panel: "ps://systeme.io/..." se guarda sin protestar, no lleva a
 * ninguna parte y no paga nada, y no hay forma de notarlo mirando la tabla.
 * Visto de verdad al pegar un enlace largo en producción.
 */
export function enlaceEsUsable(valor: string): boolean {
  const limpio = valor.trim();
  if (limpio.length === 0) return false;
  if (!/^https?:\/\/\S+$/i.test(limpio)) return false;
  try {
    const url = new URL(limpio);
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Una cuenta activa sin enlace no puede generar comisión — la misma regla
 * que `consistencia.ts` detecta a posteriori. Aquí se impide antes de
 * crearla: más vale no poder que tener que descubrirlo luego.
 */
export function puedeActivarse(enlace: string): boolean {
  return enlaceEsUsable(enlace);
}
