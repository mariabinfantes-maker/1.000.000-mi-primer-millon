import type { Herramienta } from "@/data/esquema";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * Detección de cobertura — carencia identificada en la auditoría de
 * Affiliate Manager (2026-08-25): `priorizador.ts` solo prioriza cuentas
 * que YA existen en estado "no_solicitado". Si una herramienta del
 * catálogo nunca llegó a tener ninguna `EstrategiaAfiliacion` creada, no
 * aparece en ningún informe ni en ningún sitio del sistema — invisible.
 *
 * Deliberadamente NO decide si esa herramienta tiene o no un programa de
 * afiliados fiable — eso ya lo decidió Researcher durante la investigación
 * (`prechequeoAfiliados.ts`, `AffiliateData.hasAffiliateProgram`), antes de
 * que la herramienta entrara al catálogo. Este módulo solo cruza "qué hay
 * en el catálogo" contra "qué tiene ya una estrategia registrada" — nunca
 * vuelve a preguntar si el programa existe, para no duplicar esa función.
 */

export type HerramientaSinEstrategia = {
  herramientaId: string;
  nombre: string;
};

export function detectarHerramientasSinEstrategia(
  herramientas: Herramienta[],
  estrategias: EstrategiaAfiliacion[]
): HerramientaSinEstrategia[] {
  const idsConEstrategia = new Set(estrategias.filter((e) => e.cuentas.length > 0).map((e) => e.herramientaId));

  return herramientas
    .filter((herramienta) => !idsConEstrategia.has(herramienta.id))
    .map((herramienta) => ({ herramientaId: herramienta.id, nombre: herramienta.nombre }));
}
