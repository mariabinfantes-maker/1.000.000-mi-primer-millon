import type { Descarte } from "./convertir";

/**
 * Qué hay que volver a preguntar, y sólo eso.
 *
 * La primera vuelta se hizo herramienta entera. Repetir así habría vuelto a
 * pagar ~290 pares para recuperar 133. La propietaria lo cortó: se repiten los
 * pares necesarios y se conservan las evidencias válidas.
 *
 * Hay dos clases de repesca, y no se preguntan igual:
 *
 *  - `capacidad`: no hay respuesta ninguna, porque la del modelo se cortó a
 *    mitad. Se pregunta entera.
 *  - `plan`: la capacidad está afirmada con cita buena, pero el plan falta o se
 *    apoyaba en la portada. Preguntar la capacidad otra vez sería tirar una
 *    evidencia que ya vale; se pregunta ÚNICAMENTE en qué plan está.
 */
export type TipoDeTarea = "capacidad" | "plan";

export type Tarea = {
  herramientaId: string;
  tipo: TipoDeTarea;
  capacidadIds: string[];
};

/** Motivos de descarte que se arreglan preguntando sólo por el plan. */
export const MOTIVOS_DE_PLAN = [
  "sin plan mínimo",
  "el plan no viene de una fuente que lo demuestre",
];

/** Motivos de descarte que obligan a preguntar la capacidad entera. */
export const MOTIVOS_DE_CAPACIDAD = ["sin respuesta"];

export function calcularRepesca(descartes: readonly Descarte[]): Tarea[] {
  const porHerramienta = new Map<string, Map<TipoDeTarea, Set<string>>>();

  for (const d of descartes) {
    const tipo: TipoDeTarea | null = MOTIVOS_DE_CAPACIDAD.includes(d.motivo)
      ? "capacidad"
      : MOTIVOS_DE_PLAN.includes(d.motivo)
        ? "plan"
        : null;
    if (!tipo) continue;

    if (!porHerramienta.has(d.herramientaId)) porHerramienta.set(d.herramientaId, new Map());
    const porTipo = porHerramienta.get(d.herramientaId)!;
    if (!porTipo.has(tipo)) porTipo.set(tipo, new Set());
    porTipo.get(tipo)!.add(d.capacidadId);
  }

  const tareas: Tarea[] = [];
  for (const [herramientaId, porTipo] of [...porHerramienta].sort(([a], [b]) => a.localeCompare(b))) {
    for (const tipo of ["capacidad", "plan"] as TipoDeTarea[]) {
      const ids = porTipo.get(tipo);
      if (ids?.size) tareas.push({ herramientaId, tipo, capacidadIds: [...ids].sort() });
    }
  }
  return tareas;
}

export function paresDeRepesca(tareas: readonly Tarea[]): number {
  return tareas.reduce((n, t) => n + t.capacidadIds.length, 0);
}
