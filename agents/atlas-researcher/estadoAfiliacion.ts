import type { AffiliateData } from "@/data/esquemaInterno";

/**
 * En qué situación quedó la afiliación de una herramienta tras investigarla.
 *
 * Tres estados, no un booleano, y por el mismo motivo que en F3: un `false`
 * y un "no lo he encontrado" no son la misma cosa, y tratarlos igual
 * convierte la ignorancia en una afirmación. Hasta ahora la regla era
 * `hasAffiliateProgram !== true`, que metía en el mismo saco el `false`
 * demostrado y el `undefined` de una investigación que no encontró nada —
 * y descartaba las dos.
 *
 * El precedente es `EstadoDeEvidencia` en `data/verificacion/puerto.ts`. Se
 * replica el patrón, no el módulo: importar `data/verificacion` desde aquí
 * haría fallar su guarda de aislamiento, cuya lista de lectores
 * autorizados existe justamente para que ampliarla se vea en un diff.
 * Son tres estados y veinte líneas; gastar esa guarda por reutilizarlos
 * saldría mucho más caro.
 *
 * NINGUNO de los tres descarta por sí solo. Quién entra al catálogo lo
 * decide la propietaria, como fija la política de «Herramientas sin
 * afiliación» de ATLAS.md.
 */
export type EstadoAfiliacion = "confirmada" | "ausencia_demostrada" | "no_consta";

export const ESTADOS_AFILIACION: readonly EstadoAfiliacion[] = [
  "confirmada",
  "ausencia_demostrada",
  "no_consta",
] as const;

/**
 * La prueba que exige `ausencia_demostrada`: una frase literal de una
 * página oficial que diga expresamente que no ofrecen programa.
 *
 * Sin esto, `hasAffiliateProgram: false` sería sólo la opinión del
 * proveedor de IA sobre algo que no encontró, y ya sabemos en qué acaba
 * eso. Misma exigencia que en F2: afirmar una ausencia necesita evidencia
 * de la ausencia, no ausencia de evidencia.
 */
export type PruebaDeAusencia = {
  /** Frase copiada literalmente de la página, en su idioma original. */
  cita: string;
  /** URL oficial del fabricante de donde se copió la frase. */
  fuente: string;
};

/** Una prueba sólo vale si trae las dos cosas: la frase y de dónde salió. */
export function esPruebaDeAusenciaValida(prueba: PruebaDeAusencia | undefined): prueba is PruebaDeAusencia {
  return prueba !== undefined && prueba.cita.trim() !== "" && prueba.fuente.trim() !== "";
}

/**
 * Decide el estado a partir de lo investigado.
 *
 * - `confirmada`: el programa existe (`hasAffiliateProgram`) y la propia
 *   investigación no se declara poco fiable (`confidenceLevel` no es
 *   "low"). Mismo listón que la regla anterior, para no cambiar por la
 *   puerta de atrás qué se considera un programa bueno.
 * - `ausencia_demostrada`: hay una cita oficial que dice expresamente que
 *   no lo ofrecen. Sólo entonces.
 * - `no_consta`: todo lo demás. Incluye el `undefined`, el `false` sin
 *   cita, y el programa hallado con `confidenceLevel: "low"`.
 */
export function decidirEstadoAfiliacion(
  datosAfiliados: Partial<AffiliateData>,
  pruebaDeAusencia?: PruebaDeAusencia
): EstadoAfiliacion {
  const tienePrueba = esPruebaDeAusenciaValida(pruebaDeAusencia);

  if (datosAfiliados.hasAffiliateProgram === true) {
    // Una prueba de ausencia junto a un programa declarado es una
    // contradicción de la investigación, no un dato: ante ella no se
    // afirma ninguna de las dos cosas.
    if (tienePrueba) return "no_consta";
    return datosAfiliados.confidenceLevel === "low" ? "no_consta" : "confirmada";
  }

  return tienePrueba ? "ausencia_demostrada" : "no_consta";
}

/** Texto para el informe y el registro de pendientes. Nunca dice "no tiene" salvo que se haya demostrado. */
export function describirEstadoAfiliacion(estado: EstadoAfiliacion, nombreHerramienta: string): string {
  switch (estado) {
    case "confirmada":
      return `"${nombreHerramienta}": programa de afiliados activo y fiable.`;
    case "ausencia_demostrada":
      return `"${nombreHerramienta}": una fuente oficial dice expresamente que no ofrece programa de afiliados. Puede existir igualmente un acuerdo directo: lo decide la propietaria.`;
    case "no_consta":
      return `"${nombreHerramienta}": no consta programa de afiliados. No se ha encontrado, que no es lo mismo que no exista: lo decide la propietaria.`;
  }
}
