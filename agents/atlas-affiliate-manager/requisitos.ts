import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

/**
 * Prechequeo de requisitos del programa de afiliados — pieza distinta y
 * deliberadamente separada de `agents/atlas-researcher/prechequeoAfiliados.ts`:
 * aquel decide SI un programa de afiliados existe y es fiable, antes de que
 * la herramienta entre al catálogo. Este solo documenta QUÉ exige un
 * programa que Researcher ya confirmó que existe — tráfico mínimo, país,
 * tipo de negocio, documentos — para que una persona sepa qué preparar
 * antes de solicitar. Nunca decide nada, nunca envía nada, nunca vuelve a
 * preguntar si el programa existe.
 */

const LONGITUD_MAXIMA = 800;

export type ResultadoRequisitos = { ok: true; requisitos: string } | { ok: false; error: string };

export function construirPromptRequisitos(nombreHerramienta: string, nombrePrograma: string | undefined): string {
  const programa = nombrePrograma ? `su programa de afiliados "${nombrePrograma}"` : "su programa de afiliados";

  return [
    `Investiga ${programa} de la herramienta de software "${nombreHerramienta}".`,
    "Necesito saber qué exige ese programa para admitir a un nuevo afiliado — solo los requisitos de entrada, " +
      "nunca la comisión ni las condiciones de pago (eso ya se investiga aparte).",
    "Busca específicamente: tráfico mínimo o audiencia mínima exigida, países o idiomas admitidos, tipo de negocio " +
      "o sitio web aceptado (blog, medio, empresa...), documentos o datos que pida el formulario de alta, y cualquier " +
      "requisito de aprobación manual (revisión humana, entrevista, verificación de dominio).",
    'Devuelve ÚNICAMENTE un JSON con esta forma: { "requisitos": "texto breve, en español, resumiendo lo anterior" }',
    "Si no encuentras información fiable sobre los requisitos de entrada, responde " +
      '{ "requisitos": "" } — nunca inventes un requisito que no puedas confirmar.',
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}

function extraerRequisitos(respuestaCruda: unknown): string {
  if (typeof respuestaCruda !== "object" || respuestaCruda === null) {
    throw new Error("La respuesta de la IA no es un objeto JSON.");
  }
  const requisitos = (respuestaCruda as Record<string, unknown>).requisitos;
  if (typeof requisitos !== "string") {
    throw new Error('La respuesta de la IA no incluye "requisitos" en texto.');
  }
  return requisitos.trim().slice(0, LONGITUD_MAXIMA);
}

/**
 * Nunca lanza: si la IA falla, no está configurada, o la respuesta no es
 * usable, devuelve `{ ok: false, error }` para que quien llame decida qué
 * mostrar — nunca deja `requisitosPrograma` con un valor a medias.
 */
export async function investigarRequisitosPrograma(
  nombreHerramienta: string,
  nombrePrograma: string | undefined,
  proveedor: ProveedorIA
): Promise<ResultadoRequisitos> {
  try {
    const prompt = construirPromptRequisitos(nombreHerramienta, nombrePrograma);
    const respuestaCruda = await proveedor.generarJson(prompt);
    const requisitos = extraerRequisitos(respuestaCruda);
    if (requisitos === "") {
      return { ok: false, error: "La IA no encontró información fiable sobre los requisitos de entrada." };
    }
    return { ok: true, requisitos };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".` };
  }
}
