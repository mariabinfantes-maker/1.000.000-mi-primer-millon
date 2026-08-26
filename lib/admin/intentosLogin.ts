import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Límite de intentos de login sin base de datos: Vercel es serverless, así
 * que un contador en memoria del proceso no sirve (cada petición puede caer
 * en una instancia distinta). El estado viaja en una cookie firmada —
 * `bloqueadoHasta` es lo único que importa comprobar en cada intento.
 *
 * Límite honesto, no vendido como infalible: quien borre esta cookie
 * reinicia el contador. Sin una base de datos o un almacén compartido
 * (Redis, KV), es la mejor barrera posible sin añadir infraestructura
 * nueva — sigue deteniendo un intento automatizado ingenuo, que es la
 * amenaza real para un panel de un solo usuario.
 */

const MAX_INTENTOS = 5;
const DURACION_BLOQUEO_MS = 15 * 60 * 1000;
const PREFIJO_FIRMA = "admin-intentos-v1:";

const SECRETO = process.env.ADMIN_PANEL_SECRETO ?? "atlas-dev-secreto-admin-no-usar-en-produccion";

export type EstadoIntentos = { fallos: number; bloqueadoHasta: number | null };

export function estadoInicial(): EstadoIntentos {
  return { fallos: 0, bloqueadoHasta: null };
}

export function estaBloqueado(estado: EstadoIntentos, ahoraMs: number = Date.now()): boolean {
  return estado.bloqueadoHasta !== null && estado.bloqueadoHasta > ahoraMs;
}

export function minutosRestantesDeBloqueo(estado: EstadoIntentos, ahoraMs: number = Date.now()): number {
  if (!estaBloqueado(estado, ahoraMs)) return 0;
  return Math.ceil((estado.bloqueadoHasta! - ahoraMs) / 60000);
}

/** Un intento fallido más. Si alcanza MAX_INTENTOS, fija el bloqueo desde ahora. */
export function registrarIntentoFallido(estado: EstadoIntentos, ahoraMs: number = Date.now()): EstadoIntentos {
  const fallos = estado.fallos + 1;
  if (fallos >= MAX_INTENTOS) {
    return { fallos, bloqueadoHasta: ahoraMs + DURACION_BLOQUEO_MS };
  }
  return { fallos, bloqueadoHasta: null };
}

function firmar(datos: Buffer): Buffer {
  return createHmac("sha256", SECRETO).update(Buffer.concat([Buffer.from(PREFIJO_FIRMA), datos])).digest();
}

function aBase64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(texto: string): Buffer {
  const normalizado = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = normalizado.length % 4 === 0 ? "" : "=".repeat(4 - (normalizado.length % 4));
  return Buffer.from(normalizado + relleno, "base64");
}

export function codificarEstadoIntentos(estado: EstadoIntentos): string {
  const datos = Buffer.from(JSON.stringify(estado), "utf8");
  const firma = firmar(datos);
  return `${aBase64Url(datos)}.${aBase64Url(firma)}`;
}

/** `estadoInicial()` ante cualquier cookie ausente, corrupta o falsificada — un intento sin cookie previa nunca debe fallar por un error interno. */
export function decodificarEstadoIntentos(token: string | undefined): EstadoIntentos {
  if (!token) return estadoInicial();
  const partes = token.split(".");
  if (partes.length !== 2) return estadoInicial();

  try {
    const datos = desdeBase64Url(partes[0]);
    const firmaRecibida = desdeBase64Url(partes[1]);
    const firmaEsperada = firmar(datos);
    if (firmaRecibida.length !== firmaEsperada.length || !timingSafeEqual(firmaRecibida, firmaEsperada)) {
      return estadoInicial();
    }
    const estado = JSON.parse(datos.toString("utf8")) as EstadoIntentos;
    if (typeof estado.fallos !== "number") return estadoInicial();
    return estado;
  } catch {
    return estadoInicial();
  }
}
