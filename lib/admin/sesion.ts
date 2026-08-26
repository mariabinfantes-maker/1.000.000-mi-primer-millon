import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión del panel interno — mismo patrón de firma que
 * `lib/resultadoToken.ts` (HMAC-SHA256 + comparación en tiempo constante),
 * sin compresión porque el payload es minúsculo. El token viaja dentro de
 * una cookie HttpOnly/Secure/SameSite=Strict (ver `lib/admin/cookies.ts`),
 * nunca es legible ni manipulable desde el navegador salvo por su propio
 * borrado.
 */

const DURACION_SESION_MS = 12 * 60 * 60 * 1000; // 12 horas

// Mismo criterio que `RESULTADO_TOKEN_SECRETO`: sin variable de entorno,
// un valor de repuesto solo para que `npm run dev`/tests funcionen sin
// configuración — nunca usar el valor de repuesto en producción.
const SECRETO = process.env.ADMIN_PANEL_SECRETO ?? "atlas-dev-secreto-admin-no-usar-en-produccion";

type PayloadSesion = { usuario: string; exp: number };

function aBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(texto: string): Buffer {
  const normalizado = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizado.length % 4 === 0 ? "" : "=".repeat(4 - (normalizado.length % 4));
  return Buffer.from(normalizado + relleno, "base64");
}

function firmar(datos: Buffer): Buffer {
  return createHmac("sha256", SECRETO).update(datos).digest();
}

export function generarTokenSesion(usuario: string, ahoraMs: number = Date.now()): string {
  const payload: PayloadSesion = { usuario, exp: ahoraMs + DURACION_SESION_MS };
  const datos = Buffer.from(JSON.stringify(payload), "utf8");
  const firma = firmar(datos);
  return `${aBase64Url(datos)}.${aBase64Url(firma)}`;
}

/**
 * `null` ante cualquier token ausente, corrupto, falsificado o caducado —
 * nunca lanza, para que el middleware pueda simplemente redirigir al
 * login en cualquiera de esos casos sin distinguirlos (distinguirlos no
 * aportaría nada a quien intenta entrar sin sesión válida).
 */
export function verificarTokenSesion(token: string | undefined, ahoraMs: number = Date.now()): PayloadSesion | null {
  if (!token) return null;
  const partes = token.split(".");
  if (partes.length !== 2) return null;

  try {
    const datos = desdeBase64Url(partes[0]);
    const firmaRecibida = desdeBase64Url(partes[1]);
    const firmaEsperada = firmar(datos);
    if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(firmaRecibida, firmaEsperada)) {
      return null;
    }

    const payload = JSON.parse(datos.toString("utf8")) as PayloadSesion;
    if (typeof payload.usuario !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < ahoraMs) return null;
    return payload;
  } catch {
    return null;
  }
}

export const DURACION_SESION_SEGUNDOS = DURACION_SESION_MS / 1000;
