import { NextResponse } from "next/server";
import { COOKIE_CSRF, COOKIE_INTENTOS, COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarPassword } from "@/lib/admin/passwordHash";
import { generarTokenSesion, DURACION_SESION_SEGUNDOS } from "@/lib/admin/sesion";
import { generarTokenCsrf } from "@/lib/admin/csrf";
import {
  codificarEstadoIntentos,
  decodificarEstadoIntentos,
  estaBloqueado,
  estadoInicial,
  minutosRestantesDeBloqueo,
  registrarIntentoFallido,
} from "@/lib/admin/intentosLogin";

/**
 * Único punto de entrada del panel interno. Nunca registra la contraseña
 * recibida en ningún log (`console.log`/`console.error` de este archivo
 * jamás incluyen `password` ni `cuerpo`) — solo el resultado (éxito/fallo)
 * si algún día se añade logging.
 */

const ES_PRODUCCION = process.env.NODE_ENV === "production";

function opcionesCookieSesion() {
  return {
    httpOnly: true,
    secure: ES_PRODUCCION,
    sameSite: "strict" as const,
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  };
}

export async function POST(request: Request) {
  const cookiesCabecera = request.headers.get("cookie");
  const estadoIntentos = decodificarEstadoIntentos(leerCookie(cookiesCabecera, COOKIE_INTENTOS));

  if (estaBloqueado(estadoIntentos)) {
    return NextResponse.json(
      { error: `Demasiados intentos. Vuelve a intentarlo en ${minutosRestantesDeBloqueo(estadoIntentos)} minuto(s).` },
      { status: 429 }
    );
  }

  let cuerpo: { usuario?: string; password?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const usuarioEsperado = process.env.ADMIN_PANEL_USUARIO;
  const hashEsperado = process.env.ADMIN_PANEL_PASSWORD_HASH;

  const credencialesValidas =
    !!usuarioEsperado &&
    !!cuerpo.usuario &&
    cuerpo.usuario === usuarioEsperado &&
    verificarPassword(cuerpo.password ?? "", hashEsperado);

  if (!credencialesValidas) {
    const nuevoEstado = registrarIntentoFallido(estadoIntentos);
    const respuesta = NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
    respuesta.cookies.set(COOKIE_INTENTOS, codificarEstadoIntentos(nuevoEstado), {
      httpOnly: true,
      secure: ES_PRODUCCION,
      sameSite: "strict",
      path: "/api/admin/login",
      maxAge: 30 * 60,
    });
    return respuesta;
  }

  const sesion = generarTokenSesion(cuerpo.usuario!);
  const csrf = generarTokenCsrf();

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, sesion, opcionesCookieSesion());
  // No HttpOnly a propósito: el cliente necesita leerla para reenviarla en
  // la cabecera x-csrf-token (ver lib/admin/csrf.ts).
  respuesta.cookies.set(COOKIE_CSRF, csrf, {
    httpOnly: false,
    secure: ES_PRODUCCION,
    sameSite: "strict",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
  respuesta.cookies.set(COOKIE_INTENTOS, codificarEstadoIntentos(estadoInicial()), {
    httpOnly: true,
    secure: ES_PRODUCCION,
    sameSite: "strict",
    path: "/api/admin/login",
    maxAge: 0,
  });

  return respuesta;
}

function leerCookie(cabecera: string | null, nombre: string): string | undefined {
  if (!cabecera) return undefined;
  for (const parte of cabecera.split(";")) {
    const indice = parte.indexOf("=");
    if (indice === -1) continue;
    if (parte.slice(0, indice).trim() === nombre) return decodeURIComponent(parte.slice(indice + 1).trim());
  }
  return undefined;
}
