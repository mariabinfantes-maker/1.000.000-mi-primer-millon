/**
 * Dónde tiene el negocio quien pregunta.
 *
 * Existe porque Molnip no sabía con quién hablaba. El motor ya tenía un
 * criterio de idioma (`criterios.ts`), pero nadie le decía nunca qué idioma
 * hacía falta: el resultado era que a una autónoma española le salía primero
 * una herramienta que no está en español. El fallo no era del criterio, era
 * que faltaba el dato.
 *
 * Se pregunta el país y NO el idioma a propósito. «¿En qué idioma necesitas
 * la herramienta?» es una pregunta de producto para quien ya sabe lo que
 * busca; «¿dónde tienes el negocio?» la contesta cualquiera. La carga de
 * traducir una cosa en la otra es de Molnip, no de la persona.
 *
 * La lista es corta y cerrada a propósito: son los mercados a los que Molnip
 * se dirige hoy, más dos salidas para no dejar a nadie fuera. Ampliarla es
 * añadir entradas aquí, no tocar el motor.
 */

/** Código del país, ISO 3166-1 alfa-2, más dos salidas que no son países. */
export type CodigoPais = "ES" | "MX" | "AR" | "CO" | "CL" | "PE" | "OTRO_HISPANO" | "OTRO";

export type Pais = {
  codigo: CodigoPais;
  etiqueta: string;
  /**
   * Idioma en el que hace falta la herramienta. `undefined` cuando no se
   * puede deducir del país ("Otro país"): entonces no se filtra por idioma
   * ni se penaliza a nadie, porque no saberlo no es lo mismo que saber que
   * no hace falta.
   */
  idioma?: string;
  /**
   * Moneda del país, en ISO 4217. Hoy NO se usa para nada visible: 48 de las
   * 65 fichas tienen el precio en dólares y convertir sin tipo de cambio
   * comprobado sería inventar un número. Se guarda porque el dato es del
   * cliente y no hay que volver a pedírselo cuando haya con qué usarlo.
   */
  moneda?: string;
};

export const PAISES: Pais[] = [
  { codigo: "ES", etiqueta: "España", idioma: "español", moneda: "EUR" },
  { codigo: "MX", etiqueta: "México", idioma: "español", moneda: "MXN" },
  { codigo: "AR", etiqueta: "Argentina", idioma: "español", moneda: "ARS" },
  { codigo: "CO", etiqueta: "Colombia", idioma: "español", moneda: "COP" },
  { codigo: "CL", etiqueta: "Chile", idioma: "español", moneda: "CLP" },
  { codigo: "PE", etiqueta: "Perú", idioma: "español", moneda: "PEN" },
  { codigo: "OTRO_HISPANO", etiqueta: "Otro país de habla hispana", idioma: "español" },
  { codigo: "OTRO", etiqueta: "Otro país" },
];

export function getPais(codigo: string | undefined): Pais | undefined {
  if (!codigo) return undefined;
  return PAISES.find((pais) => pais.codigo === codigo);
}

/** El idioma que hace falta según el país, o `undefined` si no se puede deducir. */
export function idiomaDePais(codigo: string | undefined): string | undefined {
  return getPais(codigo)?.idioma;
}

/**
 * Si el negocio factura en España. Todavía no lo usa nadie: ninguna de las
 * 65 fichas tiene investigado si sirve para facturar aquí, y filtrar por un
 * dato que no existe dejaría al cliente sin resultados. Está aquí para que
 * la pregunta se haga una sola vez.
 */
export function facturaEnEspana(codigo: string | undefined): boolean {
  return codigo === "ES";
}
