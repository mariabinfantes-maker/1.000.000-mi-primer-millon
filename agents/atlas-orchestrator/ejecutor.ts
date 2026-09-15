import { execFile } from "node:child_process";
import path from "node:path";
import { exigirArgumentosValidos } from "./carriles";
import {
  marcarTerminada,
  reclamarSiguiente,
  type OpcionesRepositorio,
  type Solicitud,
  type SolicitudInvalida,
} from "./repositorio";
import { tareaDe, type Tarea } from "./tareas";

/**
 * El que aprieta el botón. Es el sitio donde más cuidado hace falta, así
 * que hace lo mínimo y lo hace explícito.
 *
 * ── Cómo se lanza un proceso, y por qué así ───────────────────────────
 *
 * `execFile` con `shell: false`: **no hay intérprete de comandos en
 * ningún punto**. No es que se escapen bien las comillas — es que no hay
 * nada que las interprete. Un `; rm -rf /` guardado en la base de datos
 * llegaría al programa como un argumento literal y feo, no como una orden.
 *
 * Y lo que se lanza no es `npm run <algo>`, sino `node tsx <fichero>`, con
 * el fichero escrito en `tareas.ts`. Dos razones:
 *
 * 1. `npm` es un `.cmd` en Windows, y Node se niega —con razón, desde la
 *    corrección de 2024— a ejecutar un `.cmd` sin pasar por el intérprete.
 *    Lanzarlo obligaría a poner `shell: true`, que es justo lo que no
 *    queremos. Llamando a `process.execPath` (el mismo Node que ya corre)
 *    esto funciona igual en Windows, en macOS y en Linux.
 * 2. Lo que se ejecuta queda escrito en el código y se lee línea a línea,
 *    en vez de depender de resolver un nombre de script en tiempo de
 *    ejecución. Una prueba comprueba que `tarea.modulo` es exactamente lo
 *    que hace `npm run <tarea.script>`, para que no puedan separarse.
 *
 * ── La segunda puerta ─────────────────────────────────────────────────
 *
 * El carril se comprueba **otra vez** aquí, después de reclamar la fila.
 * Ya se comprobó al crearla, y se vuelve a comprobar porque entre las dos
 * cosas hay una base de datos. Si una fila de `conPermiso` apareciera como
 * ejecutable sin firma —un error, una mano ajena—, aquí se rechaza. Es la
 * comprobación que espero no ver saltar nunca.
 */

const CLI_TSX = path.join("node_modules", "tsx", "dist", "cli.mjs");

/** Media hora. Un informe tarda segundos; una investigación, minutos. Lo que pase de aquí está colgado. */
export const TIEMPO_MAXIMO_MS = 30 * 60 * 1000;

const MAXIMO_SALIDA_BYTES = 4 * 1024 * 1024;

export type ResultadoEjecucion = {
  ok: boolean;
  codigoSalida: number | null;
  salida: string;
};

export type OpcionesEjecucion = {
  /** La raíz del repositorio. Se inyecta en las pruebas; en producción es el directorio de trabajo. */
  raiz?: string;
  tiempoMaximoMs?: number;
  /** Sustituye el lanzamiento real. Sólo para pruebas: así se comprueba QUÉ se lanzaría sin lanzarlo. */
  lanzar?: (ejecutable: string, argumentos: string[], opciones: { cwd: string }) => Promise<ResultadoEjecucion>;
};

/** Lo que se lanzaría, sin lanzarlo. Existe para que una prueba pueda leerlo. */
export function comandoDe(tarea: Tarea, argumentos: readonly string[], raiz: string = process.cwd()) {
  return {
    ejecutable: process.execPath,
    argumentos: [path.join(raiz, CLI_TSX), path.join(raiz, tarea.modulo), ...exigirArgumentosValidos(tarea, argumentos)],
  };
}

