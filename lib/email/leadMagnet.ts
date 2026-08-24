import { URL_BASE } from "@/lib/urlBase";

/**
 * Metadatos del lead magnet (etapa 1 de captación de emails). El PDF en sí
 * vive en `public/lead-magnets/` (contenido estático, no generado en cada
 * petición) — este módulo es la única fuente de verdad de su nombre y ruta,
 * para que la plantilla de bienvenida y cualquier otro sitio que lo enlace
 * en el futuro (un formulario en el blog, por ejemplo) nunca hardcodeen la
 * URL por su cuenta.
 */
export const LEAD_MAGNET = {
  titulo: "7 preguntas antes de elegir cualquier software para tu empresa",
  archivo: "7-preguntas-antes-de-elegir-software.pdf",
} as const;

export function urlLeadMagnet(): string {
  return `${URL_BASE}/lead-magnets/${LEAD_MAGNET.archivo}`;
}
