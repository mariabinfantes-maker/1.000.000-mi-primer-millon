import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Levanta un Postgres 16 LOCAL Y TEMPORAL para las pruebas que necesitan
 * una base real (`data/repositorioEstrategiaAfiliacion.ts` y todo lo que
 * dependa de ella) — nunca toca Neon, nunca necesita red. Expone la
 * conexión en `process.env.POSTGRES_URL_TEST`, que es exactamente la
 * variable que `data/db/cliente.ts` exige cuando `MOLNIP_E2E=true`, y que
 * los tests con `pool` inyectado leen directamente.
 *
 * Si el entorno no tiene los binarios de Postgres (`initdb`/`pg_ctl`) o el
 * usuario de sistema `postgres` disponibles — por ejemplo, un futuro
 * entorno de CI o la máquina de la usuaria — esto NO falla `npm test`:
 * avisa por consola y deja `POSTGRES_URL_TEST` sin definir. Los tests que
 * necesitan Postgres real comprueban esa variable y se saltan
 * (`describe.skipIf`) en vez de fallar cuando no está disponible.
 */

const RUTA_PG_BIN = "/usr/lib/postgresql/16/bin";
const DIR_TRABAJO = path.join(os.tmpdir(), "molnip-vitest-pg");

function pgDisponible(): boolean {
  if (!fs.existsSync(path.join(RUTA_PG_BIN, "initdb"))) return false;
  const usuario = spawnSync("id", ["-u", "postgres"]);
  return usuario.status === 0;
}

function ejecutarComoPostgres(comando: string): void {
  execFileSync("su", ["postgres", "-c", comando], { stdio: "pipe" });
}

export async function setup() {
  if (!pgDisponible()) {
    console.warn(
      "[vitest] Postgres local no disponible en este entorno (initdb o usuario 'postgres' ausente) — " +
        "las pruebas que dependen de POSTGRES_URL_TEST se saltarán."
    );
    return;
  }

  fs.rmSync(DIR_TRABAJO, { recursive: true, force: true });
  fs.mkdirSync(DIR_TRABAJO, { recursive: true });
  execFileSync("chown", ["-R", "postgres:postgres", DIR_TRABAJO]);

  const dirDatos = path.join(DIR_TRABAJO, "data");
  const dirSocket = path.join(DIR_TRABAJO, "socket");
  fs.mkdirSync(dirSocket, { recursive: true });
  execFileSync("chown", ["-R", "postgres:postgres", dirSocket]);

  const rutaPath = `export PATH=${RUTA_PG_BIN}:$PATH;`;
  ejecutarComoPostgres(`${rutaPath} initdb -D ${dirDatos} -U testuser -A trust`);
  ejecutarComoPostgres(
    `${rutaPath} pg_ctl -D ${dirDatos} -o "-p 5477 -k ${dirSocket}" -l ${path.join(DIR_TRABAJO, "pg.log")} start -w`
  );
  ejecutarComoPostgres(`${rutaPath} psql -h ${dirSocket} -p 5477 -U testuser -d postgres -c "CREATE DATABASE molnip_test;"`);

  const cadenaConexion = `postgres://testuser@localhost:5477/molnip_test?host=${encodeURIComponent(dirSocket)}`;
  process.env.POSTGRES_URL_TEST = cadenaConexion;

  const { Pool } = await import("pg");
  const { SENTENCIAS_ESQUEMA } = await import("./data/db/esquema");
  const pool = new Pool({ connectionString: cadenaConexion });
  for (const sentencia of SENTENCIAS_ESQUEMA) await pool.query(sentencia);
  await pool.end();

  console.log(`[vitest] Postgres local de pruebas listo en ${dirSocket} (puerto 5477).`);
}

export async function teardown() {
  if (!pgDisponible() || !fs.existsSync(DIR_TRABAJO)) return;
  const rutaPath = `export PATH=${RUTA_PG_BIN}:$PATH;`;
  try {
    ejecutarComoPostgres(`${rutaPath} pg_ctl -D ${path.join(DIR_TRABAJO, "data")} stop`);
  } catch {
    // Ya estaba parado o no llegó a arrancar — nada que limpiar en ese caso.
  }
  fs.rmSync(DIR_TRABAJO, { recursive: true, force: true });
}
