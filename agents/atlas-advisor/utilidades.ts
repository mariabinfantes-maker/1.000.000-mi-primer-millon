import type { CurvaDeAprendizaje } from "@/data/esquema";
import type { NivelTecnicoEquipo, PresupuestoMensual } from "./tipos";

/** Quita acentos y pasa a minúsculas, para comparar texto libre sin depender de mayúsculas ni tildes. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** true si `contenedor` incluye `buscado` como subcadena, comparando ambos normalizados. Cadenas vacías nunca coinciden. */
export function contieneTexto(contenedor: string, buscado: string): boolean {
  const b = normalizar(buscado);
  if (b === "") return false;
  return normalizar(contenedor).includes(b);
}

/** Orden de exigencia de la curva de aprendizaje, de menor a mayor. */
const ORDEN_CURVA: Record<CurvaDeAprendizaje, number> = {
  muy_facil: 0,
  facil: 1,
  media: 2,
  dificil: 3,
};

export function nivelCurva(curva: CurvaDeAprendizaje): number {
  return ORDEN_CURVA[curva];
}

/**
 * Convierte la capacidad técnica declarada del equipo a la misma escala 1-10
 * que `Herramienta.puntuaciones.nivelTecnicoRequerido`, para poder
 * compararlas directamente. Son puntos intermedios de la escala, no los
 * extremos exactos: un equipo "avanzado" cubre perfectamente una herramienta
 * que pida un 8, pero no necesariamente una que exija un 10.
 */
const NIVEL_TECNICO_A_ESCALA: Record<NivelTecnicoEquipo, number> = {
  ninguno: 1,
  basico: 3,
  intermedio: 6,
  avanzado: 9,
};

export function nivelTecnicoEnEscala(nivel: NivelTecnicoEquipo): number {
  return NIVEL_TECNICO_A_ESCALA[nivel];
}

/** Techo de gasto mensual (en euros) que representa cada tramo de presupuesto. `null` = sin techo (cualquier precio vale). */
const TECHO_PRESUPUESTO_EUR: Record<PresupuestoMensual, number | null> = {
  sin_presupuesto: 0,
  ajustado: 50,
  medio: 150,
  alto: 500,
  sin_limite: null,
};

export function techoPresupuestoEnEuros(presupuesto: PresupuestoMensual): number | null {
  return TECHO_PRESUPUESTO_EUR[presupuesto];
}

/**
 * Extrae una estimación aproximada del precio de entrada mensual en euros a
 * partir del texto libre `precioInicial` (ej. "Desde 15€ mes por asiento" →
 * 15). Es una heurística, no un parser de precios: solo se usa como señal
 * adicional y nunca para excluir una herramienta por sí sola. Si el precio
 * es anual (ej. "37€/usuario/mes (facturación anual)") sigue devolviendo el
 * importe mensual porque es lo que aparece primero en el texto.
 */
export function estimarPrecioMensualEUR(precioInicial: string): number | null {
  const coincidencia = precioInicial.match(/(\d+(?:[.,]\d+)?)\s*€/);
  if (!coincidencia) return null;
  const numero = Number(coincidencia[1].replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

/** Palabras vacías excluidas de la comparación por solapamiento de texto libre. Lista corta a propósito: solo cubre conectores muy frecuentes en español. */
const PALABRAS_VACIAS = new Set([
  "de",
  "la",
  "el",
  "los",
  "las",
  "que",
  "en",
  "con",
  "sin",
  "para",
  "muy",
  "una",
  "uno",
  "y",
  "o",
  "a",
  "un",
  "no",
  "su",
  "sus",
]);

/** Tokeniza texto libre en palabras significativas (≥4 letras, sin palabras vacías), normalizadas. */
export function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((palabra) => palabra.length >= 4 && !PALABRAS_VACIAS.has(palabra));
}

/** Número de palabras significativas que comparten dos textos libres. */
export function contarPalabrasComunes(textoA: string, textoB: string): number {
  const palabrasA = new Set(tokenizar(textoA));
  const palabrasB = tokenizar(textoB);
  return palabrasB.filter((palabra) => palabrasA.has(palabra)).length;
}
