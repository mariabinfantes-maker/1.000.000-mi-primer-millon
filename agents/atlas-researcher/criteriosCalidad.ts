import type { Herramienta } from "@/data/esquema";
import type { AffiliateData } from "@/data/esquemaInterno";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import type { MetadatosBorrador } from "./borrador";

/**
 * Regla de calidad del catálogo — aprobada explícitamente el 2026-08-18,
 * al revisar en conjunto las primeras seis incorporaciones reales
 * (Zoho CRM, Copper, Insightly, Asana, Wrike, Smartsheet). Antes de esta
 * regla, `promoverBorrador()` solo comprobaba que hubiera programa de
 * afiliados fiable (`confidenceLevel !== "low"`) — nada evaluaba la
 * calidad de la investigación pública en sí.
 *
 * Dos decisiones, en este orden:
 *
 * 1. Umbral general de calidad (se aplica siempre, sin excepción): si la
 *    investigación tiene confianza "baja", trae alguna advertencia, o la
 *    Puntuación Molnip no llega al umbral (o no se puede calcular), la
 *    herramienta NO se promueve — "dudas importantes sobre su calidad o
 *    incertidumbre alta en los datos", tal como se acordó.
 * 2. Si supera el punto 1, la confianza del PROGRAMA DE AFILIADOS decide
 *    cómo se promueve:
 *    - "low": sigue bloqueando, como ya hacía `tieneProgramaDeAfiliadosFiable`
 *      antes de esta regla — sin cambios.
 *    - "medium": se promueve igualmente SI la reputación externa (G2 o
 *      Capterra) es buena — la herramienta queda marcada
 *      `verificacionPendiente` para que Atlas Affiliate Manager confirme
 *      comisión/plataforma antes de solicitar el programa o monetizar.
 *      Sin esa reputación de respaldo, bloquea igual que "low".
 *    - "high" (o sin dato, que la regla obligatoria de afiliados ya trata
 *      aparte): se promueve normal, sin marca.
 */

/** Recalculada aquí, nunca se confía en `analisisAtlas.puntuacion` del borrador tal cual: es un valor derivado, y este es el único punto de la promoción donde de verdad importa que esté actualizado. */
export const UMBRAL_PUNTUACION_ALTA = 80;

/** Escala G2/Capterra: 1-5. Por debajo de esto, la reputación externa no es un respaldo suficiente para tolerar una comisión de afiliados con confianza media. */
export const UMBRAL_REPUTACION_BUENA = 4.0;

export type ResultadoCriteriosCalidad =
  | { ok: true; verificacionAfiliacionPendiente: boolean; puntuacion: number }
  | { ok: false; errores: string[] };

function tieneBuenaReputacionExterna(reputacion: Herramienta["reputacion"]): boolean {
  if (!reputacion) return false;
  return (
    (reputacion.g2Puntuacion !== undefined && reputacion.g2Puntuacion >= UMBRAL_REPUTACION_BUENA) ||
    (reputacion.capterraPuntuacion !== undefined && reputacion.capterraPuntuacion >= UMBRAL_REPUTACION_BUENA)
  );
}

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

  const confianzaAfiliacion = datosAfiliados.confidenceLevel;
  if (confianzaAfiliacion === "medium") {
    if (!tieneBuenaReputacionExterna(herramienta.reputacion)) {
      return {
        ok: false,
        errores: [
          "El programa de afiliados tiene confianza media y la herramienta no tiene reputación externa " +
            `(G2/Capterra >= ${UMBRAL_REPUTACION_BUENA}) que la respalde — completa la investigación de afiliados o de reputación antes de promover.`,
        ],
      };
    }
    return { ok: true, verificacionAfiliacionPendiente: true, puntuacion: puntuacion! };
  }

  return { ok: true, verificacionAfiliacionPendiente: false, puntuacion: puntuacion! };
}
