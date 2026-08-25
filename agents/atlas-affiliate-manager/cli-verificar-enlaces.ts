import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { verificarEnlacesActivos } from "./verificarEnlaces";

/**
 * `npm run verificar-enlaces-afiliados`
 *
 * Comprueba, con una petición HTTP real, que cada enlace de afiliado
 * guardado sigue respondiendo — nunca desactiva ni modifica nada por su
 * cuenta, solo informa. Mismo espíritu de solo-lectura que
 * `informe-afiliacion`/`informe-mantenimiento`/`informe-curador`, pero como
 * salida de consola en vez de HTML: es una comprobación puntual, no algo
 * que se abra y se lea con calma.
 */

async function main() {
  const estrategias = getTodasLasEstrategiasAfiliacion();
  const resultados = await verificarEnlacesActivos(estrategias);

  if (resultados.length === 0) {
    console.log("No hay ningún enlace de afiliado guardado todavía.");
    return;
  }

  const rotos = resultados.filter((r) => !r.ok);
  const activos = resultados.filter((r) => r.ok);

  console.log(`Comprobados ${resultados.length} enlace(s): ${activos.length} responden, ${rotos.length} con problema.\n`);

  if (rotos.length > 0) {
    console.log("✗ Enlaces con problema:");
    for (const r of rotos) {
      const detalle = r.error ?? `HTTP ${r.estadoHttp}`;
      console.log(`  - "${r.herramientaId}" / cuenta "${r.cuentaId}" / segmento "${r.segmento}": ${detalle}`);
      console.log(`    ${r.url}`);
    }
    process.exitCode = 1;
  } else {
    console.log("✓ Todos los enlaces guardados responden correctamente.");
  }
}

main();
