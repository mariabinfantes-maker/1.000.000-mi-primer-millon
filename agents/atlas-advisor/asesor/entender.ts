import { getNecesidad, getNecesidades } from "@/data/vocabulario/necesidades";
import type { NecesidadDelCaso } from "@/data/vocabulario/necesidades";

/**
 * El paso 1 del asesor: ENTENDER LO QUE CUENTA LA PERSONA.
 *
 * La regla, dicha por la propietaria el 2026-09-24: «recoge tus necesidades y
 * circunstancias, SIN ATRIBUIRTE OTRAS AUTOMÁTICAMENTE».
 *
 * Esa frase corrige un error medido: en el recorrido anterior, el diagnóstico
 * por defecto era «todo es tuyo», y por eso las 62.208 combinaciones de
 * respuestas daban siempre la misma herramienta primero. Aquí lo que no se
 * reconoce NO se añade, y lo que se añade queda marcado con de dónde salió.
 *
 * La IA sólo ENTIENDE. No elige herramientas, no puntúa y no afirma nada de
 * ningún producto: su única salida son identificadores de necesidad que ya
 * existen en el vocabulario, y los que no existan se tiran aquí.
 */

/** Lo único que se le pide a un modelo. Deliberadamente pequeño. */
export type LectorDeTexto = (prompt: string) => Promise<unknown>;

export type Comprension = {
  /** Lo que la persona escribió, tal cual. Se conserva para poder enseñárselo. */
  loQueDijo: string;
  /** Necesidades reconocidas, en el orden en que aparecen en su texto. */
  necesidades: NecesidadDelCaso[];
  /**
   * Frases suyas que no hemos sabido convertir en ninguna necesidad. No se
   * tiran: decirle «esto no lo he entendido» es mejor que callarlo, y es la
   * forma de consejo `no-lo-sabemos` del esqueleto.
   */
  noEntendido: string[];
  /** Circunstancias sueltas que ella contó y que pueden afectar al consejo. */
  circunstancias: string[];
};

export function construirPromptDeComprension(texto: string): string {
  const catalogo = getNecesidades()
    .map((n) => `[${n.id}] ${n.titulo} — lo dice así: ${n.loQueDice.join(" / ")}`)
    .join("\n");
  return `Eres la parte de Molnip que ESCUCHA. No recomiendas nada y no nombras ninguna herramienta.

Alguien ha escrito esto sobre su negocio:

"""
${texto}
"""

De esta lista cerrada, ¿qué necesidades ha contado? Sólo las que ha contado.

${catalogo}

Devuelve SÓLO este JSON, sin nada alrededor:
{"necesidades":[{"id":"<un id de la lista>","porQue":"la parte de SU texto que lo dice"}],
 "noEntendido":["frases suyas que no encajan en ninguna necesidad de la lista"],
 "circunstancias":["datos de su negocio que ha contado: oficio, cuánta gente, dónde, cuánto factura..."]}

REGLAS QUE MANDAN:
- No le atribuyas necesidades que no ha contado. Si sólo habla de citas, sólo citas.
- "porQue" es un trozo LITERAL de su texto. Si no puedes citarlo, no lo incluyas.
- Lo que no encaje en la lista va a "noEntendido". Es un resultado válido, no un fallo.
- No inventes ids. Si dudas entre dos, elige el que use sus mismas palabras.
- No escribas consejos ni nombres de productos.`;
}

/**
 * Convierte la respuesta cruda en comprensión, tirando lo que no se sostenga.
 *
 * Se valida aquí y no se confía en el modelo: un id que no existe se descarta
 * sin ruido, y una necesidad sin cita de su texto tampoco entra —porque sin
 * cita no podríamos enseñarle de dónde la sacamos—.
 */
export function leerComprension(texto: string, cruda: unknown): Comprension {
  const d = (cruda ?? {}) as {
    necesidades?: { id?: string; porQue?: string }[];
    noEntendido?: string[];
    circunstancias?: string[];
  };
  const vistas = new Set<string>();
  const necesidades: NecesidadDelCaso[] = [];
  for (const n of d.necesidades ?? []) {
    const necesidad = n?.id ? getNecesidad(n.id) : undefined;
    if (!necesidad || vistas.has(necesidad.id)) continue;
    if (!n.porQue?.trim()) continue;
    vistas.add(necesidad.id);
    // Todo lo que ella cuenta entra como imprescindible: lo trajo ella. Las
    // deseables sólo pueden salir de una pregunta nuestra, en el paso 2.
    necesidades.push({ necesidad, importancia: "imprescindible" });
  }
  return {
    loQueDijo: texto,
    necesidades,
    noEntendido: (d.noEntendido ?? []).filter((s) => typeof s === "string" && s.trim()).slice(0, 6),
    circunstancias: (d.circunstancias ?? []).filter((s) => typeof s === "string" && s.trim()).slice(0, 8),
  };
}

export async function entender(texto: string, leer: LectorDeTexto): Promise<Comprension> {
  const cruda = await leer(construirPromptDeComprension(texto));
  return leerComprension(texto, cruda);
}
