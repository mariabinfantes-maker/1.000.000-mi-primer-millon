import type { Herramienta } from "@/data/esquema";
import { CRITERIOS } from "./criterios";
import type { DetalleCriterio, HerramientaEvaluada, ResultadoRecomendacion, RespuestasUsuario } from "./tipos";

const CANTIDAD_POR_DEFECTO = 3;
/** Nº máximo de motivos que entran en el párrafo de explicación (el resto sigue disponible en `razones`). */
const MOTIVOS_EN_EXPLICACION = 3;

function porRelevancia(a: DetalleCriterio, b: DetalleCriterio): number {
  return Math.abs(b.puntos) - Math.abs(a.puntos);
}

/**
 * Compone un párrafo legible a partir de los motivos más relevantes de una
 * herramienta ya evaluada.
 *
 * Cada motivo llega ya redactado como frase independiente y capitalizada
 * (ver los criterios en ./criterios.ts, p. ej. "Interfaz muy fácil de usar
 * (8/10)."), así que encadenarlos tras "porque:" los convertía en
 * fragmentos sin sujeto ("Recomendamos X porque: Pensada para..."). Un
 * encabezado nominal en vez de una conjunción evita esa fricción
 * gramatical sin tener que reescribir los motivos en sí.
 */
function generarExplicacion(herramienta: Herramienta, razones: string[]): string {
  if (razones.length === 0) {
    return `${herramienta.nombre} es una opción sólida y bien valorada dentro de su categoría.`;
  }
  const motivos = razones.slice(0, MOTIVOS_EN_EXPLICACION).join(" ");
  return `Por qué te recomendamos ${herramienta.nombre}: ${motivos}`;
}

/** Aplica todos los criterios a una única herramienta y consolida el resultado. */
export function evaluarHerramienta(herramienta: Herramienta, respuestas: RespuestasUsuario): HerramientaEvaluada {
  const detalles = CRITERIOS.map((criterio) => criterio(herramienta, respuestas));
  const puntuacionTotal = detalles.reduce((total, detalle) => total + detalle.puntos, 0);

  const razones = detalles
    .filter((detalle) => detalle.explicacion !== "")
    .sort(porRelevancia)
    .map((detalle) => detalle.explicacion);

  const tieneAdvertencia = detalles.some((detalle) => detalle.criterio === "casosNoRecomendados" && detalle.puntos < 0);

  return {
    herramienta,
    puntuacionTotal,
    detalles,
    razones,
    explicacion: generarExplicacion(herramienta, razones),
    tieneAdvertencia,
  };
}

/**
 * Reduce el catálogo a las herramientas relevantes para la intención del
 * usuario, antes de puntuar nada — filtrar, no adivinar puntos.
 *
 * `categoriaId` es una elección explícita y siempre tiene prioridad: si no
 * hay ninguna herramienta en esa categoría, se devuelve vacío a propósito
 * (el usuario pidió justo esa categoría). `problemaIdsCandidatos` es más
 * blando — puede venir de una elección explícita ("por objetivo", un solo
 * id) o de una detección por texto libre ("Cuéntanoslo", posibles varios
 * ids empatados) — así que si el catálogo no tiene ninguna herramienta con
 * ese `problemasIds` todavía (hueco editorial, no elección del usuario), se
 * ignora el filtro en vez de dejar al usuario sin recomendación.
 */
function seleccionarCandidatas(herramientas: Herramienta[], respuestas: RespuestasUsuario): Herramienta[] {
  if (respuestas.categoriaId) {
    return herramientas.filter((herramienta) => herramienta.categoriaId === respuestas.categoriaId);
  }

  if (respuestas.problemaIdsCandidatos && respuestas.problemaIdsCandidatos.length > 0) {
    const idsObjetivo = new Set(respuestas.problemaIdsCandidatos);
    const filtradas = herramientas.filter((herramienta) =>
      herramienta.problemasIds?.some((id) => idsObjetivo.has(id))
    );
    if (filtradas.length > 0) return filtradas;
  }

  return herramientas;
}

/**
 * Motor de recomendación de Atlas.
 *
 * Recibe las respuestas del cuestionario y el catálogo completo de
 * herramientas (normalmente `getHerramientas()` de `data/repositorio.ts`,
 * pero el motor no importa ese módulo: así se puede probar con catálogos de
 * prueba y, el día de mañana, reutilizar desde una ruta de API sin cambios).
 *
 * Puntúa cada herramienta candidata con `CRITERIOS`, las ordena de mayor a
 * menor puntuación (con la calidad editorial como desempate) y devuelve el
 * top N junto con el ranking completo.
 */
export function recomendarHerramientas(
  respuestas: RespuestasUsuario,
  herramientas: Herramienta[],
  opciones: { cantidad?: number } = {}
): ResultadoRecomendacion {
  const cantidad = opciones.cantidad ?? CANTIDAD_POR_DEFECTO;

  const candidatas = seleccionarCandidatas(herramientas, respuestas);

  const evaluadas = candidatas
    .map((herramienta) => evaluarHerramienta(herramienta, respuestas))
    .sort(
      (a, b) =>
        b.puntuacionTotal - a.puntuacionTotal ||
        b.herramienta.puntuaciones.calidad - a.herramienta.puntuaciones.calidad ||
        b.herramienta.puntuaciones.fiabilidad - a.herramienta.puntuaciones.fiabilidad
    );

  return {
    top: evaluadas.slice(0, cantidad),
    todas: evaluadas,
  };
}
