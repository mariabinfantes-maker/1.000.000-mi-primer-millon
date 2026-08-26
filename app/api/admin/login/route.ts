import { NextResponse } from "next/server";
import { COOKIE_CSRF, COOKIE_INTENTOS, COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarPassword } from "@/lib/admin/passwordHash";
import { generarTokenSesion, DURACION_SESION_SEGUNDOS } from "@/lib/admin/sesion";
import { generarTokenCsrf } from "@/lib/admin/csrf";
import { obtenerIpCliente } from "@/lib/admin/ipCliente";
import { comprobarLimite, limpiarIntentos, registrarFallo } from "@/lib/admin/limitadorRedis";
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
 *
 * Dos barreras contra quien pruebe contraseñas en serie:
 *
 * 1. `limitadorRedis.ts` — la principal. Cuenta en Upstash Redis por IP y
 *    por usuario, en un servidor que quien lo intenta no controla, y falla
 *    cerrado en producción si Redis no responde.
 * 2. `intentosLogin.ts` — una cookie firmada, como capa adicional. Se
 *    conserva porque no cuesta nada y detiene el caso más ingenuo, pero no
 *    es la defensa real: cualquiera puede borrar sus propias cookies.
 *
 * El mensaje de error es SIEMPRE el mismo, exista el usuario o no: revelar
 * cuál de los dos campos falla le diría a quien lo intenta que ha acertado
 * el nombre de la cuenta.
 */

const ES_PRODUCCION = process.env.NODE_ENV === "production";
const ERROR_CREDENCIALES = "Usuario o contraseña incorrectos.";

function opcionesCookieSesion() {
  return {
    httpOnly: true,
    secure: ES_PRODUCCION,
    sameSite: "strict" as const,
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  };
}

function respuestaBloqueado(minutos: number) {
  return NextResponse.json(
    { error: `Demasiados intentos fallidos. Vuelve a intentarlo dentro de ${minutos} minuto(s).` },
    { status: 429 }
  );
}

export async function POST(request: Request) {
  const cookiesCabecera = request.headers.get("cookie");
  const estadoIntentos = decodificarEstadoIntentos(leerCookie(cookiesCabecera, COOKIE_INTENTOS));

  // Capa adicional (cookie): si ya está marcada como bloqueada, ni siquiera
  // se consulta a Redis.
  if (estaBloqueado(estadoIntentos)) {
    return respuestaBloqueado(minutosRestantesDeBloqueo(estadoIntentos));
  }

  let cuerpo: { usuario?: string; password?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida." }, { status: 400 });
  }

  const ip = obtenerIpCliente(request);
  // Se cuenta contra el usuario que se ha intentado, exista o no: así el
  // límite por usuario también protege de quien va probando nombres.
  const usuarioIntentado = (cuerpo.usuario ?? "").slice(0, 200);

  // Barrera principal (Redis), antes de comprobar ninguna contraseña.
  const limite = await comprobarLimite(ip, usuarioIntentado);

  if (!limite.permitido && limite.motivo === "bloqueado") {
    return respuestaBloqueado(Math.max(1, Math.ceil(limite.segundosRestantes / 60)));
  }

  if (!limite.permitido && limite.motivo === "no-disponible") {
    if (ES_PRODUCCION) {
      // Fallo cerrado: sin limitador no se admiten intentos. Preferible a
      // dejar el panel expuesto a intentos ilimitados si Redis se cae o se
      // queda mal configurado.
      console.error("[admin/login] Limitador de intentos no disponible: se rechaza el acceso por seguridad.");
      return NextResponse.json(
        { error: "El acceso no está disponible en este momento. Inténtalo de nuevo más tarde." },
        { status: 503 }
      );
    }
    console.warn("[admin/login] Sin Redis configurado: en desarrollo se continúa solo con la cookie de intentos.");
  }

  const usuarioEsperado = process.env.ADMIN_PANEL_USUARIO;
  const hashEsperado = process.env.ADMIN_PANEL_PASSWORD_HASH;

  const credencialesValidas =
    !!usuarioEsperado &&
    !!cuerpo.usuario &&
    cuerpo.usuario === usuarioEsperado &&
    verificarPassword(cuerpo.password ?? "", hashEsperado);

  if (!credencialesValidas) {
    await registrarFallo(ip, usuarioIntentado);

    const nuevoEstado = registrarIntentoFallido(estadoIntentos);
    const respuesta = NextResponse.json({ error: ERROR_CREDENCIALES }, { status: 401 });
    respuesta.cookies.set(COOKIE_INTENTOS, codificarEstadoIntentos(nuevoEstado), {
      httpOnly: true,
      secure: ES_PRODUCCION,
      sameSite: "strict",
      path: "/api/admin/login",
      maxAge: 30 * 60,
    });
    return respuesta;
  }

  // Acceso correcto: se limpian los contadores de fallos previos.
  await limpiarIntentos(ip, usuarioIntentado);

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
