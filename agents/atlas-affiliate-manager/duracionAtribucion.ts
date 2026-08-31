/**
 * Cuánto dura la atribución de una venta a la afiliada.
 *
 * Se llamó "duración de la cookie" porque en la mayoría de los programas eso
 * es literalmente lo que la limita. Pero no en todos: en Systeme.io la
 * atribución se ancla al correo del lead registrado y no caduca nunca, así
 * que no hay cookie que dure ni número de días que anotar. El nombre viejo
 * obligaba a escribir una mentira con forma de dato.
 *
 * El caso se detectó al dar de alta Systeme.io: la ficha decía "365 días"
 * cuando el correo oficial del programa dice atribución permanente. La causa
 * no fue un descuido al investigar — era que la descripción del campo que se
 * le da a Researcher pedía la respuesta en días y en días nada más, así que
 * la permanencia no se podía ni expresar.
 */

/** Redacción canónica de la permanencia, para que no convivan cinco formas de decir lo mismo. */
export const ATRIBUCION_PERMANENTE = "Permanente — sin caducidad";

/** Lo que se ofrece como sugerencia al escribir. No es una lista cerrada: el campo sigue siendo libre. */
export const SUGERENCIAS_ATRIBUCION: readonly string[] = [
  ATRIBUCION_PERMANENTE,
  "30 días",
  "60 días",
  "90 días",
  "120 días",
  "365 días",
  "Mientras el cliente siga activo",
];

/** Minúsculas y sin tildes: se escribe "expiración" tanto como "expiracion". */
function sinTildes(valor: string): string {
  return valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const SEÑALES_PERMANENCIA = [
  "permanente",
  "sin caducidad",
  "no caduca",
  "sin expiración",
  "no expira",
  "de por vida",
  "vitalicia",
  "vitalicio",
  "indefinida",
  "indefinido",
  "lifetime",
  "para siempre",
];

/**
 * Si el valor escrito describe una atribución que no termina.
 *
 * Sirve para señalarlo en la tabla: entre "90 días" y algo que no caduca hay
 * una diferencia de negocio grande, y leyendo texto libre a toda velocidad
 * se pasa por alto.
 */
export function esAtribucionPermanente(valor: string | undefined): boolean {
  if (!valor) return false;
  const texto = sinTildes(valor);
  // Una negación delante lo cambia todo: "no permanente" no es permanente.
  if (/\bno\s+(es\s+)?(permanente|vitalici|indefinid)/.test(texto)) return false;
  return SEÑALES_PERMANENCIA.some((señal) => texto.includes(sinTildes(señal)));
}
