import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * `npm run migrar-a-neon -- --env .env.neon.local`
 *
 * Puesta en marcha completa de Neon, en un solo comando: comprueba la
 * conexión, guarda una copia de seguridad de lo que ya hubiera, crea el
 * esquema, migra los JSON, verifica campo a campo y escribe un informe.
 *
 * Está pensado para ejecutarse UNA VEZ desde el ordenador de la persona que
 * gestiona el proyecto, que es donde están a la vez el acceso de red a Neon
 * y las credenciales. Nunca imprime la cadena de conexión ni ningún secreto:
 * ni por pantalla, ni en el informe.
 *
 * Protecciones:
 * - Si la tabla ya tiene datos, ABORTA en vez de pisarlos. Los JSON son una
 *   foto del día de la migración; si el panel ya se ha usado contra Neon,
 *   volver a migrarlos borraría trabajo real. `--forzar` lo permite, pero
 *   solo después de haber guardado la copia de seguridad.
 * - Antes de escribir nada, exporta a un archivo con fecha todo lo que ya
 *   hubiera en Neon.
 * - Cada registro migrado se relee desde Neon y se compara campo a campo
 *   con su JSON de origen. Si uno solo no coincide, el comando falla.
 */

type Resultado = { archivo: string; herramientaId: string; ok: true } | { archivo: string; herramientaId: string | null; ok: false; error: string };

const DIR_JSON = path.join(process.cwd(), "data", "estrategia-afiliados");
const DIR_COPIAS = path.join(process.cwd(), "copias-seguridad-afiliacion");
const USUARIO = "migracion-inicial";

const lineas: string[] = [];
function informar(linea = "") {
  console.log(linea);
  lineas.push(linea);
}

