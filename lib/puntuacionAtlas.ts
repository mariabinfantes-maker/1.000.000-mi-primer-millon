import type { Herramienta } from "@/data/esquema";

export type ResultadoPuntuacionAtlas = {
  /** 0-100. */
  puntuacion: number;
  /** Motivos legibles, generados junto con la puntuación — nunca al revés. */
  motivos: string[];
};

/**
 * Calcula la "Puntuación Atlas" (0-100) de una herramienta a partir de los
 * datos ya investigados. Vive en `lib/` — no dentro de
 * `agents/atlas-researcher/` — para poder reutilizarse desde cualquier
 * sitio que lo necesite más adelante (el comparador inteligente, un panel
 * interno, un script de recalculado periódico...), no solo desde el
 * pipeline de investigación.
 *
 * Es una función pura y determinista: nunca la rellena un proveedor de IA
 * directamente (por eso `AnalisisAtlas.puntuacion` en `data/esquema.ts` se
 * documenta como "calculado, no investigado"). Si no hay ninguna señal con
 * la que calcular nada con sentido, devuelve `null` en vez de inventar un
 * número — igual que el resto del proyecto nunca rellena un dato que no
 * pudo confirmar.
 *
 * Fórmula (deliberadamente simple y transparente, no un modelo de ML):
 *  - Media de las puntuaciones editoriales internas (1-10 → 0-100): hasta el 100% del peso si es la única señal disponible.
 *  - Reputación externa (G2/Capterra, escala 1-5 → 0-100): si existe, se promedia a partes iguales con las puntuaciones internas.
 *  - Pequeño extra por señales de producto que facilitan la adopción (plan gratuito, API pública, app móvil).
 */
export function calcularPuntuacionAtlas(datos: Partial<Herramienta>): ResultadoPuntuacionAtlas | null {
  const motivos: string[] = [];
  const componentes: number[] = [];

  const mediaInterna = calcularMediaPuntuacionesInternas(datos.puntuaciones);
  if (mediaInterna !== null) {
    componentes.push(mediaInterna * 10);
    motivos.push(`Puntuaciones editoriales internas: media de ${mediaInterna.toFixed(1)}/10.`);
  }

  const mediaExterna = calcularMediaReputacionExterna(datos.reputacion, motivos);
  if (mediaExterna !== null) {
    componentes.push((mediaExterna / 5) * 100);
  }

  const bonus = calcularBonusDeProducto(datos, motivos);

  if (componentes.length === 0 && bonus === 0) {
    return null;
  }

  const base = componentes.length > 0 ? componentes.reduce((a, b) => a + b, 0) / componentes.length : 50;
  const puntuacion = Math.round(Math.max(0, Math.min(100, base + bonus)));

  return { puntuacion, motivos };
}

function calcularMediaPuntuacionesInternas(puntuaciones: Herramienta["puntuaciones"] | undefined): number | null {
  if (!puntuaciones) return null;

  // Las 5 primeras son obligatorias en el esquema: si existe `puntuaciones`, existen ellas.
  const valores: number[] = [
    puntuaciones.calidad,
    puntuaciones.fiabilidad,
    puntuaciones.facilidadDeUso,
    puntuaciones.atencionAlCliente,
    puntuaciones.escalabilidad,
  ];

  if (typeof puntuaciones.facilidadImplementacion === "number") {
    valores.push(puntuaciones.facilidadImplementacion);
  }

  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

function calcularMediaReputacionExterna(reputacion: Herramienta["reputacion"] | undefined, motivos: string[]): number | null {
  if (!reputacion) return null;

  const valores: number[] = [];

  if (typeof reputacion.g2Puntuacion === "number") {
    valores.push(reputacion.g2Puntuacion);
    const reseñas = reputacion.g2NumeroResenas ? ` (${reputacion.g2NumeroResenas} reseñas)` : "";
    motivos.push(`G2: ${reputacion.g2Puntuacion}/5${reseñas}.`);
  }

  if (typeof reputacion.capterraPuntuacion === "number") {
    valores.push(reputacion.capterraPuntuacion);
    const reseñas = reputacion.capterraNumeroResenas ? ` (${reputacion.capterraNumeroResenas} reseñas)` : "";
    motivos.push(`Capterra: ${reputacion.capterraPuntuacion}/5${reseñas}.`);
  }

  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

const PUNTOS_POR_PLAN_GRATUITO = 3;
const PUNTOS_POR_API_PUBLICA = 2;
const PUNTOS_POR_APP_MOVIL = 2;

function calcularBonusDeProducto(datos: Partial<Herramienta>, motivos: string[]): number {
  let bonus = 0;

  if (datos.tienePlanGratuito) {
    bonus += PUNTOS_POR_PLAN_GRATUITO;
    motivos.push("Tiene plan gratuito.");
  }
  if (datos.tieneApiPublica) {
    bonus += PUNTOS_POR_API_PUBLICA;
    motivos.push("Ofrece una API pública.");
  }
  if (datos.tieneAppMovil) {
    bonus += PUNTOS_POR_APP_MOVIL;
    motivos.push("Dispone de app móvil.");
  }

  return bonus;
}
