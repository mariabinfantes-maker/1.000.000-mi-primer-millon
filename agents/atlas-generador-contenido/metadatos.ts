import type { Metadata } from "next";
import type { Categoria, Herramienta, Post, Problema } from "@/data/esquema";
import { URL_BASE } from "@/lib/urlBase";
import { slugComparacion } from "./comparaciones";

/**
 * Único punto de construcción de metadata pública de Atlas — título,
 * descripción, Open Graph y Twitter Card comparten siempre el mismo
 * patrón; ninguna ruta debería repetirlo a mano.
 *
 * `app/layout.tsx` reutiliza `TITULO_ATLAS`/`DESCRIPCION_ATLAS` como
 * plantilla por defecto (`title.template`), así que cada página solo
 * necesita indicar su propio título, nunca el sufijo "| Atlas".
 */

export const TITULO_ATLAS = "Molnip — El asesor que recomienda la herramienta exacta para tu empresa";
export const DESCRIPCION_ATLAS =
  "Molnip es un asesor inteligente, no un directorio de software. Describe tu problema y te recomendamos la tecnología exacta para resolverlo, sin listas interminables ni sesgos publicitarios.";

function construirMetadata(
  titulo: string,
  descripcion: string,
  opciones: { indexable: boolean; ruta?: string }
): Metadata {
  // `title` se queda como texto plano: el layout raíz ya añade " | Atlas"
  // mediante `title.template`. openGraph/twitter no heredan esa plantilla
  // (las leen plataformas externas, no el <title> del documento), así que
  // llevan el sufijo explícito para no aparecer sin marca en una vista previa.
  const tituloCompleto = `${titulo} | Molnip`;
  // `opengraph-image.tsx` solo se adjunta automáticamente a la ruta raíz;
  // cada página con su propio `openGraph` necesita indicar la imagen a
  // mano para que las vistas previas (WhatsApp, Slack, X...) no salgan en
  // blanco. Una sola imagen de marca para todo el sitio por ahora — nunca
  // una por herramienta, para no prometer una miniatura personalizada que
  // el catálogo no tiene.
  const imagenSocial = [{ url: "/opengraph-image", width: 1200, height: 630 }];
  return {
    title: titulo,
    description: descripcion,
    // Misma ruta que ya calcula cada llamante para su propia página: sin
    // canonical explícito, cualquier forma alternativa de llegar al mismo
    // contenido (parámetros de query, mayúsculas, trailing slash) queda sin
    // señal de cuál es la versión "real" para Google. Las páginas de flujo
    // (`metadataFlujo`, sin `ruta`) no lo necesitan: ya son `noindex`, así
    // que no hay nada que consolidar.
    ...(opciones.ruta ? { alternates: { canonical: `${URL_BASE}${opciones.ruta}` } } : {}),
    openGraph: {
      title: tituloCompleto,
      description: descripcion,
      type: "website",
      locale: "es_ES",
      images: imagenSocial,
    },
    twitter: { card: "summary_large_image", title: tituloCompleto, description: descripcion, images: imagenSocial },
    ...(opciones.indexable ? {} : { robots: { index: false, follow: true } }),
  };
}

/** Ficha de herramienta — contenido de valor, indexable. */
export function metadataHerramienta(herramienta: Herramienta): Metadata {
  return construirMetadata(`${herramienta.nombre}: precio, ventajas y alternativas`, herramienta.descripcion, {
    indexable: true,
    ruta: `/herramienta/${herramienta.id}`,
  });
}

/** Landing de categoría — contenido de valor, indexable. */
export function metadataCategoria(categoria: Categoria): Metadata {
  return construirMetadata(`${categoria.nombre}: comparativa y mejores opciones`, categoria.descripcion, {
    indexable: true,
    ruta: `/categoria/${categoria.id}`,
  });
}

