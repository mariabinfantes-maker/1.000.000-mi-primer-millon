import fs from "node:fs";
import path from "node:path";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { construirDatosInforme, generarInformeMantenimientoHtml } from "./informe";

/**
 * `npm run informe-mantenimiento`
 *
 * Genera un informe HTML autocontenido del estado de frescura del catálogo
 * — fichas de herramientas y cuentas de afiliado activas que llevan mucho
 * tiempo sin revisarse. Solo informativo: no cambia ni bloquea nada. Mismo
 * patrón que `cli-informe-afiliacion.ts` — abrible con doble clic, sin
 * subir nada a ningún sitio.
 */

const DIR_INFORMES = path.join(process.cwd(), "data", "informes-mantenimiento");

async function main() {
  const herramientas = getTodasLasHerramientas();
  const estrategias = await getTodasLasEstrategiasAfiliacion();
  const hoy = new Date().toISOString().slice(0, 10);

  const datos = construirDatosInforme(herramientas, estrategias, hoy);

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeMantenimientoHtml(datos), "utf-8");

  console.log(`✓ Informe generado: ${rutaInforme}`);
  console.log(
    `  ${datos.herramientasDesactualizadas.length} herramienta(s) desactualizada(s) · ` +
      `${datos.cuentasDesactualizadas.length} cuenta(s) activa(s) sin revisar`
  );
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
