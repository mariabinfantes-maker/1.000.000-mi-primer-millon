import fs from "node:fs";
import path from "node:path";
import type { AffiliateData } from "@/data/esquemaInterno";
import type { EstadoAfiliacion, PruebaDeAusencia } from "./estadoAfiliacion";

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
 * `decisiones/`, `herramientas/` y `afiliados/`, y con la misma convención
 * que `decision.ts`: un archivo por id, sobrescribible, legible con un
 * `JSON.parse` sin tener que listar ni ordenar nada.
 *
 * Un pendiente NO es un descarte ni un borrador: es una candidata
 * investigada a medias a propósito, que se ha parado antes de gastar la
 * investigación completa porque la decisión de seguir es humana. Se
 * guarda lo poco que ya costó averiguar (los cuatro campos del
 * prechequeo) para no volver a pagarlo.
 */

export type HerramientaPendiente = {
  id: string;
  nombreHerramienta: string;
  /** En cuál de los tres estados quedó la afiliación. Nunca "confirmada": eso sigue de largo a la investigación completa. */
  estado: Exclude<EstadoAfiliacion, "confirmada">;
  /** Texto legible de por qué está aquí, tal y como lo redacta `describirEstadoAfiliacion`. */
  motivo: string;
  /** Lo que el prechequeo ya averiguó. Se conserva para no repetir la llamada al decidir. */
  datosAfiliados: Partial<AffiliateData>;
  /** Sólo en `ausencia_demostrada`: la cita oficial que lo demuestra. */
  pruebaDeAusencia?: PruebaDeAusencia;
  /** ISO 8601 (YYYY-MM-DD). */
  fecha: string;
};

const DIR_BORRADORES_POR_DEFECTO = path.join(process.cwd(), "data", "borradores");

function dirPendientes(dirBase: string): string {
  return path.join(dirBase, "pendientes");
}

/** Registra (o sobrescribe) el pendiente de una candidata. Devuelve lo escrito. */
export function registrarPendiente(
  pendiente: Omit<HerramientaPendiente, "fecha">,
  opciones: { dirBase?: string } = {}
): HerramientaPendiente {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const dir = dirPendientes(dirBase);
  fs.mkdirSync(dir, { recursive: true });

  const registro: HerramientaPendiente = { ...pendiente, fecha: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(path.join(dir, `${pendiente.id}.json`), `${JSON.stringify(registro, null, 2)}\n`, "utf-8");
  return registro;
}

/** Lee el pendiente de un id, o `undefined` si no hay ninguno. */
export function leerPendiente(id: string, opciones: { dirBase?: string } = {}): HerramientaPendiente | undefined {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const ruta = path.join(dirPendientes(dirBase), `${id}.json`);
  if (!fs.existsSync(ruta)) return undefined;
  return JSON.parse(fs.readFileSync(ruta, "utf-8")) as HerramientaPendiente;
}

/** Todos los pendientes, ordenados por id para que el listado sea estable entre ejecuciones. */
export function listarPendientes(opciones: { dirBase?: string } = {}): HerramientaPendiente[] {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const dir = dirPendientes(dirBase);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((nombre) => nombre.endsWith(".json"))
    .sort()
    .map((nombre) => JSON.parse(fs.readFileSync(path.join(dir, nombre), "utf-8")) as HerramientaPendiente);
}

/** Borra el pendiente de un id — se llama cuando ya se ha investigado y hay borrador. No falla si no existía. */
export function eliminarPendiente(id: string, opciones: { dirBase?: string } = {}): void {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const ruta = path.join(dirPendientes(dirBase), `${id}.json`);
  if (fs.existsSync(ruta)) fs.rmSync(ruta);
}
