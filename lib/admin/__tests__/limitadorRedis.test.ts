import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  arrancarRedisDePrueba,
  caducarClaves,
  clavesDelLimitador,
  limpiarRedis,
  pararRedisDePrueba,
  vidaRestante,
} from "./servidorRedisDePrueba";

/**
 * Pruebas del bloqueo de intentos de login contra un Redis REAL, levantado
 * en local por `servidorRedisDePrueba.ts` — no una imitación. Así se
 * comprueban también las suposiciones sobre el propio Redis: que `INCR`
 * devuelve un número, que `TTL` devuelve segundos, y que al desaparecer la
 * clave el bloqueo se levanta solo.
 *
 * Nunca se conecta a la instancia real de Upstash.
 */

let disponible = false;

beforeAll(async () => {
  disponible = await arrancarRedisDePrueba();
  if (!disponible) console.warn("[vitest] redis-server no disponible: se saltan las pruebas del limitador.");
}, 20000);

afterAll(async () => {
  if (disponible) await pararRedisDePrueba();
});

// El módulo lee el entorno al construir su cliente, así que se importa
// después de que `arrancarRedisDePrueba` haya fijado las variables.
async function cargarLimitador() {
  const modulo = await import("../limitadorRedis");
  modulo.reiniciarClienteRedis();
  return modulo;
}

const IP = "203.0.113.10";
const OTRA_IP = "203.0.113.99";
const USUARIO = "admin";
const OTRO_USUARIO = "intruso";

