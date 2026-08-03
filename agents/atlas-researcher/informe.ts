import type { AffiliateData } from "@/data/esquemaInterno";
import type { Herramienta } from "@/data/esquema";
import type { MetadatosBorrador } from "./borrador";
import { CAMPOS_INVESTIGABLES_AFILIADOS_OBLIGATORIOS } from "./camposAfiliados";
import { CAMPOS_INVESTIGABLES_OBLIGATORIOS } from "./camposEsquema";

/**
 * Informe legible para revisión humana (etapa entre "borrador" y
 * "aprobación" del flujo: investigar → informe → revisión → aprobación →
 * promoción).
 *
 * Es la versión automatizada de lo que antes había que redactar a mano
 * leyendo los JSON del borrador uno a uno. Nunca llama al proveedor de IA
 * ni inventa nada: solo reorganiza para lectura humana lo que ya está
 * escrito en `data/borradores/` — si un dato falta ahí, el informe lo
 * señala como falta, no lo rellena.
 */

export type BorradorLeido = {
  datos: unknown;
  datosAfiliados: unknown;
  metadatos?: MetadatosBorrador;
};

export type SeccionInforme = {
  id: string;
  nombre: string;
  datos: Partial<Herramienta>;
  datosAfiliados: Partial<AffiliateData>;
  metadatos?: MetadatosBorrador;
  /** Campos públicos obligatorios que la investigación no rellenó. */
  camposPublicosFaltantes: string[];
  /** Campos de afiliación obligatorios que la investigación no rellenó. */
  camposAfiliadosFaltantes: string[];
};

function campoEstaVacio(valor: unknown): boolean {
  if (Array.isArray(valor)) return valor.length === 0;
  if (typeof valor === "string") return valor.trim() === "";
  return valor === undefined || valor === null;
}

/** Construye la sección de informe de una herramienta a partir de su borrador ya leído (ver `leerBorrador` en borrador.ts). Sin validar contra el esquema: son los propios JSON que escribió `escribirBorrador`. */
export function construirSeccionInforme(id: string, borrador: BorradorLeido): SeccionInforme {
  const datos = (borrador.datos ?? {}) as Partial<Herramienta>;
  const datosAfiliados = (borrador.datosAfiliados ?? {}) as Partial<AffiliateData>;
  const { metadatos } = borrador;

  const camposPublicosFaltantes = CAMPOS_INVESTIGABLES_OBLIGATORIOS.filter((campo) => campoEstaVacio(datos[campo]));
  const camposAfiliadosFaltantes = CAMPOS_INVESTIGABLES_AFILIADOS_OBLIGATORIOS.filter((campo) =>
    campoEstaVacio(datosAfiliados[campo])
  );

  return {
    id,
    nombre: datos.nombre?.trim() || id,
    datos,
    datosAfiliados,
    metadatos,
    camposPublicosFaltantes,
    camposAfiliadosFaltantes,
  };
}

function escaparHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listaHtml(items: string[] | undefined): string {
  if (!items || items.length === 0) return "<p class=\"vacio\">— ninguna —</p>";
  return `<ul>${items.map((item) => `<li>${escaparHtml(item)}</li>`).join("")}</ul>`;
}

function seccionComparativa(secciones: SeccionInforme[]): string {
  if (secciones.length < 2) return "";
  const filas = secciones
    .map((s) => {
      const puntuacion = s.datos.analisisAtlas?.puntuacion;
      return `<tr>
        <td>${escaparHtml(s.nombre)}</td>
        <td class="num">${puntuacion ?? "—"}</td>
        <td>${escaparHtml(s.datos.precioInicial ?? "—")}</td>
        <td>${s.datos.tienePlanGratuito ? "Sí" : "No"}</td>
        <td>${escaparHtml(s.metadatos?.confianza ?? "no registrada")}</td>
        <td>${escaparHtml(s.datosAfiliados.confidenceLevel ?? "—")}</td>
      </tr>`;
    })
    .join("");

  return `
    <section class="bloque">
      <h2>Comparativa del lote</h2>
      <table>
        <thead><tr><th>Herramienta</th><th>Puntuación</th><th>Precio inicial</th><th>Gratis</th><th>Confianza</th><th>Afiliado</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>`;
}

