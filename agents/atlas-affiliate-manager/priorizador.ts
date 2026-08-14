import type { Herramienta } from "@/data/esquema";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";

/**
 * Prioriza qué cuentas "no_solicitado" merecen el próximo rato de gestión
 * manual. Deliberadamente NO calcula un número de "valor estimado" que
 * mezcle comisión y puntuación: la comisión investigada es texto libre
 * heterogéneo ("15% recurrente", "40-50% lifetime", "hasta 100% primer
 * pago"...) y convertirlo en una única cifra sería inventar precisión que
 * no existe — Atlas nunca inventa métricas.
 *
 * En su lugar, ordena por Puntuación Atlas (`lib/puntuacionAtlas.ts`) —
 * una señal ya real y calculada, proxy razonable de cuánto se recomienda y
 * se hace clic en cada herramienta — y muestra la comisión tal cual se
 * investigó, para que la decisión final la tome una persona.
 */

export type CuentaPriorizada = {
  herramientaId: string;
  nombreHerramienta: string;
  cuentaId: string;
  plataforma: string;
  nombrePrograma?: string;
  comision?: string;
  puntuacionAtlas: number | null;
};

export function priorizarCuentasPendientesDeSolicitud(
  estrategias: EstrategiaAfiliacion[],
  herramientas: Herramienta[]
): CuentaPriorizada[] {
  const porId = new Map(herramientas.map((h) => [h.id, h]));
  const candidatas: CuentaPriorizada[] = [];

  for (const estrategia of estrategias) {
    const herramienta = porId.get(estrategia.herramientaId);

    for (const cuenta of estrategia.cuentas) {
      if (cuenta.estado !== "no_solicitado") continue;

      candidatas.push({
        herramientaId: estrategia.herramientaId,
        nombreHerramienta: herramienta?.nombre ?? estrategia.herramientaId,
        cuentaId: cuenta.id,
        plataforma: cuenta.plataforma,
        nombrePrograma: cuenta.nombrePrograma,
        comision: cuenta.comision,
        puntuacionAtlas: herramienta ? (calcularPuntuacionAtlas(herramienta)?.puntuacion ?? null) : null,
      });
    }
  }

  return candidatas.sort((a, b) => (b.puntuacionAtlas ?? -1) - (a.puntuacionAtlas ?? -1));
}
