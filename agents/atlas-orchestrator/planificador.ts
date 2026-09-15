import { TAREAS, type Cadencia, type Tarea, type TareaId } from "./tareas";

/**
 * Qué toca hoy.
 *
 * Es una función pura: se le dan las tareas, cuándo se ejecutó cada una
 * por última vez y qué hora es, y devuelve la lista. No mira la base de
 * datos, no mira el reloj por su cuenta y no ejecuta nada — así se puede
 * probar un martes de noviembre sin esperar a noviembre.
 *
 * `manual` no se propone nunca. Son las tareas que necesitan que alguien
 * decida algo primero: qué lote investigar, qué borrador promover. Que el
 * Orchestrator sepa ejecutarlas no significa que sepa cuándo.
 */

const DIAS: Record<Exclude<Cadencia, "cada_ejecucion" | "manual">, number> = {
  semanal: 7,
  mensual: 30,
};

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export type UltimaEjecucion = { tareaId: TareaId; fecha: Date };

export type Propuesta = {
  tarea: Tarea;
  /** Por qué toca ahora, en la lengua de la propietaria. */
  porQue: string;
  /** `undefined` si no se ha ejecutado nunca. */
  ultimaVez?: Date;
};

function diasDesde(desde: Date, ahora: Date): number {
  return (ahora.getTime() - desde.getTime()) / MILISEGUNDOS_POR_DIA;
}

/**
 * Devuelve las tareas que toca proponer, en el orden de `TAREAS`.
 *
 * Proponer no es ejecutar: lo que sale de aquí pasa por el carril que le
 * corresponda. Una tarea de `conPermiso` vencida se propone igual, y se
 * queda esperando firma.
 */
export function planificar(
  ultimas: readonly UltimaEjecucion[],
  ahora: Date,
  tareas: readonly Tarea[] = TAREAS
): Propuesta[] {
  const ultimaPorTarea = new Map<string, Date>();
  for (const { tareaId, fecha } of ultimas) {
    const previa = ultimaPorTarea.get(tareaId);
    if (!previa || fecha > previa) ultimaPorTarea.set(tareaId, fecha);
  }

  const propuestas: Propuesta[] = [];
  for (const tarea of tareas) {
    if (tarea.cadencia === "manual") continue;

    const ultimaVez = ultimaPorTarea.get(tarea.id);

    if (tarea.cadencia === "cada_ejecucion") {
      propuestas.push({ tarea, ultimaVez, porQue: "se comprueba en cada pasada" });
      continue;
    }

    const diasExigidos = DIAS[tarea.cadencia];
    if (!ultimaVez) {
      propuestas.push({ tarea, porQue: "no se ha ejecutado nunca" });
      continue;
    }

    const transcurridos = diasDesde(ultimaVez, ahora);
    if (transcurridos >= diasExigidos) {
      propuestas.push({
        tarea,
        ultimaVez,
        porQue: `han pasado ${Math.floor(transcurridos)} días y toca cada ${diasExigidos}`,
      });
    }
  }
  return propuestas;
}

/**
 * Una fecha en el futuro no adelanta nada: si el reloj de la máquina va
 * mal o alguien anotó mal una ejecución, `planificar` la trata como
 * reciente y la tarea no se propone. Se prefiere no proponer de más.
 */
export function proximaVez(ultimaVez: Date, cadencia: Cadencia): Date | undefined {
  if (cadencia === "manual" || cadencia === "cada_ejecucion") return undefined;
  return new Date(ultimaVez.getTime() + DIAS[cadencia] * MILISEGUNDOS_POR_DIA);
}
