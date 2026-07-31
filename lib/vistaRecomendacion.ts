import type { HerramientaEvaluada } from "@/lib/recommendationEngine";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
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

  // La "Puntuación Atlas" (0-100) mostrada al usuario es la misma que
  // calcula `lib/puntuacionAtlas.ts` para el resto del producto — nunca la
  // puntuación interna de encaje (esa solo sirve para ordenar el ranking,
  // no tiene una escala fija pensada para mostrarse — ver el comentario en
  // `HerramientaEvaluada.puntuacionTotal`).
  const puntuacionAtlas = calcularPuntuacionAtlas(herramienta);

  return {
    posicion,
    id: herramienta.id,
    nombre: herramienta.nombre,
    paginaOficial: herramienta.paginaOficial,
    puntuacionAtlas: puntuacionAtlas?.puntuacion ?? null,
    motivosPuntuacion: puntuacionAtlas?.motivos ?? [],
    precioInicial: herramienta.precioInicial,
    tienePlanGratuito: herramienta.tienePlanGratuito,
    ventajas: herramienta.ventajas,
    inconvenientes: herramienta.inconvenientes,
    explicacionPersonalizada: evaluada.explicacion,
    integracionPrincipal: herramienta.integracionesPrincipales[0] ?? null,
    tieneAdvertencia: evaluada.tieneAdvertencia,
    casoDeUso: herramienta.casosDeUso[0] ?? null,
    casosNoRecomendados: herramienta.casosNoRecomendados,
  };
}
