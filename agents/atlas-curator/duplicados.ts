import type { Herramienta } from "@/data/esquema";

/**
 * Detección de casi-duplicados — Capa 1 de Atlas Curator: determinista,
 * sin IA, sin coste. Solo detecta y explica; nunca decide fusionar,
 * renombrar ni descartar nada — esa decisión la toma siempre una persona,
 * mismo principio sin excepción que rige el resto de Atlas.
 *
 * Compara UN candidato (una herramienta a punto de promoverse) contra el
 * catálogo ya existente, no todo contra todo — ese es el problema real que
 * resuelve (ver ATLAS.md, sección Atlas Curator): dos lotes de Researcher
 * investigando la misma herramienta bajo ids distintos, cosa que
 * `promoverBorrador()` no detecta hoy porque solo comprueba colisión
 * exacta de `id`.
 */

export type AvisoDuplicado = {
  herramientaExistenteId: string;
  motivo: string;
};

/** Minúsculas, sin acentos, sin puntuación — para comparar nombres sin que un detalle tipográfico oculte una coincidencia real. */
function normalizarNombre(texto: string): string {
  const SIN_ACENTOS = new RegExp("[\\u0300-\\u036f]", "g");
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(SIN_ACENTOS, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** `null` si `paginaOficial` no es una URL válida — un dato mal investigado no debe hacer fallar la detección, solo queda sin comparar por dominio. */
function normalizarDominio(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Nombres de menos de 4 caracteres normalizados quedan fuera de la
 * comparación "un nombre contenido en el otro": con nombres cortos y
 * genéricos (ej. "Go") esa regla generaría más ruido que señal.
 */
const LONGITUD_MINIMA_PARA_SUBCADENA = 4;

export function detectarCasiDuplicados(
  candidato: Pick<Herramienta, "id" | "nombre" | "paginaOficial">,
  catalogo: Herramienta[]
): AvisoDuplicado[] {
  const avisos: AvisoDuplicado[] = [];
  const nombreCandidato = normalizarNombre(candidato.nombre);
  const dominioCandidato = normalizarDominio(candidato.paginaOficial);

  for (const existente of catalogo) {
    if (existente.id === candidato.id) continue;

    const nombreExistente = normalizarNombre(existente.nombre);
    const dominioExistente = normalizarDominio(existente.paginaOficial);

    if (dominioCandidato && dominioCandidato === dominioExistente) {
      avisos.push({
        herramientaExistenteId: existente.id,
        motivo: `"${candidato.nombre}" y "${existente.nombre}" comparten el mismo dominio (${dominioCandidato}) en su página oficial.`,
      });
      continue;
    }

    if (nombreCandidato === nombreExistente) {
      avisos.push({
        herramientaExistenteId: existente.id,
        motivo: `"${candidato.nombre}" tiene el mismo nombre que "${existente.nombre}", ya en el catálogo.`,
      });
      continue;
    }

    if (
      nombreCandidato.length >= LONGITUD_MINIMA_PARA_SUBCADENA &&
      nombreExistente.length >= LONGITUD_MINIMA_PARA_SUBCADENA &&
      (nombreExistente.includes(nombreCandidato) || nombreCandidato.includes(nombreExistente))
    ) {
      avisos.push({
        herramientaExistenteId: existente.id,
        motivo: `"${candidato.nombre}" y "${existente.nombre}" tienen nombres muy parecidos — revisa si son la misma herramienta.`,
      });
    }
  }

  return avisos;
}
