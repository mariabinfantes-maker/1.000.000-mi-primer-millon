import type { AffiliateData } from "@/data/esquemaInterno";
import { DESCRIPCION_CAMPOS_AFILIADOS } from "./camposAfiliados";
import { decidirEstadoAfiliacion, describirEstadoAfiliacion, type EstadoAfiliacion, type PruebaDeAusencia } from "./estadoAfiliacion";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

/**
 * Prechequeo de afiliados (etapa 3 del pipeline por lotes).
 *
 * Averigua en qué estado queda la afiliación con una llamada corta, antes
 * de pagar la investigación completa (todos los campos públicos + los de
 * afiliación).
 *
 * Ya no descarta nada. Hasta ahora, cualquier resultado que no fuera un
 * programa confirmado terminaba en descarte silencioso, y eso contradecía
 * la política de «Herramientas sin afiliación» de ATLAS.md, que dice que
 * una herramienta sin programa se PRESENTA a la propietaria en vez de
 * caerse sola. Ahora devuelve uno de los tres estados de
 * `estadoAfiliacion.ts` y es `lote.ts` quien decide qué hacer con cada
 * uno: sólo `confirmada` sigue directa a la investigación completa; los
 * otros dos quedan pendientes de decisión, sin gastar esa investigación.
 *
 * Sigue siendo informativo, no autoritativo: la investigación completa
 * vuelve a mirar la afiliación al final ("cinturón y tirantes", Sheet 02
 * del documento de arquitectura).
 */

/** Subconjunto de AffiliateData suficiente para decidir si un programa de afiliados es fiable, sin investigar el resto (comisión, plataforma, cookie...). */
const CAMPOS_PRECHEQUEO: (keyof AffiliateData)[] = ["hasAffiliateProgram", "affiliateStatus", "confidenceLevel", "source"];

export type ResultadoPrechequeo =
  /** El prechequeo se pudo hacer: `estado` dice en cuál de los tres quedó. */
  | { ok: true; estado: EstadoAfiliacion; motivo: string; datosAfiliados: Partial<AffiliateData>; pruebaDeAusencia?: PruebaDeAusencia }
  /** No se pudo comprobar — falló el proveedor. Nunca es un estado de afiliación: no sabemos nada. */
  | { ok: false; error: string };

/** Prompt corto: solo pide los campos de `CAMPOS_PRECHEQUEO`, nunca los datos públicos ni el resto de `AffiliateData`. */
export function construirPromptPrechequeo(nombreHerramienta: string): string {
  const listaCampos = CAMPOS_PRECHEQUEO.map((campo) => `- "${campo}": ${DESCRIPCION_CAMPOS_AFILIADOS[campo]}`).join("\n");

  return [
    "Eres Atlas Researcher, el agente de investigación de Atlas, un asesor de software para empresas.",
    `Comprobación RÁPIDA y previa sobre la herramienta de software "${nombreHerramienta}": ¿tiene un programa de ` +
      "afiliados activo? No investigues nada más todavía (ni datos públicos de la herramienta, ni el resto de " +
      "detalles del programa de afiliados) — esto es solo un filtro previo.",
    'Devuelve ÚNICAMENTE un JSON con esta forma: { "hasAffiliateProgram": true o false, "affiliateStatus": "active" ' +
      'o "not_available", "confidenceLevel": "low", "medium" o "high", "source": "URL de donde lo has confirmado", ' +
      '"citaAusencia": "", "fuenteAusencia": "" }',
    "",
    "Campos a rellenar (usa exactamente estos nombres de clave):",
    listaCampos,
    "",
    "Si no encuentras el dato con confianza razonable, usa \"confidenceLevel\": \"low\" en vez de inventarlo.",
    "",
    'IMPORTANTE sobre "hasAffiliateProgram": false. No basta con que no hayas encontrado el programa. ' +
      'Rellena "citaAusencia" y "fuenteAusencia" ÚNICAMENTE si has leído en una página oficial del fabricante ' +
      'una frase que diga expresamente que NO ofrecen programa de afiliados; copia esa frase literal en ' +
      '"citaAusencia" y la URL en "fuenteAusencia". Si sólo es que no lo has encontrado, deja las dos vacías: ' +
      "no encontrarlo y que no exista son cosas distintas, y aquí no se confunden nunca.",
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}

/** La prueba literal de ausencia, si el proveedor la aportó. Dos campos vacíos no son una prueba. */
function extraerPruebaDeAusencia(datosCrudos: unknown): PruebaDeAusencia | undefined {
  if (typeof datosCrudos !== "object" || datosCrudos === null) return undefined;
  const raiz = datosCrudos as Record<string, unknown>;
  const cita = typeof raiz.citaAusencia === "string" ? raiz.citaAusencia.trim() : "";
  const fuente = typeof raiz.fuenteAusencia === "string" ? raiz.fuenteAusencia.trim() : "";
  if (cita === "" || fuente === "") return undefined;
  return { cita, fuente };
}

function extraerDatosAfiliados(datosCrudos: unknown): Partial<AffiliateData> {
  if (typeof datosCrudos !== "object" || datosCrudos === null) return {};

  const raiz = datosCrudos as Record<string, unknown>;
  const datosAfiliados: Partial<AffiliateData> = {};

  if (typeof raiz.hasAffiliateProgram === "boolean") {
    datosAfiliados.hasAffiliateProgram = raiz.hasAffiliateProgram;
  }
  if (raiz.affiliateStatus === "active" || raiz.affiliateStatus === "not_available") {
    datosAfiliados.affiliateStatus = raiz.affiliateStatus;
  }
  if (raiz.confidenceLevel === "low" || raiz.confidenceLevel === "medium" || raiz.confidenceLevel === "high") {
    datosAfiliados.confidenceLevel = raiz.confidenceLevel;
  }
  if (typeof raiz.source === "string" && raiz.source.trim() !== "") {
    datosAfiliados.source = raiz.source;
  }

  return datosAfiliados;
}

/**
 * Ejecuta el prechequeo para una herramienta. Nunca lanza.
 *
 * Un fallo del proveedor devuelve `ok: false`, NUNCA un estado de
 * afiliación: que la llamada se caiga no dice absolutamente nada sobre si
 * la herramienta tiene programa. Antes ese fallo acababa en descarte, que
 * es lo contrario de lo que sabemos en ese momento.
 */
export async function prechequearAfiliados(
  nombreHerramienta: string,
  proveedor: ProveedorIA
): Promise<ResultadoPrechequeo> {
  const prompt = construirPromptPrechequeo(nombreHerramienta);

  let crudo: unknown;
  try {
    crudo = await proveedor.generarJson(prompt);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".`,
    };
  }

  const datosAfiliados = extraerDatosAfiliados(crudo);
  const pruebaDeAusencia = extraerPruebaDeAusencia(crudo);
  const estado = decidirEstadoAfiliacion(datosAfiliados, pruebaDeAusencia);

  return {
    ok: true,
    estado,
    motivo: describirEstadoAfiliacion(estado, nombreHerramienta),
    datosAfiliados,
    ...(estado === "ausencia_demostrada" ? { pruebaDeAusencia } : {}),
  };
}
