import type { Categoria, Herramienta, Problema } from "@/data/esquema";
import { escaparHtml } from "@/agents/compartido/html";
import { detectarHuecosEditoriales, type AvisoCompletitud } from "./completitud";
import { detectarEquilibrioCategorias, detectarEquilibrioProblemas, type AvisoEquilibrio } from "./equilibrio";

/**
 * Informe legible para revisión humana del gobierno de calidad del
 * catálogo — mismo principio que los informes de Affiliate Manager y
 * Mantenimiento: reorganiza para lectura humana lo que ya existe, nunca
 * inventa nada, y nunca bloquea nada por sí solo (a diferencia de la
 * detección de casi-duplicados, que sí bloquea dentro de
 * `agents/atlas-researcher/promover.ts`).
 *
 * No incluye duplicados: esa comprobación solo tiene sentido en el
 * momento de promover un candidato nuevo contra el catálogo existente, no
 * como barrido periódico de "todo contra todo" (coste creciente sin
 * límite con el catálogo, y sin ningún candidato nuevo que aprobar aquí).
 */

export type DatosInformeCurator = {
  categorias: AvisoEquilibrio[];
  problemas: AvisoEquilibrio[];
  huecosEditoriales: AvisoCompletitud[];
};

export function construirDatosInforme(
  categorias: Categoria[],
  problemas: Problema[],
  herramientas: Herramienta[]
): DatosInformeCurator {
  return {
    categorias: detectarEquilibrioCategorias(categorias, herramientas),
    problemas: detectarEquilibrioProblemas(problemas, herramientas),
    huecosEditoriales: detectarHuecosEditoriales(herramientas),
  };
}

function seccionEquilibrio(titulo: string, avisos: AvisoEquilibrio[]): string {
  if (avisos.length === 0) {
    return `
    <section class="bloque">
      <h2>${escaparHtml(titulo)}</h2>
      <p class="vacio">Nada que revisar — reparto dentro de lo esperado.</p>
    </section>`;
  }

  const filas = avisos
    .map(
      (aviso) => `<tr>
        <td>${escaparHtml(aviso.nombre)}</td>
        <td class="num">${aviso.numeroHerramientas}</td>
        <td>${escaparHtml(aviso.mensaje)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="bloque">
      <h2>${escaparHtml(titulo)}</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Herramientas activas</th><th>Detalle</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>`;
}

function seccionCompletitud(avisos: AvisoCompletitud[]): string {
  if (avisos.length === 0) {
    return `
    <section class="bloque">
      <h2>Huecos editoriales relativos</h2>
      <p class="vacio">Nada que revisar — ninguna ficha se queda por detrás de sus vecinas de categoría.</p>
    </section>`;
  }

  const filas = avisos
    .map(
      (aviso) => `<tr>
        <td>${escaparHtml(aviso.herramientaId)}</td>
        <td>${escaparHtml(aviso.etiqueta)}</td>
        <td>${escaparHtml(aviso.mensaje)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="bloque">
      <h2>Huecos editoriales relativos</h2>
      <p>Campos opcionales que le faltan a una ficha y que sí tiene la mayoría de sus vecinas de categoría.</p>
      <table>
        <thead><tr><th>Herramienta</th><th>Campo</th><th>Detalle</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) del gobierno de calidad del catálogo. */
export function generarInformeCuratorHtml(datos: DatosInformeCurator): string {
  const fecha = new Date().toISOString().slice(0, 10);

  const cuerpo =
    seccionEquilibrio("Equilibrio de categorías", datos.categorias) +
    seccionEquilibrio("Equilibrio de objetivos (problemas)", datos.problemas) +
    seccionCompletitud(datos.huecosEditoriales);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Atlas Curator — Informe de gobierno del catálogo</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 880px; margin: 0 auto; padding: 24px 20px 80px; line-height: 1.55; color: #1e1b4b; background: #f6f4ee; }
  @media (prefers-color-scheme: dark) { body { color: #eae8fb; background: #100f28; } }
  h1 { font-size: 22px; }
  h2 { font-size: 19px; margin: 0 0 10px; }
  p { margin: 4px 0; }
  .vacio { color: #8b87ad; font-style: italic; }
  .etiqueta { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #b45309; }
  .bloque { background: rgba(255,255,255,.6); border: 1px solid #d7d3c4; border-radius: 8px; padding: 20px 24px; margin-top: 20px; }
  @media (prefers-color-scheme: dark) { .bloque { background: #171640; border-color: #322f66; } }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d7d3c4; font-size: 13.5px; }
  @media (prefers-color-scheme: dark) { th, td { border-color: #322f66; } }
  td.num { font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
  <p class="etiqueta">Atlas Curator · generado ${fecha}</p>
  <h1>Informe de gobierno del catálogo</h1>
  <p>Solo informativo — no bloquea ni cambia nada por sí solo. La detección de casi-duplicados, que sí bloquea, ocurre en el momento de promover cada herramienta nueva, no aquí.</p>
  ${cuerpo}
</body>
</html>
`;
}
