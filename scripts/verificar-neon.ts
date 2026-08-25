import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * `npm run verificar-neon -- --env .env.neon.local`
 *
 * Recorrido completo de comprobación contra Neon, después de migrar: que se
 * lee de Neon y no de los archivos, que se escribe en Neon y no en disco,
 * que el historial guarda valor anterior y nuevo, que restaurar crea un
 * apunte nuevo sin tocar el original, y que todo sigue ahí en un proceso
 * distinto.
 *
 * SEGURO DE EJECUTAR SOBRE DATOS REALES: elige una herramienta, guarda su
 * estado exacto antes de empezar y lo restaura al terminar, comprobando que
 * quedó idéntico. Lo único que deja son apuntes en el historial que
 * documentan la propia prueba — por diseño el historial no se puede borrar,
 * y esos apuntes llevan el usuario "verificacion-tecnica" para que se
 * distingan de un cambio real hecho desde el panel.
 *
 * Solo escribe en UNA herramienta. Nunca toca las otras 50.
 */

const DIR_JSON = path.join(process.cwd(), "data", "estrategia-afiliados");
const USUARIO = "verificacion-tecnica";

const lineas: string[] = [];
function informar(l = "") {
  console.log(l);
  lineas.push(l);
}

function cargarEnv(ruta: string) {
  const absoluta = path.resolve(process.cwd(), ruta);
  if (!fs.existsSync(absoluta)) throw new Error(`No existe "${ruta}". Créalo con:  npx vercel env pull ${ruta}`);
  for (const linea of fs.readFileSync(absoluta, "utf-8").split("\n")) {
    const l = linea.trim();
    if (!l || l.startsWith("#")) continue;
    const sep = l.indexOf("=");
    if (sep === -1) continue;
    const clave = l.slice(0, sep).trim();
    let valor = l.slice(sep + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) valor = valor.slice(1, -1);
    if (!process.env[clave]) process.env[clave] = valor;
  }
}

function leerFlag(args: string[], nombre: string) {
  const i = args.indexOf(`--${nombre}`);
  return i === -1 || i + 1 >= args.length ? undefined : args[i + 1];
}

let fallos = 0;
function comprobar(descripcion: string, condicion: boolean, detalle?: string) {
  informar(`  ${condicion ? "✓" : "✗"} ${descripcion}`);
  if (detalle) informar(`      ${detalle}`);
  if (!condicion) fallos++;
}

