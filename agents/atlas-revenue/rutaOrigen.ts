/**
 * De qué recorrido venía el clic saliente.
 *
 * `OrigenClic` ya decía la PANTALLA (resultado, comparar, ficha), pero no el
 * camino: no distinguía a quien llegó buscando "conseguir clientes" de quien
 * entró por la categoría CRM. Sin eso no se puede responder a la pregunta que
 * justifica el piloto — qué recorridos producen ingresos — así que la
 * pantalla sola no bastaba.
 *
 * Es una etiqueta de recorrido, nunca de persona: describe por dónde entró
 * ESTE clic, y no hay forma de enlazar dos clics del mismo visitante.
 * Vocabulario cerrado a propósito, con longitud acotada: si algún día alguien
 * intentara colar aquí un identificador, no cabría ni pasaría la validación.
 */

export const TIPOS_RUTA = ["objetivo", "categoria", "subtipo", "libre"] as const;
export type TipoRuta = (typeof TIPOS_RUTA)[number];

/** `objetivo:conseguir-clientes`, `categoria:crm`, `subtipo:escritura`... */
export type RutaOrigen = string;

/** Tope deliberado: los identificadores del catálogo son slugs cortos. */
export const LARGO_MAXIMO_RUTA = 64;

const FORMATO = /^(objetivo|categoria|subtipo|libre):[a-z0-9-]{1,48}$/;

/**
 * La forma sola NO basta, y lo descubrió una prueba: una cadena de 32
 * caracteres hexadecimales —exactamente la pinta de un identificador de
 * sesión— encajaba en `FORMATO` sin problema. Un filtro de forma solo puede
 * decir "esto parece un slug"; no puede decir "esto no es un identificador".
 *
 * Por eso la comprobación de verdad es contra el catálogo: solo se guarda una
 * etiqueta si su identificador EXISTE como objetivo, categoría o subtipo
 * real. Nada inventado entra, por bien formado que venga.
 */
export function esRutaConocida(ruta: RutaOrigen, identificadoresValidos: ReadonlySet<string>): boolean {
  const partes = partirRutaOrigen(ruta);
  if (!partes) return false;
  if (partes.tipo === "libre") return partes.id === "texto-libre";
  return identificadoresValidos.has(partes.id);
}

export function construirRutaOrigen(tipo: TipoRuta, id: string): RutaOrigen {
  return `${tipo}:${id}`;
}

/**
 * Acepta la etiqueta solo si encaja en el vocabulario. Ante cualquier duda
 * devuelve `undefined` en vez de guardarla: perder la etiqueta de recorrido
 * es un dato menos, guardar algo inesperado es un riesgo.
 */
export function normalizarRutaOrigen(valor: unknown): RutaOrigen | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim().toLowerCase();
  if (limpio.length === 0 || limpio.length > LARGO_MAXIMO_RUTA) return undefined;
  return FORMATO.test(limpio) ? limpio : undefined;
}

/** Parte la etiqueta para agrupar en los informes. */
export function partirRutaOrigen(ruta: RutaOrigen): { tipo: TipoRuta; id: string } | undefined {
  if (!normalizarRutaOrigen(ruta)) return undefined;
  const [tipo, id] = ruta.split(":");
  return { tipo: tipo as TipoRuta, id };
}

/**
 * Conjunto de identificadores que pueden aparecer en una etiqueta de
 * recorrido: los objetivos, categorías y subtipos que existen de verdad.
 * Quien lo construye pasa el catálogo; este módulo no lo importa para poder
 * seguir siendo lógica pura y probarse sin base de datos.
 */
export function construirIdentificadoresValidos(entradas: {
  objetivos: readonly string[];
  categorias: readonly string[];
  subtipos: readonly string[];
}): ReadonlySet<string> {
  return new Set([...entradas.objetivos, ...entradas.categorias, ...entradas.subtipos]);
}
