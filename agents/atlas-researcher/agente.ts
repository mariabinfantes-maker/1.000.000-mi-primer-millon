import { decidirEstadoAfiliacion } from "./estadoAfiliacion";
import { construirPromptInvestigacion } from "./prompt";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";
import type { ResultadoInvestigacion, SolicitudInvestigacion } from "./tipos";
import { validarPropuesta } from "./validador";

/**
 * Orquestador de Atlas Researcher.
 *
 * No sabe nada de Gemini ni de ningún proveedor concreto: recibe cualquier
 * `ProveedorIA` por parámetro (inyección de dependencias), igual que
 * `agents/atlas-advisor` recibe el catálogo de herramientas en vez de
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

  // La afiliación ya no descarta aquí.
  //
  // Hasta ahora esta función devolvía `ok: false` cuando no había programa
  // activo y fiable, y con ello se tiraba una investigación entera ya
  // pagada. La política aprobada de «Herramientas sin afiliación» dice lo
  // contrario: una herramienta sin programa se presenta a la propietaria,
  // no se cae sola. Así que el estado se anota y la propuesta se devuelve
  // igual; quien decide si entra al catálogo es `promover.ts`, y sólo con
  // una decisión humana por escrito.
  //
  // `lote.ts` normalmente ni llega aquí en esos casos: el prechequeo para
  // antes. Esto cubre `cli.ts`, que investiga una sola herramienta y se
  // salta el prechequeo.
  //
  // El estado va aparte, NO en `propuesta.advertencias`: una advertencia
  // hace fallar `evaluarCriteriosDeCalidad`, y eso levantaría un segundo
  // bloqueo que la excepción autorizada de `promover.ts` no podría abrir.
  // Son dos cosas distintas —la calidad de la investigación y la situación
  // de la afiliación— y mezclarlas dejaría la excepción inservible.
  return { ok: true, propuesta, estadoAfiliacion: decidirEstadoAfiliacion(propuesta.datosAfiliados) };
}
