import type { Criterio } from "./tipos";
import { contieneTexto } from "./utilidades";

/**
 * Criterios que aprovechan `Herramienta.analisisAtlas` — investigado ya por
 * el Researcher, pero sin usar en el motor hasta ahora. Separados de
 * `criterios.ts` porque dependen de un campo opcional (una herramienta
 * puede no tener todavía análisis de Atlas) y no del núcleo del esquema.
 *
 * `analisisAtlas.competidoresDirectos` no entra aquí: es información
 * relacional entre herramientas (qué compite con qué), no una propiedad
 * puntuable de una herramienta aislada — no encaja en la firma `Criterio`
 * (una herramienta, sin ver al resto del catálogo). Su uso natural es más
 * bien para diversificar el top 3 o para el comparador, no para sumar o
 * restar puntos a una ficha por sí sola.
 */

const MAPA_NIVEL_EQUIPO_A_PERFIL: Record<string, "principiante" | "intermedio" | "avanzado"> = {
  ninguno: "principiante",
  basico: "principiante",
  intermedio: "intermedio",
  avanzado: "avanzado",
};

const ORDEN_PERFIL: Record<"principiante" | "intermedio" | "avanzado", number> = {
  principiante: 0,
  intermedio: 1,
  avanzado: 2,
};

/**
 * Complementa a `criterioNivelTecnico` (que compara la exigencia numérica
 * 1-10 con la capacidad declarada). Este usa el perfil cualitativo que el
 * Researcher recomienda para la herramienta (`nivelTecnicoRecomendado`):
 * un equipo por debajo del perfil recomendado es una señal de fricción real;
 * un equipo por encima nunca es un problema, así que no se penaliza.
 */
export const criterioNivelTecnicoRecomendado: Criterio = (herramienta, { nivelTecnicoEquipo }) => {
  const recomendado = herramienta.analisisAtlas?.nivelTecnicoRecomendado;
  if (!recomendado || !nivelTecnicoEquipo) {
    return { criterio: "nivelTecnicoRecomendado", etiqueta: "Perfil técnico recomendado", puntos: 0, explicacion: "" };
  }

  const perfilEquipo = MAPA_NIVEL_EQUIPO_A_PERFIL[nivelTecnicoEquipo];
  const brecha = ORDEN_PERFIL[recomendado] - ORDEN_PERFIL[perfilEquipo];

  if (brecha <= 0) {
    return {
      criterio: "nivelTecnicoRecomendado",
      etiqueta: "Perfil técnico recomendado",
      puntos: 5,
      explicacion: `Molnip la recomienda para un perfil ${recomendado}, dentro de tu capacidad técnica.`,
    };
  }

  return {
    criterio: "nivelTecnicoRecomendado",
    etiqueta: "Perfil técnico recomendado",
    puntos: -8,
    explicacion: `Molnip la recomienda para un perfil ${recomendado}, por encima de tu capacidad técnica declarada.`,
  };
};

/**
 * Complementa a `criterioIndustria` (que cruza contra la lista completa
 * `industriasIdeales`). `tipoNegocioIdeal` es una etiqueta curada y más
 * específica ("Agencias de marketing" en vez de "Servicios"), así que solo
 * suma como refuerzo — nunca penaliza si no coincide, para no castigar dos
 * veces la misma falta de encaje de sector.
 */
export const criterioTipoNegocioIdeal: Criterio = (herramienta, { industria }) => {
  const tipoIdeal = herramienta.analisisAtlas?.tipoNegocioIdeal;
  if (!tipoIdeal || !industria || industria.trim() === "") {
    return { criterio: "tipoNegocioIdeal", etiqueta: "Tipo de negocio ideal", puntos: 0, explicacion: "" };
  }

  if (contieneTexto(tipoIdeal, industria) || contieneTexto(industria, tipoIdeal)) {
    return {
      criterio: "tipoNegocioIdeal",
      etiqueta: "Tipo de negocio ideal",
      puntos: 4,
      explicacion: `Molnip la identifica como especialmente adecuada para ${tipoIdeal.toLowerCase()}.`,
    };
  }

  return { criterio: "tipoNegocioIdeal", etiqueta: "Tipo de negocio ideal", puntos: 0, explicacion: "" };
};