/** Landing de problema — contenido de valor, indexable. */
export function metadataProblema(problema: Problema): Metadata {
  return construirMetadata(`${problema.titulo}: las mejores herramientas para tu empresa`, problema.descripcion, {
    indexable: true,
    ruta: `/problema/${problema.id}`,
  });
}

/** Página de comparación par a par — contenido de valor, indexable. */
export function metadataComparacion(a: Herramienta, b: Herramienta): Metadata {
  return construirMetadata(
    `${a.nombre} vs ${b.nombre}: comparativa`,
    `Compara ${a.nombre} y ${b.nombre} criterio a criterio: precio, facilidad de uso, funciones e integraciones.`,
    { indexable: true, ruta: `/comparar/${slugComparacion(a.id, b.id)}` }
  );
}

/** Página "alternativas a X" — contenido de valor, indexable. */
export function metadataAlternativas(herramienta: Herramienta): Metadata {
  return construirMetadata(
    `Alternativas a ${herramienta.nombre}`,
    `Otras opciones a ${herramienta.nombre} en la misma categoría, comparadas por Molnip.`,
    { indexable: true, ruta: `/herramienta/${herramienta.id}/alternativas` }
  );
}

/** Índice del blog — contenido de valor, indexable. */
export function metadataBlog(): Metadata {
  return construirMetadata(
    "Blog de Molnip: guías para elegir software empresarial",
    "Análisis y guías para decidir entre herramientas y plataformas todo en uno, escritas por el mismo equipo que investiga cada ficha del catálogo.",
    { indexable: true, ruta: "/blog" }
  );
}

/** Artículo del blog — contenido de valor, indexable. */
export function metadataPost(post: Post): Metadata {
  return construirMetadata(post.titulo, post.resumen, { indexable: true, ruta: `/blog/${post.id}` });
}

/** Página "Cómo trabaja Molnip" — contenido de valor, indexable; antes heredaba el título/descripción del home sin distinguirse de la portada. */
export function metadataAgentes(): Metadata {
  return construirMetadata(
    "Cómo trabaja Molnip: los tres agentes detrás de cada recomendación",
    "Researcher, Evaluador y Recomendador — cómo colabora cada uno para llegar a una recomendación objetiva, sin caja negra.",
    { indexable: true, ruta: "/agentes" }
  );
}

/** Página "Sobre Molnip" — misión, metodología y modelo de negocio. Contenido de valor, indexable. */
export function metadataSobre(): Metadata {
  return construirMetadata(
    "Sobre Molnip: nuestra misión y cómo evaluamos cada herramienta",
    "Quiénes somos, cómo evaluamos el software que recomendamos y por qué nuestro modelo de afiliación nunca cambia lo que te recomendamos.",
    { indexable: true, ruta: "/sobre" }
  );
}

/**
 * Páginas legales — indexables a propósito (identificar al titular del
 * sitio y las condiciones de uso es parte de lo que un visitante o un
 * buscador esperaría poder encontrar, no algo que ocultar).
 */
export function metadataAvisoLegal(): Metadata {
  return construirMetadata("Aviso legal", "Identificación del titular de Molnip y condiciones de acceso al sitio.", {
    indexable: true,
    ruta: "/aviso-legal",
  });
}

export function metadataPrivacidad(): Metadata {
  return construirMetadata(
    "Política de privacidad",
    "Qué datos trata Molnip, con qué finalidad, y cómo ejercer tus derechos de protección de datos.",
    { indexable: true, ruta: "/privacidad" }
  );
}

export function metadataCookies(): Metadata {
  return construirMetadata("Política de cookies", "Qué cookies y tecnologías de almacenamiento usa Molnip — hoy, ninguna no esencial.", {
    indexable: true,
    ruta: "/cookies",
  });
}

export function metadataTerminos(): Metadata {
  return construirMetadata(
    "Términos y condiciones",
    "Condiciones de uso de Molnip: naturaleza de las recomendaciones, modelo de afiliación y responsabilidad.",
    { indexable: true, ruta: "/terminos" }
  );
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
