import { obtenerPoolSinPooling, cerrarPools } from "@/data/db/cliente";
import { SENTENCIAS_ESQUEMA } from "@/data/db/esquema";
import { verificarEsquema } from "@/data/db/verificarEsquema";

/**
 * Aprovisiona el esquema en Neon. Es aditivo y se puede ejecutar tantas
 * veces como haga falta: las tablas y los índices son IF NOT EXISTS y las
 * funciones OR REPLACE. No borra, no vacía y no reescribe ninguna fila.
 *
 * TODO va dentro de una transacción, y la razón no es la de siempre.
 * Dos triggers se recrean en cada pasada, y recrear significa primero
 * DROP y después CREATE. Sin transacción, un corte de red contra Neon
 * justo entre esas dos sentencias dejaría `historial_cambios_afiliacion`
 * —una tabla que ya está en producción y con datos— sin la protección que
 * le impide aceptar UPDATE y DELETE. El aviso saldría por consola como un
 * error cualquiera de aprovisionamiento, sin decir que además ha quedado
 * desprotegida. En Postgres el DDL es transaccional, así que basta con
 * envolverlo: o queda todo aplicado, o no queda nada.
 */
async function main() {
  const pool = obtenerPoolSinPooling();
  const cliente = await pool.connect();

  try {
    console.log(`Aprovisionando esquema (${SENTENCIAS_ESQUEMA.length} sentencias, aditivo e idempotente)...`);
    await cliente.query("BEGIN");
    for (const [indice, sentencia] of SENTENCIAS_ESQUEMA.entries()) {
      await cliente.query(sentencia);
      console.log(`  [${indice + 1}/${SENTENCIAS_ESQUEMA.length}] ejecutada.`);
    }
    await cliente.query("COMMIT");
    console.log("Cambios confirmados.");
  } catch (error) {
    await cliente.query("ROLLBACK").catch(() => {});
    console.error("Aprovisionamiento deshecho: la base de datos queda como estaba.");
    throw error;
  } finally {
    cliente.release();
  }

  // Comprobación posterior e independiente: no se fía de que las
  // sentencias "no hayan dado error", sino que va a mirar qué hay.
  const problemas = await verificarEsquema(pool);
  if (problemas.length) {
    console.error("El esquema NO está completo:");
    for (const problema of problemas) console.error(`  - ${problema}`);
    throw new Error("verificación del esquema fallida");
  }

  const { rows } = await pool.query(
    `SELECT table_name,
            (SELECT count(*) FROM information_schema.columns c
              WHERE c.table_schema = 'public' AND c.table_name = t.table_name) AS columnas
       FROM information_schema.tables t
      WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log("\nTablas presentes:");
  for (const fila of rows) console.log(`  ${fila.table_name} (${fila.columnas} columnas)`);
  console.log("\nEsquema aprovisionado y verificado correctamente.");
}

main()
  .catch((error) => {
    console.error("Error aprovisionando el esquema:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => cerrarPools());
