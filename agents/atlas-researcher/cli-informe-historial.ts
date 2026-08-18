import fs from "node:fs";
import path from "node:path";
import { leerHistorialAprobaciones } from "./historialAprobaciones";
import { generarInformeHistorialHtml } from "./informeHistorial";

/**
 * `npm run informe-historial`
 *
 * Genera un informe HTML autocontenido del historial de aprobaciones —
 * cada intento de promoción, aceptado o rechazado, con Puntuación Molnip,
 * estado de afiliación y aprobación del CEO. Solo lectura: no modifica el
 * historial, solo lo reorganiza para revisión humana. Mismo patrón que
 * `cli-informe-mantenimiento.ts` — abrible con doble clic, sin subir nada
 * a ningún sitio.
 */

const DIR_INFORMES = path.join(process.cwd(), "data", "informes-historial");

function main() {
  const historial = leerHistorialAprobaciones();

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeHistorialHtml(historial), "utf-8");

  const aceptadas = historial.filter((r) => r.resultado === "aceptada").length;
  console.log(`✓ Informe generado: ${rutaInforme}`);
  console.log(`  ${historial.length} intento(s) · ${aceptadas} aceptada(s) · ${historial.length - aceptadas} rechazada(s)`);
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main();
