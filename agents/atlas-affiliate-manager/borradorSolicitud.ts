import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

/**
 * Borrador de solicitud de afiliación — redacta un texto de apoyo (correo o
 * respuesta de formulario) para que una persona lo revise, edite y envíe
 * ella misma. El sistema NUNCA lo envía: no hay ninguna integración de
 * correo saliente conectada a esta función, ni se llama desde ningún flujo
 * automático. Es, deliberadamente, el límite explícito que fijó ATLAS.md
 * ("Redacción asistida por IA de solicitudes de afiliación... no debe
 * automatizarse sin una decisión explícita y posterior a esta") — esta
 * pieza cubre solo la parte de redacción que esa decisión autorizó.
 *
 * No pide ni acepta ningún dato fiscal, bancario ni de identidad real de
 * Molnip — el borrador se queda genérico en esos puntos (marcados
 * claramente para que la persona los rellene a mano) porque introducir esa
 * información automáticamente está fuera de alcance por diseño, no por
 * limitación técnica.
 */

const LONGITUD_MINIMA = 40;
const LONGITUD_MAXIMA = 1500;

export type DatosSolicitud = {
  nombreHerramienta: string;
  nombrePrograma?: string;
  requisitosPrograma?: string;
};

export type ResultadoBorrador = { ok: true; borrador: string } | { ok: false; error: string };

export function construirPromptBorrador(datos: DatosSolicitud): string {
  const programa = datos.nombrePrograma ? `su programa de afiliados "${datos.nombrePrograma}"` : "su programa de afiliados";
  const requisitos = datos.requisitosPrograma
    ? `Ten en cuenta estos requisitos ya conocidos del programa: ${datos.requisitosPrograma}`
    : "No hay requisitos concretos documentados todavía — mantén el texto genérico en ese punto.";

  return [
    `Redacta un borrador de correo de solicitud para entrar en ${programa} de la herramienta de software ` +
      `"${datos.nombreHerramienta}", en nombre de Molnip (molnip.com), un asesor independiente de tecnología para empresas.`,
    requisitos,
    "El tono debe ser profesional, breve (un párrafo de presentación y una petición clara de entrar al programa) y en español.",
    'Deja marcados con "[COMPLETAR: ...]" cualquier dato que dependa de la persona que lo envía (nombre, cargo, ' +
      "email de contacto, cifras de tráfico reales, o cualquier dato fiscal/bancario) — nunca inventes esos datos.",
    "No incluyas ninguna promesa de resultados ni ninguna cifra de tráfico o conversión que no te haya dado yo.",
    'Devuelve ÚNICAMENTE un JSON con esta forma: { "borrador": "texto completo del correo, incluido el asunto en la primera línea" }',
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}

function extraerBorrador(respuestaCruda: unknown): string {
  if (typeof respuestaCruda !== "object" || respuestaCruda === null) {
    throw new Error("La respuesta de la IA no es un objeto JSON.");
  }
  const borrador = (respuestaCruda as Record<string, unknown>).borrador;
  if (typeof borrador !== "string") {
    throw new Error('La respuesta de la IA no incluye "borrador" en texto.');
  }
  const limpio = borrador.trim();
  if (limpio.length < LONGITUD_MINIMA || limpio.length > LONGITUD_MAXIMA) {
    throw new Error(`El "borrador" de la IA tiene una longitud fuera de rango (${limpio.length} caracteres).`);
  }
  return limpio;
}

/** Nunca lanza ni envía nada — solo genera texto para revisión humana. */
export async function generarBorradorSolicitud(datos: DatosSolicitud, proveedor: ProveedorIA): Promise<ResultadoBorrador> {
  try {
    const prompt = construirPromptBorrador(datos);
    const respuestaCruda = await proveedor.generarJson(prompt);
    return { ok: true, borrador: extraerBorrador(respuestaCruda) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".` };
  }
}
