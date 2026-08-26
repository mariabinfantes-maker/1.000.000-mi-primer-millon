import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "../login/route";
import { generarHashPassword } from "@/lib/admin/passwordHash";
import {
  arrancarRedisDePrueba,
  caducarClaves,
  limpiarRedis,
  pararRedisDePrueba,
} from "@/lib/admin/__tests__/servidorRedisDePrueba";

/**
 * Cubre exactamente lo pedido: hash vacío, hash malformado, límite de
 * intentos — a nivel de integración (la ruta real, no solo la función
 * pura de abajo). Nunca imprime ni registra la contraseña usada en estos
 * tests (son valores de prueba fijos, nunca la contraseña real que se
 * configura fuera de este chat).
 */

const envOriginal = { ...process.env };

function peticionLogin(body: unknown, cookie?: string, cabecerasExtra: Record<string, string> = {}): Request {
  const headers: Record<string, string> = { "content-type": "application/json", ...cabecerasExtra };
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

/**
 * Bloqueo PERSISTENTE contra un Redis real: es la defensa que de verdad
 * frena a quien prueba contraseñas en serie, porque el contador vive en un
 * servidor que esa persona no controla — a diferencia de la cookie, que
 * cualquiera borra desde su navegador.
 */
describe("POST /api/admin/login — bloqueo persistente (Redis real)", () => {
  let disponible = false;
  // Instantánea tomada DESPUÉS de arrancar Redis: restaurar `envOriginal` a
  // secas borraría las variables de conexión que fija `arrancarRedisDePrueba`,
  // y las pruebas siguientes se quedarían sin limitador — pasando por el
  // motivo equivocado, que es exactamente lo que se quiere evitar.
  let envConRedis: NodeJS.ProcessEnv;

  beforeAll(async () => {
    disponible = await arrancarRedisDePrueba();
    envConRedis = { ...process.env };
  }, 20000);

  afterAll(async () => {
    if (disponible) await pararRedisDePrueba();
  });

  beforeEach(async () => {
    if (!disponible) return;
    await limpiarRedis();
    const { reiniciarClienteRedis } = await import("@/lib/admin/limitadorRedis");
    reiniciarClienteRedis();
    process.env.ADMIN_PANEL_USUARIO = "admin-test";
    process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("la-correcta");

    // Salvaguarda: si en algún momento se perdiera la configuración de
    // Redis, estas pruebas dejarían de comprobar lo que dicen comprobar.
    const { redisConfigurado } = await import("@/lib/admin/limitadorRedis");
    expect(redisConfigurado(), "las pruebas de bloqueo persistente exigen Redis configurado").toBe(true);
  });

  afterEach(() => {
    process.env = { ...envConRedis };
  });

  const desde = (ip: string) => ({ "x-vercel-forwarded-for": ip });

  it("bloquea tras 5 fallos aunque se borren las cookies entre intentos", async () => {
    if (!disponible) return;

    // Sin pasar nunca la cookie de intentos: se simula a alguien que la
    // borra después de cada intento. El bloqueo debe llegar igualmente.
    for (let i = 0; i < 5; i++) {
      const r = await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.1")));
      expect(r.status).toBe(401);
    }

    const sexto = await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.1")));
    expect(sexto.status).toBe(429);
  });

  it("el bloqueo resiste aunque se acierte la contraseña correcta después", async () => {
    if (!disponible) return;

    for (let i = 0; i < 5; i++) {
      await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.2")));
    }

    const conCorrecta = await login(
      peticionLogin({ usuario: "admin-test", password: "la-correcta" }, undefined, desde("203.0.113.2"))
    );
    expect(conCorrecta.status).toBe(429);
  });

  it("no se puede esquivar el bloqueo falsificando la cabecera de IP del cliente", async () => {
    if (!disponible) return;

    // Cinco fallos desde una IP real fijada por el proxy.
    for (let i = 0; i < 5; i++) {
      await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.3")));
    }

    // Ahora se intenta con una x-forwarded-for inventada: la cabecera de
    // Vercel manda, así que sigue bloqueado.
    const conIpFalsa = await login(
      peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, {
        "x-vercel-forwarded-for": "203.0.113.3",
        "x-forwarded-for": "8.8.8.8",
      })
    );
    expect(conIpFalsa.status).toBe(429);
  });

  it("el bloqueo se levanta al caducar, sin intervención de nadie", async () => {
    if (!disponible) return;

    for (let i = 0; i < 5; i++) {
      await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.4")));
    }
    expect((await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.4")))).status).toBe(429);

    await caducarClaves("molnip:login");

    const trasCaducar = await login(
      peticionLogin({ usuario: "admin-test", password: "la-correcta" }, undefined, desde("203.0.113.4"))
    );
    expect(trasCaducar.status).toBe(200);
  });

  it("un acceso correcto borra los fallos acumulados", async () => {
    if (!disponible) return;

    for (let i = 0; i < 3; i++) {
      await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.5")));
    }
    expect((await login(peticionLogin({ usuario: "admin-test", password: "la-correcta" }, undefined, desde("203.0.113.5")))).status).toBe(200);

    // Tras el acceso correcto, vuelve a haber cinco oportunidades.
    for (let i = 0; i < 5; i++) {
      const r = await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.5")));
      expect(r.status).toBe(401);
    }
  });

  it("el mensaje de bloqueo no revela si el usuario existe", async () => {
    if (!disponible) return;

    for (let i = 0; i < 5; i++) {
      await login(peticionLogin({ usuario: "admin-test", password: "mala" }, undefined, desde("203.0.113.6")));
    }
    for (let i = 0; i < 5; i++) {
      await login(peticionLogin({ usuario: "usuario-que-no-existe", password: "x" }, undefined, desde("203.0.113.7")));
    }

    const conUsuarioReal = await login(peticionLogin({ usuario: "admin-test", password: "x" }, undefined, desde("203.0.113.6")));
    const conUsuarioFalso = await login(peticionLogin({ usuario: "usuario-que-no-existe", password: "x" }, undefined, desde("203.0.113.7")));

    expect(conUsuarioReal.status).toBe(conUsuarioFalso.status);
    expect((await conUsuarioReal.json()).error).toBe((await conUsuarioFalso.json()).error);
  });

  it("nunca escribe la contraseña ni el hash en los registros", async () => {
    if (!disponible) return;
    const espiaLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const espiaError = vi.spyOn(console, "error").mockImplementation(() => {});
    const espiaAviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    const contraseña = "una-contraseña-que-no-debe-aparecer-en-ningun-log";
    await login(peticionLogin({ usuario: "admin-test", password: contraseña }, undefined, desde("203.0.113.8")));

    const todoLoRegistrado = [...espiaLog.mock.calls, ...espiaError.mock.calls, ...espiaAviso.mock.calls]
      .flat()
      .map(String)
      .join(" ");

    expect(todoLoRegistrado).not.toContain(contraseña);
    expect(todoLoRegistrado).not.toContain(process.env.ADMIN_PANEL_PASSWORD_HASH);

    espiaLog.mockRestore();
    espiaError.mockRestore();
    espiaAviso.mockRestore();
  });
});

/**
 * Fallo cerrado: en producción, sin limitador disponible NO se admite
 * ningún intento. Es preferible dejar el panel temporalmente inaccesible a
 * dejarlo expuesto a intentos ilimitados si Redis se cae o se despliega mal
 * configurado.
 */
describe("POST /api/admin/login — comportamiento sin Redis", () => {
  const nodeEnvOriginal = process.env.NODE_ENV;

  afterEach(() => {
    process.env = { ...envOriginal };
    Object.defineProperty(process.env, "NODE_ENV", { value: nodeEnvOriginal, configurable: true, writable: true });
  });

  beforeEach(async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    const { reiniciarClienteRedis } = await import("@/lib/admin/limitadorRedis");
    reiniciarClienteRedis();
    process.env.ADMIN_PANEL_USUARIO = "admin-test";
    process.env.ADMIN_PANEL_PASSWORD_HASH = generarHashPassword("la-correcta");
  });

  it("EN PRODUCCIÓN rechaza el acceso si el limitador no está disponible", async () => {
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true, writable: true });
    vi.resetModules();
    const { POST: loginProduccion } = await import("../login/route");
    const espiaError = vi.spyOn(console, "error").mockImplementation(() => {});

    const respuesta = await loginProduccion(peticionLogin({ usuario: "admin-test", password: "la-correcta" }));

    expect(respuesta.status).toBe(503);
    const cuerpo = await respuesta.json();
    // El mensaje no explica que el motivo es que Redis está caído.
    expect(cuerpo.error).not.toMatch(/redis|upstash/i);

    espiaError.mockRestore();
    vi.resetModules();
  });

  it("EN DESARROLLO permite continuar para no exigir Redis en local", async () => {
    const espiaAviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    const respuesta = await login(peticionLogin({ usuario: "admin-test", password: "la-correcta" }));

    expect(respuesta.status).toBe(200);
    espiaAviso.mockRestore();
  });
});
