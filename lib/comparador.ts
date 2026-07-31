import type { HerramientaEvaluada } from "@/lib/recommendationEngine";

/**
 * Construye la comparativa guiada (P-05) a partir de los mismos
 * `HerramientaEvaluada` que ya calculó el motor para P-03 — no se vuelve a
 * puntuar nada aquí, solo se reorganiza el desglose por criterio
 * (`detalles`) que el motor ya adjunta a cada herramienta evaluada.
 *
 * Principio del comparador (Sheet 05 del documento de arquitectura UX):
 * "comparación lado a lado limitada a los criterios donde realmente
 * difieren, no una tabla exhaustiva". Un criterio se omite si las
 * herramientas comparadas obtuvieron el mismo puntaje y la misma
 * explicación en él — no aporta nada que Atlas no supiera ya.
 */

export type CeldaComparativa = {
  herramientaId: string;
  nombre: string;
  puntos: number;
  explicacion: string;
  /** true si esta herramienta es la única con el mayor puntaje en este criterio. */
  gana: boolean;
};

export type FilaComparativa = {
  criterio: string;
  etiqueta: string;
  /** Qué significa este criterio para una pyme, en una frase — microcopy editorial, no un dato investigado. */
  explicacionCriterio: string;
  celdas: CeldaComparativa[];
  hayGanadorUnico: boolean;
};

/** Una frase por criterio explicando qué mide, pensada para quien no conoce la jerga del sector. */
export const EXPLICACION_CRITERIO: Record<string, string> = {
  tamanoEmpresa: "Qué tan pensada está para negocios de tu tamaño exacto.",
  industria: "Si tiene experiencia real con empresas de tu sector.",
  presupuesto: "Cómo de bien encaja su precio con lo que quieres invertir.",
  facilidadDeUso: "Qué tan fácil es empezar a usarla en el día a día.",
  nivelTecnico: "Cuánto conocimiento técnico exige de tu equipo para sacarle partido.",
  curvaDeAprendizaje: "Cuánto cuesta arrancar con ella al principio.",
  integraciones: "Si conecta con las herramientas que ya usas.",
  idioma: "Si está disponible en el idioma que necesitas.",
  casosNoRecomendados: "Si tu situación coincide con algún caso en el que esta herramienta no es la mejor opción.",
  metodologia: "Qué tan contrastada está la valoración: solo editorial o también con datos de uso reales.",
};

export function construirComparativa(evaluadas: HerramientaEvaluada[]): FilaComparativa[] {
  if (evaluadas.length < 2) return [];

  const idsCriterios = evaluadas[0].detalles.map((detalle) => detalle.criterio);
  const filas: FilaComparativa[] = [];

  for (const criterioId of idsCriterios) {
    const porHerramienta = evaluadas.map((evaluada) => ({
      herramienta: evaluada.herramienta,
      detalle: evaluada.detalles.find((detalle) => detalle.criterio === criterioId),
    }));

    const puntosUnicos = new Set(porHerramienta.map((h) => h.detalle?.puntos ?? 0));
    const explicacionesUnicas = new Set(porHerramienta.map((h) => h.detalle?.explicacion ?? ""));

    // No aporta nada que Atlas no supiera ya: todas las herramientas obtuvieron lo mismo en este criterio.
    if (puntosUnicos.size <= 1 && explicacionesUnicas.size <= 1) continue;

    const maxPuntos = Math.max(...porHerramienta.map((h) => h.detalle?.puntos ?? 0));
    const ganadores = porHerramienta.filter((h) => (h.detalle?.puntos ?? 0) === maxPuntos);
    const hayGanadorUnico = puntosUnicos.size > 1 && ganadores.length === 1;

    filas.push({
      criterio: criterioId,
      etiqueta: porHerramienta[0].detalle?.etiqueta ?? criterioId,
      explicacionCriterio: EXPLICACION_CRITERIO[criterioId] ?? "",
      hayGanadorUnico,
      celdas: porHerramienta.map((h) => ({
        herramientaId: h.herramienta.id,
        nombre: h.herramienta.nombre,
        puntos: h.detalle?.puntos ?? 0,
        explicacion: h.detalle?.explicacion ?? "",
        gana: hayGanadorUnico && (h.detalle?.puntos ?? 0) === maxPuntos,
      })),
    });
  }

  return filas;
}
