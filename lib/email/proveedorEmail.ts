/**
 * Contrato que debe cumplir cualquier proveedor de email marketing que use
 * Molnip — mismo patrón que `ProveedorIA` (`agents/compartido/proveedorIA.ts`)
 * para Gemini: la app solo conoce esta interfaz, nunca una API concreta, así
 * que cambiar de proveedor (Brevo hoy, otro mañana) es escribir un adaptador
 * nuevo, no tocar `app/api/suscribir/route.ts` ni ningún componente.
 *
 * Dos responsabilidades separadas a propósito, no un único método:
 * `suscribir` (dar de alta al contacto, con los datos que permiten
 * segmentar campañas futuras) y `enviarBienvenida` (la automatización de
 * bienvenida en sí). Un fallo en una no debe impedir la otra — ver el
 * comentario de `app/api/suscribir/route.ts`.
 */

/** Dónde se suscribió el usuario — etiqueta libre, útil para medir qué formulario convierte mejor. */
export type OrigenSuscripcion = "pie-de-pagina" | "resultados";

export type DatosSuscripcion = {
  email: string;
  origen: OrigenSuscripcion;
  /** Si la suscripción ocurre en la página de resultados, la categoría de la herramienta recomendada — para poder segmentar campañas por interés real, no solo por fecha de alta. */
  categoriaId?: string;
  /** Igual que `categoriaId`, pero cuando el usuario entró "por objetivo" en vez de "por categoría". */
  problemaId?: string;
};

export type ResultadoOperacionEmail = { ok: true } | { ok: false; error: string };

export type ProveedorEmail = {
  /** Nombre identificativo del proveedor, útil en logs y mensajes de error. */
  nombre: string;
  /** Da de alta (o actualiza) el contacto en la lista de Molnip. */
  suscribir(datos: DatosSuscripcion): Promise<ResultadoOperacionEmail>;
  /** Envía el email de bienvenida con el lead magnet. Independiente de `suscribir` para que un fallo aquí no deshaga el alta ya hecha. */
  enviarBienvenida(email: string): Promise<ResultadoOperacionEmail>;
};

/** Error de un proveedor de email concreto, con su nombre incluido en el mensaje — mismo patrón que `ErrorProveedorIA`. */
export class ErrorProveedorEmail extends Error {
  constructor(
    public readonly proveedor: string,
    mensaje: string
  ) {
    super(`[${proveedor}] ${mensaje}`);
    this.name = "ErrorProveedorEmail";
  }
}