async function main() {
  const args = process.argv.slice(2);
  cargarEnv(leerFlag(args, "env") ?? ".env.neon.local");

  const { obtenerPool, cerrarPools } = await import("@/data/db/cliente");
  const { getEstrategiaAfiliacion, getTodasLasEstrategiasAfiliacion, getHistorialCambios, guardarEstrategiaAfiliacion, restaurarValorHistorial } =
    await import("@/data/repositorioEstrategiaAfiliacion");

  informar("═".repeat(70));
  informar("  VERIFICACIÓN DE NEON — recorrido completo");
  informar(`  ${new Date().toISOString()}`);
  informar("═".repeat(70));

  // ── 1 · Lectura ───────────────────────────────────────────────────
  informar("");
  informar("1 · LECTURA DESDE NEON");
  const todas = await getTodasLasEstrategiasAfiliacion();
  comprobar(`Se leen ${todas.length} herramientas desde Neon`, todas.length > 0);

  const elegida = todas.find((e) => fs.existsSync(path.join(DIR_JSON, `${e.herramientaId}.json`))) ?? todas[0];
  const id = elegida.herramientaId;
  const cuentaId = elegida.cuentas[0].id;
  informar(`  Herramienta elegida para la prueba: "${id}" (cuenta "${cuentaId}")`);

  // Estado exacto de partida, para poder dejarlo todo como estaba.
  const estadoOriginal: EstrategiaAfiliacion = JSON.parse(JSON.stringify(elegida));
  const valorOriginal = estadoOriginal.cuentas[0].observaciones ?? null;

  // ── 2 · Escritura ─────────────────────────────────────────────────
  informar("");
  informar("2 · ESCRITURA EN NEON");
  const marca = new Date().toISOString();
  const valorDePrueba = `[verificación técnica ${marca}]`;
  const conCambio: EstrategiaAfiliacion = JSON.parse(JSON.stringify(estadoOriginal));
  conCambio.cuentas[0].observaciones = valorDePrueba;
  await guardarEstrategiaAfiliacion(conCambio, { usuario: USUARIO, motivo: "Comprobación técnica posterior a la migración" });

  const releida = await getEstrategiaAfiliacion(id);
  comprobar("El cambio se relee desde Neon con una consulta nueva", releida?.cuentas[0].observaciones === valorDePrueba);

  // ── 3 · ¿Neon o archivos? ─────────────────────────────────────────
  informar("");
  informar("3 · ¿DE DÓNDE SALEN LOS DATOS?");
  const rutaJson = path.join(DIR_JSON, `${id}.json`);
  const enDisco = JSON.parse(fs.readFileSync(rutaJson, "utf-8")) as EstrategiaAfiliacion;
  const valorEnDisco = enDisco.cuentas.find((c) => c.id === cuentaId)?.observaciones ?? null;
  comprobar(
    "El archivo JSON en disco NO ha cambiado (la escritura fue a Neon, no a disco)",
    valorEnDisco !== valorDePrueba,
    `en Neon: "${valorDePrueba.slice(0, 45)}…"  ·  en el archivo: ${valorEnDisco === null ? "(vacío)" : `"${String(valorEnDisco).slice(0, 45)}…"`}`
  );

  // ── 4 · Historial ─────────────────────────────────────────────────
  informar("");
  informar("4 · HISTORIAL DE CAMBIOS");
  const historial = await getHistorialCambios(id);
  const apunte = historial.find((e) => e.campo === `${cuentaId}.observaciones` && e.valorNuevo === valorDePrueba);
  comprobar("Se ha registrado un apunte para este cambio", Boolean(apunte));
  if (apunte) {
    informar(`      campo:          ${apunte.campo}`);
    informar(`      valor anterior: ${JSON.stringify(apunte.valorAnterior)}`);
    informar(`      valor nuevo:    ${JSON.stringify(String(apunte.valorNuevo).slice(0, 50))}…`);
    informar(`      usuario:        ${apunte.usuario}`);
    informar(`      fecha:          ${apunte.fecha}`);
    comprobar("Guarda el valor ANTERIOR correcto", JSON.stringify(apunte.valorAnterior) === JSON.stringify(valorOriginal));
    comprobar("Guarda usuario y fecha", Boolean(apunte.usuario) && !Number.isNaN(Date.parse(apunte.fecha)));
  }

  // ── 5 · El historial no se puede alterar ──────────────────────────
  informar("");
  informar("5 · EL HISTORIAL NO SE PUEDE MODIFICAR NI BORRAR");
  if (apunte) {
    const pool = obtenerPool();
    let rechazoUpdate = false;
    let rechazoDelete = false;
    try {
      await pool.query(`UPDATE historial_cambios_afiliacion SET usuario='otro' WHERE id=$1`, [apunte.id]);
    } catch {
      rechazoUpdate = true;
    }
    try {
      await pool.query(`DELETE FROM historial_cambios_afiliacion WHERE id=$1`, [apunte.id]);
    } catch {
      rechazoDelete = true;
    }
    comprobar("La base de datos rechaza modificar un apunte", rechazoUpdate);
    comprobar("La base de datos rechaza borrar un apunte", rechazoDelete);
  }

  // ── 6 · Restauración ──────────────────────────────────────────────
  informar("");
  informar("6 · RESTAURAR UN VALOR ANTERIOR");
  if (apunte) {
    const antesDeRestaurar = await getHistorialCambios(id);
    await restaurarValorHistorial(apunte.id, { usuario: USUARIO });
    const trasRestaurar = await getEstrategiaAfiliacion(id);
    comprobar("El valor vuelve a ser el anterior", (trasRestaurar?.cuentas[0].observaciones ?? null) === valorOriginal);

    const despues = await getHistorialCambios(id);
    const original = despues.find((e) => e.id === apunte.id);
    comprobar("El apunte original sigue intacto, sin un solo cambio", JSON.stringify(original) === JSON.stringify(apunte));
    comprobar("Se ha añadido un apunte nuevo documentando la restauración", despues.length === antesDeRestaurar.length + 1);
  }

  // ── 7 · Dejarlo todo como estaba ──────────────────────────────────
  informar("");
  informar("7 · ESTADO FINAL");
  const finalEnNeon = await getEstrategiaAfiliacion(id);
  try {
    assert.deepStrictEqual(finalEnNeon, estadoOriginal);
    comprobar(`"${id}" ha quedado exactamente como estaba antes de la prueba`, true);
  } catch {
    // No debería ocurrir; si ocurre, se restaura explícitamente y se avisa.
    await guardarEstrategiaAfiliacion(estadoOriginal, { usuario: USUARIO, motivo: "Restauración del estado previo a la verificación" });
    const reintento = await getEstrategiaAfiliacion(id);
    comprobar(`"${id}" ha quedado como estaba (hizo falta restaurar explícitamente)`, JSON.stringify(reintento) === JSON.stringify(estadoOriginal));
  }

  const todasFinal = await getTodasLasEstrategiasAfiliacion();
  comprobar(`Siguen estando las ${todas.length} herramientas`, todasFinal.length === todas.length);

  informar("");
  informar("═".repeat(70));
  informar(fallos === 0 ? "  ✓ TODAS LAS COMPROBACIONES CORRECTAS" : `  ✗ ${fallos} COMPROBACIÓN(ES) FALLIDA(S)`);
  informar("═".repeat(70));
  informar("");
  informar("Nota: esta prueba deja apuntes en el historial con el usuario");
  informar('"verificacion-tecnica". Es intencionado: el historial no se puede borrar,');
  informar("y así se distinguen de los cambios reales hechos desde el panel.");

  const dirCopias = path.join(process.cwd(), "copias-seguridad-afiliacion");
  fs.mkdirSync(dirCopias, { recursive: true });
  const ruta = path.join(dirCopias, `informe-verificacion-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`);
  fs.writeFileSync(ruta, `${lineas.join("\n")}\n`, "utf-8");
  console.log("");
  console.log(`Informe guardado en: ${path.relative(process.cwd(), ruta)}`);

  await cerrarPools();
  if (fallos > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("");
  console.error("✗ Error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
