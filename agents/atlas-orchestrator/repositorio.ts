import type { Pool } from "pg";
import { obtenerPool } from "@/data/db/cliente";
import { exigirArgumentosValidos } from "./carriles";
import { esTareaId, tareaDe, type Carril, type MotivoDelCarril, type TareaId } from "./tareas";

/**
 * El buzón del Orchestrator, en Postgres.
 *
 * ── Por qué Postgres y no un fichero ──────────────────────────────────
 *
 * La primera versión de esto guardaba las solicitudes en `data/`. Estaba
 * mal: la máquina donde corre el orquestador y la web donde la propietaria
 * firmaría no comparten disco, y el sistema de ficheros de Vercel es
 * efímero. Una autorización firmada en la web no habría llegado nunca al
 * ejecutor. Postgres es el único sitio que los dos ven.
 *
 * ── Lo que nunca sale de aquí ─────────────────────────────────────────
 *
 * Un comando. Una solicitud guarda un `tarea_id` y unos argumentos
 * revisados; el comando lo pone `tareas.ts`, en código. Ver el comentario
 * de la tabla en `data/db/esquema.ts`.
 *
 * ── El silencio no es permiso ─────────────────────────────────────────
 *
 * Una solicitud de `conPermiso` nace en `esperando_autorizacion` y ahí se
 * queda. No caduca, no se degrada a permitida, no hay tiempo de espera
 * tras el cual se ejecute igual. Sólo pasa a `autorizada` si alguien la
 * firma, y **en este bloque no existe ningún camino que la firme**: el
 * panel donde la propietaria firma es el bloque 2. Hasta entonces esta
 * transición sólo la provocan las pruebas, a propósito y a mano.
 */

export type EstadoSolicitud =
  | "lista"
  | "esperando_autorizacion"
  | "autorizada"
  | "en_curso"
  | "completada"
  | "fallida"
  | "rechazada";

/** Los dos estados desde los que una solicitud puede reclamarse para ejecutar. */
export const ESTADOS_EJECUTABLES: readonly EstadoSolicitud[] = ["lista", "autorizada"];

/** Los estados de los que una solicitud todavía puede moverse. Sirve para no duplicarlas. */
export const ESTADOS_VIVOS: readonly EstadoSolicitud[] = [
  "lista",
  "esperando_autorizacion",
  "autorizada",
  "en_curso",
];

export type Solicitud = {
  id: number;
  tareaId: TareaId;
  carril: Carril;
  motivo: MotivoDelCarril;
  argumentos: string[];
  estado: EstadoSolicitud;
  porQue?: string;
  creadaEn: Date;
  autorizadaEn?: Date;
  autorizadaPor?: string;
  reclamadaEn?: Date;
  reclamadaPor?: string;
  terminadaEn?: Date;
  resultado?: string;
};

export type EventoBitacora = "creada" | "reclamada" | "completada" | "fallida" | "rechazada" | "no_ejecutada";

export type AsientoBitacora = {
  id: number;
  solicitudId?: number;
  tareaId: string;
  evento: EventoBitacora;
  detalle?: string;
  ejecucionId?: string;
  fecha: Date;
};

export type OpcionesRepositorio = { pool?: Pool };

function resolverPool(explicito?: Pool): Pool {
  return explicito ?? obtenerPool();
}

/**
 * Traduce una fila a `Solicitud`. Si el `tarea_id` guardado no está en el
 * catálogo del código, se rechaza aquí y no más adelante: quien lea esta
 * fila nunca llega a tener un objeto con una tarea que no existe.
 */
function aSolicitud(fila: Record<string, unknown>): Solicitud {
  const tareaId = String(fila.tarea_id);
  if (!esTareaId(tareaId)) {
    throw new Error(
      `La solicitud ${fila.id} apunta a la tarea "${tareaId}", que no está en el catálogo de agents/atlas-orchestrator/tareas.ts. No se ejecuta nada.`
    );
  }
  const argumentos = Array.isArray(fila.argumentos) ? fila.argumentos : [];
  return {
    id: Number(fila.id),
    tareaId,
    carril: String(fila.carril) as Carril,
    motivo: String(fila.motivo) as MotivoDelCarril,
    argumentos: exigirArgumentosValidos(argumentos),
    estado: String(fila.estado) as EstadoSolicitud,
    porQue: (fila.por_que as string) ?? undefined,
    creadaEn: fila.creada_en as Date,
    autorizadaEn: (fila.autorizada_en as Date) ?? undefined,
    autorizadaPor: (fila.autorizada_por as string) ?? undefined,
    reclamadaEn: (fila.reclamada_en as Date) ?? undefined,
    reclamadaPor: (fila.reclamada_por as string) ?? undefined,
    terminadaEn: (fila.terminada_en as Date) ?? undefined,
    resultado: (fila.resultado as string) ?? undefined,
  };
}

