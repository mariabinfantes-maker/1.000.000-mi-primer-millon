import { describe, expect, it } from "vitest";
import { COOKIE_CSRF, COOKIE_SESION } from "../cookies";
import { generarTokenSesion } from "../sesion";
import { verificarPeticionAdmin } from "../verificarPeticion";

function peticion(metodo: string, cookies: Record<string, string>, cabeceraCsrf?: string): Request {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("; ");
  const headers = new Headers({ cookie: cookieHeader });
  if (cabeceraCsrf !== undefined) headers.set("x-csrf-token", cabeceraCsrf);
  return new Request("https://molnip.com/api/admin/afiliacion", { method: metodo, headers });
}

describe("verificarPeticionAdmin", () => {
  it("rechaza una petición sin cookie de sesión", () => {
    const resultado = verificarPeticionAdmin(peticion("GET", {}));
    expect(resultado.ok).toBe(false);
  });

  it("acepta un GET con sesión válida, sin exigir CSRF", () => {
    const token = generarTokenSesion("admin");
    const resultado = verificarPeticionAdmin(peticion("GET", { [COOKIE_SESION]: token }));
    expect(resultado.ok).toBe(true);
  });

  it("rechaza un POST con sesión válida pero sin token CSRF", () => {
    const token = generarTokenSesion("admin");
    const resultado = verificarPeticionAdmin(peticion("POST", { [COOKIE_SESION]: token }));
    expect(resultado.ok).toBe(false);
  });

  it("rechaza un POST cuando el CSRF de la cookie y de la cabecera no coinciden", () => {
    const token = generarTokenSesion("admin");
    const resultado = verificarPeticionAdmin(
      peticion("POST", { [COOKIE_SESION]: token, [COOKIE_CSRF]: "aaaa" }, "bbbb")
    );
    expect(resultado.ok).toBe(false);
  });

  it("acepta un POST cuando el CSRF de la cookie y de la cabecera coinciden y la sesión es válida", () => {
    const token = generarTokenSesion("admin");
    const csrf = "aabbccdd"; // hex válido — un token CSRF real siempre lo es (randomBytes().toString("hex"))
    const resultado = verificarPeticionAdmin(peticion("POST", { [COOKIE_SESION]: token, [COOKIE_CSRF]: csrf }, csrf));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.usuario).toBe("admin");
  });

  it("rechaza un token de sesión falsificado", () => {
    const resultado = verificarPeticionAdmin(peticion("GET", { [COOKIE_SESION]: "falsificado.token" }));
    expect(resultado.ok).toBe(false);
  });
});
