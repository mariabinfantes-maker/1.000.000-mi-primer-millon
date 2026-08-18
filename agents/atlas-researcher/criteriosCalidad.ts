import type { Herramienta } from "@/data/esquema";
import type { AffiliateData } from "@/data/esquemaInterno";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import type { MetadatosBorrador } from "./borrador";

/**
 * Regla de calidad del catálogo — aprobada el 2026-08-18 al revisar en
 * conjunto las primeras seis incorporaciones reales (Zoho CRM, Copper,
 * Insightly, Asana, Wrike, Smartsheet), y ajustada el mismo día tras esa
 * revisión. Antes de esta regla, `promoverBorrador()` solo comprobaba que
 * hubiera programa de afiliados fiable (`confidenceLevel !== "low"`) —
 * nada evaluaba la calidad de la investigación pública en sí.
 *
 * Dos decisiones, en este orden:
 *
 * 1. Umbral general de calidad (se aplica siempre, sin excepción): si la
 *    investigación tiene confianza "baja", trae alguna advertencia, o la
 *    Puntuación Molnip no llega al umbral (o no se puede calcular), la
 *    herramienta NO se promueve — "dudas importantes sobre su calidad o
 *    incertidumbre alta en los datos".
 * 2. Si supera el punto 1, si el programa de afiliados existe y está
 *    confirmado (`hasAffiliateProgram` + `confidenceLevel !== "low"`, ya
 *    exigido aparte por `tieneProgramaDeAfiliadosFiable` en
 *    `promover.ts` — solo eso bloquea por motivo de afiliación) pero la
 *    confianza global es "media" porque algún dato SECUNDARIO (la
 *    comisión exacta, la plataforma, la duración de cookie...) no quedó
 *    del todo confirmado, la herramienta se promueve igual, marcada
 *    `verificacionPendiente` para que Atlas Affiliate Manager la revise
 *    antes de solicitar el programa o darla por lista para monetizar. No
 *    se exige ningún respaldo adicional (reputación externa u otro) para
 *    esto: la existencia del programa ya está confirmada, que es lo único
 *    que de verdad importaba bloquear.
 */

/** Recalculada aquí, nunca se confía en `analisisAtlas.puntuacion` del borrador tal cual: es un valor derivado, y este es el único punto de la promoción donde de verdad importa que esté actualizado. */
export const UMBRAL_PUNTUACION_ALTA = 80;

export type ResultadoCriteriosCalidad =
  | { ok: true; verificacionAfiliacionPendiente: boolean; puntuacion: number }
  | { ok: false; errores: string[] };

export function evaluarCriteriosDeCalidad(
  herramienta: Herramienta,
  datosAfiliados: Partial<AffiliateData>,
  metadatos: MetadatosBorrador | undefined
): ResultadoCriteriosCalidad {
  const errores: string[] = [];

  const confianza = metadatos?.confianza;
  if (confianza === "baja") {
    errores.push('La investigación tiene confianza "baja" — completa la investigación antes de promover.');
  }

  const advertencias = metadatos?.advertencias ?? [];
  if (advertencias.length > 0) {
    errores.push(`La investigación tiene ${advertencias.length} advertencia(s) sin resolver: ${advertencias.join("; ")}`);
  }

  const resultadoPuntuacion = calcularPuntuacionAtlas(herramienta);
  const puntuacion = resultadoPuntuacion?.puntuacion ?? null;
  if (puntuacion === null) {
    errores.push("No se puede calcular la Puntuación Molnip con los datos investigados.");
  } else if (puntuacion < UMBRAL_PUNTUACION_ALTA) {
    errores.push(`Puntuación Molnip (${puntuacion}/100) por debajo del umbral de calidad (${UMBRAL_PUNTUACION_ALTA}/100).`);
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  // El bloqueo por programa de afiliados no confirmado (hasAffiliateProgram
  // falso, o confidenceLevel "low") lo exige `tieneProgramaDeAfiliadosFiable`
  // en promover.ts, aparte de este criterio. Aquí solo decidimos si algún
  // dato secundario del programa (ya confirmado que existe) merece marcarse
  // para revisión antes de solicitarlo o monetizar.
  const verificacionAfiliacionPendiente = datosAfiliados.confidenceLevel === "medium";

  return { ok: true, verificacionAfiliacionPendiente, puntuacion: puntuacion! };
}
