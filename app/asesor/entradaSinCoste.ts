/**
 * QUÉ ENTRADA SIN COSTE TIENE, DICHA COMO LO QUE ES.
 *
 * Decisión de la propietaria (2026-09-17), reafirmada el 2026-10-06: una
 * prueba gratuita cuenta como «plan gratuito» para el asesor. No es una
 * confusión: un plan gratuito para siempre puede ser tan limitado que no deja
 * comprobar si la herramienta sirve, y una prueba de 15 o 30 días de un plan
 * completo sí. Las dos quitan el riesgo de empezar, y por eso las dos
 * cuentan como lo mismo en el desempate.
 *
 * Lo que estaba mal era decirlas igual. Hasta el 2026-10-06 la tarjeta ponía
 * «Tiene plan gratuito» también cuando era una prueba de 7 días: en 1.231 de
 * los 1.891 casos salía alguna así. Sus palabras: Molnip «nunca debe ocultar
 * cuál de los dos es».
 *
 * Esto NO decide nada: el motor sigue usando `tienePlanGratuito` igual que
 * antes. Sólo cambia cómo se dice.
 *
 * Sin tipo anotado se dice «Plan gratuito», como hasta ahora. No se deduce
 * que sea indefinido aunque lo parezca: Koibox publica «Plan Free: 0 €/mes» y
 * aun así su ficha no lo dice, y no se escribe lo que la fuente no demuestra.
 *
 * Cliniko queda pendiente: su gratuidad es sólo para entidades benéficas y
 * centros educativos, una tercera clase que el esquema todavía no tiene.
 */

export type EntradaSinCoste = {
  tienePlanGratuito?: boolean;
  tipoPlanGratuito?: "indefinido" | "prueba";
  pruebaGratuitaDias?: number;
};

/** «Plan gratuito», «Prueba gratuita de 7 días» o «Prueba gratuita». `null` si no tiene. */
export function comoSeDiceLaEntrada(c: EntradaSinCoste): string | null {
  if (!c.tienePlanGratuito) return null;
  if (c.tipoPlanGratuito === "prueba") {
    return c.pruebaGratuitaDias ? `Prueba gratuita de ${c.pruebaGratuitaDias} días` : "Prueba gratuita";
  }
  return "Plan gratuito";
}

/** Lo mismo en minúscula, para seguir una frase: «y prueba gratuita de 7 días». */
export function comoSeDiceLaEntradaEnFrase(c: EntradaSinCoste): string | null {
  const t = comoSeDiceLaEntrada(c);
  return t ? t[0].toLowerCase() + t.slice(1) : null;
}
