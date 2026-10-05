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

const EN_LETRA_MAYUSCULA = ["Cero", "Una", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez"];

/**
 * CÓMO SE DICE UN EMPATE. Propietaria, 2026-10-05: «Si después de aplicar los
 * criterios actuales del motor quedan dos herramientas sin una razón para poner
 * una por delante de la otra, ambas son el resultado de Molnip y comparten la
 * primera posición.» Se dice «Dos buenas opciones para tu caso», y nada más:
 * ni «no tengo con qué decidir», ni una pregunta, ni la promesa de afinar.
 *
 * Con cobertura parcial la redacción es otra, y tiene que dejar claro que
 * ninguna cubre todo. «Ella sola» no sobra: en 269 de los 665 empates
 * parciales una PAREJA sí lo cubre todo, y decir «ninguna lo cubre» sería
 * falso.
 *
 * Sólo cambia cómo se presenta. El motor decide igual y el conjunto es el
 * suyo, `empatadas`, en su orden.
 */
export function comoSeDiceElEmpate(empatadas: Opcion[]): { titulo: string; texto?: string } | null {
  if (empatadas.length === 0) return null;
  const n = empatadas.length;
  const enLetra = EN_LETRA_MAYUSCULA[n] ?? String(n);
  const primera = empatadas[0];
  if (primera.noCubre.length === 0) return { titulo: `${enLetra} buenas opciones para tu caso` };
  const cubiertas = new Set(primera.piezas.flatMap((p) => p.cubre)).size;
  const pedidas = cubiertas + primera.noCubre.length;
  return {
    titulo: "Ninguna herramienta cubre ella sola todo lo que me has contado",
    texto: `Estas ${n} cubren ${cubiertas} de las ${pedidas} cosas que necesitas.`,
  };
}
