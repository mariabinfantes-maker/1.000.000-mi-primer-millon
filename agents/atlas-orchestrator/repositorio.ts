import type { Pool } from "pg";
import { obtenerPool } from "@/data/db/cliente";
import { revisarArgumentos } from "./carriles";
import { tareaDe, type Carril, type MotivoDelCarril, type TareaId } from "./tareas";

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
 * ── Una sola fuente de verdad ─────────────────────────────────────────
 *
 * La base guarda **qué** tarea y **con qué** argumentos. No guarda el
 * carril ni el motivo: esos se derivan de `tareas.ts` al leer la fila.
 * Guardarlos sería tener el mismo dato en dos sitios, y el de la base es
 * el que puede manipularse — una fila que dijera «libre» en una tarea que
 * gasta dinero sería una puerta abierta.
 *
 * Los argumentos sí vienen de la base, y por eso se revisan **al leer**,
 * contra el tipo declarado de esa tarea concreta. Ver `carriles.ts`.
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
  /** Derivado de `tareas.ts`. La base no lo guarda. */
  carril: Carril;
  /** Derivado de `tareas.ts`. La base no lo guarda. */
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

/** Una fila que no se puede convertir en `Solicitud`, y por qué. */
export type SolicitudInvalida = { id: number; tareaId: string; explicacion: string };

export type EventoBitacora = "creada" | "reclamada" | "completada" | "fallida" | "rechazada";

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
 * Convierte una fila en `Solicitud`, o explica por qué no puede.
 *
 * **No lanza.** Una fila mala no es un fallo del programa: es una fila
 * mala, y el orquestador tiene que poder rechazarla, dejar constancia y
 * seguir con las siguientes. Lanzar aquí detenía la pasada entera y dejaba
 * sin ejecutar lo que venía detrás.
 */
function interpretarFila(fila: Record<string, unknown>): { ok: true; solicitud: Solicitud } | { ok: false } & SolicitudInvalida {
  const id = Number(fila.id);
  const tareaId = String(fila.tarea_id);

  const tarea = tareaDe(tareaId);
  if (!tarea) {
    return {
      ok: false,
      id,
      tareaId,
      explicacion: `"${tareaId}" no está en el catálogo de agents/atlas-orchestrator/tareas.ts`,
    };
  }

  const revision = revisarArgumentos(tarea, Array.isArray(fila.argumentos) ? fila.argumentos : []);
  if (!revision.validos) {
    return { ok: false, id, tareaId, explicacion: revision.explicacion };
  }

  return {
    ok: true,
    solicitud: {
      id,
      tareaId: tarea.id,
      // Del código, nunca de la fila.
      carril: tarea.carril,
      motivo: tarea.motivo,
      argumentos: revision.argumentos,
      estado: String(fila.estado) as EstadoSolicitud,
      porQue: (fila.por_que as string) ?? undefined,
      creadaEn: fila.creada_en as Date,
      autorizadaEn: (fila.autorizada_en as Date) ?? undefined,
      autorizadaPor: (fila.autorizada_por as string) ?? undefined,
      reclamadaEn: (fila.reclamada_en as Date) ?? undefined,
      reclamadaPor: (fila.reclamada_por as string) ?? undefined,
      terminadaEn: (fila.terminada_en as Date) ?? undefined,
      resultado: (fila.resultado as string) ?? undefined,
    },
  };
}

