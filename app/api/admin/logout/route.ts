import { NextResponse } from "next/server";
import { COOKIE_CSRF, COOKIE_SESION } from "@/lib/admin/cookies";

/** Borra las cookies de sesión y CSRF. Funciona sin sesión válida: cerrar sesión nunca debe fallar. */
export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, "", { path: "/", maxAge: 0 });
  respuesta.cookies.set(COOKIE_CSRF, "", { path: "/", maxAge: 0 });
  return respuesta;
}
