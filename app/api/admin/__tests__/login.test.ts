import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "../login/route";
import { generarHashPassword } from "@/lib/admin/passwordHash";

/**
 * Cubre exactamente lo pedido: hash vacío, hash malformado, límite de
 * intentos — a nivel de integración (la ruta real, no solo la función
 * pura de abajo). Nunca imprime ni registra la contraseña usada en estos
 * tests (son valores de prueba fijos, nunca la contraseña real que
 * configura el CEO fuera de este chat).
 */

const envOriginal = { ...process.env };

function peticionLogin(body: unknown, cookie?: string): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  return new Request("https://molnip.com/api/admin/login", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/login — casos de seguridad", () => {
  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("rechaza cualquier contraseña si ADMIN_PANEL_PASSWORD_HASH no está configurado (hash vacío)", async () => {
    delete process.env.ADMIN_PANEL_PASSWORD_HASH;
    process.env.ADMIN_PANEL_USUARIO = "admin";

    const respuesta = await login(peticionLogin({ usuario: "admin", password: "cualquiera" }));
    expect(respuesta.status).toBe(401);
  });

  it("rechaza cualquier contraseña si ADMIN_PANEL_PASSWORD_HASH está mal formado", async () => {
    process.env.ADMIN_PANEL_PASSWORD_HASH = "esto-no-es-un-hash-valido";
    process.env.ADMIN_PANEL_USUARIO = "admin";

    const respuesta = await login(peticionLogin({ usuario: "admin", password: "cualquiera" }));
    expect(respuesta.status).toBe(401);
  });

  it("acepta la combinación correcta cuando el hash es válido", async () => {
    process.env.ADMIN_PANEL_USUARIO = "admin-test";
    process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("contraseña-de-prueba-solo-para-este-test");

    const respuesta = await login(peticionLogin({ usuario: "admin-test", password: "contraseña-de-prueba-solo-para-este-test" }));
    expect(respuesta.status).toBe(200);

    const setCookie = respuesta.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("molnip_admin_sesion=");
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("rechaza un usuario correcto con contraseña incorrecta", async () => {
    process.env.ADMIN_PANEL_USUARIO = "admin-test";
    process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("la-correcta");

    const respuesta = await login(peticionLogin({ usuario: "admin-test", password: "la-incorrecta" }));
    expect(respuesta.status).toBe(401);
  });

  it("nunca revela en el mensaje de error si falló el usuario o la contraseña", async () => {
    process.env.ADMIN_PANEL_USUARIO = "admin-test";
    process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("la-correcta");

    const conUsuarioMalo = await login(peticionLogin({ usuario: "otro-usuario", password: "la-correcta" }));
    const conPasswordMala = await login(peticionLogin({ usuario: "admin-test", password: "mala" }));
    const cuerpo1 = await conUsuarioMalo.json();
    const cuerpo2 = await conPasswordMala.json();

    expect(cuerpo1.error).toBe(cuerpo2.error);
  });

  describe("límite de intentos (bloqueo tras 5 fallos)", () => {
    beforeEach(() => {
      process.env.ADMIN_PANEL_USUARIO = "admin-test";
      process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("la-correcta");
    });

    it("bloquea tras 5 intentos fallidos, incluso con la contraseña correcta en el 6º", async () => {
      let cookieIntentos: string | undefined;

      for (let i = 0; i < 5; i++) {
        const r = await login(peticionLogin({ usuario: "admin-test", password: "mala" }, cookieIntentos));
        expect(r.status).toBe(401);
        const setCookie = r.headers.get("set-cookie");
        const match = setCookie?.match(/molnip_admin_intentos=([^;]+)/);
        if (match) cookieIntentos = `molnip_admin_intentos=${match[1]}`;
      }

      const bloqueado = await login(peticionLogin({ usuario: "admin-test", password: "la-correcta" }, cookieIntentos));
      expect(bloqueado.status).toBe(429);
    });
  });
});
