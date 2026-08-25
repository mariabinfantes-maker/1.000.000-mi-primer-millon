import { randomBytes, timingSafeEqual } from "node:crypto";

/**
 * CSRF de doble envío: un valor aleatorio se guarda en una cookie legible
 * (no HttpOnly, a propósito — el cliente necesita leerla para reenviarla)
 * y el cliente debe repetirla en una cabecera (`x-csrf-token`) en cada
 * petición que cambie estado. Un sitio externo puede hacer que el
 * navegador envíe la cookie de sesión (aunque `SameSite=Strict` ya lo
 * bloquea en la práctica), pero no puede leer esta cookie para copiarla en
 * la cabecera — esa es la protección.
 */

const LONGITUD_TOKEN = 32;

export function generarTokenCsrf(): string {
  return randomBytes(LONGITUD_TOKEN).toString("hex");
}

/** Compara en tiempo constante; `false` ante cualquier valor ausente o de longitud distinta. */
export function tokensCsrfCoinciden(deCookie: string | undefined, deCabecera: string | undefined | null): boolean {
  if (!deCookie || !deCabecera) return false;
  const a = Buffer.from(deCookie, "hex");
  const b = Buffer.from(deCabecera, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}