function lanzarDeVerdad(
  ejecutable: string,
  argumentos: string[],
  opciones: { cwd: string; tiempoMaximoMs: number }
): Promise<ResultadoEjecucion> {
  return new Promise((resolver) => {
    execFile(
      ejecutable,
      argumentos,
      {
        cwd: opciones.cwd,
        shell: false,
        timeout: opciones.tiempoMaximoMs,
        maxBuffer: MAXIMO_SALIDA_BYTES,
        env: process.env,
      },
      (error, salidaEstandar, salidaError) => {
        const salida = [salidaEstandar, salidaError].filter(Boolean).join("\n").trim();
        if (!error) return resolver({ ok: true, codigoSalida: 0, salida });
        const codigo = typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : null;
        resolver({ ok: false, codigoSalida: codigo, salida: salida || error.message });
      }
    );
  });
}

/** Lanza una tarea del catálogo. No consulta la base de datos ni decide si debía lanzarse: eso ya está decidido. */
export async function ejecutarTarea(
  tarea: Tarea,
  argumentos: readonly string[] = [],
  opciones: OpcionesEjecucion = {}
): Promise<ResultadoEjecucion> {
  const raiz = opciones.raiz ?? process.cwd();
  const { ejecutable, argumentos: argv } = comandoDe(tarea, argumentos, raiz);
  if (opciones.lanzar) return opciones.lanzar(ejecutable, argv, { cwd: raiz });
  return lanzarDeVerdad(ejecutable, argv, { cwd: raiz, tiempoMaximoMs: opciones.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS });
}

export type Ejecutada = {
  solicitud: Solicitud;
  resultado?: ResultadoEjecucion;
  /** Presente si no llegó a ejecutarse. Dice por qué. */
  rechazo?: string;
};

/** Una fila que ni siquiera pudo leerse. Ya quedó cerrada y anotada; se devuelve para poder contarla. */
export type Descartada = { invalida: SolicitudInvalida };

export type Paso = Ejecutada | Descartada;

export function esDescartada(paso: Paso): paso is Descartada {
  return "invalida" in paso;
}

/**
 * Reclama la siguiente solicitud ejecutable y la ejecuta. Devuelve
 * `undefined` si no había ninguna.
 *
 * Entre reclamar y terminar hay un proceso hijo que puede tardar minutos.
 * Si esta máquina se apaga en ese hueco, la fila se queda en `en_curso`
 * con su asiento `reclamada` en la bitácora y **nadie la vuelve a coger**:
 * `reclamarSiguiente` sólo mira `lista` y `autorizada`. Queda registrada y
 * espera a una persona, que es exactamente lo que se pidió.
 *
 * Una fila que no se puede leer ya viene cerrada y anotada del
 * repositorio: aquí sólo se cuenta y se sigue con la siguiente. Nunca
 * detiene la pasada.
 */
export async function ejecutarSiguiente(
  ejecucionId: string,
  opciones: OpcionesEjecucion & OpcionesRepositorio = {}
): Promise<Paso | undefined> {
  const reclamada = await reclamarSiguiente(ejecucionId, opciones);
  if (!reclamada) return undefined;
  if (!reclamada.ok) {
    return { invalida: { id: reclamada.id, tareaId: reclamada.tareaId, explicacion: reclamada.explicacion } };
  }

  const solicitud = reclamada.solicitud;
  // `solicitud.carril` viene de `tareas.ts`, no de la fila: el repositorio
  // lo deriva al leer. Aun así se vuelve a mirar aquí, que es donde se
  // aprieta el botón, para que la comprobación esté junto a la acción.
  const tarea = tareaDe(solicitud.tareaId)!;

  if (tarea.carril === "conPermiso" && !solicitud.autorizadaEn) {
    const rechazo = `"${tarea.id}" necesita la firma de la propietaria y la solicitud no la tiene. No se ejecuta.`;
    await marcarTerminada(solicitud.id, "rechazada", ejecucionId, { resultado: rechazo }, opciones);
    return { solicitud, rechazo };
  }

  const resultado = await ejecutarTarea(tarea, solicitud.argumentos, opciones);
  await marcarTerminada(
    solicitud.id,
    resultado.ok ? "completada" : "fallida",
    ejecucionId,
    { resultado: resultado.salida.slice(0, 4000) },
    opciones
  );
  return { solicitud, resultado };
}