/** Carga un archivo de variables de entorno (formato `CLAVE=valor`) sin depender de ninguna librería. */
function cargarEnv(ruta: string) {
  const absoluta = path.resolve(process.cwd(), ruta);
  if (!fs.existsSync(absoluta)) {
    throw new Error(
      `No existe el archivo de variables "${ruta}". Créalo con:\n` +
        `  npx vercel env pull ${ruta}\n` +
        `(usa un nombre distinto de .env.local para no sobrescribir tu configuración actual)`
    );
  }
  for (const linea of fs.readFileSync(absoluta, "utf-8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const separador = limpia.indexOf("=");
    if (separador === -1) continue;
    const clave = limpia.slice(0, separador).trim();
    let valor = limpia.slice(separador + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!process.env[clave]) process.env[clave] = valor;
  }
}

function leerFlag(args: string[], nombre: string): string | undefined {
  const i = args.indexOf(`--${nombre}`);
  return i === -1 || i + 1 >= args.length ? undefined : args[i + 1];
}

/** Describe la conexión sin revelar credenciales — solo host y nombre de base. */
function describirConexionSinSecretos(cadena: string): string {
  try {
    const url = new URL(cadena);
    return `${url.hostname} · base "${url.pathname.replace(/^\//, "") || "(por defecto)"}"`;
  } catch {
    return "(no se pudo interpretar la cadena de conexión)";
  }
}

async function main() {
  const args = process.argv.slice(2);
  const forzar = args.includes("--forzar");
  cargarEnv(leerFlag(args, "env") ?? ".env.neon.local");

  const { obtenerPool, obtenerPoolSinPooling, cerrarPools } = await import("@/data/db/cliente");
  const { SENTENCIAS_ESQUEMA } = await import("@/data/db/esquema");
  const { getEstrategiaAfiliacion, getTodasLasEstrategiasAfiliacion, guardarEstrategiaAfiliacion } = await import(
    "@/data/repositorioEstrategiaAfiliacion"
  );

  informar("═".repeat(70));
  informar("  PUESTA EN MARCHA DE NEON — Molnip Affiliate Manager");
  informar(`  ${new Date().toISOString()}`);
  informar("═".repeat(70));

  // ── PASO 1: conexión ──────────────────────────────────────────────
  informar("");
  informar("PASO 1 · Conexión");
  const pool = obtenerPool();
  const { rows: version } = await pool.query<{ v: string }>("SELECT version() AS v");
  informar(`  Servidor: ${describirConexionSinSecretos(process.env.POSTGRES_URL!)}`);
  informar(`  Postgres: ${version[0].v.split(",")[0]}`);
  informar("  ✓ Conexión establecida.");

  // ── PASO 2: copia de seguridad de lo que ya hubiera ───────────────
  informar("");
  informar("PASO 2 · Copia de seguridad previa");
  await pool.query(SENTENCIAS_ESQUEMA[0]); // la tabla debe existir para poder leerla
  const yaEnNeon = await getTodasLasEstrategiasAfiliacion();
  fs.mkdirSync(DIR_COPIAS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaCopia = path.join(DIR_COPIAS, `neon-antes-de-migrar-${marca}.json`);
  fs.writeFileSync(rutaCopia, `${JSON.stringify(yaEnNeon, null, 2)}\n`, "utf-8");
  informar(`  Registros que ya había en Neon: ${yaEnNeon.length}`);
  informar(`  Copia guardada en: ${path.relative(process.cwd(), rutaCopia)}`);

  // ── PASO 3: protección contra pisar trabajo real ──────────────────
  if (yaEnNeon.length > 0 && !forzar) {
    informar("");
    informar("  ⚠ ABORTADO: Neon ya contiene datos.");
    informar("    Los JSON son una foto del día de la migración. Si el panel ya se ha");
    informar("    usado contra Neon, volver a migrarlos borraría ese trabajo.");
    informar("    Si de verdad quieres reemplazarlos, repite el comando con --forzar");
    informar(`    (la copia de seguridad de arriba te permite volver atrás).`);
    escribirInforme();
    await cerrarPools();
    process.exitCode = 1;
    return;
  }

  // ── PASO 4: esquema ───────────────────────────────────────────────
  informar("");
  informar("PASO 4 · Esquema");
  const poolDdl = obtenerPoolSinPooling();
  for (const sentencia of SENTENCIAS_ESQUEMA) await poolDdl.query(sentencia);
  const { rows: tablas } = await poolDdl.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name IN ('estrategias_afiliacion','historial_cambios_afiliacion')
     ORDER BY table_name`
  );
  informar(`  Tablas: ${tablas.map((t) => t.table_name).join(", ")}`);
  informar("  ✓ Esquema listo (las sentencias son repetibles: no duplican ni borran nada).");

  // ── PASO 5: recuento antes ────────────────────────────────────────
  informar("");
  informar("PASO 5 · Recuento ANTES de migrar");
  const archivos = fs.readdirSync(DIR_JSON).filter((f) => f.endsWith(".json")).sort();
  const { rows: antes } = await pool.query<{ c: string }>("SELECT count(*) AS c FROM estrategias_afiliacion");
  informar(`  Archivos JSON de origen: ${archivos.length}`);
  informar(`  Registros en Neon:       ${antes[0].c}`);

  // ── PASO 6: migración ─────────────────────────────────────────────
  informar("");
  informar("PASO 6 · Migración");
  const resultados: Resultado[] = [];
  for (const archivo of archivos) {
    try {
      const estrategia = JSON.parse(fs.readFileSync(path.join(DIR_JSON, archivo), "utf-8")) as EstrategiaAfiliacion;
      if (!estrategia.herramientaId || !Array.isArray(estrategia.cuentas)) {
        resultados.push({ archivo, herramientaId: null, ok: false, error: "Estructura inválida." });
        continue;
      }
      await guardarEstrategiaAfiliacion(estrategia, { usuario: USUARIO, motivo: "Migración inicial desde JSON" });

      // Relectura y comparación campo a campo: que la escritura no diera
      // error no basta para dar el dato por bueno.
      const releida = await getEstrategiaAfiliacion(estrategia.herramientaId);
      assert.deepStrictEqual(releida, estrategia);

      resultados.push({ archivo, herramientaId: estrategia.herramientaId, ok: true });
    } catch (error) {
      resultados.push({
        archivo,
        herramientaId: null,
        ok: false,
        error: error instanceof Error ? error.message.split("\n")[0] : "Error desconocido.",
      });
    }
  }
  const conExito = resultados.filter((r) => r.ok);
  const fallidos = resultados.filter((r) => !r.ok);
  informar(`  Migrados y verificados campo a campo: ${conExito.length}/${archivos.length}`);
  if (fallidos.length > 0) {
    informar("  ✗ Fallidos:");
    for (const f of fallidos) if (!f.ok) informar(`     - ${f.archivo}: ${f.error}`);
  }

  // ── PASO 7: recuento después y comprobación final ─────────────────
  informar("");
  informar("PASO 7 · Recuento DESPUÉS de migrar");
  const { rows: despues } = await pool.query<{ c: string }>("SELECT count(*) AS c FROM estrategias_afiliacion");
  const { rows: hist } = await pool.query<{ c: string }>("SELECT count(*) AS c FROM historial_cambios_afiliacion");
  informar(`  Registros en Neon:      ${despues[0].c}  (esperado: ${archivos.length})`);
  informar(`  Apuntes de historial:   ${hist[0].c}`);

  const idsJson = new Set(archivos.map((a) => a.replace(/\.json$/, "")));
  const enNeon = await getTodasLasEstrategiasAfiliacion();
  const idsNeon = new Set(enNeon.map((e) => e.herramientaId));
  const faltan = [...idsJson].filter((id) => !idsNeon.has(id));
  const sobran = [...idsNeon].filter((id) => !idsJson.has(id));
  informar(`  Herramientas que faltan en Neon: ${faltan.length === 0 ? "ninguna" : faltan.join(", ")}`);
  informar(`  Herramientas de más en Neon:     ${sobran.length === 0 ? "ninguna" : sobran.join(", ")}`);

  informar("");
  informar("═".repeat(70));
  const todoBien = fallidos.length === 0 && faltan.length === 0 && Number(despues[0].c) === archivos.length;
  informar(todoBien ? "  ✓ MIGRACIÓN COMPLETADA SIN PÉRDIDAS" : "  ✗ LA MIGRACIÓN NO ESTÁ COMPLETA — revisa los avisos de arriba");
  informar("═".repeat(70));
  informar("");
  informar("Los archivos de data/estrategia-afiliados/ NO se han modificado:");
  informar("siguen en el repositorio como copia de seguridad y origen de esta migración.");

  escribirInforme();
  await cerrarPools();
  if (!todoBien) process.exitCode = 1;
}

function escribirInforme() {
  fs.mkdirSync(DIR_COPIAS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  const ruta = path.join(DIR_COPIAS, `informe-migracion-${marca}.txt`);
  fs.writeFileSync(ruta, `${lineas.join("\n")}\n`, "utf-8");
  console.log("");
  console.log(`Informe guardado en: ${path.relative(process.cwd(), ruta)}`);
  console.log("Puedes enviarme ese archivo: no contiene ninguna contraseña ni cadena de conexión.");
}

main().catch((error) => {
  const mensaje = error instanceof Error ? error.message : String(error);
  console.error("");
  console.error("✗ Error:", mensaje);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|self.signed|certificate/i.test(mensaje)) {
    console.error("  Parece un problema de conexión con Neon. Comprueba que las variables");
    console.error("  del archivo de entorno son las que Vercel generó para la integración.");
  }
  process.exitCode = 1;
});
