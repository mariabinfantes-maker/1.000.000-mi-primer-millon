import { Pool } from "pg";

/**
 * Helper compartido por las pruebas que necesitan Postgres real —
 * `vitest.global-setup.postgres.ts` levanta un Postgres local temporal una
 * sola vez para toda la ejecución y expone `POSTGRES_URL_TEST`. Nunca
 * apunta a Neon: si esa variable no está definida (entorno sin los
 * binarios de Postgres), `postgresDisponible()` es `false` y el test que
 * la use debe saltarse con `describe.skipIf(!postgresDisponible())`.
 */

let pool: Pool | undefined;

export function postgresDisponible(): boolean {
  return Boolean(process.env.POSTGRES_URL_TEST);
}

export function poolDePrueba(): Pool {
  if (!pool) {
    if (!process.env.POSTGRES_URL_TEST) {
      throw new Error("POSTGRES_URL_TEST no está definido — comprueba postgresDisponible() antes de llamar a poolDePrueba().");
    }
    pool = new Pool({ connectionString: process.env.POSTGRES_URL_TEST });
  }
  return pool;
}

/** TRUNCATE de ambas tablas entre pruebas — no pasa por el trigger append-only (no es un DELETE por fila), es limpieza de test, no una operación de la aplicación. */
export async function limpiarTablasDePrueba(): Promise<void> {
  const p = poolDePrueba();
  await p.query(
    `TRUNCATE TABLE historial_cambios_afiliacion, estrategias_afiliacion, clics_salientes, ingresos_afiliacion RESTART IDENTITY`
  );
}
