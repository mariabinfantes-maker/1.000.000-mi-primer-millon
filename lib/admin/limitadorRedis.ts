import { Redis } from "@upstash/redis";

/**
 * Bloqueo de intentos de login PERSISTENTE, en Upstash Redis.
 *
 * Sustituye como defensa principal a la cookie firmada de
 * `intentosLogin.ts`, que se sigue usando pero solo como capa adicional: una
 * cookie la borra cualquiera desde su propio navegador, así que por sí sola
 * no frena a quien pruebe contraseñas en serie. El contador de aquí vive en
 * un servidor que quien lo intenta no controla.
 *
 * Se cuenta por IP **y** por usuario, por separado:
 * - por IP frena a quien prueba muchos usuarios desde un sitio;
 * - por usuario frena a quien prueba una misma cuenta desde muchas IP.
 * Basta con que uno de los dos contadores llegue al límite para bloquear.
 *
 * El propio Redis se encarga de que el bloqueo caduque: cada contador se
 * crea con un tiempo de vida, y al desaparecer la clave el bloqueo se
 * levanta solo. No hay ninguna tarea de limpieza que pueda olvidarse.
 *
 * FALLO CERRADO EN PRODUCCIÓN: si Redis no está configurado o no responde,
 * en producción se rechaza el intento en vez de dejar pasar a todo el mundo
 * sin límite. En desarrollo se permite continuar (con aviso por consola)
 * para no exigir Redis solo para trabajar en local.
 *
 * Nunca guarda ni registra contraseñas: la clave de Redis lleva un
 * resumen del nombre de usuario, no el usuario en claro, y jamás la
 * contraseña.
 */

const MAX_INTENTOS = 5;
const BLOQUEO_SEGUNDOS = 15 * 60;
const PREFIJO = "molnip:login";

/**
 * Cuánto se espera como máximo a Redis antes de darlo por no disponible.
 * Sin este tope, con Redis lento o caído el cliente reintenta varias veces
 * y la pantalla de login se queda colgada varios segundos — detectado al
 * escribir las pruebas, donde una comprobación contra un puerto cerrado
 * tardaba más de cinco segundos en resolverse. En producción eso se
 * traduce en un fallo cerrado lento en vez de rápido.
 */
const ESPERA_MAXIMA_MS = 1500;

export type ResultadoLimite =
  | { permitido: true }
  | { permitido: false; motivo: "bloqueado"; segundosRestantes: number }
  | { permitido: false; motivo: "no-disponible" };

let cliente: Redis | null | undefined;

/** `null` si no hay configuración de Redis. Se construye una sola vez por proceso. */
function obtenerCliente(): Redis | null {
  if (cliente !== undefined) return cliente;

  // Mismos nombres que reconoce `Redis.fromEnv()`: los de Upstash y, como
  // alternativa, los `KV_*` que genera la integración de Vercel.
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  cliente =
    url && token
      ? new Redis({
          url,
          token,
          // Un solo reintento y con tope de tiempo: ante un Redis caído
          // interesa saberlo rápido para aplicar el fallo cerrado, no
          // insistir mientras quien intenta entrar espera.
          retry: { retries: 1, backoff: () => 100 },
          signal: () => AbortSignal.timeout(ESPERA_MAXIMA_MS),
        })
      : null;
  return cliente;
}

/** Solo para pruebas: olvida el cliente ya construido para que se relea el entorno. */
export function reiniciarClienteRedis() {
  cliente = undefined;
}

export function redisConfigurado(): boolean {
  return obtenerCliente() !== null;
}

/**
 * Identificador estable y no reversible del usuario, para no guardar en
 * Redis el nombre de la cuenta administrativa en claro.
 */
async function huella(valor: string): Promise<string> {
  const datos = new TextEncoder().encode(`${PREFIJO}:${valor}`);
  const resumen = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(resumen).slice(0, 16))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function clavesDe(ip: string, usuario: string): Promise<string[]> {
  return [`${PREFIJO}:ip:${await huella(ip)}`, `${PREFIJO}:usuario:${await huella(usuario)}`];
}

/**
 * Comprueba si este intento puede seguir adelante. No cuenta nada: solo
 * mira. Se llama ANTES de comprobar la contraseña.
 */
export async function comprobarLimite(ip: string, usuario: string): Promise<ResultadoLimite> {
  const redis = obtenerCliente();
  if (!redis) return { permitido: false, motivo: "no-disponible" };

  try {
    const claves = await clavesDe(ip, usuario);
    const [conteos, vidas] = await Promise.all([
      Promise.all(claves.map((c) => redis.get<number>(c))),
      Promise.all(claves.map((c) => redis.ttl(c))),
    ]);

    for (const [indice, conteo] of conteos.entries()) {
      if ((conteo ?? 0) >= MAX_INTENTOS) {
        const vida = vidas[indice];
        return { permitido: false, motivo: "bloqueado", segundosRestantes: vida > 0 ? vida : BLOQUEO_SEGUNDOS };
      }
    }
    return { permitido: true };
  } catch {
    // Nunca se propaga el error hacia arriba con detalles: quien llama solo
    // necesita saber que el limitador no está disponible.
    return { permitido: false, motivo: "no-disponible" };
  }
}

/**
 * Suma un intento fallido a los dos contadores. El tiempo de vida se fija
 * en el primer fallo y NO se renueva después, para que el bloqueo dure
 * siempre lo mismo desde que empezó y no se prolongue indefinidamente
 * mientras alguien siga intentándolo.
 */
export async function registrarFallo(ip: string, usuario: string): Promise<void> {
  const redis = obtenerCliente();
  if (!redis) return;

  try {
    const claves = await clavesDe(ip, usuario);
    await Promise.all(
      claves.map(async (clave) => {
        const conteo = await redis.incr(clave);
        if (conteo === 1) await redis.expire(clave, BLOQUEO_SEGUNDOS);
      })
    );
  } catch {
    // Un fallo al contabilizar no debe romper la respuesta de login. La
    // comprobación de `comprobarLimite` ya falla cerrado en producción si
    // Redis no responde.
  }
}

/** Borra los contadores tras un acceso correcto: un login válido limpia el historial de fallos. */
export async function limpiarIntentos(ip: string, usuario: string): Promise<void> {
  const redis = obtenerCliente();
  if (!redis) return;
  try {
    const claves = await clavesDe(ip, usuario);
    await Promise.all(claves.map((c) => redis.del(c)));
  } catch {
    // Si no se pueden borrar, los contadores caducarán solos.
  }
}

export const LIMITES = { MAX_INTENTOS, BLOQUEO_SEGUNDOS } as const;
