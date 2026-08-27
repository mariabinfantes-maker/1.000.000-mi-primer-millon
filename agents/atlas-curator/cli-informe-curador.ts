import fs from "node:fs";
import path from "node:path";
import { getCategorias, getProblemas, getTodasLasHerramientas } from "@/data/repositorio";
import { construirDatosInforme, generarInformeCuratorHtml } from "./informe";

/**
 * `npm run informe-curador`
 *
 * Genera un informe HTML autocontenido del gobierno de calidad del
 * catálogo — equilibrio de categorías y objetivos, y huecos editoriales
 * relativos frente a las vecinas de categoría. Solo informativo: no
 * cambia ni bloquea nada. Mismo patrón que `cli-informe-mantenimiento.ts`
 * — abrible con doble clic, sin subir nada a ningún sitio.
 */

const DIR_INFORMES = path.join(process.cwd(), "data", "informes-curador");

function main() {
  const categorias = getCategorias();
  const problemas = getProblemas();
  const herramientas = getTodasLasHerramientas();

  const datos = construirDatosInforme(categorias, problemas, herramientas);

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeCuratorHtml(datos), "utf-8");

  console.log(`✓ Informe generado: ${rutaInforme}`);
  console.log(
    `  ${datos.categorias.length} aviso(s) de categorías · ${datos.problemas.length} aviso(s) de objetivos · ` +
      `${datos.huecosEditoriales.length} hueco(s) editorial(es)`
  );
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main();
