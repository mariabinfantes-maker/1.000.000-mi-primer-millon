import fs from "node:fs";
import path from "node:path";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { construirDatosInforme, generarInformeAfiliacionHtml } from "./informe";

/**
 * `npm run informe-afiliacion`
 *
 * Genera un informe HTML autocontenido del estado de la estrategia de
 * afiliación — resumen por estado, comisión que se está perdiendo,
 * solicitudes estancadas y prioridad de las cuentas por solicitar. Solo
 * informativo: no cambia ni bloquea nada (a diferencia de
 * `npm run verificar-datos`, que sí falla si hay una cuenta activa sin
 * enlace). Mismo patrón que `cli-generar-informe.ts` del Researcher —
 * abrible con doble clic, sin subir nada a ningún sitio.
 */

const DIR_INFORMES = path.join(process.cwd(), "data", "informes-afiliacion");

function main() {
  const estrategias = getTodasLasEstrategiasAfiliacion();
  const herramientas = getTodasLasHerramientas();
  const hoy = new Date().toISOString().slice(0, 10);

  const datos = construirDatosInforme(estrategias, herramientas, hoy);

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeAfiliacionHtml(datos), "utf-8");

  console.log(`✓ Informe generado: ${rutaInforme}`);
  console.log(
    `  ${datos.totalCuentas} cuenta(s) · ${datos.cuentasSinEnlace.length} sin enlace · ${datos.cuentasEstancadas.length} estancada(s) · ${datos.priorizadas.length} por solicitar`
  );
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main();
