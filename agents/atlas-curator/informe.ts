import type { Categoria, Herramienta, Problema } from "@/data/esquema";
import { escaparHtml } from "@/agents/compartido/html";
import { detectarHuecosEditoriales, type AvisoCompletitud } from "./completitud";
import { detectarEquilibrioCategorias, detectarEquilibrioProblemas, type AvisoEquilibrio } from "./equilibrio";
import { construirColaInvestigacion, evaluarCobertura, type InformeCobertura, type TareaInvestigacion } from "./cobertura";
import { detectarIncoherenciasEnCatalogo, type AvisoCoherencia } from "./coherencia";
import { detectarProblemasDeValidezEnCatalogo, type AvisoValidez } from "./validez";
import { detectarHerramientasDesactualizadas } from "@/agents/atlas-mantenimiento/frescura";

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
  cobertura: InformeCobertura;
  colaInvestigacion: TareaInvestigacion[];
  validez: AvisoValidez[];
  coherencia: AvisoCoherencia[];
  /**
   * Vigencia. NO la calcula Curator: se la pide a Atlas Mantenimiento, que
   * es su dueño (`frescura.ts`, umbral de 180 días). Aquí solo se enseña
   * el recuento para que quien lea este informe sepa si además de estar
   * bien clasificado y completo, el catálogo sigue siendo cierto — y se
   * enlaza mentalmente con `npm run informe-mantenimiento`, que es donde
   * está el detalle. Tener dos umbrales de frescura sería tener dos
   * verdades el día que uno cambie.
   */
  desactualizadasSegunMantenimiento: number;
};

