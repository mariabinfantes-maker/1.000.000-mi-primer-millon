import fs from "node:fs";
import path from "node:path";
import type { AffiliateData } from "@/data/esquemaInterno";
import { esPruebaDeAusenciaValida, type EstadoAfiliacion, type PruebaDeAusencia } from "./estadoAfiliacion";
import { idEsValido } from "./id";

/**
 * Las herramientas que esperan una decisión de la propietaria sobre su
 * afiliación.
 *
 * Sin esto, "queda pendiente de decisión" no significaría nada: el lote
 * imprime su resumen y termina, y la candidata se perdería en cuanto se
 * cerrara la terminal. Un pendiente tiene que sobrevivir al lote que lo
 * creó para que alguien pueda decidir sobre él más tarde.
 *
 * Vive en `data/borradores/pendientes/{id}.json`, al lado de
 * `decisiones/`, `herramientas/` y `afiliados/`.
 *
 * Un pendiente NO es un descarte ni un borrador: es una candidata
 * investigada a medias a propósito, que se ha parado antes de gastar la
 * investigación completa porque la decisión de seguir es humana.
 */

/** Sólo dos de los tres estados llegan aquí: `confirmada` sigue de largo a la investigación completa. */
export type EstadoPendiente = Exclude<EstadoAfiliacion, "confirmada">;

/**
 * Una pasada del prechequeo sobre esta herramienta.
 *
 * Se guardan todas, en orden. Repetir un lote es volver a observar, no
 * volver a empezar: si la segunda observación es más débil que la primera,
 * la débil se anota igual pero no sustituye a la fuerte.
 */
export type ObservacionPendiente = {
  /** ISO 8601 (YYYY-MM-DD). */
  fecha: string;
  estado: EstadoPendiente;
  motivo: string;
  pruebaDeAusencia?: PruebaDeAusencia;
};

export type HerramientaPendiente = {
  id: string;
  nombreHerramienta: string;
  /** El estado más fuerte observado hasta ahora, no el último. */
  estado: EstadoPendiente;
  motivo: string;
  /** Lo que el prechequeo averiguó en la observación que fijó el estado vigente. */
  datosAfiliados: Partial<AffiliateData>;
  /** Sólo en `ausencia_demostrada`: la cita oficial que lo demuestra. Nunca se pierde por una observación posterior. */
  pruebaDeAusencia?: PruebaDeAusencia;
  /** Desde cuándo espera decisión. Se fija en la primera observación y NO se reinicia nunca. */
  fecha: string;
  /** Cuándo se observó por última vez. */
  fechaUltimaObservacion: string;
  /** Todas las observaciones, en orden. La primera es la que fijó `fecha`. */
  observaciones: ObservacionPendiente[];
};

/** Lo que aporta una observación nueva, sin las partes que sólo sabe el almacén (fechas, historial). */
export type ObservacionNueva = {
  id: string;
  nombreHerramienta: string;
  estado: EstadoPendiente;
  motivo: string;
  datosAfiliados: Partial<AffiliateData>;
  pruebaDeAusencia?: PruebaDeAusencia;
};

/** Un fichero que no se pudo leer, reportado individualmente para que no tumbe el listado entero. */
export type PendienteCorrupto = { fichero: string; error: string };

export type ListadoPendientes = { pendientes: HerramientaPendiente[]; corruptos: PendienteCorrupto[] };

const DIR_BORRADORES_POR_DEFECTO = path.join(process.cwd(), "data", "borradores");

function dirPendientes(dirBase: string): string {
  return path.join(dirBase, "pendientes");
}

/**
 * Ningún id puede salir de su carpeta.
 *
 * `generarId` ya devuelve kebab-case sin nada raro, pero estas funciones
 * son públicas y reciben ids de sitios que no pasan por ahí — el argumento
 * de una CLI, por ejemplo —, y un `..` construiría una ruta fuera de
 * `pendientes/`. Se valida en la frontera, no se confía en quien llama.
 */
function rutaDe(dirBase: string, id: string): string {
  if (!idEsValido(id)) {
    throw new Error(`Id de herramienta inválido: "${id}". Debe ser kebab-case (minúsculas, números y guiones).`);
  }
  return path.join(dirPendientes(dirBase), `${id}.json`);
}

/**
 * Cuál de los dos estados pesa más.
 *
 * `ausencia_demostrada` se apoya en una cita literal de una fuente
 * oficial; `no_consta` no se apoya en nada. Que una pasada posterior no
 * encuentre la cita no borra la que ya se leyó: puede ser que la página
 * cambiara, que el extractor fallara, o que se leyera otra URL.
 */
function esMasFuerte(candidato: EstadoPendiente, actual: EstadoPendiente): boolean {
  return candidato === "ausencia_demostrada" && actual === "no_consta";
}