const COLUMNAS = `id, tarea_id, carril, motivo, argumentos, estado, por_que, creada_en,
                  autorizada_en, autorizada_por, reclamada_en, reclamada_por, terminada_en, resultado`;

/** Escribe un asiento en la bitácora. Append-only por trigger, no por disciplina. */
export async function anotar(
  asiento: { solicitudId?: number; tareaId: string; evento: EventoBitacora; detalle?: string; ejecucionId?: string },
  opciones: OpcionesRepositorio = {}
): Promise<void> {
  await resolverPool(opciones.pool).query(
    `INSERT INTO bitacora_orquestador (solicitud_id, tarea_id, evento, detalle, ejecucion_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [asiento.solicitudId ?? null, asiento.tareaId, asiento.evento, asiento.detalle ?? null, asiento.ejecucionId ?? null]
  );
}

/**
 * Crea una solicitud.
 *
 * El carril, el motivo y el estado inicial **no los elige quien llama**:
 * salen de `tareas.ts`. Pedir una tarea no es decidir en qué carril va.
 */
export async function crearSolicitud(
  entrada: { tareaId: string; argumentos?: readonly string[]; porQue?: string },
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud> {
  const tarea = tareaDe(entrada.tareaId);
  if (!tarea) {
    throw new Error(`"${entrada.tareaId}" no es una tarea del catálogo. No se crea ninguna solicitud.`);
  }
  const argumentos = exigirArgumentosValidos(entrada.argumentos ?? []);
  if (tarea.exigeArgumentos && argumentos.length === 0) {
    throw new Error(`La tarea "${tarea.id}" necesita argumentos y no se le han dado.`);
  }

  const estado: EstadoSolicitud = tarea.carril === "libre" ? "lista" : "esperando_autorizacion";

  const { rows } = await resolverPool(opciones.pool).query(
    `INSERT INTO solicitudes_orquestador (tarea_id, carril, motivo, argumentos, estado, por_que)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6)
     RETURNING ${COLUMNAS}`,
    [tarea.id, tarea.carril, tarea.motivo, JSON.stringify(argumentos), estado, entrada.porQue ?? null]
  );
  const solicitud = aSolicitud(rows[0]);
  await anotar({ solicitudId: solicitud.id, tareaId: tarea.id, evento: "creada", detalle: entrada.porQue }, opciones);
  return solicitud;
}

/**
 * ¿Hay ya una solicitud viva de esta tarea con estos mismos argumentos?
 *
 * Sin esto, cada pasada del orquestador apilaría otra solicitud idéntica
 * de lo que sigue esperando firma, y la propietaria acabaría con
 * cuarenta filas de lo mismo. Una espera larga es normal; el ruido, no.
 */
export async function haySolicitudViva(
  tareaId: string,
  argumentos: readonly string[] = [],
  opciones: OpcionesRepositorio = {}
): Promise<boolean> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT 1 FROM solicitudes_orquestador
     WHERE tarea_id = $1 AND argumentos = $2::jsonb AND estado = ANY($3::text[])
     LIMIT 1`,
    [tareaId, JSON.stringify(argumentos), ESTADOS_VIVOS]
  );
  return rows.length > 0;
}

/**
 * Reclama la siguiente solicitud ejecutable, de forma atómica.
 *
 * `FOR UPDATE SKIP LOCKED` dentro de la misma sentencia que el UPDATE: dos
 * procesos que arranquen a la vez no pueden llevarse la misma fila —uno se
 * la lleva y el otro pasa a la siguiente—, y no hay ventana entre leer y
 * marcar. Es la diferencia entre ejecutar una investigación una vez y
 * ejecutarla dos, que cuesta dinero de verdad.
 *
 * Sólo mira `lista` y `autorizada`. Una fila en `en_curso` —una ejecución
 * que se cortó a mitad— nunca vuelve a entrar aquí: queda registrada y
 * espera a que una persona decida, que es lo que pidió la propietaria.
 */
