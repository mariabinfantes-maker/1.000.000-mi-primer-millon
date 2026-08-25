import { COOKIE_CSRF, COOKIE_SESION } from "./cookies";
import { verificarTokenSesion } from "./sesion";
import { tokensCsrfCoinciden } from "./csrf";

/**
 * Verificación de sesión reutilizada por CADA ruta de API bajo
 * `/api/admin/*`, además de por `proxy.ts` — nunca confiar solo en el
 * proxy: la propia documentación de Next.js para esta versión lo advierte
 * explícitamente ("Always verify authentication... inside each Server
 * Function rather than relying on Proxy alone"), porque un cambio futuro
 * de ruta podría dejar de pasar por el matcher del proxy sin que nadie se
 * dé cuenta.
 */

const METODOS_QUE_EXIGEN_CSRF = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export type ResultadoVerificacion = { ok: true; usuario: string } | { ok: false; motivo: string };

export function verificarPeticionAdmin(request: Request): ResultadoVerificacion {
  const cookies = parsearCookies(request.headers.get("cookie"));

  const sesion = verificarTokenSesion(cookies[COOKIE_SESION]);
  if (!sesion) return { ok: false, motivo: "Sesión no válida o caducada." };

  if (METODOS_QUE_EXIGEN_CSRF.has(request.method)) {
    const cabeceraCsrf = request.headers.get("x-csrf-token");
    if (!tokensCsrfCoinciden(cookies[COOKIE_CSRF], cabeceraCsrf)) {
      return { ok: false, motivo: "Token CSRF ausente o no coincide." };
    }
  }

  return { ok: true, usuario: sesion.usuario };
}

function parsearCookies(cabecera: string | null): Record<string, string> {
  if (!cabecera) return {};
  const resultado: Record<string, string> = {};
  for (const parte of cabecera.split(";")) {
    const indice = parte.indexOf("=");
    if (indice === -1) continue;
    const nombre = parte.slice(0, indice).trim();
    const valor = parte.slice(indice + 1).trim();
    if (nombre) resultado[nombre] = decodeURIComponent(valor);
  }
  return resultado;
}
