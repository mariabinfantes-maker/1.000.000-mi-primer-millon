import type { Categoria, Herramienta, Problema } from "@/data/esquema";

/**
 * Equilibrio de taxonomía — Capa 1 de Atlas Curator: determinista, sin IA,
 * sin coste. Solo detecta y explica; nunca crea, fusiona ni elimina
 * ninguna categoría o problema — esa decisión la toma siempre una persona.
 *
 * Dos señales, deliberadamente simples para no generar ruido con un
 * catálogo todavía pequeño (mismo criterio que el umbral de 180 días de
 * `agents/atlas-mantenimiento/frescura.ts`):
 *  - huérfana: cero herramientas activas — una puerta de entrada real del
 *    producto (landing indexable, puerta del cuestionario) sin nada que
 *    mostrar.
 *  - concentración: una sola categoría o problema acapara más de la mitad
 *    del catálogo activo — con solo 4 categorías reales hoy, un reparto
 *    equilibrado ya está por debajo de ese umbral, así que superarlo es
 *    señal real de desequilibrio, no varianza normal.
 */

export type AvisoEquilibrio = {
  tipo: "categoria" | "problema";
  id: string;
  nombre: string;
  numeroHerramientas: number;
  mensaje: string;
};

/** Por encima de este porcentaje del catálogo activo en una sola categoría/problema, se avisa de concentración. */
export const PORCENTAJE_CONCENTRACION_POR_DEFECTO = 0.5;

/**
 * Con menos herramientas activas que este mínimo, cualquier categoría o
 * problema con al menos una herramienta ya supera el porcentaje de
 * concentración de forma trivial (1 de 1 es 100%) — no es señal real de
 * desequilibrio, solo un catálogo que aún no ha crecido. Por debajo de
 * este umbral se sigue avisando de huérfanas, pero no de concentración.
 */
export const MINIMO_ACTIVAS_PARA_CONCENTRACION = 4;

function contarPorId(herramientas: Herramienta[], campo: (h: Herramienta) => string[]): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const herramienta of herramientas) {
    if (herramienta.estado !== "activo") continue;
    for (const id of campo(herramienta)) {
      conteo.set(id, (conteo.get(id) ?? 0) + 1);
    }
  }
  return conteo;
}

function detectarEquilibrio(
  tipo: AvisoEquilibrio["tipo"],
  entradas: Array<{ id: string; nombre: string }>,
  conteo: Map<string, number>,
  totalActivas: number,
  porcentajeConcentracion: number
): AvisoEquilibrio[] {
  const avisos: AvisoEquilibrio[] = [];

  for (const entrada of entradas) {
    const numeroHerramientas = conteo.get(entrada.id) ?? 0;

    if (numeroHerramientas === 0) {
      avisos.push({
        tipo,
        id: entrada.id,
        nombre: entrada.nombre,
        numeroHerramientas,
        mensaje: `"${entrada.nombre}" no tiene ninguna herramienta activa — su página pública no muestra nada.`,
      });
      continue;
    }

    if (totalActivas >= MINIMO_ACTIVAS_PARA_CONCENTRACION && numeroHerramientas / totalActivas > porcentajeConcentracion) {
      const porcentaje = Math.round((numeroHerramientas / totalActivas) * 100);
      avisos.push({
        tipo,
        id: entrada.id,
        nombre: entrada.nombre,
        numeroHerramientas,
        mensaje: `"${entrada.nombre}" concentra ${numeroHerramientas} de ${totalActivas} herramientas activas (${porcentaje}%) — el resto del catálogo puede estar quedando desatendido.`,
      });
    }
  }

  return avisos;
}

export function detectarEquilibrioCategorias(
  categorias: Categoria[],
  herramientas: Herramienta[],
  porcentajeConcentracion: number = PORCENTAJE_CONCENTRACION_POR_DEFECTO
): AvisoEquilibrio[] {
  const totalActivas = herramientas.filter((h) => h.estado === "activo").length;
  const conteo = contarPorId(herramientas, (h) => [h.categoriaId]);
  return detectarEquilibrio(
    "categoria",
    categorias.map((c) => ({ id: c.id, nombre: c.nombre })),
    conteo,
    totalActivas,
    porcentajeConcentracion
  );
}

/** `Herramienta.problemasIds` es opcional (ver `data/esquema.ts`) — una herramienta sin ese campo todavía no cuenta para ningún problema, no rompe el conteo. */
export function detectarEquilibrioProblemas(
  problemas: Problema[],
  herramientas: Herramienta[],
  porcentajeConcentracion: number = PORCENTAJE_CONCENTRACION_POR_DEFECTO
): AvisoEquilibrio[] {
  const totalActivas = herramientas.filter((h) => h.estado === "activo").length;
  const conteo = contarPorId(herramientas, (h) => h.problemasIds ?? []);
  return detectarEquilibrio(
    "problema",
    problemas.map((p) => ({ id: p.id, nombre: p.titulo })),
    conteo,
    totalActivas,
    porcentajeConcentracion
  );
}