/** Escritura atómica: se escribe a un temporal y se renombra, para que nadie llegue a ver medio fichero. */
function escribirAtomico(ruta: string, contenido: string): void {
  const temporal = `${ruta}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, contenido, "utf-8");
  fs.renameSync(temporal, ruta);
}

function leerFichero(ruta: string): HerramientaPendiente {
  const crudo = fs.readFileSync(ruta, "utf-8");
  try {
    return JSON.parse(crudo) as HerramientaPendiente;
  } catch (error) {
    throw new Error(`El pendiente "${path.basename(ruta)}" está corrupto y no se puede leer: ${(error as Error).message}`);
  }
}

/**
 * Anota una observación sobre una herramienta.
 *
 * Si ya había un pendiente, **fusiona en vez de sobrescribir**: conserva la
 * fecha original de espera, añade la observación al historial y sólo
 * cambia el estado vigente si la nueva observación es más fuerte. Una
 * `ausencia_demostrada` ya registrada nunca se degrada a `no_consta` ni
 * pierde su cita.
 */
export function registrarPendiente(observacion: ObservacionNueva, opciones: { dirBase?: string } = {}): HerramientaPendiente {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const ruta = rutaDe(dirBase, observacion.id);
  fs.mkdirSync(dirPendientes(dirBase), { recursive: true });

  const hoy = new Date().toISOString().slice(0, 10);
  const nueva: ObservacionPendiente = {
    fecha: hoy,
    estado: observacion.estado,
    motivo: observacion.motivo,
    ...(esPruebaDeAusenciaValida(observacion.pruebaDeAusencia) ? { pruebaDeAusencia: observacion.pruebaDeAusencia } : {}),
  };

  const previo = fs.existsSync(ruta) ? leerFichero(ruta) : undefined;

  if (!previo) {
    const registro: HerramientaPendiente = {
      id: observacion.id,
      nombreHerramienta: observacion.nombreHerramienta,
      estado: observacion.estado,
      motivo: observacion.motivo,
      datosAfiliados: observacion.datosAfiliados,
      ...(nueva.pruebaDeAusencia ? { pruebaDeAusencia: nueva.pruebaDeAusencia } : {}),
      fecha: hoy,
      fechaUltimaObservacion: hoy,
      observaciones: [nueva],
    };
    escribirAtomico(ruta, `${JSON.stringify(registro, null, 2)}\n`);
    return registro;
  }

  const sustituye = esMasFuerte(observacion.estado, previo.estado);
  const registro: HerramientaPendiente = {
    ...previo,
    nombreHerramienta: observacion.nombreHerramienta,
    estado: sustituye ? observacion.estado : previo.estado,
    motivo: sustituye ? observacion.motivo : previo.motivo,
    datosAfiliados: sustituye ? observacion.datosAfiliados : previo.datosAfiliados,
    // La cita sólo se mantiene o mejora, nunca desaparece.
    ...(sustituye && nueva.pruebaDeAusencia
      ? { pruebaDeAusencia: nueva.pruebaDeAusencia }
      : previo.pruebaDeAusencia
        ? { pruebaDeAusencia: previo.pruebaDeAusencia }
        : {}),
    fecha: previo.fecha,
    fechaUltimaObservacion: hoy,
    observaciones: [...(previo.observaciones ?? []), nueva],
  };
  escribirAtomico(ruta, `${JSON.stringify(registro, null, 2)}\n`);
  return registro;
}

/** Lee el pendiente de un id, o `undefined` si no hay ninguno. Un fichero corrupto lanza con su nombre dentro. */
export function leerPendiente(id: string, opciones: { dirBase?: string } = {}): HerramientaPendiente | undefined {
  const ruta = rutaDe(opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO, id);
  if (!fs.existsSync(ruta)) return undefined;
  return leerFichero(ruta);
}

/**
 * Todos los pendientes, ordenados por id, más los ficheros que no se
 * pudieron leer.
 *
 * Un fichero corrupto se reporta aparte y **no impide ver los demás**: el
 * listado es la pantalla por la que la propietaria se entera de qué está
 * esperando su decisión, y dejarla ciega por un fichero roto sería el peor
 * momento para fallar.
 */
export function listarPendientes(opciones: { dirBase?: string } = {}): ListadoPendientes {
  const dir = dirPendientes(opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO);
  if (!fs.existsSync(dir)) return { pendientes: [], corruptos: [] };

  const pendientes: HerramientaPendiente[] = [];
  const corruptos: PendienteCorrupto[] = [];

  for (const fichero of fs.readdirSync(dir).filter((n) => n.endsWith(".json")).sort()) {
    try {
      pendientes.push(leerFichero(path.join(dir, fichero)));
    } catch (error) {
      corruptos.push({ fichero, error: error instanceof Error ? error.message : String(error) });
    }
  }

  return { pendientes, corruptos };
}

/** Borra el pendiente de un id — se llama cuando ya se ha investigado y hay borrador. No falla si no existía. */
export function eliminarPendiente(id: string, opciones: { dirBase?: string } = {}): void {
  const ruta = rutaDe(opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO, id);
  if (fs.existsSync(ruta)) fs.rmSync(ruta);
}
