import fs from "node:fs";
import path from "node:path";
import { leerBorrador, listarIdsBorradores } from "./borrador";
import { construirSeccionInforme, generarInformeHtml, type SeccionInforme } from "./informe";

/**
 * `npm run generar-informe -- id1 id2 ...` o `npm run generar-informe -- --todos`
 *
 * Lee los borradores indicados (o todos los pendientes) y escribe un
 * informe HTML autocontenido en `data/borradores/informes/` — abrible con
 * doble clic en cualquier navegador, sin depender de que alguien lo
 * redacte a mano ni de subir archivos a ningún sitio.
 */

const DIR_INFORMES = path.join(process.cwd(), "data", "borradores", "informes");

function main() {
  const argumentos = process.argv.slice(2);
  const ids = argumentos.includes("--todos") ? listarIdsBorradores() : argumentos;

  if (ids.length === 0) {
    console.error('Uso: npm run generar-informe -- id1 id2 ... (o "--todos" para todos los borradores pendientes)');
    process.exitCode = 1;
    return;
  }

  const secciones: SeccionInforme[] = [];
  const noEncontrados: string[] = [];

  for (const id of ids) {
    const borrador = leerBorrador(id);
    if (!borrador) {
      noEncontrados.push(id);
      continue;
    }
    secciones.push(construirSeccionInforme(id, borrador));
  }

  if (noEncontrados.length > 0) {
    console.error(`⚠ No existe borrador para: ${noEncontrados.join(", ")}`);
  }

  if (secciones.length === 0) {
    console.error("No se ha podido generar el informe: ningún id tiene un borrador real.");
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeHtml(secciones), "utf-8");

  console.log(`✓ Informe generado con ${secciones.length} herramienta(s): ${rutaInforme}`);
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main();
