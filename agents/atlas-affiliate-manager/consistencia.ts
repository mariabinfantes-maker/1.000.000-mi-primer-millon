import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { diasEntre } from "@/agents/compartido/fechas";

/**
 * Comprobaciones de consistencia sobre la estrategia de afiliación —
 * lógica pura, sin `node:fs`, para poder probarla sin depender de
 * `data/estrategia-afiliados/` ni del reloj real. Dos consumidores
 * distintos las reutilizan: `data/verificar.ts` (bloquea con exit 1 si hay
 * comisión que se está perdiendo) y el informe de prioridad
 * (`informe.ts`, solo lectura, nunca bloquea).
 */

export type AvisoConsistencia = {
  herramientaId: string;
  cuentaId: string;
  mensaje: string;
};

/**
 * Una cuenta "activo" sin ningún enlace no puede generar comisión — es un
 * error real, no un detalle cosmético (ver ATLAS.md, sección Affiliate
 * Manager): significa que Atlas ya está aprobado como afiliado pero el
 * redirect de producción (`elegirEnlaceAfiliado`) no tiene nada que servir
 * para esa cuenta.
 */
export function detectarCuentasActivasSinEnlace(estrategias: EstrategiaAfiliacion[]): AvisoConsistencia[] {
  const avisos: AvisoConsistencia[] = [];

  for (const estrategia of estrategias) {
    for (const cuenta of estrategia.cuentas) {
      if (cuenta.estado === "activo" && cuenta.enlaces.length === 0) {
        avisos.push({
          herramientaId: estrategia.herramientaId,
          cuentaId: cuenta.id,
          mensaje:
            `"${estrategia.herramientaId}" tiene la cuenta "${cuenta.id}" (${cuenta.plataforma}) activa pero sin ningún ` +
            `enlace de afiliado — no está generando comisión.`,
        });
      }
    }
  }

  return avisos;
}

export const DIAS_ESTANCAMIENTO_POR_DEFECTO = 60;

/**
 * Una cuenta "pendiente" es una solicitud enviada sin respuesta todavía.
 * Si `ultimaRevision` lleva más de `umbralDias` sin actualizarse, es
 * indistinguible de una olvidada — merece un seguimiento manual (escribir
 * a la plataforma, comprobar el estado). No es un error de datos: nunca
 * bloquea `verificar-datos`, solo se muestra en el informe.
 */
export function detectarCuentasEstancadas(
  estrategias: EstrategiaAfiliacion[],
  hoy: string,
  umbralDias: number = DIAS_ESTANCAMIENTO_POR_DEFECTO
): AvisoConsistencia[] {
  const avisos: AvisoConsistencia[] = [];

  for (const estrategia of estrategias) {
    for (const cuenta of estrategia.cuentas) {
      if (cuenta.estado !== "pendiente") continue;

      const dias = diasEntre(hoy, cuenta.ultimaRevision);
      if (dias !== null && dias >= umbralDias) {
        avisos.push({
          herramientaId: estrategia.herramientaId,
          cuentaId: cuenta.id,
          mensaje:
            `"${estrategia.herramientaId}" tiene la cuenta "${cuenta.id}" (${cuenta.plataforma}) pendiente desde hace ` +
            `${dias} días sin revisión — puede necesitar seguimiento.`,
        });
      }
    }
  }

  return avisos;
}
