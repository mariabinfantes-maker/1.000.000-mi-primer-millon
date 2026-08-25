import { neon } from "@neondatabase/serverless";

/**
 * Cliente de Postgres (Neon) perezoso: no intenta conectar hasta la
 * primera consulta, y falla con un mensaje claro si falta la variable de
 * entorno — nunca a medias ni en silencio. Dos endpoints distintos, ambos
 * provistos automáticamente por la integración de Neon en Vercel:
 *
 * - `POSTGRES_URL` (con pooling, vía pgbouncer): para las consultas
 *   normales de la aplicación (panel, API, CLI).
 * - `POSTGRES_URL_NON_POOLING`: solo para aprovisionar/migrar el esquema
 *   (DDL), que no debe pasar por el pooler en modo transacción.
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

let clientePooled: ReturnType<typeof neon> | undefined;
let clienteSinPooling: ReturnType<typeof neon> | undefined;

export function obtenerSql(): ReturnType<typeof neon> {
  if (!clientePooled) clientePooled = neon(requerirEnv("POSTGRES_URL"));
  return clientePooled;
}

export function obtenerSqlSinPooling(): ReturnType<typeof neon> {
  if (!clienteSinPooling) clienteSinPooling = neon(requerirEnv("POSTGRES_URL_NON_POOLING"));
  return clienteSinPooling;
}
