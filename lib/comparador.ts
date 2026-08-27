import type { HerramientaEvaluada } from "@/agents/atlas-advisor";

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

  // Precio y plan gratuito son hechos del catálogo, no criterios
  // personalizados: a diferencia de `detalles` (que depende de lo que el
  // cuestionario haya preguntado — hoy no pide presupuesto ni nivel
  // técnico, así que varios criterios quedan vacíos para todas las
  // herramientas por igual), estos dos siempre están disponibles y casi
  // siempre diferencian algo real entre finalistas, aunque los criterios
  // personalizados hayan empatado.
  const filas: FilaComparativa[] = [];

  const planesUnicos = new Set(evaluadas.map((e) => e.herramienta.tienePlanGratuito));
  if (planesUnicos.size > 1) {
    filas.push({
      criterio: "planGratuito",
      etiqueta: "Plan gratuito",
      explicacionCriterio: "Si puedes empezar a usarla sin pagar, aunque sea con límites.",
      hayGanadorUnico: false,
      celdas: evaluadas.map((e) => ({
        herramientaId: e.herramienta.id,
        nombre: e.herramienta.nombre,
        puntos: e.herramienta.tienePlanGratuito ? 1 : 0,
        explicacion: e.herramienta.tienePlanGratuito
          ? "Tiene plan gratuito."
          : "No tiene plan gratuito.",
        gana: e.herramienta.tienePlanGratuito,
      })),
    });
  }

  const preciosUnicos = new Set(evaluadas.map((e) => e.herramienta.precioInicial));
  if (preciosUnicos.size > 1) {
    filas.push({
      criterio: "precioInicial",
      etiqueta: "Precio de entrada",
      explicacionCriterio: "Lo que cuesta empezar, tal y como lo publica cada proveedor.",
      hayGanadorUnico: false,
      celdas: evaluadas.map((e) => ({
        herramientaId: e.herramienta.id,
        nombre: e.herramienta.nombre,
        puntos: 0,
        explicacion: e.herramienta.precioInicial,
        gana: false,
      })),
    });
  }

  const idsCriterios = evaluadas[0].detalles.map((detalle) => detalle.criterio);

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
