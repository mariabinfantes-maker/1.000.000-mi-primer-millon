import fs from "node:fs";
import path from "node:path";
import type { EstadoAfiliacion } from "./estadoAfiliacion";
import { idEsValido } from "./id";

/**
 * La autorización de la propietaria para seguir adelante con una
 * herramienta **pese a su afiliación**.
 *
 * Es un registro aparte de `decision.ts` a propósito, y la diferencia es
 * justo lo que hacía falta arreglar. La decisión editorial dice «esta
 * ficha es lo bastante buena para el catálogo»; podía estar registrada
 * meses antes, por un motivo que no tenía nada que ver, y servía igual
 * para desbloquear la excepción de afiliación. Eso no es una autorización
 * a la excepción: es una firma reaprovechada.
 *
 * Esta sí está atada a tres cosas a la vez:
 *
 * 1. **La herramienta concreta** — un id, no una política general.
 * 2. **El estado de afiliación exacto** que se autorizó. Si la herramienta
 *    pasa de `no_consta` a `ausencia_demostrada`, o al revés, la
 *    autorización deja de cubrirla: lo que se autorizó ya no es lo que hay.
 * 3. **Un motivo escrito de verdad**, no un carácter suelto.
 *
 * Vive en `data/borradores/autorizaciones-afiliacion/{id}.json`.
 */

/** Sólo se autoriza lo que no está confirmado: una afiliación confirmada no necesita excepción. */
export type EstadoAutorizable = Exclude<EstadoAfiliacion, "confirmada">;

export type AutorizacionAfiliacion = {
  id: string;
  /** El estado que se autorizó. La autorización sólo vale mientras el estado siga siendo éste. */
  estadoAutorizado: EstadoAutorizable;
  /** Por qué: cubre un hueco del catálogo, o demuestra una ventaja material. Queda en el historial de promoción. */
  motivo: string;
  /** ISO 8601 (YYYY-MM-DD). */
  fecha: string;
};

/**
 * Longitud mínima del motivo.
 *
 * La revisión encontró que `--motivo-sin-afiliacion "x"` pasaba el filtro
 * de "justificación obligatoria". Un motivo tiene que poder leerse dentro
 * de seis meses y explicar la decisión a quien no estaba.
 */
export const LONGITUD_MINIMA_MOTIVO = 20;

const DIR_BORRADORES_POR_DEFECTO = path.join(process.cwd(), "data", "borradores");

function dirAutorizaciones(dirBase: string): string {
  return path.join(dirBase, "autorizaciones-afiliacion");
}

/** Misma validación de frontera que en `pendientes.ts`: ningún id construye una ruta fuera de su carpeta. */
function rutaDe(dirBase: string, id: string): string {
  if (!idEsValido(id)) {
    throw new Error(`Id de herramienta inválido: "${id}". Debe ser kebab-case (minúsculas, números y guiones).`);
  }
  return path.join(dirAutorizaciones(dirBase), `${id}.json`);
}

function escribirAtomico(ruta: string, contenido: string): void {
  const temporal = `${ruta}.tmp-${process.pid}`;
  fs.writeFileSync(temporal, contenido, "utf-8");
  fs.renameSync(temporal, ruta);
}

/** Registra la autorización. Lanza si el motivo no llega al mínimo: un motivo vacío no es una justificación. */
export function registrarAutorizacionAfiliacion(
  id: string,
  estadoAutorizado: EstadoAutorizable,
  motivo: string,
  opciones: { dirBase?: string } = {}
): AutorizacionAfiliacion {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const ruta = rutaDe(dirBase, id);

  const limpio = motivo.trim();
  if (limpio.length < LONGITUD_MINIMA_MOTIVO) {
    throw new Error(
      `El motivo de la autorización debe tener al menos ${LONGITUD_MINIMA_MOTIVO} caracteres. ` +
        "Explica qué hueco cubre o qué ventaja material demuestra."
    );
  }

  fs.mkdirSync(dirAutorizaciones(dirBase), { recursive: true });
  const registro: AutorizacionAfiliacion = {
    id,
    estadoAutorizado,
    motivo: limpio,
    fecha: new Date().toISOString().slice(0, 10),
  };
  escribirAtomico(ruta, `${JSON.stringify(registro, null, 2)}\n`);
  return registro;
}

/** Lee la autorización de un id, o `undefined` si no hay ninguna. Un fichero corrupto lanza con su nombre dentro. */
export function leerAutorizacionAfiliacion(
  id: string,
  opciones: { dirBase?: string } = {}
): AutorizacionAfiliacion | undefined {
  const ruta = rutaDe(opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO, id);
  if (!fs.existsSync(ruta)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf-8")) as AutorizacionAfiliacion;
  } catch (error) {
    throw new Error(
      `La autorización "${path.basename(ruta)}" está corrupta y no se puede leer: ${(error as Error).message}`
    );
  }
}

export type ResultadoAutorizacion =
  | { autorizada: true; motivo: string }
  | { autorizada: false; explicacion: string };

/**
 * ¿Puede esta herramienta seguir adelante con el estado de afiliación que
 * tiene ahora mismo?
 *
 * Es la única puerta que abre la excepción, y la comparten los tres
 * caminos: el lote, `investigar-pendiente` y `investigar-herramienta`. Una
 * `confirmada` no necesita autorización; cualquier otra cosa sí, y tiene
 * que ser para ese estado exacto.
 */
export function comprobarAutorizacion(
  id: string,
  estadoActual: EstadoAfiliacion,
  opciones: { dirBase?: string } = {}
): ResultadoAutorizacion {
  if (estadoActual === "confirmada") return { autorizada: true, motivo: "Afiliación confirmada: no hace falta excepción." };

  const autorizacion = leerAutorizacionAfiliacion(id, opciones);
  if (!autorizacion) {
    return {
      autorizada: false,
      explicacion:
        `"${id}" tiene la afiliación en "${estadoActual}" y no hay ninguna autorización registrada para esa excepción. ` +
        `Regístrala con: npm run autorizar-afiliacion -- ${id} --motivo "..."`,
    };
  }

  if (autorizacion.estadoAutorizado !== estadoActual) {
    return {
      autorizada: false,
      explicacion:
        `La autorización de "${id}" se dio para el estado "${autorizacion.estadoAutorizado}", ` +
        `pero ahora la afiliación está en "${estadoActual}". Lo autorizado ya no es lo que hay: vuelve a autorizarlo.`,
    };
  }

  return { autorizada: true, motivo: autorizacion.motivo };
}
