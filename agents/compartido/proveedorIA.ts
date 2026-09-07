/**
 * Contrato que debe cumplir cualquier proveedor de IA que use un agente de
 * Atlas — Researcher para investigar herramientas, Recomendador para
 * personalizar explicaciones, y cualquier agente futuro que necesite IA.
 *
 * Cada agente solo conoce esta interfaz, nunca una API concreta. Eso
 * permite dos cosas: probar toda la orquestación con un proveedor falso en
 * los tests (sin llamar a ningún servicio externo), y conectar Gemini — o
 * cualquier otro modelo, el día que haga falta cambiarlo — sin tocar la
 * lógica de cada agente. Es el mismo patrón que ya usa `agents/atlas-advisor`
 * recibiendo el catálogo por parámetro en vez de leerlo él mismo. Vive en
 * `agents/compartido/` (no dentro de un agente concreto) precisamente
 * porque no es exclusivo de ninguno.
 */
export type ProveedorIA = {
  /** Nombre identificativo del proveedor, útil en logs y mensajes de error. */
  nombre: string;
  /**
   * Envía `prompt` al modelo y devuelve su respuesta ya parseada como JSON.
   * Debe lanzar un error legible si el proveedor falla o si la respuesta no
   * es JSON válido — el agente no vuelve a intentar interpretar el texto.
   */
  generarJson(prompt: string): Promise<unknown>;
};

/** Error de un proveedor de IA concreto, con su nombre incluido en el mensaje para que se vea de un vistazo quién falló. */
export class ErrorProveedorIA extends Error {
  constructor(
    public readonly proveedor: string,
    mensaje: string
  ) {
    super(`[${proveedor}] ${mensaje}`);
    this.name = "ErrorProveedorIA";
  }
}

/**
 * Cómo le fue al proveedor con cada dirección que intentó leer.
 *
 * Es la mitad que faltaba para que F2 pueda verificar de verdad. Sin esto,
 * una respuesta bien redactada y una invención suenan igual: el modelo conoce
 * de memoria casi todas las herramientas del catálogo y puede describir su
 * página de precios sin haberla abierto. Con esto, «lo leyó» y «no lo leyó»
 * son dos hechos distintos y comprobables.
 */
export type RecuperacionUrl = {
  /** La dirección tal y como la devuelve el proveedor, no la que se pidió. */
  url: string;
  /** El estado literal del proveedor, sin traducir ni normalizar. */
  estado: string;
  /** `true` sólo si el proveedor afirma explícitamente que la recuperó. */
  recuperada: boolean;
};

export type RespuestaConFuentes = {
  datos: unknown;
  /** Vacío si el proveedor no intentó leer ninguna, o no lo dice. */
  urls: RecuperacionUrl[];
};

/**
 * Proveedor que además sabe leer páginas web antes de responder.
 *
 * Se añade como extensión y no se mete en `ProveedorIA` a propósito: los
 * agentes que ya existen —Researcher, el prechequeo de afiliados, la
 * clasificación de módulos— no necesitan leer nada y no deben cambiar por
 * esto. Quien lo necesite, comprueba con `sabeLeerUrls` y si no, se apaña.
 */
export type ProveedorIAQueLee = ProveedorIA & {
  /**
   * Envía `prompt` pidiendo al modelo que lea `urls` antes de responder, y
   * devuelve su respuesta junto con qué direcciones consiguió leer de verdad.
   *
   * Quien llame NO debe dar por buena ninguna afirmación cuya dirección no
   * aparezca recuperada: sin eso, esto es exactamente el mismo error que llenó
   * las 62 fichas de datos sin fuente.
   */
  generarJsonLeyendoUrls(prompt: string, urls: string[]): Promise<RespuestaConFuentes>;
};

export function sabeLeerUrls(proveedor: ProveedorIA): proveedor is ProveedorIAQueLee {
  return typeof (proveedor as ProveedorIAQueLee).generarJsonLeyendoUrls === "function";
}
