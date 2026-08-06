/**
 * Escapa un valor para insertarlo de forma segura en HTML — usado por los
 * informes autocontenidos de cada agente (Researcher, Affiliate Manager,
 * Mantenimiento...) que vuelcan datos reales del catálogo en una página
 * HTML sin depender de ningún framework de plantillas.
 */
export function escaparHtml(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
