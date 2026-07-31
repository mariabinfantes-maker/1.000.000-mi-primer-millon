import type { AffiliateData } from "@/data/esquemaInterno";
import { DESCRIPCION_CAMPOS_AFILIADOS } from "./camposAfiliados";
import type { ProveedorIA } from "./proveedorIA";

/**
 * Prechequeo de afiliados (etapa 3 del pipeline por lotes).
 *
 * La regla obligatoria de Atlas (ver `agente.ts`) descarta cualquier
 * herramienta sin programa de afiliados activo y fiable — pero hoy esa
 * comprobación llega DESPUÉS de pagar la investigación completa (todos los
 * campos públicos + de afiliación). Este módulo hace una llamada mucho más
 * corta, pidiendo solo lo mínimo para decidir si merece la pena investigar
 * el resto: si el prechequeo ya descarta la herramienta, `lote.ts` se
 * ahorra la investigación completa.
 *
 * Es deliberadamente informativo, no autoritativo: la investigación
 * completa vuelve a aplicar la regla obligatoria de verdad al final (ver el
 * comentario "cinturón y tirantes" en la Sheet 02 del documento de
 * arquitectura). Un prechequeo positivo no garantiza que la herramienta
 * acabe aceptada; uno negativo sí evita gastar la investigación completa.
 */

/** Subconjunto de AffiliateData suficiente para decidir si un programa de afiliados es fiable, sin investigar el resto (comisión, plataforma, cookie...). */
const CAMPOS_PRECHEQUEO: (keyof AffiliateData)[] = ["hasAffiliateProgram", "affiliateStatus", "confidenceLevel", "source"];

export type ResultadoPrechequeo =
  | { tieneProgramaFiable: true; datosAfiliados: Partial<AffiliateData> }
  | { tieneProgramaFiable: false; motivo: string; datosAfiliados: Partial<AffiliateData> };

/** Prompt corto: solo pide los campos de `CAMPOS_PRECHEQUEO`, nunca los datos públicos ni el resto de `AffiliateData`. */
export function construirPromptPrechequeo(nombreHerramienta: string): string {
  const listaCampos = CAMPOS_PRECHEQUEO.map((campo) => `- "${campo}": ${DESCRIPCION_CAMPOS_AFILIADOS[campo]}`).join("\n");

  return [
    "Eres Atlas Researcher, el agente de investigación de Atlas, un asesor de software para empresas.",
    `Comprobación RÁPIDA y previa sobre la herramienta de software "${nombreHerramienta}": ¿tiene un programa de ` +
      "afiliados activo? No investigues nada más todavía (ni datos públicos de la herramienta, ni el resto de " +
      "detalles del programa de afiliados) — esto es solo un filtro previo.",
    'Devuelve ÚNICAMENTE un JSON con esta forma: { "hasAffiliateProgram": true o false, "affiliateStatus": "active" ' +
      'o "not_available", "confidenceLevel": "low", "medium" o "high", "source": "URL de donde lo has confirmado" }',
    "",
    "Campos a rellenar (usa exactamente estos nombres de clave):",
    listaCampos,
    "",
    "Si no encuentras el dato con confianza razonable, usa \"confidenceLevel\": \"low\" en vez de inventarlo.",
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}

/**
 * Misma regla que `tieneProgramaDeAfiliadosFiable` en `agente.ts`
 * (programa activo y `confidenceLevel` distinto de "low"), duplicada aquí a
 * propósito: es una función de cuatro líneas, y duplicarla evita tener que
 * exportar un detalle interno de `agente.ts` solo para este prechequeo —
 * `agente.ts` sigue intacto, como fija la Sheet 03 del documento aprobado.
 */
function tieneProgramaDeAfiliadosFiable(datosAfiliados: Partial<AffiliateData>): boolean {
  if (datosAfiliados.hasAffiliateProgram !== true) return false;
  return datosAfiliados.confidenceLevel !== "low";
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
 * Ejecuta el prechequeo para una herramienta. Nunca lanza: un error del
 * proveedor o una respuesta que no se pueda interpretar se tratan como "no
 * fiable" (mismo criterio conservador que `validarPropuesta`: ante la duda,
 * no se investiga de más).
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
      tieneProgramaFiable: false,
      motivo: error instanceof Error ? error.message : `Error desconocido del proveedor "${proveedor.nombre}".`,
      datosAfiliados: {},
    };
  }

  const datosAfiliados = extraerDatosAfiliados(crudo);

  if (!tieneProgramaDeAfiliadosFiable(datosAfiliados)) {
    return {
      tieneProgramaFiable: false,
      motivo: `"${nombreHerramienta}" no supera el prechequeo: sin programa de afiliados activo y fiable.`,
      datosAfiliados,
    };
  }

  return { tieneProgramaFiable: true, datosAfiliados };
}
