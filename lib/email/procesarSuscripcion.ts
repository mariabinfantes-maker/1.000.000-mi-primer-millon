import type { CuerpoSuscripcion } from "./validarSuscripcion";
import { validarSuscripcion } from "./validarSuscripcion";
import type { ProveedorEmail } from "./proveedorEmail";

export type ResultadoSuscripcion = { ok: true } | { ok: false; error: string };

/**
 * Orquesta una suscripción completa: valida, da de alta al contacto y envía
 * la bienvenida — recibe el `ProveedorEmail` por parámetro (igual que
 * `investigarHerramienta` recibe `ProveedorIA`) para poder probarse con un
 * proveedor falso, sin llamar nunca a la API real de Brevo desde un test.
 *
 * El alta y la bienvenida son independientes a propósito (ver el
 * comentario de `ProveedorEmail`): si el alta falla, se informa al
 * usuario (no está realmente suscrito). Si el alta funciona pero la
 * bienvenida falla, el usuario sigue viendo éxito — ya está suscrito, que
 * es lo que le importa — y el fallo del email queda solo en el log del
 * servidor para revisarlo aparte.
 */
export async function procesarSuscripcion(
  cuerpo: CuerpoSuscripcion,
  proveedor: ProveedorEmail
): Promise<ResultadoSuscripcion> {
  const validacion = validarSuscripcion(cuerpo);
  if (!validacion.ok) return validacion;

  const resultadoAlta = await proveedor.suscribir({
    email: validacion.email,
    origen: validacion.origen,
    categoriaId: validacion.categoriaId,
    problemaId: validacion.problemaId,
  });

  if (!resultadoAlta.ok) {
    console.error(`[email] Fallo al suscribir ${validacion.email}: ${resultadoAlta.error}`);
    return { ok: false, error: "No hemos podido completar la suscripción. Inténtalo de nuevo en unos minutos." };
  }

  const resultadoBienvenida = await proveedor.enviarBienvenida(validacion.email);
  if (!resultadoBienvenida.ok) {
    console.error(`[email] Suscripción ok pero falló el email de bienvenida para ${validacion.email}: ${resultadoBienvenida.error}`);
  }

  return { ok: true };
}
