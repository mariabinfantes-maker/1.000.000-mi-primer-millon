import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";

/**
 * Protege el panel interno de Affiliate Manager. En esta versión de
 * Next.js `middleware.ts` está deprecado en favor de `proxy.ts` (ver
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`,
 * "Middleware is deprecated and renamed to Proxy") — confirmado en la
 * documentación local antes de escribir este archivo, no asumido.
 *
 * Primera barrera, no la única: cada ruta de `/api/admin/*` vuelve a
 * verificar la sesión por su cuenta (`lib/admin/verificarPeticion.ts`) —
 * la propia documentación de Proxy advierte no confiar solo en esta capa,
 * por si un cambio de ruta futuro se queda fuera del matcher sin que
 * nadie se dé cuenta.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESION)?.value;
  const sesion = verificarTokenSesion(token);

  if (!sesion) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const destino = new URL("/admin/login", request.url);
    destino.searchParams.set("desde", pathname);
    return NextResponse.redirect(destino);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
