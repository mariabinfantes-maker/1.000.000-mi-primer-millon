import type { Metadata } from "next";
import type { Categoria, Herramienta, Problema } from "@/data/esquema";

/**
 * Único punto de construcción de metadata pública de Atlas — título,
 * descripción, Open Graph y Twitter Card comparten siempre el mismo
 * patrón; ninguna ruta debería repetirlo a mano.
 *
 * `app/layout.tsx` reutiliza `TITULO_ATLAS`/`DESCRIPCION_ATLAS` como
 * plantilla por defecto (`title.template`), así que cada página solo
 * necesita indicar su propio título, nunca el sufijo "| Atlas".
 */

export const TITULO_ATLAS = "Atlas — El asesor que recomienda la herramienta exacta para tu empresa";
export const DESCRIPCION_ATLAS =
  "Atlas es un asesor inteligente, no un directorio de software. Describe tu problema y te recomendamos la tecnología exacta para resolverlo, sin listas interminables ni sesgos publicitarios.";

function construirMetadata(titulo: string, descripcion: string, opciones: { indexable: boolean }): Metadata {
  // `title` se queda como texto plano: el layout raíz ya añade " | Atlas"
  // mediante `title.template`. openGraph/twitter no heredan esa plantilla
  // (las leen plataformas externas, no el <title> del documento), así que
  // llevan el sufijo explícito para no aparecer sin marca en una vista previa.
  const tituloCompleto = `${titulo} | Atlas`;
  return {
    title: titulo,
    description: descripcion,
    openGraph: { title: tituloCompleto, description: descripcion, type: "website", locale: "es_ES" },
    twitter: { card: "summary", title: tituloCompleto, description: descripcion },
    ...(opciones.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Ficha de herramienta — contenido de valor, indexable. */
export function metadataHerramienta(herramienta: Herramienta): Metadata {
  return construirMetadata(`${herramienta.nombre}: precio, ventajas y alternativas`, herramienta.descripcion, {
    indexable: true,
  });
}

/** Landing de categoría — contenido de valor, indexable. */
export function metadataCategoria(categoria: Categoria): Metadata {
  return construirMetadata(`${categoria.nombre}: comparativa y mejores opciones`, categoria.descripcion, {
    indexable: true,
  });
}

/** Landing de problema — contenido de valor, indexable. */
export function metadataProblema(problema: Problema): Metadata {
  return construirMetadata(`${problema.titulo}: las mejores herramientas para tu empresa`, problema.descripcion, {
    indexable: true,
  });
}

/**
 * Páginas de flujo (cuestionario, comparador, recomendación, salida al
 * proveedor — las 3 puertas de entrada): un cascarón que solo cobra
 * sentido con `sessionStorage` en el navegador, nunca contenido estático
 * real que merezca aparecer en resultados de búsqueda — siempre
 * `noindex, follow` (ver ATLAS.md, Generador de Contenido). `follow: true`
 * para que Google siga rastreando los enlaces que contienen (por ejemplo,
 * hacia fichas de herramienta) aunque la propia página de flujo no se
 * indexe.
 */
export function metadataFlujo(titulo: string, descripcion: string): Metadata {
  return construirMetadata(titulo, descripcion, { indexable: false });
}
