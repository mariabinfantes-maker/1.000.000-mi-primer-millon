/**
 * Contrato que debe cumplir cualquier proveedor de IA que Atlas Researcher
 * use para investigar una herramienta.
 *
 * El agente (agente.ts) solo conoce esta interfaz, nunca una API concreta.
 * Eso permite dos cosas: probar toda la orquestación con un proveedor
 * falso en los tests (sin llamar a ningún servicio externo), y conectar
 * Gemini — o cualquier otro modelo, el día que haga falta cambiarlo — más
 * adelante sin tocar la lógica de investigación. Es el mismo patrón que ya
 * usa `agents/atlas-advisor` recibiendo el catálogo por parámetro en
 * vez de leerlo él mismo.
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
