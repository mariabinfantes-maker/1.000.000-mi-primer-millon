import type { MetadataRoute } from "next";
import { generarEntradasSitemap } from "@/agents/atlas-generador-contenido/sitemap";
import { URL_BASE } from "@/lib/urlBase";

export default function sitemap(): MetadataRoute.Sitemap {
  return generarEntradasSitemap().map((entrada) => ({
    url: `${URL_BASE}${entrada.ruta}`,
    priority: entrada.prioridad,
    ...(entrada.ultimaModificacion ? { lastModified: entrada.ultimaModificacion } : {}),
  }));
}
