import type { Herramienta } from "@/data/esquema";
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
