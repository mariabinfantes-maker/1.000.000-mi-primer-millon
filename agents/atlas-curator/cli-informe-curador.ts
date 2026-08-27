import fs from "node:fs";
import path from "node:path";
import { getProblemas, getTodasLasCategorias, getTodasLasHerramientas } from "@/data/repositorio";
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
  // TODAS, no solo las públicas: medir la cobertura de una categoría
  // interna es justo la razón por la que existe el estado "pendiente".
  const categorias = getTodasLasCategorias();
  const problemas = getProblemas();
  const herramientas = getTodasLasHerramientas();

  const datos = construirDatosInforme(categorias, problemas, herramientas);

  fs.mkdirSync(DIR_INFORMES, { recursive: true });
  const marcaDeTiempo = new Date().toISOString().replace(/[:.]/g, "-");
  const rutaInforme = path.join(DIR_INFORMES, `informe-${marcaDeTiempo}.html`);
  fs.writeFileSync(rutaInforme, generarInformeCuratorHtml(datos), "utf-8");

  console.log(`✓ Informe generado: ${rutaInforme}`);
  const { cobertura } = datos;
  const cuenta = (estado: string) => cobertura.categorias.filter((c) => c.estado === estado).length;
  console.log(
    `  categorías: ${cuenta("preparada")} preparada(s) · ${cuenta("insuficiente")} insuficiente(s) · ` +
      `${cuenta("vacia")} vacía(s) · ${cuenta("sobrerrepresentada")} sobrerrepresentada(s) · ${cobertura.ausentes.length} ausente(s)`
  );
  console.log(
    `  ${datos.coherencia.length} incoherencia(s) de clasificación · ` +
      `${datos.validez.filter((a) => a.gravedad === "invalido").length} valor(es) inválido(s) · ` +
      `${datos.validez.filter((a) => a.gravedad === "pendiente").length} dato(s) pendiente(s) de investigar`
  );
  console.log(
    `  ${datos.colaInvestigacion.length} tarea(s) en la cola de Researcher · ` +
      `${datos.huecosEditoriales.length} hueco(s) editorial(es) · ` +
      `${datos.desactualizadasSegunMantenimiento} ficha(s) sin revisar (según Mantenimiento)`
  );
  console.log("Ábrelo con doble clic en tu navegador para revisarlo.");
}

main();
