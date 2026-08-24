import type { Reputacion } from "@/data/esquema";

export type FuenteReputacion = { nombre: string; puntuacion: number; numeroResenas?: number };

/**
 * Elige qué fuente de reputación mostrar cuando existe más de una (hoy,
 * G2 y Capterra) — la de más reseñas, porque es la señal más fiable
 * estadísticamente, no necesariamente la puntuación más alta. Función
 * pura, separada de `InsigniaReputacion.tsx` (componente) para poder
 * probarla sin renderizar nada — mismo patrón que el resto de `lib/`.
 */
export function elegirMejorFuenteReputacion(reputacion: Reputacion | undefined): FuenteReputacion | null {
  if (!reputacion) return null;

  const candidatas: FuenteReputacion[] = [];
  if (reputacion.g2Puntuacion !== undefined) {
    candidatas.push({ nombre: "G2", puntuacion: reputacion.g2Puntuacion, numeroResenas: reputacion.g2NumeroResenas });
  }
  if (reputacion.capterraPuntuacion !== undefined) {
    candidatas.push({
      nombre: "Capterra",
      puntuacion: reputacion.capterraPuntuacion,
      numeroResenas: reputacion.capterraNumeroResenas,
    });
  }

  if (candidatas.length === 0) return null;

  return candidatas.sort((a, b) => (b.numeroResenas ?? 0) - (a.numeroResenas ?? 0))[0];
}
