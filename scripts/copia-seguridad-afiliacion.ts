import fs from "node:fs";
import path from "node:path";

/**
 * `npm run copia-seguridad-afiliacion -- --env .env.neon.local`
 *
 * Descarga a un archivo con fecha todo lo que hay ahora mismo en Neon: las
 * estrategias de afiliación y el historial completo de cambios. Es la red de
 * seguridad para poder recuperar el trabajo del panel sin depender de Neon —
 * el archivo es JSON corriente, legible y reimportable desde el propio panel
 * ("Importar JSON").
 *
 * Solo lee: nunca modifica nada. Conviene ejecutarlo antes de cualquier
 * cambio grande y de vez en cuando sin más.
 */

const DIR_COPIAS = path.join(process.cwd(), "copias-seguridad-afiliacion");

function cargarEnv(ruta: string) {
  const absoluta = path.resolve(process.cwd(), ruta);
  if (!fs.existsSync(absoluta)) {
    throw new Error(`No existe el archivo de variables "${ruta}". Créalo con:  npx vercel env pull ${ruta}`);
  }
  for (const linea of fs.readFileSync(absoluta, "utf-8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const sep = limpia.indexOf("=");
    if (sep === -1) continue;
    const clave = limpia.slice(0, sep).trim();
    let valor = limpia.slice(sep + 1).trim();
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

async function main() {
  const args = process.argv.slice(2);
  cargarEnv(leerFlag(args, "env") ?? ".env.neon.local");

  const { obtenerPool, cerrarPools } = await import("@/data/db/cliente");
  const { getTodasLasEstrategiasAfiliacion } = await import("@/data/repositorioEstrategiaAfiliacion");

  const estrategias = await getTodasLasEstrategiasAfiliacion();
  const { rows: historial } = await obtenerPool().query(
    `SELECT id, herramienta_id, campo, valor_anterior, valor_nuevo, motivo, usuario, fecha
     FROM historial_cambios_afiliacion ORDER BY id`
  );

  fs.mkdirSync(DIR_COPIAS, { recursive: true });
  const marca = new Date().toISOString().replace(/[:.]/g, "-");

  // Dos archivos separados a propósito: el de estrategias tiene exactamente
  // el mismo formato que espera "Importar JSON" del panel, así que sirve
  // para restaurar directamente sin tocar nada a mano.
  const rutaEstrategias = path.join(DIR_COPIAS, `estrategias-${marca}.json`);
  const rutaHistorial = path.join(DIR_COPIAS, `historial-${marca}.json`);
  fs.writeFileSync(rutaEstrategias, `${JSON.stringify(estrategias, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaHistorial, `${JSON.stringify(historial, null, 2)}\n`, "utf-8");

  console.log(`✓ Copia de seguridad guardada:`);
  console.log(`  ${path.relative(process.cwd(), rutaEstrategias)}  — ${estrategias.length} herramienta(s)`);
  console.log(`  ${path.relative(process.cwd(), rutaHistorial)}  — ${historial.length} apunte(s) de historial`);
  console.log("");
  console.log("El archivo de estrategias se puede volver a cargar desde el panel con");
  console.log('"Importar JSON" si alguna vez hiciera falta recuperar el estado guardado aquí.');

  await cerrarPools();
}

main().catch((error) => {
  console.error("✗ Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