export async function reclamarSiguiente(
  ejecucionId: string,
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud | undefined> {
  const { rows } = await resolverPool(opciones.pool).query(
    `UPDATE solicitudes_orquestador
     SET estado = 'en_curso', reclamada_en = now(), reclamada_por = $1
     WHERE id = (
       SELECT id FROM solicitudes_orquestador
       WHERE estado = ANY($2::text[])
       ORDER BY id
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING ${COLUMNAS}`,
    [ejecucionId, ESTADOS_EJECUTABLES]
  );
  if (rows.length === 0) return undefined;

  const solicitud = aSolicitud(rows[0]);
  await anotar({ solicitudId: solicitud.id, tareaId: solicitud.tareaId, evento: "reclamada", ejecucionId }, opciones);
  return solicitud;
}

/**
 * Cierra una solicitud reclamada. Nunca la devuelve a la cola: una
 * solicitud cerrada está cerrada, y volver a intentarlo es crear otra.
 *
 * `rechazada` no es `fallida`: fallida es que se ejecutó y salió mal;
 * rechazada es que no llegó a ejecutarse porque no debía. Distinguirlo es
 * lo que permite leer la bitácora dentro de un año y saber qué pasó.
 */
export async function marcarTerminada(
  id: number,
  estado: "completada" | "fallida" | "rechazada",
  detalle: { resultado?: string; ejecucionId?: string } = {},
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud> {
  const { rows } = await resolverPool(opciones.pool).query(
    `UPDATE solicitudes_orquestador
     SET estado = $2, terminada_en = now(), resultado = $3
     WHERE id = $1 AND estado = 'en_curso'
     RETURNING ${COLUMNAS}`,
    [id, estado, detalle.resultado ?? null]
  );
  if (rows.length === 0) {
    throw new Error(`La solicitud ${id} no estaba en curso: no se cierra nada.`);
  }
  const solicitud = aSolicitud(rows[0]);
  await anotar(
    {
      solicitudId: solicitud.id,
      tareaId: solicitud.tareaId,
      evento: estado,
      detalle: detalle.resultado,
      ejecucionId: detalle.ejecucionId,
    },
    opciones
  );
  return solicitud;
}

export async function leerSolicitud(id: number, opciones: OpcionesRepositorio = {}): Promise<Solicitud | undefined> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT ${COLUMNAS} FROM solicitudes_orquestador WHERE id = $1`,
    [id]
  );
  return rows.length ? aSolicitud(rows[0]) : undefined;
}

export async function listarPorEstado(
  estados: readonly EstadoSolicitud[],
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud[]> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT ${COLUMNAS} FROM solicitudes_orquestador WHERE estado = ANY($1::text[]) ORDER BY id`,
    [estados]
  );
  return rows.map(aSolicitud);
}

/**
 * Las ejecuciones que se reclamaron y nunca terminaron.
 *
 * No las toca: sólo las enseña. Volver a lanzarlas por su cuenta sería
 * exactamente lo que la propietaria prohibió — a saber si la que se cortó
 * llegó a gastar, a escribir o a medias. Decide una persona.
 */
export async function listarInterrumpidas(opciones: OpcionesRepositorio = {}): Promise<Solicitud[]> {
  return listarPorEstado(["en_curso"], opciones);
}

/** Cuándo terminó bien cada tarea por última vez. Es lo que lee el planificador. */
export async function ultimasEjecuciones(
  opciones: OpcionesRepositorio = {}
): Promise<{ tareaId: TareaId; fecha: Date }[]> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT tarea_id, max(fecha) AS fecha
     FROM bitacora_orquestador
     WHERE evento = 'completada'
     GROUP BY tarea_id`
  );
  return rows
    .filter((fila) => esTareaId(String(fila.tarea_id)))
    .map((fila) => ({ tareaId: String(fila.tarea_id) as TareaId, fecha: fila.fecha as Date }));
}

export async function leerBitacora(
  opciones: OpcionesRepositorio & { limite?: number } = {}
): Promise<AsientoBitacora[]> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT id, solicitud_id, tarea_id, evento, detalle, ejecucion_id, fecha
     FROM bitacora_orquestador ORDER BY id DESC LIMIT $1`,
    [opciones.limite ?? 100]
  );
  return rows.map((fila) => ({
    id: Number(fila.id),
    solicitudId: fila.solicitud_id === null ? undefined : Number(fila.solicitud_id),
    tareaId: String(fila.tarea_id),
    evento: String(fila.evento) as EventoBitacora,
    detalle: (fila.detalle as string) ?? undefined,
    ejecucionId: (fila.ejecucion_id as string) ?? undefined,
    fecha: fila.fecha as Date,
  }));
}
