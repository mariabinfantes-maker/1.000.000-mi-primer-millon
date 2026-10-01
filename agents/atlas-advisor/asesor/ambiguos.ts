import { getNecesidad, getNecesidades } from "@/data/vocabulario/necesidades";

/**
 * PREGUNTAR «¿PARA QUÉ?» CUANDO UNA PALABRA SIGNIFICA VARIAS COSAS.
 *
 * Propietaria, 2026-09-30: «Molnip debe pedir aclaración cuando reconoce el
 * concepto pero no puede determinar para qué lo quiere el usuario. No quiero
 * que elija automáticamente la interpretación más probable y tampoco quiero
 * que trate estos casos como si no hubiera entendido nada.» Y: «debe ser un
 * comportamiento general para términos ambiguos que el sistema ya sabe
 * desambiguar, no un parche escrito específicamente para la palabra WhatsApp».
 *
 * Nació de «También necesito WhatsApp». En el vocabulario, WhatsApp aparece en
 * las frases de cuatro necesidades distintas —vender, comprar a proveedores,
 * hablar con el equipo y responder a quien escribe—, y el modelo, con razón,
 * no se atrevía a elegir una. Antes eso acababa en «no lo he entendido».
 *
 * CÓMO SE REPARTE EL TRABAJO, y por qué así:
 *
 *  - El MODELO sólo señala la palabra que no sabe a qué necesidad llevar, con
 *    una cita literal del mensaje. No propone opciones.
 *  - Las OPCIONES salen del VOCABULARIO: las necesidades cuyas frases
 *    (`loQueDice`) contienen esa palabra. Son, literalmente, «los significados
 *    que nuestro vocabulario ya reconoce». Si el vocabulario no conoce al menos
 *    dos, no hay nada que aclarar y el mensaje sigue su camino de siempre.
 *
 * Así no hay ninguna palabra escrita a mano: hoy salen WhatsApp (4
 * significados) y papel (5), y mañana saldrá la que el vocabulario aprenda.
 */

export type Aclaracion = {
  /** La palabra tal como la escribió ella. */
  termino: string;
  /** Lo que puede querer decir, según el vocabulario, en lenguaje natural. */
  opciones: { id: string; titulo: string }[];
};

/**
 * Más de seis significados ya no es una palabra ambigua: es una palabra
 * general, y una lista tan larga es el formulario otra vez.
 */
export const MAXIMO_DE_OPCIONES = 6;

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Palabra entera, no trozo: «IA» no puede encajar dentro de «diaria». */
function contiene(frase: string, termino: string): boolean {
  const t = normalizar(termino);
  return t.length > 0 && ` ${normalizar(frase)} `.includes(` ${t} `);
}

/** Los significados que el vocabulario reconoce para una palabra, quitando los que ya están en el caso. */
export function significadosDe(termino: string, yaEnElCaso: ReadonlySet<string> = new Set()): { id: string; titulo: string }[] {
  return getNecesidades()
    .filter((n) => !yaEnElCaso.has(n.id) && n.loQueDice.some((d) => contiene(d, termino)))
    .map((n) => ({ id: n.id, titulo: n.titulo }));
}

/**
 * De lo que el modelo señala como ambiguo, lo que se sostiene: la palabra está
 * en su mensaje, el vocabulario le reconoce entre dos y seis significados que
 * aún no están en el caso, y ninguno de ellos se ha añadido ya con este mismo
 * mensaje —si el modelo sí supo cuál era, no se pregunta—.
 */
export function aclaracionesDe(
  texto: string,
  crudas: unknown,
  yaEnElCaso: ReadonlySet<string>,
  anadidasAhora: ReadonlySet<string> = new Set()
): Aclaracion[] {
  const salida: Aclaracion[] = [];
  const vistos = new Set<string>();
  for (const a of Array.isArray(crudas) ? crudas : []) {
    const termino = (a as { termino?: unknown })?.termino;
    if (typeof termino !== "string" || !contiene(texto, termino)) continue;
    const clave = normalizar(termino);
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    const todos = significadosDe(termino);
    if (todos.some((o) => anadidasAhora.has(o.id))) continue;
    const opciones = todos.filter((o) => !yaEnElCaso.has(o.id));
    if (opciones.length < 2 || opciones.length > MAXIMO_DE_OPCIONES) continue;
    salida.push({ termino: termino.trim(), opciones });
  }
  return salida;
}

/** Quita de «no entendido» lo que ya se va a preguntar: no se dice «no lo entiendo» y a la vez «¿para qué?». */
export function sinLoQueSePregunta(noEntendido: string[], aclaraciones: Aclaracion[]): string[] {
  return noEntendido.filter((f) => !aclaraciones.some((a) => contiene(f, a.termino)));
}

/** ¿Es esta necesidad uno de los significados de esta palabra? Lo que llega del navegador se comprueba. */
export function esSignificadoDe(termino: string, necesidadId: string): boolean {
  return Boolean(getNecesidad(necesidadId)) && significadosDe(termino).some((o) => o.id === necesidadId);
}

/**
 * Lo que el modelo señaló como ambiguo y no se sostiene —la palabra no está,
 * o el vocabulario no le conoce varios significados—. No se tira en
 * silencio: vuelve a «no entendido», para que se le diga.
 *
 * Existe por un fallo medido el mismo día: con la primera redacción de la
 * instrucción, el modelo apartaba «no cogemos el teléfono» como ambiguo en 2
 * de cada 5 lecturas; «teléfono» sólo tiene un significado en el vocabulario,
 * la aclaración se descartaba y las reservas desaparecían sin que nadie lo
 * dijera.
 */
export function ambiguosQueNoSeSostienen(texto: string, crudas: unknown, aceptadas: Aclaracion[]): string[] {
  const salida: string[] = [];
  for (const a of Array.isArray(crudas) ? crudas : []) {
    const termino = (a as { termino?: unknown })?.termino;
    if (typeof termino !== "string" || !termino.trim()) continue;
    if (aceptadas.some((x) => normalizar(x.termino) === normalizar(termino))) continue;
    salida.push(termino.trim());
  }
  return salida;
}

/**
 * El trozo de las instrucciones al modelo que pide señalar lo ambiguo. Uno
 * solo, para los dos momentos. Acotado a propósito: sólo cuando NOMBRA una
 * aplicación o un canal SIN contar qué problema tiene. Una primera redacción
 * más abierta hacía dudar al modelo de problemas bien contados —«no cogemos
 * el teléfono»— y los perdía; ésta no toca la lectura normal.
 */
export const INSTRUCCION_DE_AMBIGUOS = `- "ambiguos" es SÓLO para esto: nombra una aplicación, una red o un canal concreto (por su nombre) y NO cuenta qué problema quiere resolver con él, y ese nombre encaja en varias necesidades de la lista. Entonces no elijas: pon el nombre exacto en "ambiguos". Si cuenta el problema, aunque nombre la aplicación, clasifícalo en necesidades como siempre. Si no hay nada así, deja "ambiguos" vacío.`;
