import { Pool } from "pg";

/**
 * Cliente de Postgres (Neon), perezoso: no conecta hasta la primera
 * consulta, y falla con un mensaje claro si falta la variable de entorno
 * — nunca a medias ni en silencio.
 *
 * Usa `pg` (protocolo estándar de Postgres) en vez del driver HTTP propio
 * de Neon (`@neondatabase/serverless`) deliberadamente: `POSTGRES_URL` /
 * `POSTGRES_URL_NON_POOLING` son cadenas `postgres://` estándar — Neon las
 * sirve así precisamente para ser compatible con cualquier cliente
 * Postgres normal — y `pg` funciona igual contra Neon que contra un
 * Postgres local, lo que permite probar el código real (no una
 * reimplementación) en las pruebas automáticas, sin tocar la base de
 * producción. `@neondatabase/serverless` habla un protocolo HTTP propio de
 * Neon que no existe en un Postgres corriente, así que no se puede probar
 * en local con él.
 *
 * Dos endpoints, ambos provistos automáticamente por la integración de
 * Neon en Vercel:
 * - `POSTGRES_URL` (con pooling, vía pgbouncer): consultas normales de la
 *   aplicación (panel, API, CLI).
 * - `POSTGRES_URL_NON_POOLING`: solo para aprovisionar/migrar el esquema
 *   (DDL), que no debe pasar por el pooler en modo transacción.
 *
 * Aislamiento de pruebas E2E (Playwright, que llama a las rutas HTTP
 * reales y no puede inyectar un `Pool` directamente): si `MOLNIP_E2E=true`,
 * exige `POSTGRES_URL_TEST` y usa ESA cadena en vez de `POSTGRES_URL` /
 * `POSTGRES_URL_NON_POOLING` — igual que `ESTRATEGIA_AFILIACION_DIR` para
 * el repositorio basado en archivos. Sin `POSTGRES_URL_TEST` configurado,
 * lanza en vez de arriesgarse a escribir sobre Neon real durante pruebas.
 */

function requerirEnv(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre} — necesaria para conectar con Postgres. Revisa la integración de Neon en Vercel.`
    );
  }
  return valor;
}

function resolverCadenaPooled(): string {
  if (process.env.MOLNIP_E2E === "true") return requerirEnv("POSTGRES_URL_TEST");
  return requerirEnv("POSTGRES_URL");
}

function resolverCadenaSinPooling(): string {
  if (process.env.MOLNIP_E2E === "true") return requerirEnv("POSTGRES_URL_TEST");
  return requerirEnv("POSTGRES_URL_NON_POOLING");
}

function esHostLocal(cadenaConexion: string): boolean {
  return (
    cadenaConexion.startsWith("/") ||
    /:\/\/[^@/]*@?(127\.0\.0\.1|localhost)/.test(cadenaConexion) ||
    /^(127\.0\.0\.1|localhost)/.test(cadenaConexion)
  );
}

/**
 * Fuerza `sslmode=verify-full` en la cadena de conexión de cualquier
 * servidor remoto.
 *
 * Por qué en la cadena y no solo en la opción `ssl` del Pool: `pg` hace
 * `Object.assign({}, config, parse(config.connectionString))`, es decir, lo
 * que venga en la cadena PISA lo que se pase como opción. Un
 * `ssl: { rejectUnauthorized: true }` explícito se descarta en silencio si
 * la cadena trae su propio `sslmode` — que es justo lo que hace la cadena
 * que genera Neon (`sslmode=require`).
 *
 * Hoy eso no rompe nada, porque `pg-connection-string` trata "require" como
 * alias de "verify-full" y acaba verificando el certificado igualmente.
 * Pero la propia librería avisa de que en su siguiente versión mayor
 * adoptará la semántica de libpq, donde "require" cifra pero NO comprueba
 * quién está al otro lado. Sería una degradación silenciosa de la seguridad
 * al actualizar una dependencia. Dejándolo escrito como "verify-full" el
 * comportamiento es el mismo antes y después del cambio.
 */
export function forzarVerificacionSsl(cadenaConexion: string): string {
  if (esHostLocal(cadenaConexion)) return cadenaConexion;
  try {
    const url = new URL(cadenaConexion);
    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  } catch {
    // Cadena con un formato que `URL` no sabe interpretar: se devuelve tal
    // cual y la opción `ssl` de abajo sigue actuando como red de seguridad.
    return cadenaConexion;
  }
}

function construirPool(cadenaConexion: string): Pool {
  const esLocal = esHostLocal(cadenaConexion);
  return new Pool({
    connectionString: forzarVerificacionSsl(cadenaConexion),
    ssl: esLocal ? undefined : { rejectUnauthorized: true },
    max: 5,
  });
}

let poolPooled: Pool | undefined;
let poolSinPooling: Pool | undefined;

/** Pool para las consultas normales de la aplicación (endpoint con pooling de Neon, o `POSTGRES_URL_TEST` bajo MOLNIP_E2E). */
export function obtenerPool(): Pool {
  if (!poolPooled) poolPooled = construirPool(resolverCadenaPooled());
  return poolPooled;
}

/** Pool sin pooling — solo para aprovisionar/migrar el esquema (DDL). */
export function obtenerPoolSinPooling(): Pool {
  if (!poolSinPooling) poolSinPooling = construirPool(resolverCadenaSinPooling());
  return poolSinPooling;
}

/** Cierra ambos pools — solo para pruebas/scripts puntuales que necesitan terminar limpiamente. */
export async function cerrarPools(): Promise<void> {
  await Promise.all([poolPooled?.end(), poolSinPooling?.end()]);
  poolPooled = undefined;
  poolSinPooling = undefined;
}
