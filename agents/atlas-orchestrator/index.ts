import { randomUUID } from "node:crypto";
import { explicarMotivo } from "./carriles";
import { ejecutarSiguiente, type Ejecutada, type OpcionesEjecucion } from "./ejecutor";
import { planificar, type Propuesta } from "./planificador";
import {
  crearSolicitud,
  haySolicitudViva,
  listarInterrumpidas,
  listarPorEstado,
  ultimasEjecuciones,
  type OpcionesRepositorio,
  type Solicitud,
} from "./repositorio";

/**
 * Atlas Orchestrator — una pasada completa.
 *
 * El orden importa y es éste:
 *
 * 1. **Mirar lo que quedó a medias.** Se enseña, no se toca. Una ejecución
 *    cortada no se reintenta sola ni aquí ni en ningún sitio.
 * 2. **Planificar.** Qué toca según la cadencia y la última vez que salió
 *    bien.
 * 3. **Crear las solicitudes que falten.** Las del carril libre nacen
 *    listas; las que gastan dinero o escriben datos nacen esperando firma
 *    y **ahí se quedan**. No hay plazo tras el cual se ejecuten igual: el
 *    silencio no es permiso.
 * 4. **Ejecutar lo ejecutable.** Una a una, reclamando cada fila de forma
 *    atómica.
 *
 * Lo que no hace, y no es un olvido: no firma autorizaciones, no las pide
 * por su cuenta a nadie, y no decide que algo urgente puede saltarse el
 * paso 3. Firmar es del bloque 2, y es de la propietaria.
 */

export type ResumenPasada = {
  ejecucionId: string;
  /** Reclamadas en una pasada anterior que nunca terminaron. Sólo informativo. */
  interrumpidas: Solicitud[];
  propuestas: Propuesta[];
  creadas: Solicitud[];
  /** Ya había una solicitud viva idéntica: no se duplica. */
  yaEstaban: Propuesta[];
  ejecutadas: Ejecutada[];
  /** Lo que está esperando la firma de la propietaria, después de la pasada. */
  esperandoFirma: Solicitud[];
};

export type OpcionesPasada = OpcionesRepositorio &
  OpcionesEjecucion & {
    ahora?: Date;
    /** Planifica y crea solicitudes, pero no ejecuta nada. */
    soloPlanificar?: boolean;
    /** Tope de tareas por pasada. Una red de seguridad, no una política. */
    maximoEjecuciones?: number;
  };

export const MAXIMO_EJECUCIONES_POR_PASADA = 20;

export async function orquestar(opciones: OpcionesPasada = {}): Promise<ResumenPasada> {
  const ejecucionId = randomUUID();
  const ahora = opciones.ahora ?? new Date();

  const interrumpidas = await listarInterrumpidas(opciones);

  const propuestas = planificar(await ultimasEjecuciones(opciones), ahora);

  const creadas: Solicitud[] = [];
  const yaEstaban: Propuesta[] = [];
  for (const propuesta of propuestas) {
    if (await haySolicitudViva(propuesta.tarea.id, [], opciones)) {
      yaEstaban.push(propuesta);
      continue;
    }
    creadas.push(
      await crearSolicitud({ tareaId: propuesta.tarea.id, porQue: propuesta.porQue }, opciones)
    );
  }

  const ejecutadas: Ejecutada[] = [];
  if (!opciones.soloPlanificar) {
    const tope = opciones.maximoEjecuciones ?? MAXIMO_EJECUCIONES_POR_PASADA;
    for (let i = 0; i < tope; i++) {
      const ejecutada = await ejecutarSiguiente(ejecucionId, opciones);
      if (!ejecutada) break;
      ejecutadas.push(ejecutada);
    }
  }

  const esperandoFirma = await listarPorEstado(["esperando_autorizacion"], opciones);

  return { ejecucionId, interrumpidas, propuestas, creadas, yaEstaban, ejecutadas, esperandoFirma };
}

/** El resumen en palabras, para la consola y —más adelante— para el panel. */
export function describirPasada(resumen: ResumenPasada): string[] {
  const lineas: string[] = [];

  if (resumen.interrumpidas.length) {
    lineas.push(`⚠ ${resumen.interrumpidas.length} ejecución(es) quedaron a medias y NO se reintentan solas:`);
    for (const s of resumen.interrumpidas) {
      lineas.push(`   · #${s.id} ${s.tareaId} — reclamada el ${s.reclamadaEn?.toISOString().slice(0, 16).replace("T", " ")}`);
    }
    lineas.push("   Míralas antes de volver a pedirlas: no se sabe hasta dónde llegaron.");
  }

  lineas.push(`Propuestas: ${resumen.propuestas.length} · nuevas: ${resumen.creadas.length} · ya estaban: ${resumen.yaEstaban.length}`);

  for (const ejecutada of resumen.ejecutadas) {
    if (ejecutada.rechazo) {
      lineas.push(`✗ #${ejecutada.solicitud.id} ${ejecutada.solicitud.tareaId} — no se ejecutó: ${ejecutada.rechazo}`);
    } else if (ejecutada.resultado?.ok) {
      lineas.push(`✓ #${ejecutada.solicitud.id} ${ejecutada.solicitud.tareaId}`);
    } else {
      lineas.push(`✗ #${ejecutada.solicitud.id} ${ejecutada.solicitud.tareaId} — salió con error`);
    }
  }

  if (resumen.esperandoFirma.length) {
    lineas.push("");
    lineas.push(`Esperando tu autorización (${resumen.esperandoFirma.length}). No se harán hasta que las firmes:`);
    for (const s of resumen.esperandoFirma) {
      lineas.push(`   · #${s.id} ${s.tareaId} — ${explicarMotivo(s.motivo)}`);
    }
  }

  return lineas;
}

export * from "./tareas";
export * from "./carriles";
export * from "./planificador";
