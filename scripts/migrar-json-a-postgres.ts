import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { cerrarPools } from "@/data/db/cliente";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * `npm run migrar-json-a-postgres`
 *
 * Migración ÚNICA de `data/estrategia-afiliados/*.json` a Postgres — nunca
 * borra ni modifica los JSON originales (quedan como semilla/copia de
 * respaldo, ver `data/repositorioEstrategiaAfiliacion.ts`). Cada archivo se
 * migra de forma independiente, mismo espíritu que `lote.ts`: un error en
 * uno no aborta el resto. Tras escribir, relee desde Postgres y compara
 * campo a campo contra el JSON original — si algo no coincide exactamente,
 * lo reporta como fallo en vez de darlo por bueno.
 *
 * Usa `guardarEstrategiaAfiliacion` (el mismo camino que usa el panel, no
 * una vía especial), así que también deja registro en el historial de
 * cambios con `usuario: "migracion-inicial"` — un rastro de cuándo y cómo
 * llegaron los datos.
 */

const DIR_ORIGEN = path.join(process.cwd(), "data", "estrategia-afiliados");
const USUARIO_MIGRACION = "migracion-inicial";

type ResultadoFila =
  | { archivo: string; herramientaId: string; ok: true }
  | { archivo: string; herramientaId: string | null; ok: false; error: string };

async function main() {
  if (!fs.existsSync(DIR_ORIGEN)) {
    console.error(`No existe el directorio de origen: ${DIR_ORIGEN}`);
    process.exitCode = 1;
    return;
  }

  const archivos = fs.readdirSync(DIR_ORIGEN).filter((f) => f.endsWith(".json"));
  console.log(`Encontrados ${archivos.length} archivo(s) JSON en ${DIR_ORIGEN}.\n`);

  const resultados: ResultadoFila[] = [];

  for (const archivo of archivos) {
    const rutaCompleta = path.join(DIR_ORIGEN, archivo);
    try {
      const crudo = fs.readFileSync(rutaCompleta, "utf-8");
      const estrategia = JSON.parse(crudo) as EstrategiaAfiliacion;

      if (!estrategia.herramientaId || !Array.isArray(estrategia.cuentas)) {
        resultados.push({ archivo, herramientaId: null, ok: false, error: "Estructura inválida (falta herramientaId o cuentas[])." });
        continue;
      }

      await guardarEstrategiaAfiliacion(estrategia, { usuario: USUARIO_MIGRACION, motivo: "Migración inicial desde JSON" });

      // Relee desde Postgres y compara campo a campo contra el original —
      // no basta con que la escritura no lance error. `assert.deepStrictEqual`
      // en vez de comparar JSON.stringify: JSONB en Postgres no conserva el
      // orden de las claves de un objeto (sí el de los arrays), así que una
      // comparación por texto daría falsos negativos aunque el contenido sea
      // idéntico.
      const releida = await getEstrategiaAfiliacion(estrategia.herramientaId);
      try {
        assert.deepStrictEqual(releida, estrategia);
      } catch {
        resultados.push({
          archivo,
          herramientaId: estrategia.herramientaId,
          ok: false,
          error: "La relectura desde Postgres no coincide exactamente con el JSON original.",
        });
        continue;
      }

      resultados.push({ archivo, herramientaId: estrategia.herramientaId, ok: true });
      console.log(`  ✓ ${archivo} → "${estrategia.herramientaId}" (${estrategia.cuentas.length} cuenta(s))`);
    } catch (error) {
      resultados.push({ archivo, herramientaId: null, ok: false, error: error instanceof Error ? error.message : "Error desconocido." });
    }
  }

  const ok = resultados.filter((r) => r.ok);
  const fallidos = resultados.filter((r) => !r.ok);

  console.log(`\nMigrados con éxito: ${ok.length}/${archivos.length}.`);
  if (fallidos.length > 0) {
    console.log(`\n✗ Fallidos (${fallidos.length}):`);
    for (const f of fallidos) {
      if (!f.ok) console.log(`  - ${f.archivo}${f.herramientaId ? ` ("${f.herramientaId}")` : ""}: ${f.error}`);
    }
  }

  const todasLasFilas = await getEstrategiaAfiliacionCount();
  console.log(`\nRecuento en Postgres tras la migración: ${todasLasFilas} fila(s) en estrategias_afiliacion.`);
  console.log(`Recuento de archivos JSON de origen: ${archivos.length}.`);
  if (todasLasFilas !== archivos.length && fallidos.length === 0) {
    console.warn(
      "⚠ El recuento en Postgres no coincide con el número de archivos JSON, y no se reportó ningún fallo — revisa manualmente " +
        "(puede deberse a una migración parcial anterior, no necesariamente un error de esta ejecución)."
    );
  }

  if (fallidos.length > 0) process.exitCode = 1;
}

async function getEstrategiaAfiliacionCount(): Promise<number> {
  const { obtenerPool } = await import("@/data/db/cliente");
  const { rows } = await obtenerPool().query<{ count: string }>(`SELECT count(*) FROM estrategias_afiliacion`);
  return Number(rows[0].count);
}

main()
  .catch((error) => {
    console.error("Error en la migración:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => cerrarPools());
