import { escaparHtml } from "@/agents/compartido/html";
import type { RegistroHistorialAprobacion } from "./historialAprobaciones";

/**
 * Informe legible del historial de aprobaciones — auditoría interna: por
 * qué se aceptó o rechazó cada intento de promoción, y cuándo. Nunca
 * inventa nada ni recalcula nada: es una vista de lectura pura sobre lo
 * que `promoverBorrador()` ya registró en cada intento (ver
 * `historialAprobaciones.ts`).
 */

const ETIQUETA_ESTADO_AFILIACION: Record<string, string> = {
  confirmada: "Confirmada",
  pendiente_de_verificar: "Pendiente de verificar",
};

function formatearFechaHora(iso: string): string {
  return iso.replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

function fila(registro: RegistroHistorialAprobacion): string {
  const claseResultado = registro.resultado === "aceptada" ? "aceptada" : "rechazada";
  return `<tr class="${claseResultado}">
    <td class="mono">${escaparHtml(formatearFechaHora(registro.fechaHora))}</td>
    <td>${escaparHtml(registro.nombreHerramienta)} <span class="etiqueta">${escaparHtml(registro.herramientaId)}</span></td>
    <td><span class="pastilla pastilla--${claseResultado}">${registro.resultado === "aceptada" ? "Aceptada" : "Rechazada"}</span></td>
    <td class="num">${registro.puntuacionMolnip ?? "—"}</td>
    <td>${registro.estadoAfiliacion ? escaparHtml(ETIQUETA_ESTADO_AFILIACION[registro.estadoAfiliacion]) : "—"}</td>
    <td>${registro.aprobacionCeo ? "Sí" : "No"}</td>
    <td>${escaparHtml(registro.observaciones)}</td>
  </tr>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) del historial completo, más reciente primero. */
export function generarInformeHistorialHtml(historial: RegistroHistorialAprobacion[]): string {
  const fecha = new Date().toISOString().slice(0, 10);
  const ordenado = [...historial].reverse();
  const aceptadas = historial.filter((r) => r.resultado === "aceptada").length;
  const rechazadas = historial.length - aceptadas;

  const cuerpo =
    ordenado.length === 0
      ? '<p class="vacio">Todavía no hay ningún registro — se añade uno automáticamente en cada intento de promoción.</p>'
      : `<table>
          <thead><tr><th>Fecha y hora</th><th>Herramienta</th><th>Resultado</th><th>Puntuación Molnip</th><th>Afiliación</th><th>Aprobación CEO</th><th>Observaciones</th></tr></thead>
          <tbody>${ordenado.map(fila).join("")}</tbody>
        </table>`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Atlas Researcher — Historial de aprobaciones</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 1080px; margin: 0 auto; padding: 24px 20px 80px; line-height: 1.55; color: #1e1b4b; background: #f6f4ee; }
  @media (prefers-color-scheme: dark) { body { color: #eae8fb; background: #100f28; } }
  h1 { font-size: 22px; }
  p { margin: 4px 0; }
  .vacio { color: #8b87ad; font-style: italic; }
  .etiqueta { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #6b6890; }
  .bloque { background: rgba(255,255,255,.6); border: 1px solid #d7d3c4; border-radius: 8px; padding: 20px 24px; margin-top: 20px; overflow-x: auto; }
  @media (prefers-color-scheme: dark) { .bloque { background: #171640; border-color: #322f66; } }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d7d3c4; font-size: 13px; vertical-align: top; }
  @media (prefers-color-scheme: dark) { th, td { border-color: #322f66; } }
  td.num { font-variant-numeric: tabular-nums; }
  td.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; white-space: nowrap; }
  .pastilla { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .pastilla--aceptada { background: #dcfce7; color: #166534; }
  .pastilla--rechazada { background: #fee2e2; color: #991b1b; }
  @media (prefers-color-scheme: dark) { .pastilla--aceptada { background: #14532d; color: #bbf7d0; } .pastilla--rechazada { background: #7f1d1d; color: #fecaca; } }
</style>
</head>
<body>
  <p class="etiqueta">Atlas Researcher · generado ${fecha}</p>
  <h1>Historial de aprobaciones</h1>
  <p>${historial.length} intento(s) registrado(s) — ${aceptadas} aceptada(s), ${rechazadas} rechazada(s). Cada intento de promoción, gane o pierda, se registra automáticamente y nunca se sobrescribe.</p>
  <div class="bloque">${cuerpo}</div>
</body>
</html>
`;
}
