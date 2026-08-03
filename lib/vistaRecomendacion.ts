import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import type { Herramienta } from "@/data/esquema";
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

/**
 * Misma tarjeta, sin cuestionario de por medio (páginas de aterrizaje de
 * categoría/problema, Atlas Generador de Contenido): no hay
 * `RespuestasUsuario` con las que personalizar nada, así que
 * `explicacionPersonalizada` usa `idealPara` — un dato real ya escrito
 * sobre la herramienta, nunca un texto que finja estar hablándole a un
 * usuario concreto — y no hay advertencia posible sin un perfil que
 * pueda chocar con `casosNoRecomendados`.
 */
export function aVistaDeTarjetaGenerica(herramienta: Herramienta, posicion: number): TarjetaHerramientaRecomendadaProps {
  const puntuacionAtlas = calcularPuntuacionAtlas(herramienta);

  return {
    posicion,
    id: herramienta.id,
    nombre: herramienta.nombre,
    puntuacionAtlas: puntuacionAtlas?.puntuacion ?? null,
    motivosPuntuacion: puntuacionAtlas?.motivos ?? [],
    precioInicial: herramienta.precioInicial,
    tienePlanGratuito: herramienta.tienePlanGratuito,
    ventajas: herramienta.ventajas,
    inconvenientes: herramienta.inconvenientes,
    explicacionPersonalizada: herramienta.idealPara,
    integracionPrincipal: herramienta.integracionesPrincipales[0] ?? null,
    tieneAdvertencia: false,
    casoDeUso: herramienta.casosDeUso[0] ?? null,
    casosNoRecomendados: herramienta.casosNoRecomendados,
  };
}

/** Ordena herramientas por Puntuación Atlas descendente — el mismo criterio objetivo que ya se muestra en cada ficha, reutilizado para el orden por defecto de una landing sin cuestionario. Sin puntuación calculable, va al final. */
export function ordenarPorPuntuacionAtlas(herramientas: Herramienta[]): Herramienta[] {
  return [...herramientas].sort(
    (a, b) => (calcularPuntuacionAtlas(b)?.puntuacion ?? -1) - (calcularPuntuacionAtlas(a)?.puntuacion ?? -1)
  );
}
