import { CAMPOS_INVESTIGABLES, DESCRIPCION_CAMPOS } from "./camposEsquema";
import { CAMPOS_INVESTIGABLES_AFILIADOS, DESCRIPCION_CAMPOS_AFILIADOS } from "./camposAfiliados";
import type { SolicitudInvestigacion } from "./tipos";

/**
 * Construye el prompt de investigación a partir del esquema de Atlas.
 *
 * Es una función pura de texto: no llama a ningún proveedor de IA, así que
 * se puede probar por completo sin conexión a internet. El agente
 * (agente.ts) es quien decide a qué proveedor enviársela.
 *
 * Pide la información pública y la de afiliación bajo dos claves distintas
 * del mismo JSON ("datos" y "affiliateData") — nunca mezcladas en un
 * mismo objeto — reflejando la misma separación que ya existe en el
 * esquema (`data/esquema.ts` vs `data/esquemaInterno.ts`) y en la salida
 * del agente (`HerramientaPropuesta.datos` vs `.datosAfiliados`).
 */
export function construirPromptInvestigacion(solicitud: SolicitudInvestigacion): string {
  const listaCampos = CAMPOS_INVESTIGABLES.map((campo) => `- "${campo}": ${DESCRIPCION_CAMPOS[campo]}`).join("\n");
  const listaCamposAfiliados = CAMPOS_INVESTIGABLES_AFILIADOS.map(
    (campo) => `- "${campo}": ${DESCRIPCION_CAMPOS_AFILIADOS[campo]}`
  ).join("\n");

  const lineasContexto = [
    solicitud.categoriaId ? `Categoría conocida dentro de Atlas: "${solicitud.categoriaId}".` : null,
    solicitud.contextoAdicional ? `Contexto adicional del solicitante: ${solicitud.contextoAdicional}` : null,
  ].filter((linea): linea is string => Boolean(linea));

  return [
    "Eres Atlas Researcher, el agente de investigación de Atlas, un asesor de software para empresas.",
    "Investiga como lo haría un analista de software profesional: contrasta varias fuentes cuando puedas, " +
      "distingue hechos verificables de estimaciones, y sé especialmente riguroso con precios, comisiones de " +
      "afiliados y puntuaciones de reputación externa (G2, Capterra) — son los datos que más rápido quedan " +
      "obsoletos o mal citados.",
    `Investiga la herramienta de software "${solicitud.nombreHerramienta}" y devuelve ÚNICAMENTE un JSON con esta forma:`,
    '{ "datos": { ...información pública... }, "affiliateData": { ...información de afiliación... }, "fuentes": ["URL de cada fuente que hayas usado"] }',
    "",
    'IMPORTANTE: "datos" y "affiliateData" son dos secciones separadas y no deben mezclarse. "affiliateData" es información ' +
      "interna de uso exclusivo de Atlas (nunca se muestra al usuario final): no repitas ahí ningún campo de \"datos\", " +
      "ni metas información de afiliación dentro de \"datos\".",
    "",
    "Campos de \"datos\" a rellenar (usa exactamente estos nombres de clave):",
    listaCampos,
    "",
    'Campos de "affiliateData" a rellenar (usa exactamente estos nombres de clave):',
    listaCamposAfiliados,
    "",
    ...lineasContexto,
    "Si no encuentras un dato con confianza razonable, omite ese campo en vez de inventarlo.",
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}
