import type { MetadataRoute } from "next";
import { URL_BASE } from "@/lib/urlBase";

/**
 * No usa `disallow` para las páginas de flujo (cuestionario, comparar de
 * sesión, recomendación, ir): ya llevan `noindex` en su metadata (ver
 * agents/atlas-generador-contenido/metadatos.ts). Bloquear su rastreo
 * aquí sería contraproducente — Google nunca llegaría a ver esa etiqueta
 * `noindex`, que es la forma correcta de pedir que no se indexen sin
 * impedir que se rastreen los enlaces que contienen.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${URL_BASE}/sitemap.xml`,
  };
}
