import path from "node:path";
import type { SalidaHerramienta } from "./convertir";
import type { PlanDeVerificacion, SeleccionPlausible } from "./esquema";

/**
 * Abrir un lote de F2 desde su selección congelada.
 *
 * El arnés remoto nació para REPESCAR el lote 1: sus tres buckets salían de
 * `descartes.json` y llevaba la fecha, el número de lote y la ruta del
 * checkpoint escritos a fuego. Así no podía abrir el lote 2, que no tiene
 * descartes de los que partir sino una selección congelada de la que arrancar.
 *
 * Estas funciones son puras a propósito: el arnés no se puede importar desde
 * una prueba —ejecuta `main()` al cargarse—, así que lo que decide qué se
 * pregunta, dónde se guarda y qué queda pendiente vive aquí, donde sí se puede
 * comprobar sin gastar una sola llamada.
 */

export type TrabajoDeLote = { herramientaId: string; capacidadIds: string[] };

/**
 * Un archivo de checkpoint por lote.
 *
 * El lote 1 conserva su nombre histórico: su archivo ya existe y renombrarlo
 * habría hecho que una repesca suya empezara de cero y volviera a pagar lo ya
 * contestado. Los demás lotes van a un archivo propio, así que abrir el lote 2
 * no puede tocar ni un byte del lote 1.
 */
export function rutaCheckpointDeLote(dir: string, lote: number): string {
  return lote === 1
    ? path.join(dir, "_checkpoint-repesca-remota.json")
    : path.join(dir, `_checkpoint-lote-${lote}.json`);
}

/** Igual que el checkpoint: la salida cruda de cada lote vive aparte. */
export function rutaSalidaDeLote(dir: string, lote: number): string {
  return lote === 1
    ? path.join(dir, "_salida-repesca-remota.json")
    : path.join(dir, `_salida-lote-${lote}.json`);
}

/**
 * La clave de una herramienta dentro del checkpoint, con el lote dentro.
 *
 * Segunda barrera además del archivo separado: aunque algún día los dos lotes
 * compartieran archivo, `lote1:capacidad:asana` y `lote2:capacidad:asana` no
 * son la misma clave y no pueden pisarse.
 */
export function claveDeLote(lote: number, tipo: "capacidad" | "plan", herramientaId: string): string {
  return `lote${lote}:${tipo}:${herramientaId}`;
}

/**
 * Qué hay que preguntar en un lote, leído de su selección congelada.
 *
 * Sin selección no se verifica: la regla de F2 es que las capacidades
 * plausibles se deciden y se firman ANTES, para que la lista no se estreche
 * justo donde la evidencia incomoda. Si falta, esto para el lote en vez de
 * inventarse qué preguntar.
 */
export function trabajoDelLote(
  plan: PlanDeVerificacion,
  selecciones: SeleccionPlausible[],
  lote: number
): TrabajoDeLote[] {
  const delPlan = plan.lotes.find((l) => l.numero === lote);
  if (!delPlan) throw new Error(`El plan no tiene ningún lote ${lote}.`);

  return delPlan.herramientaIds.map((herramientaId) => {
    const suyas = selecciones.filter((s) => s.herramientaId === herramientaId && s.lote === lote);
    if (!suyas.length) {
      throw new Error(`${herramientaId} no tiene selección congelada del lote ${lote}. Sin ella no se verifica.`);
    }
    if (suyas.length > 1) {
      throw new Error(`${herramientaId} aparece más de una vez en la selección del lote ${lote}.`);
    }
    return { herramientaId, capacidadIds: [...suyas[0].capacidadIds] };
  });
}

/**
 * Qué capacidades quedan por preguntar de una herramienta.
 *
 * Reanudar es volver a pedir SÓLO lo que no tiene respuesta. Lo que quedó en
 * `sinRespuesta` cuenta como pendiente a propósito: eso es exactamente lo que
 * se llevó un fallo transitorio del gateway, y darlo por contestado sería
 * perderlo para siempre.
 */
export function capacidadesPendientes(capacidadIds: string[], entrada?: SalidaHerramienta): string[] {
  if (!entrada) return [...capacidadIds];
  const contestadas = new Set(
    (entrada.respuestas ?? []).map((r) => r.capacidadId).filter((c): c is string => Boolean(c))
  );
  return capacidadIds.filter((c) => !contestadas.has(c));
}

/**
 * De qué capacidades falta preguntar el plan, con la cita que ya demostró la
 * capacidad para no volver a averiguarla.
 *
 * Sólo se pregunta el plan de lo AFIRMADO: preguntar en qué plan está algo que
 * la herramienta no hace no tiene sentido. Y una capacidad cuyo plan ya se
 * preguntó no se repite aunque la respuesta fuera «no lo demuestra» —ese
 * `null` es un resultado, no un hueco—.
 */
export function planesPendientes(entrada?: SalidaHerramienta): {
  capacidadIds: string[];
  citaPrevia: Map<string, string>;
} {
  const capacidadIds: string[] = [];
  const citaPrevia = new Map<string, string>();
  for (const r of entrada?.respuestas ?? []) {
    if (!r.capacidadId || r.veredicto !== "si") continue;
    if (r.planCita !== undefined) continue;
    capacidadIds.push(r.capacidadId);
    if (r.cita) citaPrevia.set(r.capacidadId, r.cita);
  }
  return { capacidadIds, citaPrevia };
}
