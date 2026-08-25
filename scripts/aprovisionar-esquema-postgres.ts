import { obtenerPoolSinPooling, cerrarPools } from "@/data/db/cliente";
import { SENTENCIAS_ESQUEMA } from "@/data/db/esquema";

/**
 * Aprovisiona el esquema de estrategia de afiliación en Neon. Cada
 * sentencia de `SENTENCIAS_ESQUEMA` es idempotente (IF NOT EXISTS / OR
 * REPLACE / IF EXISTS) — este script es seguro de ejecutar más de una vez,
 * en cualquier entorno (no modifica ni duplica datos existentes).
 */
async function main() {
  const pool = obtenerPoolSinPooling();

  console.log(`Aprovisionando esquema (${SENTENCIAS_ESQUEMA.length} sentencias, idempotente)...`);
  for (const [indice, sentencia] of SENTENCIAS_ESQUEMA.entries()) {
    await pool.query(sentencia);
    console.log(`  [${indice + 1}/${SENTENCIAS_ESQUEMA.length}] ejecutada.`);
  }

  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('estrategias_afiliacion', 'historial_cambios_afiliacion')
     ORDER BY table_name`
  );
  console.log("Tablas presentes:", rows.map((f: { table_name: string }) => f.table_name).join(", "));
  console.log("Esquema aprovisionado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error aprovisionando el esquema:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => cerrarPools());
