import type { Herramienta } from "@/data/esquema";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { diasEntre } from "@/agents/compartido/fechas";

/**
 * Detección de frescura del catálogo — Capa 1 de Atlas Mantenimiento:
 * determinista, sin IA, sin coste. Solo detecta y explica; nunca decide
 * qué hacer ni modifica ningún dato — ese es el trabajo de una futura
 * Capa 2, con re-investigación asistida por IA y aprobación humana antes
 * de aplicar cualquier cambio a una ficha ya publicada.
 *
 * Mismo patrón que `agents/atlas-affiliate-manager/consistencia.ts`: lógica
 * pura, sin `node:fs`, para poder probarla sin depender de
 * `data/herramientas/` ni `data/estrategia-afiliados/` ni del reloj real.
 */

export type AvisoFrescura = {
  herramientaId: string;
  /** Presente solo en avisos sobre una cuenta de afiliado concreta, no sobre la ficha de la herramienta. */
  cuentaId?: string;
  dias: number;
  mensaje: string;
};

/**
 * Los precios y funciones de un software no cambian cada semana: 180 días
 * (~6 meses) evita generar ruido en el informe sin dejar que una ficha
 * lleve años sin revisarse.
 */
export const DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO = 180;
export const DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO = 180;

/**
 * Herramientas activas cuya `fechaUltimaRevision` supera el umbral — sus
 * datos (precio, funciones, puntuaciones) pueden haber quedado
 * desactualizados. Ignora las herramientas `descontinuado` o `en_revision`:
 * ya están fuera de circulación o ya se están revisando.
 */
export function detectarHerramientasDesactualizadas(
  herramientas: Herramienta[],
  hoy: string,
  umbralDias: number = DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO
): AvisoFrescura[] {
  const avisos: AvisoFrescura[] = [];

  for (const herramienta of herramientas) {
    if (herramienta.estado !== "activo") continue;

    const dias = diasEntre(hoy, herramienta.fechaUltimaRevision);
    if (dias !== null && dias >= umbralDias) {
      avisos.push({
        herramientaId: herramienta.id,
        dias,
        mensaje:
          `"${herramienta.nombre}" no se revisa desde hace ${dias} días — sus datos (precio, funciones, ` +
          `puntuaciones) pueden estar desactualizados.`,
      });
    }
  }

  return avisos;
}

/**
 * Cuentas de afiliado en estado "activo" cuya `ultimaRevision` supera el
 * umbral — a diferencia de `detectarCuentasEstancadas` (que solo mira
 * cuentas "pendiente"), esto cubre un hueco distinto: comprobar que un
 * programa de afiliados que sí genera comisión hoy sigue vivo, no que una
 * solicitud sin responder necesita seguimiento.
 */
export function detectarCuentasActivasDesactualizadas(
  estrategias: EstrategiaAfiliacion[],
  hoy: string,
  umbralDias: number = DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO
): AvisoFrescura[] {
  const avisos: AvisoFrescura[] = [];

  for (const estrategia of estrategias) {
    for (const cuenta of estrategia.cuentas) {
      if (cuenta.estado !== "activo") continue;

      const dias = diasEntre(hoy, cuenta.ultimaRevision);
      if (dias !== null && dias >= umbralDias) {
        avisos.push({
          herramientaId: estrategia.herramientaId,
          cuentaId: cuenta.id,
          dias,
          mensaje:
            `"${estrategia.herramientaId}" tiene la cuenta "${cuenta.id}" (${cuenta.plataforma}) activa desde hace ` +
            `${dias} días sin revisión — comprobar que el programa de afiliados sigue vivo.`,
        });
      }
    }
  }

  return avisos;
}