function seccionHerramienta(s: SeccionInforme): string {
  const puntuacion = s.datos.analisisAtlas?.puntuacion;
  const confianzaTexto = s.metadatos
    ? s.metadatos.confianza
    : "no registrada (borrador escrito antes de que se guardara este dato)";

  const avisoIncompletos =
    s.camposPublicosFaltantes.length > 0 || s.camposAfiliadosFaltantes.length > 0
      ? `<div class="aviso aviso--warn">
          <h4>Campos incompletos</h4>
          ${s.camposPublicosFaltantes.length > 0 ? `<p>Públicos: ${s.camposPublicosFaltantes.map(escaparHtml).join(", ")}</p>` : ""}
          ${s.camposAfiliadosFaltantes.length > 0 ? `<p>Afiliados: ${s.camposAfiliadosFaltantes.map(escaparHtml).join(", ")}</p>` : ""}
        </div>`
      : "";

  const advertenciasHtml =
    s.metadatos && s.metadatos.advertencias.length > 0
      ? `<div class="aviso aviso--warn"><h4>Advertencias de la investigación</h4>${listaHtml(s.metadatos.advertencias)}</div>`
      : "";

  return `
    <section class="bloque herramienta" id="${escaparHtml(s.id)}">
      <div class="cabecera">
        <div>
          <span class="etiqueta">${escaparHtml(s.id)}</span>
          <h2>${escaparHtml(s.nombre)}</h2>
        </div>
        ${puntuacion !== undefined ? `<div class="puntuacion">${puntuacion}<span>/100</span></div>` : ""}
      </div>

      <p class="descripcion">${escaparHtml(s.datos.descripcion ?? "— sin descripción —")}</p>

      <div class="columnas">
        <div>
          <h3>Ideal para</h3>
          <p>${escaparHtml(s.datos.idealPara ?? "—")}</p>
        </div>
        <div>
          <h3>No recomendada para</h3>
          <p>${escaparHtml(s.datos.noRecomendadaPara ?? "—")}</p>
        </div>
      </div>

      <div class="columnas">
        <div>
          <h3>Ventajas</h3>
          ${listaHtml(s.datos.ventajas)}
        </div>
        <div>
          <h3>Inconvenientes</h3>
          ${listaHtml(s.datos.inconvenientes)}
        </div>
      </div>

      <h3>Precio</h3>
      <p>${escaparHtml(s.datos.precioInicial ?? "—")} ${s.datos.tienePlanGratuito ? " · con plan gratuito" : ""}</p>

      <h3>Programa de afiliados</h3>
      <table class="tabla-clave-valor">
        <tbody>
          <tr><th>Activo</th><td>${s.datosAfiliados.hasAffiliateProgram ? "Sí" : "No"}</td></tr>
          <tr><th>Plataforma</th><td>${escaparHtml(s.datosAfiliados.affiliatePlatform ?? "—")}</td></tr>
          <tr><th>Comisión</th><td>${escaparHtml(s.datosAfiliados.commission ?? "—")}</td></tr>
          <tr><th>Duración cookie</th><td>${escaparHtml(s.datosAfiliados.cookieDuration ?? "—")}</td></tr>
          <tr><th>Requiere aprobación</th><td>${s.datosAfiliados.approvalRequired ? "Sí" : "No"}</td></tr>
          <tr><th>Confianza del dato</th><td>${escaparHtml(s.datosAfiliados.confidenceLevel ?? "—")}</td></tr>
          <tr><th>Fuente</th><td>${escaparHtml(s.datosAfiliados.source ?? "—")}</td></tr>
        </tbody>
      </table>

      <h3>Confianza global y fuentes de la investigación</h3>
      <p><strong>Confianza:</strong> ${escaparHtml(confianzaTexto)}</p>
      <p><strong>Fuentes citadas:</strong></p>
      ${s.metadatos ? listaHtml(s.metadatos.fuentes) : "<p class=\"vacio\">— no registradas (borrador anterior) —</p>"}

      ${advertenciasHtml}
      ${avisoIncompletos}

      <div class="acciones">
        <h3>Para decidir sobre esta herramienta</h3>
        <p class="mono">npm run aprobar-borrador -- ${escaparHtml(s.id)} --decision aprobado --notas "..."</p>
        <p class="mono">npm run aprobar-borrador -- ${escaparHtml(s.id)} --decision rechazado --notas "..."</p>
        <p class="mono">npm run promover-borrador -- ${escaparHtml(s.id)}</p>
      </div>
    </section>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) para una o varias herramientas. */
export function generarInformeHtml(secciones: SeccionInforme[]): string {
  const fecha = new Date().toISOString().slice(0, 10);
  const cuerpo = `${seccionComparativa(secciones)}${secciones.map(seccionHerramienta).join("")}`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Atlas Researcher — Informe de revisión</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; max-width: 880px; margin: 0 auto; padding: 24px 20px 80px; line-height: 1.55; color: #1e1b4b; background: #f6f4ee; }
  @media (prefers-color-scheme: dark) { body { color: #eae8fb; background: #100f28; } }
  h1 { font-size: 22px; }
  h2 { font-size: 19px; margin: 0 0 10px; }
  h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #6b6890; margin: 18px 0 6px; }
  p { margin: 4px 0; }
  .vacio { color: #8b87ad; font-style: italic; }
  .bloque { background: rgba(255,255,255,.6); border: 1px solid #d7d3c4; border-radius: 8px; padding: 20px 24px; margin-top: 20px; }
  @media (prefers-color-scheme: dark) { .bloque { background: #171640; border-color: #322f66; } }
  .cabecera { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .etiqueta { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #4f46e5; }
  .puntuacion { font-size: 26px; font-weight: 700; color: #4f46e5; white-space: nowrap; }
  .puntuacion span { font-size: 13px; font-weight: 400; color: #6b6890; }
  .descripcion { color: #4b4870; }
  .columnas { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
  table { border-collapse: collapse; width: 100%; margin-top: 6px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #d7d3c4; font-size: 13.5px; }
  td.num { font-variant-numeric: tabular-nums; }
  .tabla-clave-valor th { width: 160px; color: #6b6890; font-weight: 500; }
  .aviso { border-left: 3px solid #be123c; background: #ffe4e6; border-radius: 4px; padding: 10px 14px; margin-top: 14px; }
  @media (prefers-color-scheme: dark) { .aviso { background: #4a1120; } }
  .aviso h4 { margin: 0 0 4px; font-size: 12.5px; }
  .aviso p { font-size: 13px; margin: 2px 0; }
  .acciones { margin-top: 18px; border-top: 1px dashed #b9b39d; padding-top: 12px; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12.5px; background: #eef2ff; padding: 4px 8px; border-radius: 4px; }
  @media (prefers-color-scheme: dark) { .mono { background: #1c1a4d; } }
  ul { margin: 4px 0; padding-left: 20px; }
  li { font-size: 13.5px; margin-bottom: 2px; }
</style>
</head>
<body>
  <p class="etiqueta">Atlas Researcher · generado ${fecha}</p>
  <h1>Informe de revisión — ${secciones.length} herramienta${secciones.length === 1 ? "" : "s"}</h1>
  <p>Nada de esto se ha promovido al catálogo real. Este informe es solo para tu revisión — la aprobación y la promoción son pasos aparte, explícitos.</p>
  ${cuerpo}
</body>
</html>
`;
}
