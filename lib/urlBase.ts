/**
 * Dominio real de Atlas en producción, cuando exista — ver ATLAS.md,
 * sección Generador de Contenido, "Pendiente antes de lanzar". Ningún
 * dominio hardcodeado en el código: hasta que `NEXT_PUBLIC_SITE_URL` se
 * configure en el entorno de despliegue, el sitemap y robots.txt
 * seguirán apuntando a localhost — útil para desarrollo, inválido para
 * que Google lo indexe de verdad.
 */
export const URL_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
