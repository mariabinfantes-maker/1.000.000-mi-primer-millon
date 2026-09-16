import fs from "node:fs";
import path from "node:path";
import type { SalidaHerramienta } from "./convertir";
import type { PlanDeVerificacion, SeleccionPlausible } from "./esquema";
import { getRecorrido, getUso } from "./usos";

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

/**
 * ── Lotes de usos (2026-09-16, tercera ronda) ──────────────────────────
 *
 * Un lote de usos NO es un lote del plan de F2: no parte de una selección
 * plausible de veinticinco capacidades, sino de las pocas que hacen falta
 * para un recorrido, con sus usos, sus recorridos y el idioma. Se congela y
 * se firma igual —cada herramienta lleva su criterio y el lote su fecha—, y
 * lleva escritos los límites de consumo que la propietaria fijó: tope de
 * peticiones HTTP contando reintentos, peticiones por minuto, y parada al
 * primer error de cuota.
 */
export type HerramientaDeLoteDeUsos = {
  herramientaId: string;
  /** Por qué estas capacidades, usos y recorridos, y no otros. */
  criterio: string;
  capacidadIds: string[];
  usoIds: string[];
  recorridoIds: string[];
  idioma: boolean;
};

export type LoteDeUsos = {
  /** kebab-case; nombra el checkpoint y la salida. */
  id: string;
  nombre: string;
  motivo: string;
  /** AAAA-MM-DD en que se congeló. */
  fecha: string;
  /** Peticiones HTTP como máximo en toda la ejecución, reintentos incluidos. */
  topeDePeticiones: number;
  peticionesPorMinuto: number;
  herramientas: HerramientaDeLoteDeUsos[];
};

export function leerLoteDeUsos(ruta: string): LoteDeUsos {
  return JSON.parse(fs.readFileSync(ruta, "utf8")) as LoteDeUsos;
}

/** Qué está mal en un lote de usos. Se comprueba ANTES de gastar nada. */
export function erroresDeLoteDeUsos(
  lote: LoteDeUsos,
  herramientaIds: readonly string[],
  capacidadIds: readonly string[]
): string[] {
  const e: string[] = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(lote.id ?? "")) e.push(`el id "${lote.id}" no es kebab-case`);
  if (!lote.nombre?.trim()) e.push("sin nombre");
  if (!lote.motivo?.trim()) e.push("sin motivo escrito");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lote.fecha ?? "")) e.push(`fecha inválida "${lote.fecha}"`);
  if (!Number.isInteger(lote.topeDePeticiones) || lote.topeDePeticiones <= 0) e.push("el tope de peticiones tiene que ser un entero positivo");
  if (!Number.isInteger(lote.peticionesPorMinuto) || lote.peticionesPorMinuto <= 0) e.push("las peticiones por minuto tienen que ser un entero positivo");
  if (!lote.herramientas?.length) e.push("sin herramientas");
  const vistas = new Set<string>();
  for (const h of lote.herramientas ?? []) {
    const donde = h.herramientaId;
    if (vistas.has(donde)) e.push(`${donde}: aparece dos veces`);
    vistas.add(donde);
    if (!herramientaIds.includes(donde)) e.push(`${donde}: la herramienta no existe en el catálogo`);
    if (!h.criterio?.trim()) e.push(`${donde}: sin criterio escrito, la lista se puede estrechar luego`);
    if (!h.capacidadIds?.length) e.push(`${donde}: sin capacidades`);
    for (const c of h.capacidadIds ?? []) if (!capacidadIds.includes(c)) e.push(`${donde}: la capacidad "${c}" no existe`);
    if (new Set(h.capacidadIds ?? []).size !== (h.capacidadIds ?? []).length) e.push(`${donde}: capacidades repetidas`);
    for (const u of h.usoIds ?? []) {
      const uso = getUso(u);
      if (!uso) e.push(`${donde}: el uso "${u}" no existe`);
      else if (!(h.capacidadIds ?? []).includes(uso.capacidadId)) e.push(`${donde}: el uso "${u}" cuelga de ${uso.capacidadId}, que no está en sus capacidades`);
    }
    for (const r of h.recorridoIds ?? []) {
      const rec = getRecorrido(r);
      if (!rec) e.push(`${donde}: el recorrido "${r}" no existe`);
      else {
        for (const pieza of rec.piezas) {
          if (!pieza.some((c) => (h.capacidadIds ?? []).includes(c))) {
            e.push(`${donde}: el recorrido "${r}" necesita ${pieza.join(" o ")}, y no está en sus capacidades`);
          }
        }
      }
    }
  }
  return e;
}

/**
 * Cuántas llamadas lógicas prevé un lote, y cuántas peticiones HTTP como
 * máximo si cada una agota sus reintentos. Es lo que se le enseña a la
 * propietaria antes de disparar, y lo que el tope tiene que cubrir.
 *
 * Por herramienta: los bloques de la primera pasada (capacidades, usos,
 * recorridos e idioma van en la misma llamada) más, como máximo, los mismos
 * bloques de la segunda (el plan de lo afirmado).
 */
export function peticionesPrevistas(lote: LoteDeUsos, porLlamada: number, reintentosPorLlamada = 3): { llamadas: number; maximoConReintentos: number } {
  let llamadas = 0;
  for (const h of lote.herramientas) llamadas += 2 * Math.ceil(h.capacidadIds.length / porLlamada);
  return { llamadas, maximoConReintentos: llamadas * reintentosPorLlamada };
}
