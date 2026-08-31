import type { AffiliateData } from "@/data/esquemaInterno";

/**
 * Puente entre `data/esquemaInterno.ts` y el prompt de investigación,
 * espejo de `camposEsquema.ts` pero para la sección interna de afiliación
 * — deliberadamente en un archivo separado, igual que `AffiliateData` vive
 * en un esquema separado de `Herramienta`.
 *
 * `Record<keyof AffiliateData, string>` obliga a que este archivo se
 * actualice si `AffiliateData` gana o pierde un campo.
 */

/** Campos que gestiona Atlas, no la IA: la referencia a la herramienta y la fecha de comprobación se estampan en el código, nunca los investiga el proveedor de IA. */
const CAMPOS_GESTIONADOS_POR_ATLAS = new Set<keyof AffiliateData>(["herramientaId", "lastAffiliateCheck"]);

/** Campos opcionales: pueden faltar sin contar como "campo faltante" en la comprobación genérica. */
const CAMPOS_OPCIONALES = new Set<keyof AffiliateData>([
  "affiliateProgramName",
  "cookieDuration",
  "payoutMethod",
  "payoutFrequency",
  "countriesAvailable",
]);

export const DESCRIPCION_CAMPOS_AFILIADOS: Record<keyof AffiliateData, string> = {
  herramientaId: "Identificador interno (lo asigna Atlas, no lo investigues).",
  hasAffiliateProgram: "true/false: si existe un programa de afiliados activo (no de partners/revendedores, salvo que sea el único que exista).",
  affiliateProgramName: "Nombre del programa, si tiene uno propio (ej. \"HubSpot Affiliate Program\").",
  affiliatePlatform:
    'Dónde se gestiona: "PartnerStack", "Impact", "CJ Affiliate", "ShareASale", "Rewardful", "FirstPromoter", "Programa propio", etc.',
  affiliateUrl: "URL oficial del programa de afiliados.",
  commission: 'El valor concreto de la comisión, en texto libre (ej. "30% recurrente durante 12 meses", "40€ fijos por venta").',
  cookieDuration:
    'Cuánto dura la atribución de la venta: normalmente la cookie (ej. "30 días", "90 días"), ' +
    'pero NO siempre hay cookie ni plazo. Si el programa ancla la atribución a la cuenta o al correo ' +
    'del cliente registrado y no caduca, responde "Permanente — sin caducidad". No inventes un número ' +
    'de días para que encaje: pedir la respuesta solo en días hizo que se anotara "365 días" en un ' +
    'programa cuya atribución es permanente.',
  approvalRequired: "true/false: si la inscripción requiere que la empresa apruebe cada solicitud, o es abierta para cualquiera.",
  payoutMethod: 'Formas de cobro disponibles (ej. "PayPal, transferencia bancaria"), si lo encuentras.',
  payoutFrequency: 'Con qué frecuencia se paga (ej. "Mensual", "Neto 30 días"), si lo encuentras.',
  countriesAvailable: 'Países donde se puede participar. Usa ["Global"] si no hay restricción conocida.',
  affiliateStatus: '"active" si el programa está activo, "not_available" si no existe o está descontinuado.',
  lastAffiliateCheck: "Fecha de la comprobación (la asigna Atlas, no la investigues).",
  confidenceLevel: '"low", "medium" o "high": qué tan fiable es TODA esta información, no solo si visitaste affiliateUrl.',
  source: "URL o referencia concreta de donde sacaste estos datos de afiliación.",
};

/** Campos que sí tiene sentido pedirle al proveedor de IA. */
export const CAMPOS_INVESTIGABLES_AFILIADOS = (
  Object.keys(DESCRIPCION_CAMPOS_AFILIADOS) as (keyof AffiliateData)[]
).filter((campo) => !CAMPOS_GESTIONADOS_POR_ATLAS.has(campo));

/** De los investigables, los que cuentan como "campo faltante" en una comprobación incompleta. */
export const CAMPOS_INVESTIGABLES_AFILIADOS_OBLIGATORIOS = CAMPOS_INVESTIGABLES_AFILIADOS.filter(
  (campo) => !CAMPOS_OPCIONALES.has(campo)
);
