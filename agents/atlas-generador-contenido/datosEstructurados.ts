import type { Herramienta, Post } from "@/data/esquema";
import { URL_BASE } from "@/lib/urlBase";

/**
 * Datos estructurados (JSON-LD, schema.org/SoftwareApplication) para la
 * ficha de una herramienta — Capa 1, solo campos que Atlas puede
 * verificar directamente sobre datos ya reales.
 *
 * Deliberadamente NO incluye, ni siquiera de forma condicional (ver
 * ATLAS.md, sección Pendiente antes de producción / decisiones
 * diferidas):
 * - `aggregateRating`: usar la Puntuación Atlas (un juicio editorial
 *   propio, no reseñas de usuarios) incumpliría las directrices de
 *   fragmentos enriquecidos de Google y arriesgaría una sanción manual a
 *   todo el sitio, no solo a esta página.
 * - `offers`/precio, en ningún caso, incluido el plan gratuito:
 *   `precioInicial` es texto libre y ambiguo ("Gratis / Desde 15€
 *   mes..."); estructurar cualquier precio, aunque parezca un hecho
 *   simple, se trata como información no verificable a estos efectos.
 */
export function construirDatosEstructuradosHerramienta(herramienta: Herramienta): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: herramienta.nombre,
    description: herramienta.descripcion,
    url: `${URL_BASE}/herramienta/${herramienta.id}`,
    sameAs: herramienta.paginaOficial,
    applicationCategory: "BusinessApplication",
  };
}

/**
 * Datos estructurados (JSON-LD, schema.org/BlogPosting) de un artículo del
 * blog — solo campos verificables sobre el propio post: `datePublished`
 * real, `dateModified` solo si hay una revisión posterior real. Sin
 * `aggregateRating` ni ningún dato de terceros, por la misma razón que la
 * ficha de herramienta.
 */
export function construirDatosEstructuradosPost(post: Post): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumen,
    url: `${URL_BASE}/blog/${post.id}`,
    datePublished: post.fechaPublicacion,
    ...(post.fechaUltimaRevision ? { dateModified: post.fechaUltimaRevision } : {}),
    author: { "@type": "Organization", name: post.autor ?? "Molnip" },
  };
}

/**
 * Datos estructurados (JSON-LD, schema.org/ItemList) de una página de
 * subtipo: la lista ordenada de las herramientas que compiten dentro de él.
 *
 * `ItemList` y no `CollectionPage` porque lo que aporta valor aquí es
 * precisamente el ORDEN: son las alternativas reales de ese subtipo,
 * ordenadas por Puntuación Molnip. Cada elemento reutiliza el mismo
 * `SoftwareApplication` que ya publica la ficha, para no describir la
 * misma herramienta de dos formas distintas en dos páginas del sitio.
 *
 * Mismas exclusiones que el resto del fichero: ni `aggregateRating` ni
 * `offers`. La posición en la lista es un juicio editorial de Molnip y se
 * declara como tal (`position`), no como una valoración de usuarios.
 */
export function construirDatosEstructuradosSubtipo(
  nombreSubtipo: string,
  descripcion: string,
  ruta: string,
  herramientas: Herramienta[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: nombreSubtipo,
    description: descripcion,
    url: `${URL_BASE}${ruta}`,
    numberOfItems: herramientas.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: herramientas.map((herramienta, indice) => ({
      "@type": "ListItem",
      position: indice + 1,
      item: construirDatosEstructuradosHerramienta(herramienta),
    })),
  };
}
