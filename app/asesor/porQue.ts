import type { Opcion } from "./Variantes";

/**
 * «POR QUÉ TE LA RECOMIENDO» Y «POR QUÉ LA HE INCLUIDO»: las líneas de cada
 * tarjeta, fuera del componente para poder probarlas sobre todos los casos.
 *
 * LA REGLA DEL 2026-10-05, bloque 2 del plan de cierre. Cada alternativa decía
 * «Resuelve lo mismo que Koibox con lo que me has contado», y la propietaria lo
 * leyó como lo que parecía: *«Le están metiendo al cliente por los ojos Koibox
 * como si Koibox nos pagara algo.»* Una alternativa dice lo que la distingue a
 * ELLA, sin nombrar a la principal. Y si nada comprobado la distingue, no se
 * inventa nada: el bloque no se pinta, y el párrafo de encima ya dice lo que
 * comparte —«Resuelve lo que me has contado»—, como compartido.
 *
 * Esa frase no era la única que sobraba: repetía el párrafo de encima, que
 * dice lo mismo en todas las tarjetas.
 */

export type Elegida = Opcion & { desempate?: { criterio: string; porQue: string } };

/**
 * Lo que ÉSTA demuestra de más y las demás de la pantalla no. Si todas traen
 * lo mismo, no distingue nada y no se escribe: la línea sólo habla cuando
 * tiene algo que decir, y nunca se inventa una ventaja para rellenar.
 */
export function loQueDistingue(opcion: Opcion, entreEllas: Opcion[]): string[] {
  const suyos = [...new Set(opcion.piezas.flatMap((p) => p.ademas))];
  return suyos.filter((e) => !entreEllas.every((o) => o.piezas.some((p) => p.ademas.includes(e))));
}

const EN_LETRA = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];

/** «la necesidad», «las tres necesidades»: cuántas cosas pidió, dicho como se habla. */
export function cuantasNecesidades(opcion: Opcion): string {
  const n = new Set(opcion.piezas.flatMap((p) => p.cubre)).size;
  if (n <= 1) return "la necesidad";
  return `las ${EN_LETRA[n] ?? n} necesidades`;
}

/** Las líneas del «por qué», en el orden en que se leen. Vacío si no hay nada que decir. */
export function lineasDelPorQue(opcion: Elegida, esPrincipal: boolean, entreEllas: Opcion[], cuantas: number): string[] {
  const lineas: string[] = [];
  if (esPrincipal && cuantas > 1 && opcion.piezas.length === 1 && opcion.noCubre.length === 0) {
    lineas.push(`Hay ${cuantas} herramientas que cubren ${cuantasNecesidades(opcion)} que me has contado.`);
  }
  if (esPrincipal && opcion.desempate?.porQue) lineas.push(opcion.desempate.porQue);
  if (opcion.piezas.length > 1) lineas.push(`Son ${opcion.piezas.length} programas y ${opcion.piezas.length} cuotas.`);
  const distingue = loQueDistingue(opcion, entreEllas);
  if (distingue.length > 0) {
    lineas.push(`Además lleva ${distingue.join(", ").toLowerCase()}, que no me pediste pero te ${distingue.length > 1 ? "tocan" : "toca"}.`);
  }
  return lineas;
}
