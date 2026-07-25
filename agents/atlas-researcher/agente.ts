import { construirPromptInvestigacion } from "./prompt";
import type { ProveedorIA } from "./proveedorIA";
import type { ResultadoInvestigacion, SolicitudInvestigacion } from "./tipos";
import { validarPropuesta } from "./validador";

/**
 * Orquestador de Atlas Researcher.
 *
 * No sabe nada de Gemini ni de ningún proveedor concreto: recibe cualquier
 * `ProveedorIA` por parámetro (inyección de dependencias), igual que
 * `lib/recommendationEngine` recibe el catálogo de herramientas en vez de
 * leerlo él mismo. Esto permite probar toda la orquestación con un
 * proveedor falso, y conectar el proveedor real de Gemini más adelante sin
 * cambiar ni una línea de esta función.
 */
export async function investigarHerramienta(
  solicitud: SolicitudInvestigacion,
  proveedor: ProveedorIA
): Promise<ResultadoInvestigacion> {
  if (!solicitud.nombreHerramienta.trim()) {
    return { ok: false, error: "Falta el nombre de la herramienta a investigar." };
  }

  const prompt = construirPromptInvestigacion(solicitud);

  let crudo: unknown;
  try {
    crudo = await proveedor.generarJson(prompt);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".`,
    };
  }

  return { ok: true, propuesta: validarPropuesta(crudo, solicitud) };
}
