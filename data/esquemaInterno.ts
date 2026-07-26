/**
 * Esquema INTERNO de Atlas — datos de afiliación.
 *
 * Deliberadamente separado de `data/esquema.ts` (el esquema PÚBLICO de
 * `Herramienta`): `Herramienta` no tiene ningún campo de afiliación, y
 * nada de lo que hay aquí debe mezclarse con la ficha pública de una
 * herramienta ni mostrarse al usuario final, salvo que en el futuro se
 * indique expresamente lo contrario. Es de uso exclusivo de los agentes
 * internos de Atlas — hoy, Atlas Researcher.
 *
 * También vive en un directorio de datos distinto (`data/afiliados/`,
 * gestionado por `data/repositorioAfiliados.ts`, no por
 * `data/repositorio.ts`): así ningún import del catálogo público, del
 * motor de recomendaciones o de la interfaz puede arrastrar información de
 * afiliación por accidente. La separación es estructural, no solo una
 * cuestión de no mostrarlo en pantalla.
 */

/** Estado del programa de afiliados desde el punto de vista de Atlas. */
export type AffiliateStatus = "active" | "not_available";

export type AffiliateData = {
  /** Referencia a Herramienta.id — así se puede cruzar con la ficha pública sin mezclar ambos objetos. */
  herramientaId: string;

  hasAffiliateProgram: boolean;
  affiliateProgramName?: string;
  affiliatePlatform?: string;
  affiliateUrl?: string;
  commission?: string;
  cookieDuration?: string;
  approvalRequired?: boolean;
  payoutMethod?: string;
  payoutFrequency?: string;
  countriesAvailable?: string[];
  affiliateStatus: AffiliateStatus;
  /** ISO 8601 (YYYY-MM-DD). Lo estampa Atlas automáticamente cada vez que se comprueba — no lo investiga el proveedor de IA. */
  lastAffiliateCheck: string;

  /** Qué tan fiable es esta información en su conjunto (no solo si se visitó affiliateUrl). */
  confidenceLevel?: "low" | "medium" | "high";
  /** URL o referencia concreta de donde se sacaron estos datos. */
  source?: string;
};
