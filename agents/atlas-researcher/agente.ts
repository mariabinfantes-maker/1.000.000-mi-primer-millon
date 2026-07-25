import type { Herramienta } from "@/data/esquema";
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

  const propuesta = validarPropuesta(crudo, solicitud);

  // Regla de negocio obligatoria de Atlas: el modelo de negocio se basa en
  // la monetización por afiliación, así que una herramienta sin programa
  // de afiliados activo y fiable no se incorpora a la base de datos, por
  // buena que sea el resto de la investigación. Se comprueba aquí, antes
  // de devolver la ficha como aceptada, sin cambiar el resto del flujo: si
  // la herramienta sí cumple, se sigue devolviendo exactamente como antes.
  if (!tieneProgramaDeAfiliadosFiable(propuesta.datos.programaAfiliados)) {
    return {
      ok: false,
      error:
        `Descartada "${solicitud.nombreHerramienta}": no dispone de un programa de afiliados activo y fiable, ` +
        "requisito obligatorio para incorporarla a la base de datos de Atlas.",
    };
  }

  return { ok: true, propuesta };
}

/** "Activo" (disponible) y "fiable" (la propia investigación no lo marca como de confianza baja). */
function tieneProgramaDeAfiliadosFiable(programaAfiliados: Herramienta["programaAfiliados"] | undefined): boolean {
  if (!programaAfiliados || programaAfiliados.disponible !== true) {
    return false;
  }
  return programaAfiliados.confianza !== "baja";
}
