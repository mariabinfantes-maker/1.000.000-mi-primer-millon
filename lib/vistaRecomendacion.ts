import type { HerramientaEvaluada } from "@/lib/recommendationEngine";
import type { TarjetaHerramientaRecomendadaProps } from "@/components/TarjetaHerramientaRecomendada";

/**
 * Único punto de contacto entre el motor de recomendación y la interfaz.
 *
 * Traduce la salida rica del motor (`HerramientaEvaluada`, con su desglose
 * de criterios y puntuación interna) a las props planas que espera
 * `TarjetaHerramientaRecomendada`. Si el algoritmo cambia — nuevos
 * criterios, pesos distintos, otra forma de calcular la puntuación — este
 * es el único archivo que debería tocarse; el componente visual no sabe
 * nada de cómo se llegó a estos datos.
 */
export function aVistaDeTarjeta(evaluada: HerramientaEvaluada, posicion: number): TarjetaHerramientaRecomendadaProps {
  const { herramienta } = evaluada;

  // Puntuación mostrada al usuario: calidad editorial de la ficha, no la
  // puntuación interna de encaje (esa solo sirve para ordenar, no tiene una
  // escala fija pensada para mostrarse — ver el comentario en
  // `HerramientaEvaluada.puntuacionTotal`).
  const puntuacionAtlas =
    Math.round(((herramienta.puntuaciones.calidad + herramienta.puntuaciones.fiabilidad) / 2) * 10) / 10;

  return {
    posicion,
    nombre: herramienta.nombre,
    paginaOficial: herramienta.paginaOficial,
    puntuacionAtlas,
    precioInicial: herramienta.precioInicial,
    tienePlanGratuito: herramienta.tienePlanGratuito,
    ventajas: herramienta.ventajas,
    inconvenientes: herramienta.inconvenientes,
    explicacionPersonalizada: evaluada.explicacion,
    integracionPrincipal: herramienta.integracionesPrincipales[0] ?? null,
    tieneAdvertencia: evaluada.tieneAdvertencia,
  };
}
