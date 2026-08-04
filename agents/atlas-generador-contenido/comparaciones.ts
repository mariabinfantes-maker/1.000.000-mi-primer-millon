import { getCategorias, getHerramientasPorCategoria } from "@/data/repositorio";
import { evaluarHerramienta, type HerramientaEvaluada } from "@/agents/atlas-advisor";
import { construirComparativa, type FilaComparativa } from "@/lib/comparador";
import type { Herramienta } from "@/data/esquema";

/**
 * Páginas de comparación par a par ("X vs Y") — Capa 1 del Generador de
 * Contenido: cero coste, cero IA. Reutiliza a Evaluador
 * (`evaluarHerramienta`) con un perfil neutro (sin `RespuestasUsuario`) y
 * el mismo `construirComparativa` que ya usa el comparador guiado — no se
 * puntúa nada nuevo aquí, solo se decide qué par mostrar y con qué URL.
 *
 * Los criterios que dependen de una respuesta del usuario (tamaño de
 * empresa, presupuesto...) quedan neutros con un perfil vacío y
 * `construirComparativa` los omite automáticamente (mismo criterio en
 * ambas herramientas); los que dependen solo de la propia herramienta
 * (facilidad de uso, metodología de valoración...) sí producen una
 * comparación real y objetiva.
 */

const SEPARADOR = "-vs-";

/** Slug canónico de una pareja de ids, siempre en el mismo orden alfabético — una única URL por pareja, nunca dos con el mismo contenido. */
export function slugComparacion(idA: string, idB: string): string {
  const [primero, segundo] = [idA, idB].sort();
  return `${primero}${SEPARADOR}${segundo}`;
}

export function analizarSlugComparacion(slug: string): { idA: string; idB: string } | null {
  const partes = slug.split(SEPARADOR);
  if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
  return { idA: partes[0], idB: partes[1] };
}

/** Todas las parejas del catálogo real que merece la pena pre-generar: dos herramientas de la misma categoría, nunca entre categorías distintas. */
export function generarParesComparacion(): { idA: string; idB: string; slug: string }[] {
  const pares: { idA: string; idB: string; slug: string }[] = [];

  for (const categoria of getCategorias()) {
    const herramientas = getHerramientasPorCategoria(categoria.id);
    for (let i = 0; i < herramientas.length; i++) {
      for (let j = i + 1; j < herramientas.length; j++) {
        const idA = herramientas[i].id;
        const idB = herramientas[j].id;
        pares.push({ idA, idB, slug: slugComparacion(idA, idB) });
      }
    }
  }

  return pares;
}

export type ComparacionEvaluada = {
  evaluadas: [HerramientaEvaluada, HerramientaEvaluada];
  filas: FilaComparativa[];
};

/** Evalúa dos herramientas con un perfil neutro y construye su comparativa — la misma función que usaría cualquier otra pantalla, sin duplicar lógica de puntuación. */
export function evaluarParComparacion(a: Herramienta, b: Herramienta): ComparacionEvaluada {
  const evaluadas: [HerramientaEvaluada, HerramientaEvaluada] = [evaluarHerramienta(a, {}), evaluarHerramienta(b, {})];
  return { evaluadas, filas: construirComparativa(evaluadas) };
}
