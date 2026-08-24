import type { ModuloSuite } from "@/data/esquema";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

/**
 * Clasificación de módulos (etapa independiente, fuera del pipeline 1-5).
 *
 * Reclasifica `modulosIncluidos` (ver el comentario del tipo en
 * `data/esquema.ts`) para una herramienta que YA está en el catálogo real,
 * sin volver a investigarla entera: `investigarHerramienta` reescribiría
 * todos los campos (puntuaciones, ventajas, precios...) ya revisados y
 * aprobados por el CEO, cuando lo único que hace falta aquí es rellenar un
 * campo nuevo del esquema para herramientas que ya existían antes de que
 * `modulosIncluidos` se añadiera. Mismo patrón que `prechequeoAfiliados.ts`:
 * un prompt corto y acotado, no el pipeline completo.
 */

export const MODULOS_VALIDOS: ModuloSuite[] = [
  "crm",
  "gestion_proyectos",
  "asistente_ia",
  "facturacion",
  "email_marketing",
  "atencion_cliente",
  "embudos_de_venta",
  "comercio_electronico",
  "creador_de_sitios_web",
  "recursos_humanos",
];

export type ResultadoClasificacionModulos =
  | { ok: true; modulos: ModuloSuite[] }
  | { ok: false; error: string };

/** Prompt corto: solo pide el array de módulos, nunca el resto del esquema. */
export function construirPromptModulos(nombreHerramienta: string, contextoConocido?: string): string {
  return [
    "Eres Atlas Researcher, el agente de investigación de Atlas, un asesor de software para empresas.",
    `Analiza la herramienta de software "${nombreHerramienta}" y clasifica qué módulos de negocio incluye de ` +
      "verdad como funcionalidad propia (no como integración con una herramienta externa de terceros).",
    contextoConocido ? `Contexto ya conocido sobre la herramienta: ${contextoConocido}` : null,
    'Devuelve ÚNICAMENTE un JSON con esta forma: { "modulos": [...] }',
    `"modulos" es un array que solo puede contener estos valores exactos: ${MODULOS_VALIDOS.map((m) => `"${m}"`).join(", ")}.`,
    "Incluye solo los que la herramienta ofrece de verdad. Si no incluye ninguno de la lista, devuelve un array vacío.",
    "No incluyas texto antes ni después del JSON.",
  ]
    .filter((linea): linea is string => Boolean(linea))
    .join("\n");
}

/**
 * Ejecuta la clasificación para una herramienta. Nunca lanza: un error del
 * proveedor o una respuesta ilegible se tratan como "sin módulos" en vez de
 * propagar la excepción — mismo criterio conservador que el resto del
 * pipeline de investigación.
 */
export async function clasificarModulos(
  nombreHerramienta: string,
  proveedor: ProveedorIA,
  contextoConocido?: string
): Promise<ResultadoClasificacionModulos> {
  let crudo: unknown;
  try {
    crudo = await proveedor.generarJson(construirPromptModulos(nombreHerramienta, contextoConocido));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".`,
    };
  }

  const raiz = typeof crudo === "object" && crudo !== null ? (crudo as Record<string, unknown>) : null;
  const modulosCrudos = raiz && Array.isArray(raiz.modulos) ? raiz.modulos : [];
  const modulosValidos = new Set<string>(MODULOS_VALIDOS);
  const modulos = modulosCrudos.filter((m): m is ModuloSuite => typeof m === "string" && modulosValidos.has(m));

  return { ok: true, modulos };
}
