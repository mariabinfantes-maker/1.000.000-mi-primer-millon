import type { ComprobacionDeIdioma, Herramienta } from "@/data/esquema";

/**
 * ¿ESTÁ EN ESPAÑOL? TRES RESPUESTAS, NO DOS.
 *
 * Hasta hoy el asesor preguntaba esto con un booleano, y un booleano sólo sabe
 * contestar «sí» o «no». Así que `undefined` —«no lo hemos mirado»— se
 * comportaba EXACTAMENTE igual que «no lo tiene»: el desempate hacía
 * `filter(p => p.coste.enEspanol)` y las dejaba fuera a las dos. Koibox, cuyo
 * propio soporte enseña el selector con «Español […] Inglés […] Português
 * […] Italiano […] Francés», caía en el paso 2 de 5 por no tener el campo
 * puesto. Se midió el 2026-09-30: también Square Appointments, TIMIFY, Booksy
 * y Schedulista.
 *
 * La regla, dicha por la propietaria ese mismo día:
 *
 *   «Un dato desconocido no puede convertirse en "no". Si el español es
 *    imprescindible para esa persona, una candidata sin confirmar tampoco
 *    debe presentarse como si ya cumpliera.»
 *
 * Son las dos mitades de la misma frase y hay que cumplir las dos: sin
 * confirmar NO elimina, y sin confirmar TAMPOCO pasa por confirmada. Por eso
 * son tres estados y no dos, y por eso el estado viaja hasta la pantalla en
 * vez de resolverse aquí en un sí/no.
 *
 * Y son dos pantallas, no una: el panel de gestión —donde trabaja quien
 * contrata— y la página donde reservan sus clientes. Ninguna se deduce de la
 * otra. Schedulista tiene el panel en inglés y la página de reservas en
 * español; decir de ella «está en español» o «no está en español» es mentir
 * en las dos direcciones.
 */
export type EstadoDelEspanol = "confirmado" | "no_disponible" | "sin_confirmar";

/**
 * De mejor a peor PARA QUIEN PREGUNTA, que no es lo mismo que de mejor a peor
 * herramienta —«no somos jueces»—. Se usa para ordenar, nunca para descartar:
 * ninguna candidata sale de la lista por su idioma.
 */
export const ORDEN_DEL_ESPANOL: Record<EstadoDelEspanol, number> = {
  confirmado: 0,
  sin_confirmar: 1,
  no_disponible: 2,
};

function deLaComprobacion(c: ComprobacionDeIdioma | undefined): EstadoDelEspanol | undefined {
  if (!c) return undefined;
  return c.hayEspanol ? "confirmado" : "no_disponible";
}

/**
 * EL PANEL DE GESTIÓN.
 *
 * Primero el recibo partido, si lo hay. Si no, el booleano de siempre, que
 * para 70 de las 90 fichas es lo único que existe y sigue siendo válido: lo
 * que se corrige no es ese dato, es haber tratado su ausencia como un «no».
 */
export function espanolDelPanel(h: Herramienta | undefined): EstadoDelEspanol {
  if (!h) return "sin_confirmar";
  const conRecibo = deLaComprobacion(h.idiomaComprobado?.panel);
  if (conRecibo) return conRecibo;
  if (h.disponibleEnEspanol === true) return "confirmado";
  if (h.disponibleEnEspanol === false) return "no_disponible";
  return "sin_confirmar";
}

/**
 * LA PÁGINA QUE VE EL CLIENTE.
 *
 * Aquí NO hay respaldo que valga: o hay recibo propio, o está sin confirmar.
 * Heredarlo del panel sería justo el error que este módulo existe para no
 * cometer. Hoy casi ninguna ficha lo tiene, y que salga «sin confirmar» es la
 * respuesta correcta, no un hueco que rellenar.
 */
export function espanolDeLaPaginaDeCliente(h: Herramienta | undefined): EstadoDelEspanol {
  if (!h) return "sin_confirmar";
  return deLaComprobacion(h.idiomaComprobado?.paginaDeCliente) ?? "sin_confirmar";
}

export type EspanolDeUnaHerramienta = {
  panel: EstadoDelEspanol;
  paginaDeCliente: EstadoDelEspanol;
};

export function espanolDe(h: Herramienta | undefined): EspanolDeUnaHerramienta {
  return { panel: espanolDelPanel(h), paginaDeCliente: espanolDeLaPaginaDeCliente(h) };
}

/**
 * Lo que hay que decirle a quien pregunta, o `undefined` cuando no hay nada
 * que advertir. Nunca dice «no la cojas»: dice qué sabemos y qué no, que es
 * lo único que nos consta.
 */
export function avisoDelEspanol(e: EspanolDeUnaHerramienta): string | undefined {
  if (e.panel === "no_disponible" && e.paginaDeCliente === "confirmado") {
    return "El programa de gestión, el que usarías tú, está en inglés; la página donde reservan tus clientes sí se puede poner en español.";
  }
  if (e.panel === "no_disponible") {
    return "Su programa de gestión no está en español: trabajarías en inglés.";
  }
  if (e.panel === "sin_confirmar") {
    return "No hemos confirmado que su programa de gestión esté en español. No quiere decir que no lo esté: quiere decir que no lo hemos podido comprobar.";
  }
  return undefined;
}
