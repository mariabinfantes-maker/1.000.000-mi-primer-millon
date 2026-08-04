import { getHerramientasPorCategoria } from "@/data/repositorio";
import { ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import type { Herramienta } from "@/data/esquema";

/**
 * Página "alternativas a X" — Capa 1, cero coste: el resto de herramientas
 * de la misma categoría, ordenadas por la misma Puntuación Atlas que ya
 * usan las landings de categoría/problema (`ordenarPorPuntuacionAtlas`,
 * `lib/vistaRecomendacion.ts`). No es un concepto nuevo, solo un recorte
 * distinto del mismo catálogo ya ordenado.
 */
export function getAlternativas(herramienta: Herramienta): Herramienta[] {
  const delaMismaCategoria = getHerramientasPorCategoria(herramienta.categoriaId).filter((h) => h.id !== herramienta.id);
  return ordenarPorPuntuacionAtlas(delaMismaCategoria);
}