describe("limitador de intentos de login (Redis real)", () => {
  beforeEach(async () => {
    if (!disponible) return;
    await limpiarRedis();
  });

  it("permite los primeros intentos y bloquea al llegar al quinto fallo", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, LIMITES } = await cargarLimitador();

    for (let intento = 1; intento < LIMITES.MAX_INTENTOS; intento++) {
      const antes = await comprobarLimite(IP, USUARIO);
      expect(antes.permitido, `el intento ${intento} debería permitirse`).toBe(true);
      await registrarFallo(IP, USUARIO);
    }

    // Cuatro fallos registrados: el quinto intento todavía se permite...
    const quinto = await comprobarLimite(IP, USUARIO);
    expect(quinto.permitido).toBe(true);
    await registrarFallo(IP, USUARIO);

    // ...y tras el quinto fallo, ya no.
    const sexto = await comprobarLimite(IP, USUARIO);
    expect(sexto.permitido).toBe(false);
    if (!sexto.permitido && sexto.motivo === "bloqueado") {
      expect(sexto.segundosRestantes).toBeGreaterThan(0);
      expect(sexto.segundosRestantes).toBeLessThanOrEqual(LIMITES.BLOQUEO_SEGUNDOS);
    }
  });

  it("cuenta por IP: bloquear una IP no bloquea a otra con el mismo usuario", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, LIMITES } = await cargarLimitador();

    for (let i = 0; i < LIMITES.MAX_INTENTOS; i++) await registrarFallo(IP, USUARIO);

    expect((await comprobarLimite(IP, USUARIO)).permitido).toBe(false);
    // La otra IP comparte usuario, así que el contador POR USUARIO también
    // está al límite: debe quedar bloqueada igualmente.
    expect((await comprobarLimite(OTRA_IP, USUARIO)).permitido).toBe(false);
  });

  it("cuenta por usuario: una IP bloqueada lo está aunque cambie de usuario", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, LIMITES } = await cargarLimitador();

    for (let i = 0; i < LIMITES.MAX_INTENTOS; i++) await registrarFallo(IP, USUARIO);

    // Misma IP, otro usuario: el contador por IP ya está al límite.
    expect((await comprobarLimite(IP, OTRO_USUARIO)).permitido).toBe(false);
  });

  it("una IP y un usuario distintos siguen pudiendo entrar (el bloqueo no es global)", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, LIMITES } = await cargarLimitador();

    for (let i = 0; i < LIMITES.MAX_INTENTOS; i++) await registrarFallo(IP, USUARIO);

    expect((await comprobarLimite(OTRA_IP, OTRO_USUARIO)).permitido).toBe(true);
  });

  it("el bloqueo caduca solo: al desaparecer las claves se vuelve a permitir", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, LIMITES } = await cargarLimitador();

    for (let i = 0; i < LIMITES.MAX_INTENTOS; i++) await registrarFallo(IP, USUARIO);
    expect((await comprobarLimite(IP, USUARIO)).permitido).toBe(false);

    // Se fuerza la caducidad en vez de esperar 15 minutos reales.
    const borradas = await caducarClaves("molnip:login");
    expect(borradas).toBeGreaterThan(0);

    expect((await comprobarLimite(IP, USUARIO)).permitido).toBe(true);
  });

  it("el bloqueo tiene fecha de caducidad desde el primer fallo y no se prolonga al seguir intentándolo", async () => {
    if (!disponible) return;
    const { registrarFallo, LIMITES } = await cargarLimitador();

    await registrarFallo(IP, USUARIO);
    const claves = await clavesDelLimitador();
    expect(claves.length).toBe(2); // una por IP, otra por usuario

    const vidaInicial = await vidaRestante(claves[0]);
    expect(vidaInicial).toBeGreaterThan(0);
    expect(vidaInicial).toBeLessThanOrEqual(LIMITES.BLOQUEO_SEGUNDOS);

    // Más fallos no deben reiniciar la cuenta atrás.
    await registrarFallo(IP, USUARIO);
    await registrarFallo(IP, USUARIO);
    const vidaDespues = await vidaRestante(claves[0]);
    expect(vidaDespues).toBeLessThanOrEqual(vidaInicial);
  });

  it("un acceso correcto limpia los contadores de fallos previos", async () => {
    if (!disponible) return;
    const { comprobarLimite, registrarFallo, limpiarIntentos } = await cargarLimitador();

    await registrarFallo(IP, USUARIO);
    await registrarFallo(IP, USUARIO);
    expect((await clavesDelLimitador()).length).toBe(2);

    await limpiarIntentos(IP, USUARIO);
    expect((await clavesDelLimitador()).length).toBe(0);
    expect((await comprobarLimite(IP, USUARIO)).permitido).toBe(true);
  });

  it("no guarda en Redis el nombre de usuario ni la IP en claro", async () => {
    if (!disponible) return;
    const { registrarFallo } = await cargarLimitador();

    await registrarFallo(IP, USUARIO);
    const claves = await clavesDelLimitador();

    expect(claves.length).toBeGreaterThan(0);
    for (const clave of claves) {
      expect(clave).not.toContain(USUARIO);
      expect(clave).not.toContain(IP);
    }
  });

  it("informa de 'no disponible' si Redis no está configurado", async () => {
    if (!disponible) return;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;

    const { comprobarLimite, redisConfigurado } = await cargarLimitador();
    expect(redisConfigurado()).toBe(false);

    const resultado = await comprobarLimite(IP, USUARIO);
    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) expect(resultado.motivo).toBe("no-disponible");

    process.env.UPSTASH_REDIS_REST_URL = url;
    process.env.UPSTASH_REDIS_REST_TOKEN = token;
    if (kvUrl) process.env.KV_REST_API_URL = kvUrl;
    if (kvToken) process.env.KV_REST_API_TOKEN = kvToken;
  });

  it("informa de 'no disponible' si Redis está configurado pero no responde", async () => {
    if (!disponible) return;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    // Puerto cerrado a propósito: simula Upstash caído o inalcanzable.
    process.env.UPSTASH_REDIS_REST_URL = "http://127.0.0.1:1";

    const { comprobarLimite } = await cargarLimitador();
    const resultado = await comprobarLimite(IP, USUARIO);

    expect(resultado.permitido).toBe(false);
    if (!resultado.permitido) expect(resultado.motivo).toBe("no-disponible");

    process.env.UPSTASH_REDIS_REST_URL = url;
  });

  it("registrarFallo no lanza aunque Redis no responda", async () => {
    if (!disponible) return;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    process.env.UPSTASH_REDIS_REST_URL = "http://127.0.0.1:1";

    const { registrarFallo, limpiarIntentos } = await cargarLimitador();
    await expect(registrarFallo(IP, USUARIO)).resolves.toBeUndefined();
    await expect(limpiarIntentos(IP, USUARIO)).resolves.toBeUndefined();

    process.env.UPSTASH_REDIS_REST_URL = url;
  });

  afterEach(async () => {
    if (disponible) {
      const { reiniciarClienteRedis } = await import("../limitadorRedis");
      reiniciarClienteRedis();
    }
  });
});
