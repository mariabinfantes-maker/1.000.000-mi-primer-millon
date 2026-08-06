import type { HerramientaEvaluada, RespuestasUsuario } from "@/agents/atlas-advisor";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";
import { construirPromptRecomendacion } from "./prompt";

/** Límites de cordura para la explicación devuelta por la IA — no una validación de estilo, solo una red de seguridad contra una respuesta vacía o desbocada. */
const LONGITUD_MINIMA = 20;
const LONGITUD_MAXIMA = 1000;

/**
 * Extrae y valida `explicacion` de la respuesta cruda del proveedor de IA.
 * Lanza si no es una respuesta usable — quien llama (`personalizarExplicacion`)
 * captura ese error y cae a la explicación determinista, así que lanzar
 * aquí es seguro: nunca llega al usuario como excepción sin capturar.
 */
function extraerExplicacionValidada(respuestaCruda: unknown): string {
  if (typeof respuestaCruda !== "object" || respuestaCruda === null) {
    throw new Error("La respuesta de la IA no es un objeto JSON.");
  }

  const explicacion = (respuestaCruda as Record<string, unknown>).explicacion;
  if (typeof explicacion !== "string") {
    throw new Error('La respuesta de la IA no incluye una "explicacion" en texto.');
  }

  const limpia = explicacion.trim();
  if (limpia.length < LONGITUD_MINIMA || limpia.length > LONGITUD_MAXIMA) {
    throw new Error(`La "explicacion" de la IA tiene una longitud fuera de rango (${limpia.length} caracteres).`);
  }

  return limpia;
}

/**
 * Genera una explicación personalizada por IA para una herramienta ya
 * evaluada por Atlas Advisor (Capa 1) — el "Atlas Recomendador" de la hoja
 * de ruta.
 *
 * Nunca lanza y nunca deja al usuario sin explicación: si la llamada a la
 * IA falla, si la clave no está configurada, o si la respuesta no es
 * usable, devuelve tal cual `evaluada.explicacion` (la de la Capa 1
 * determinista) — el respaldo obligatorio que se aprobó junto con esta
 * capa. La IA nunca toca `puntuacionTotal`, `detalles` ni `razones`: solo
 * redacta prosa sobre un resultado que ya está calculado.
 */
export async function personalizarExplicacion(
  evaluada: HerramientaEvaluada,
  respuestas: RespuestasUsuario,
  proveedor: ProveedorIA
): Promise<string> {
  try {
    const prompt = construirPromptRecomendacion(evaluada, respuestas);
    const respuestaCruda = await proveedor.generarJson(prompt);
    return extraerExplicacionValidada(respuestaCruda);
  } catch {
    return evaluada.explicacion;
  }
}

/**
 * Aplica `personalizarExplicacion` a una lista de herramientas ya
 * evaluadas (típicamente `resultado.top` de `recomendarHerramientas`),
 * en paralelo. Devuelve una lista nueva con la misma herramienta, el mismo
 * `puntuacionTotal`, los mismos `detalles` y `razones` — solo cambia
 * `explicacion` — y en el mismo orden: el Recomendador nunca reordena lo
 * que ya decidió el Evaluador.
 */
export async function personalizarRecomendaciones(
  top: HerramientaEvaluada[],
  respuestas: RespuestasUsuario,
  proveedor: ProveedorIA
): Promise<HerramientaEvaluada[]> {
  return Promise.all(
    top.map(async (evaluada) => ({
      ...evaluada,
      explicacion: await personalizarExplicacion(evaluada, respuestas, proveedor),
    }))
  );
}