export function construirDatosInforme(
  categorias: Categoria[],
  problemas: Problema[],
  herramientas: Herramienta[]
): DatosInformeCurator {
  const cobertura = evaluarCobertura(categorias, herramientas);
  return {
    categorias: detectarEquilibrioCategorias(categorias, herramientas),
    problemas: detectarEquilibrioProblemas(problemas, herramientas),
    huecosEditoriales: detectarHuecosEditoriales(herramientas),
    cobertura,
    colaInvestigacion: construirColaInvestigacion(cobertura),
    validez: detectarProblemasDeValidezEnCatalogo(herramientas),
    coherencia: detectarIncoherenciasEnCatalogo(herramientas, categorias),
    desactualizadasSegunMantenimiento: detectarHerramientasDesactualizadas(herramientas, new Date().toISOString().slice(0, 10)).length,
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


/** Los cuatro estados de cobertura, cada uno con su propia tabla: es la respuesta directa a "¿qué categorías puedo enseñar y cuáles no?". */
function seccionCobertura(cobertura: InformeCobertura): string {
  const grupos: { titulo: string; estado: Parameters<typeof filtrar>[1]; explicacion: string }[] = [
    { titulo: "Preparadas", estado: "preparada", explicacion: "Cumplen el mínimo de alternativas: se pueden enseñar." },
    { titulo: "Insuficientes", estado: "insuficiente", explicacion: "Tienen herramientas, pero no las suficientes para que comparar signifique algo." },
    { titulo: "Vacías", estado: "vacia", explicacion: "Declaradas y sin ninguna herramienta activa." },
    { titulo: "Sobrerrepresentadas", estado: "sobrerrepresentada", explicacion: "Acaparan más de la mitad del catálogo activo." },
  ];

  const tablas = grupos
    .map((grupo) => {
      const filas = filtrar(cobertura, grupo.estado);
      if (filas.length === 0) return "";
      const cuerpo = filas
        .map(
          (c) => `<tr>
        <td>${escaparHtml(c.nombre)}</td>
        <td>${c.publica ? "pública" : "interna"}</td>
        <td class="num">${c.numeroHerramientas}</td>
        <td>${escaparHtml(c.mensaje)}</td>
      </tr>`
        )
        .join("");
      return `<h3>${escaparHtml(grupo.titulo)}</h3>
      <p>${escaparHtml(grupo.explicacion)}</p>
      <table>
        <thead><tr><th>Categoría</th><th>Estado</th><th>Herramientas</th><th>Detalle</th></tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>`;
    })
    .join("");

  const ausentes =
    cobertura.ausentes.length === 0
      ? ""
      : `<h3>Ausentes del catálogo</h3>
      <p>Categorías del marco mínimo de Molnip que ni siquiera están declaradas.</p>
      <ul>${cobertura.ausentes.map((c) => `<li>${escaparHtml(c.mensaje)}</li>`).join("")}</ul>`;

  const propuestas = [
    ...cobertura.listasParaPublicar.map(
      (c) => `<li><strong>Publicar</strong> "${escaparHtml(c.nombre)}": ya cumple el mínimo con ${c.numeroHerramientas} herramientas.</li>`
    ),
    ...cobertura.publicadasSinRespaldo.map(
      (c) => `<li><strong>Revisar</strong> "${escaparHtml(c.nombre)}": está publicada con solo ${c.numeroHerramientas} herramienta(s).</li>`
    ),
  ].join("");

  return `
    <section class="bloque">
      <h2>Cobertura de categorías</h2>
      ${tablas || '<p class="vacio">Nada que revisar.</p>'}
      ${ausentes}
      ${propuestas ? `<h3>Propuestas para una persona</h3><ul>${propuestas}</ul>` : ""}
    </section>`;
}

function filtrar(cobertura: InformeCobertura, estado: InformeCobertura["categorias"][number]["estado"]) {
  return cobertura.categorias.filter((c) => c.estado === estado);
}

function seccionColaInvestigacion(tareas: TareaInvestigacion[]): string {
  if (tareas.length === 0) {
    return `
    <section class="bloque">
      <h2>Cola de investigación para Researcher</h2>
      <p class="vacio">Nada pendiente — todas las categorías del marco llegan al mínimo.</p>
    </section>`;
  }
  const filas = tareas
    .map(
      (t) => `<tr>
        <td>${escaparHtml(t.nombre)}</td>
        <td class="num">${t.herramientasQueFaltan}</td>
        <td>${escaparHtml(t.motivo)}</td>
      </tr>`
    )
    .join("");
  return `
    <section class="bloque">
      <h2>Cola de investigación para Researcher</h2>
      <p>Qué falta y cuánto, ordenado por lo cerca que está de poder publicarse. Curator dice QUÉ falta; no nombra ninguna herramienta concreta — proponer candidatas sin investigarlas sería inventarlas.</p>
      <table>
        <thead><tr><th>Categoría</th><th>Faltan</th><th>Motivo</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </section>`;
}

function seccionValidez(avisos: AvisoValidez[]): string {
  if (avisos.length === 0) {
    return `
    <section class="bloque">
      <h2>Validez de los datos</h2>
      <p class="vacio">Nada que revisar — todos los valores obligatorios sirven.</p>
    </section>`;
  }
  const invalidos = avisos.filter((a) => a.gravedad === "invalido");
  const pendientes = avisos.filter((a) => a.gravedad === "pendiente");
  const tabla = (titulo: string, lista: AvisoValidez[], explicacion: string) =>
    lista.length === 0
      ? ""
      : `<h3>${escaparHtml(titulo)} (${lista.length})</h3>
      <p>${escaparHtml(explicacion)}</p>
      <table>
        <thead><tr><th>Herramienta</th><th>Campo</th><th>Detalle</th></tr></thead>
        <tbody>${lista
          .map(
            (a) => `<tr><td>${escaparHtml(a.herramientaId)}</td><td>${escaparHtml(a.campo)}</td><td>${escaparHtml(a.mensaje)}</td></tr>`
          )
          .join("")}</tbody>
      </table>`;

  return `
    <section class="bloque">
      <h2>Validez de los datos</h2>
      <p>No es "¿está el campo?" sino "¿lo que hay dentro sirve?". La vigencia de los datos la controla Atlas Mantenimiento, no Curator.</p>
      ${tabla("Valores inválidos", invalidos, "Hay un valor y no sirve: alguien debe corregirlo.")}
      ${tabla("Pendiente de investigar", pendientes, "No hay valor y el campo es opcional. No es un error: es investigación que falta, y se deja marcada en vez de inventarse.")}
    </section>`;
}

function seccionCoherencia(avisos: AvisoCoherencia[]): string {
  if (avisos.length === 0) {
    return `
    <section class="bloque">
      <h2>Coherencia de clasificación</h2>
      <p class="vacio">Nada que revisar — lo que cada ficha declara ser se corresponde con lo que demuestra.</p>
    </section>`;
  }
  return `
    <section class="bloque">
      <h2>Coherencia de clasificación</h2>
      <p>Contradicciones entre lo que una ficha declara y lo que sus propios datos respaldan. Ninguna es un error de esquema: todas pasan la validación y aun así alguien debe resolverlas.</p>
      <table>
        <thead><tr><th>Herramienta</th><th>Detalle</th></tr></thead>
        <tbody>${avisos
          .map((a) => `<tr><td>${escaparHtml(a.herramientaId)}</td><td>${escaparHtml(a.motivo)}</td></tr>`)
          .join("")}</tbody>
      </table>
    </section>`;
}

function seccionVigencia(desactualizadas: number): string {
  return `
    <section class="bloque">
      <h2>Vigencia (la lleva Mantenimiento)</h2>
      <p>${
        desactualizadas === 0
          ? "Ninguna ficha activa supera el umbral de frescura."
          : `${desactualizadas} ficha(s) activa(s) llevan más tiempo del debido sin revisarse.`
      }</p>
      <p class="vacio">El detalle está en <code>npm run informe-mantenimiento</code>. Curator no recalcula la frescura a propósito: dos umbrales serían dos verdades distintas el día que uno cambie.</p>
    </section>`;
}

/** Genera el informe HTML autocontenido (sin dependencias externas) del gobierno de calidad del catálogo. */
export function generarInformeCuratorHtml(datos: DatosInformeCurator): string {
  const fecha = new Date().toISOString().slice(0, 10);

  const cuerpo =
    seccionCobertura(datos.cobertura) +
    seccionColaInvestigacion(datos.colaInvestigacion) +
    seccionCoherencia(datos.coherencia) +
    seccionValidez(datos.validez) +
    seccionEquilibrio("Equilibrio de categorías", datos.categorias) +
    seccionEquilibrio("Equilibrio de objetivos (problemas)", datos.problemas) +
    seccionCompletitud(datos.huecosEditoriales) +
    seccionVigencia(datos.desactualizadasSegunMantenimiento);

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
  h3 { font-size: 15px; margin: 18px 0 4px; }
  ul { margin: 6px 0; padding-left: 20px; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12.5px; }
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
