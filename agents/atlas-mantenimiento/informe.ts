import type { Herramienta } from "@/data/esquema";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { escaparHtml } from "@/agents/compartido/html";
import {
  detectarCuentasActivasDesactualizadas,
  detectarHerramientasDesactualizadas,
  DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO,
  DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO,
} from "./frescura";
import { priorizarAvisosFrescura, type AvisoFrescuraPriorizado } from "./priorizacion";

/**
 * Informe legible para revisión humana del estado de frescura del
 * catálogo — mismo principio que los informes de Researcher y Affiliate
 * Manager: reorganiza para lectura humana lo que ya existe, nunca inventa
 * nada, y nunca bloquea nada por sí solo (a diferencia de
 * `data/verificar.ts`).
 */

export type DatosInformeMantenimiento = {
  herramientasDesactualizadas: AvisoFrescuraPriorizado[];
  cuentasDesactualizadas: AvisoFrescuraPriorizado[];
};

export function construirDatosInforme(
  herramientas: Herramienta[],
  estrategias: EstrategiaAfiliacion[],
  hoy: string
): DatosInformeMantenimiento {
  return {
    herramientasDesactualizadas: priorizarAvisosFrescura(detectarHerramientasDesactualizadas(herramientas, hoy), herramientas),
    cuentasDesactualizadas: priorizarAvisosFrescura(detectarCuentasActivasDesactualizadas(estrategias, hoy), herramientas),
  };
}

function seccionAvisos(titulo: string, descripcion: string, avisos: AvisoFrescuraPriorizado[]): string {
  if (avisos.length === 0) {
    return `
    <section class="bloque">
      <h2>${escaparHtml(titulo)}</h2>
      <p class="vacio">Nada que revisar — todo dentro del umbral.</p>
    </section>`;
  }

  const filas = avisos
    .map(
      (aviso) => `<tr>
        <td>${escaparHtml(aviso.nombreHerramienta)}</td>
        <td class="num">${aviso.puntuacionAtlas ?? "—"}</td>
        <td class="num">${aviso.dias}</td>
        <td>${escaparHtml(aviso.mensaje)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="bloque">
      <h2>${escaparHtml(titulo)}</h2>
      <p>${escaparHtml(descripcion)}</p>
      <table>
        <thead><tr><th>Herramienta</th><th>Puntuación Atlas</th><th>Días</th><th>Detalle</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) del estado de frescura del catálogo. */
export function generarInformeMantenimientoHtml(datos: DatosInformeMantenimiento): string {
  const fecha = new Date().toISOString().slice(0, 10);

  const cuerpo =
    seccionAvisos(
      "Fichas de herramientas desactualizadas",
      `Herramientas activas sin revisar en más de ${DIAS_HERRAMIENTA_DESACTUALIZADA_POR_DEFECTO} días — ordenadas por ` +
        "Puntuación Atlas: conviene revisar antes las más recomendadas.",
      datos.herramientasDesactualizadas
    ) +
    seccionAvisos(
      "Cuentas de afiliado activas sin revisar",
      `Cuentas en estado "activo" sin comprobar en más de ${DIAS_CUENTA_ACTIVA_DESACTUALIZADA_POR_DEFECTO} días — ` +
        "comprobar que el programa de afiliados sigue vivo antes de perder comisión en silencio.",
      datos.cuentasDesactualizadas
    );

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Atlas Mantenimiento — Informe de frescura del catálogo</title>
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
  <p class="etiqueta">Atlas Mantenimiento · generado ${fecha}</p>
  <h1>Informe de frescura del catálogo</h1>
  <p>Solo informativo — no bloquea ni cambia nada por sí solo. La re-investigación y actualización de una ficha siguen requiriendo revisión humana (Capa 2, futura).</p>
  ${cuerpo}
</body>
</html>
`;
}
