/**
 * ¿CUÁL ES MÁS BARATA? CASI NUNCA SE PUEDE CONTESTAR, Y HAY QUE DECIRLO.
 *
 * El desempate por precio hacía esto:
 *
 *     const m = String(p.coste.desde).match(/(\d+(?:[.,]\d+)?)/);
 *     total += parseFloat(m[1].replace(",", "."));
 *
 * Es decir: coger el primer número que aparezca en un texto libre y sumarlo.
 * Con eso, «$9 USD/mes» ganaba a «15,90 €» y a «27,40 €», y ese desempate
 * decidía 1.032 de los 1.488 casos del barrido. Comparaba dólares con euros,
 * precios mensuales con anuales, precios por usuario con precios por negocio
 * entero y planes de entrada con planes que sí cubren lo que la persona pidió.
 * De las 57 fichas con tarifa comprobada, 45 están en dólares y 12 en euros:
 * la mezcla no era un caso raro, era el caso normal.
 *
 * La regla, de la propietaria (2026-09-30):
 *
 *   «No basta con convertir dólares a euros: hay que comparar el plan que
 *    cubre la necesidad, para el número de usuarios correspondiente y con la
 *    misma periodicidad. Mientras esos importes no sean comparables, el precio
 *    no debe decidir ese desempate.»
 *
 * Y, en la misma frase: «no hace falta montar ahora un sistema de cambio de
 * divisas». Así que aquí NO se convierte nada. Lo que se hace es reconocer
 * cuándo dos importes se pueden comparar de verdad y, cuando no, RETIRAR el
 * precio del desempate en vez de fingir una respuesta. Un desempate que no se
 * puede sostener no es un desempate: es un número que parece uno.
 *
 * Callarse aquí no deja a nadie sin precio: el precio de cada opción se sigue
 * enseñando, con su cita y su fecha, en «lo que te va a costar». Lo que se
 * retira es que decida quién va primero.
 */

export type Periodo = "mensual" | "anual";

/**
 * Un importe del que SÍ se puede decir si es mayor o menor que otro, y con
 * qué otros se puede comparar. Si falta cualquiera de estas piezas, no se
 * construye: se devuelve `null`.
 */
export type ImporteComparable = {
  cantidad: number;
  /** «EUR», «USD». Nunca se convierte una en otra. */
  moneda: string;
  periodo: Periodo;
  /** Si la tarifa se cobra por cada persona. 45 €/usuario y 45 €/negocio no son el mismo precio. */
  porUsuario: boolean;
  /** El plan que de verdad cubre lo que pidió, no el de entrada. */
  plan: string;
};

type Plan = { nombre: string; mensual?: string | null; anual?: string | null; cita?: string | null };

/** «por usuario», «/user», «per seat»… Lo dice la cita, no lo deducimos. */
const POR_USUARIO = /(por|per|\/)\s*(usuario|user|puesto|seat|miembro|member|profesional|empleado)|usuario\s*\/\s*mes|user\s*\/\s*month/i;

/**
 * Un importe sólo vale si el texto ES un precio, no si CONTIENE un número.
 * «Desde 9 €», «9 € + IVA por reserva» o «199 €/año el primer año» son
 * condiciones, no cifras comparables, y por eso caen aquí.
 */
function cantidadDe(texto: string | null | undefined): number | null {
  // `null` además de `undefined`: la tarifa de un plan puede venir explícitamente
  // vacía —«no publican este precio»— y no es lo mismo que no traer el campo.
  // Reventó con un plan real el 2026-09-30, después de escribir esto.
  if (texto === undefined || texto === null) return null;
  const t = texto.trim();
  if (/desde|hasta|a partir|consult|contact|presupuesto|según|seg[uú]n/i.test(t)) return null;
  const m = t.match(/^(?:€|\$|US\$|EUR|USD)?\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:€|\$|US\$|EUR|USD)?$/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * EL PLAN QUE CUBRE LA NECESIDAD, no el más barato de la tarifa.
 *
 * Sin nombre de plan verificado por F2 no hay importe comparable, y eso es a
 * propósito: comparar el escalón de entrada de una con el escalón de entrada
 * de otra no dice cuál le sale más barato a ella, porque puede que en uno de
 * los dos no esté lo que vino a buscar.
 */
export function importeDelPlanQueCubre(
  h: { planesComprobados?: { moneda: string; planes: Plan[] } } | undefined,
  planQueNecesita: string | undefined
): ImporteComparable | null {
  const pc = h?.planesComprobados;
  if (!pc || !pc.moneda || !planQueNecesita) return null;
  const plan = pc.planes.find((p) => p.nombre.toLowerCase() === planQueNecesita.toLowerCase());
  if (!plan) return null;

  const porUsuario = POR_USUARIO.test(plan.cita ?? "");
  const mensual = cantidadDe(plan.mensual);
  if (mensual !== null) {
    return { cantidad: mensual, moneda: pc.moneda, periodo: "mensual", porUsuario, plan: plan.nombre };
  }
  const anual = cantidadDe(plan.anual);
  if (anual !== null) {
    return { cantidad: anual, moneda: pc.moneda, periodo: "anual", porUsuario, plan: plan.nombre };
  }
  return null;
}

/**
 * Suma los importes de las piezas de una solución. Sólo suma lo que de verdad
 * se puede sumar: misma moneda, misma periodicidad y la misma forma de cobrar.
 * Un euro y un dólar no se suman, y 15 €/mes más 120 €/año tampoco.
 */
export function sumar(importes: (ImporteComparable | null)[]): ImporteComparable | null {
  if (importes.length === 0) return null;
  const buenos: ImporteComparable[] = [];
  for (const i of importes) {
    if (!i) return null;
    buenos.push(i);
  }
  const [primero, ...resto] = buenos;
  for (const i of resto) {
    if (i.moneda !== primero.moneda || i.periodo !== primero.periodo || i.porUsuario !== primero.porUsuario) {
      return null;
    }
  }
  return {
    cantidad: buenos.reduce((s, i) => s + i.cantidad, 0),
    moneda: primero.moneda,
    periodo: primero.periodo,
    porUsuario: primero.porUsuario,
    plan: buenos.map((i) => i.plan).join(" + "),
  };
}

/**
 * ¿Se pueden poner estos importes en la misma fila y decir cuál es menor?
 *
 * Sólo si TODOS comparten moneda, periodicidad y forma de cobrar. Basta con
 * que uno no lo haga para que el precio deje de decidir: no se compara a los
 * que sí se dejan y se ignora al que no, porque el que se queda fuera podría
 * ser justo el más barato.
 */
export function sonComparables(importes: ImporteComparable[]): boolean {
  if (importes.length < 2) return false;
  const [a, ...resto] = importes;
  return resto.every((i) => i.moneda === a.moneda && i.periodo === a.periodo && i.porUsuario === a.porUsuario);
}

/** Cómo se dice el importe en el consejo. Sin traducir la moneda ni redondear. */
export function comoSeDice(i: ImporteComparable): string {
  const cifra = `${String(i.cantidad).replace(".", ",")} ${i.moneda === "EUR" ? "€" : i.moneda === "USD" ? "$" : i.moneda}`;
  return `${cifra}${i.porUsuario ? " por persona" : ""} ${i.periodo === "mensual" ? "al mes" : "al año"}`;
}