const COLUMNAS = `id, tarea_id, argumentos, estado, por_que, creada_en,
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
 * El estado inicial **no lo elige quien llama**: sale del carril que
 * `tareas.ts` le da a esa tarea. Pedir una tarea no es decidir si necesita
 * permiso.
 */
export async function crearSolicitud(
  entrada: { tareaId: string; argumentos?: readonly string[]; porQue?: string },
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud> {
  const tarea = tareaDe(entrada.tareaId);
  if (!tarea) {
    throw new Error(`"${entrada.tareaId}" no es una tarea del catálogo. No se crea ninguna solicitud.`);
  }
  const revision = revisarArgumentos(tarea, entrada.argumentos ?? []);
  if (!revision.validos) throw new Error(`Argumentos rechazados: ${revision.explicacion}`);

  const estado: EstadoSolicitud = tarea.carril === "libre" ? "lista" : "esperando_autorizacion";

  const { rows } = await resolverPool(opciones.pool).query(
    `INSERT INTO solicitudes_orquestador (tarea_id, argumentos, estado, por_que)
     VALUES ($1, $2::jsonb, $3, $4)
     RETURNING ${COLUMNAS}`,
    [tarea.id, JSON.stringify(revision.argumentos), estado, entrada.porQue ?? null]
  );
  const leida = interpretarFila(rows[0]);
  if (!leida.ok) throw new Error(`La solicitud recién creada no se puede leer: ${leida.explicacion}`);

  await anotar({ solicitudId: leida.solicitud.id, tareaId: tarea.id, evento: "creada", detalle: entrada.porQue }, opciones);
  return leida.solicitud;
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

export type Reclamada =
  | { ok: true; solicitud: Solicitud }
  | ({ ok: false } & SolicitudInvalida);

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
 *
 * Si la fila reclamada no se puede interpretar, **se cierra aquí mismo**
 * como `rechazada`, con su asiento en la bitácora, y se devuelve el
 * rechazo. Quien llame puede seguir con la siguiente: una fila mala no
 * detiene la pasada.
 */
export async function reclamarSiguiente(
  ejecucionId: string,
  opciones: OpcionesRepositorio = {}
): Promise<Reclamada | undefined> {
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

  const leida = interpretarFila(rows[0]);
  if (!leida.ok) {
    await anotar(
      { solicitudId: leida.id, tareaId: leida.tareaId, evento: "reclamada", ejecucionId },
      opciones
    );
    await cerrar(leida.id, "rechazada", ejecucionId, { resultado: leida.explicacion, tareaId: leida.tareaId }, opciones);
    return leida;
  }

  await anotar(
    { solicitudId: leida.solicitud.id, tareaId: leida.solicitud.tareaId, evento: "reclamada", ejecucionId },
    opciones
  );
  return leida;
}

/**
 * Cierra una fila reclamada, sin interpretarla.
 *
 * `reclamada_por = $ejecucionId` en el WHERE: **sólo el ejecutor que la
 * reclamó puede cerrarla**. Dos orquestadores a la vez no pueden pisarse
 * el resultado, y una fila de otro proceso no se cierra por error.
 */
async function cerrar(
  id: number,
  estado: "completada" | "fallida" | "rechazada",
  ejecucionId: string,
  detalle: { resultado?: string; tareaId: string },
  opciones: OpcionesRepositorio
): Promise<Record<string, unknown>> {
  const { rows } = await resolverPool(opciones.pool).query(
    `UPDATE solicitudes_orquestador
     SET estado = $2, terminada_en = now(), resultado = $3
     WHERE id = $1 AND estado = 'en_curso' AND reclamada_por = $4
     RETURNING ${COLUMNAS}`,
    [id, estado, detalle.resultado ?? null, ejecucionId]
  );
  if (rows.length === 0) {
    throw new Error(`La solicitud ${id} no está en curso a nombre de "${ejecucionId}": no se cierra nada.`);
  }
  await anotar(
    { solicitudId: id, tareaId: detalle.tareaId, evento: estado, detalle: detalle.resultado, ejecucionId },
    opciones
  );
  return rows[0];
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
  ejecucionId: string,
  detalle: { resultado?: string } = {},
  opciones: OpcionesRepositorio = {}
): Promise<Solicitud> {
  const previa = await leerSolicitud(id, opciones);
  const tareaId = previa?.tareaId ?? "(desconocida)";
  const fila = await cerrar(id, estado, ejecucionId, { resultado: detalle.resultado, tareaId }, opciones);
  const leida = interpretarFila(fila);
  if (!leida.ok) throw new Error(`La solicitud ${id} quedó cerrada pero no se puede leer: ${leida.explicacion}`);
  return leida.solicitud;
}

export async function leerSolicitud(id: number, opciones: OpcionesRepositorio = {}): Promise<Solicitud | undefined> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT ${COLUMNAS} FROM solicitudes_orquestador WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return undefined;
  const leida = interpretarFila(rows[0]);
  return leida.ok ? leida.solicitud : undefined;
}

/**
 * Las solicitudes en esos estados, más las filas que no se pueden
 * interpretar. Una fila mala no vacía el listado ni lo rompe: se enseña
 * aparte, igual que los pendientes corruptos del Researcher.
 */
export async function listarPorEstado(
  estados: readonly EstadoSolicitud[],
  opciones: OpcionesRepositorio = {}
): Promise<{ solicitudes: Solicitud[]; invalidas: SolicitudInvalida[] }> {
  const { rows } = await resolverPool(opciones.pool).query(
    `SELECT ${COLUMNAS} FROM solicitudes_orquestador WHERE estado = ANY($1::text[]) ORDER BY id`,
    [estados]
  );
  const solicitudes: Solicitud[] = [];
  const invalidas: SolicitudInvalida[] = [];
  for (const fila of rows) {
    const leida = interpretarFila(fila);
    if (leida.ok) solicitudes.push(leida.solicitud);
    else invalidas.push({ id: leida.id, tareaId: leida.tareaId, explicacion: leida.explicacion });
  }
  return { solicitudes, invalidas };
}

/**
 * Las ejecuciones que se reclamaron y nunca terminaron.
 *
 * No las toca: sólo las enseña. Volver a lanzarlas por su cuenta sería
 * exactamente lo que la propietaria prohibió — a saber si la que se cortó
 * llegó a gastar, a escribir o a medias. Decide una persona.
 */
export async function listarInterrumpidas(
  opciones: OpcionesRepositorio = {}
): Promise<{ solicitudes: Solicitud[]; invalidas: SolicitudInvalida[] }> {
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
    .map((fila) => ({ tarea: tareaDe(String(fila.tarea_id)), fecha: fila.fecha as Date }))
    .filter((f): f is { tarea: NonNullable<ReturnType<typeof tareaDe>>; fecha: Date } => Boolean(f.tarea))
    .map(({ tarea, fecha }) => ({ tareaId: tarea.id, fecha }));
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
