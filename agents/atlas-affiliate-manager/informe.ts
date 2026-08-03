import type { Herramienta } from "@/data/esquema";
import type { EstadoAfiliacion, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { detectarCuentasActivasSinEnlace, detectarCuentasEstancadas, type AvisoConsistencia } from "./consistencia";
import { priorizarCuentasPendientesDeSolicitud, type CuentaPriorizada } from "./priorizador";

/**
 * Informe legible para revisión humana del estado de la estrategia de
 * afiliación — mismo principio que `agents/atlas-researcher/informe.ts`:
 * reorganiza para lectura humana lo que ya existe, nunca inventa nada, y
 * nunca bloquea nada por sí solo (a diferencia de `data/verificar.ts`, que
 * sí falla si hay una cuenta activa sin enlace).
 */

export type DatosInformeAfiliacion = {
  totalCuentas: number;
  porEstado: Record<EstadoAfiliacion, number>;
  cuentasSinEnlace: AvisoConsistencia[];
  cuentasEstancadas: AvisoConsistencia[];
  priorizadas: CuentaPriorizada[];
};

export function construirDatosInforme(
  estrategias: EstrategiaAfiliacion[],
  herramientas: Herramienta[],
  hoy: string
): DatosInformeAfiliacion {
  const porEstado: Record<EstadoAfiliacion, number> = {
    no_solicitado: 0,
    pendiente: 0,
    aprobado: 0,
    rechazado: 0,
    activo: 0,
  };
  let totalCuentas = 0;

  for (const estrategia of estrategias) {
    for (const cuenta of estrategia.cuentas) {
      totalCuentas += 1;
      porEstado[cuenta.estado] += 1;
    }
  }

  return {
    totalCuentas,
    porEstado,
    cuentasSinEnlace: detectarCuentasActivasSinEnlace(estrategias),
    cuentasEstancadas: detectarCuentasEstancadas(estrategias, hoy),
    priorizadas: priorizarCuentasPendientesDeSolicitud(estrategias, herramientas),
  };
}

function escaparHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ETIQUETA_ESTADO: Record<EstadoAfiliacion, string> = {
  no_solicitado: "No solicitado",
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  activo: "Activo",
};

function seccionResumen(datos: DatosInformeAfiliacion): string {
  const filas = (Object.keys(ETIQUETA_ESTADO) as EstadoAfiliacion[])
    .map((estado) => `<tr><td>${ETIQUETA_ESTADO[estado]}</td><td class="num">${datos.porEstado[estado]}</td></tr>`)
    .join("");

  return `
    <section class="bloque">
      <h2>Resumen</h2>
      <p>${datos.totalCuentas} cuenta${datos.totalCuentas === 1 ? "" : "s"} de afiliado registrada${datos.totalCuentas === 1 ? "" : "s"}.</p>
      <table><tbody>${filas}</tbody></table>
    </section>`;
}

function seccionAvisos(titulo: string, descripcion: string, avisos: AvisoConsistencia[]): string {
  if (avisos.length === 0) return "";
  const items = avisos.map((aviso) => `<li>${escaparHtml(aviso.mensaje)}</li>`).join("");

  return `
    <section class="bloque">
      <h2>${escaparHtml(titulo)}</h2>
      <p>${escaparHtml(descripcion)}</p>
      <ul>${items}</ul>
    </section>`;
}

function seccionPriorizacion(priorizadas: CuentaPriorizada[]): string {
  if (priorizadas.length === 0) {
    return `
    <section class="bloque">
      <h2>Prioridad de solicitud</h2>
      <p class="vacio">No hay ninguna cuenta en estado "no solicitado" pendiente de priorizar.</p>
    </section>`;
  }

  const filas = priorizadas
    .map(
      (c) => `<tr>
        <td>${escaparHtml(c.nombreHerramienta)}</td>
        <td>${escaparHtml(c.nombrePrograma ?? c.plataforma)}</td>
        <td class="num">${c.puntuacionAtlas ?? "—"}</td>
        <td>${escaparHtml(c.comision ?? "—")}</td>
        <td class="mono">${escaparHtml(c.herramientaId)} / ${escaparHtml(c.cuentaId)}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="bloque">
      <h2>Prioridad de solicitud</h2>
      <p>Ordenadas por Puntuación Atlas — la comisión se muestra tal como se investigó, sin combinarla en una cifra única: la decisión final es tuya.</p>
      <table>
        <thead><tr><th>Herramienta</th><th>Programa</th><th>Puntuación Atlas</th><th>Comisión investigada</th><th>Comando</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <p class="mono ayuda">npm run actualizar-estrategia-afiliacion -- herramientaId --cuenta cuentaId --estado pendiente --fecha-solicitud AAAA-MM-DD</p>
    </section>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) del estado de la estrategia de afiliación. */
export function generarInformeAfiliacionHtml(datos: DatosInformeAfiliacion): string {
  const fecha = new Date().toISOString().slice(0, 10);

  const cuerpo =
    seccionResumen(datos) +
    seccionAvisos(
      "Comisión que se está perdiendo",
      "Cuentas activas sin ningún enlace de afiliado — el redirect de producción no tiene nada que servir para ellas.",
      datos.cuentasSinEnlace
    ) +
    seccionAvisos(
      "Solicitudes estancadas",
      "Cuentas pendientes sin revisión reciente — puede merecer la pena hacer seguimiento.",
      datos.cuentasEstancadas
    ) +
    seccionPriorizacion(datos.priorizadas);

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Atlas Affiliate Manager — Informe de estrategia de afiliación</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 880px; margin: 0 auto; padding: 24px 20px 80px; line-height: 1.55; color: #1e1b4b; background: #f6f4ee; }
  @media (prefers-color-scheme: dark) { body { color: #eae8fb; background: #100f28; } }
  h1 { font-size: 22px; }
  h2 { font-size: 19px; margin: 0 0 10px; }
  p { margin: 4px 0; }
  .vacio { color: #8b87ad; font-style: italic; }
  .etiqueta { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #047857; }
  .bloque { background: rgba(255,255,255,.6); border: 1px solid #d7d3c4; border-radius: 8px; padding: 20px 24px; margin-top: 20px; }
  @media (prefers-color-scheme: dark) { .bloque { background: #171640; border-color: #322f66; } }
  table { border-collapse: collapse; width: 100%; margin-top: 10px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d7d3c4; font-size: 13.5px; }
  @media (prefers-color-scheme: dark) { th, td { border-color: #322f66; } }
  td.num { font-variant-numeric: tabular-nums; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
  .ayuda { margin-top: 12px; background: #eef2ff; padding: 8px 10px; border-radius: 4px; }
  @media (prefers-color-scheme: dark) { .ayuda { background: #1c1a4d; } }
  ul { margin: 8px 0 0; padding-left: 20px; }
  li { font-size: 13.5px; margin-bottom: 4px; }
</style>
</head>
<body>
  <p class="etiqueta">Atlas Affiliate Manager · generado ${fecha}</p>
  <h1>Informe de estrategia de afiliación</h1>
  <p>Solo informativo — no bloquea ni cambia nada por sí solo. Las cuentas activas sin enlace sí bloquean <span class="mono">npm run verificar-datos</span>.</p>
  ${cuerpo}
</body>
</html>
`;
}
