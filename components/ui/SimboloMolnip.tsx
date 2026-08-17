/**
 * Símbolo de marca de Molnip ("Prisma" — ver la guía de Dirección de
 * Arte / Sistema Prisma): un cristal de seis caras visto desde arriba,
 * cortado desde un punto descentrado — nunca perfectamente simétrico,
 * como un diamante real. Cada cara es una opción evaluada; la más
 * pequeña, la que mejor recoge la luz, se ilumina en dorado. Un objeto,
 * varias caras, una que destaca — la misma idea que el producto: mirar
 * un catálogo entero y señalar una opción con confianza. Deliberadamente
 * geométrico y simple para funcionar igual de bien como favicon de 16px
 * que como marca grande (nunca cerebros, robots, chips, circuitos,
 * engranajes, bombillas ni checks).
 *
 * Un solo componente para toda la web (cabecera, favicon, estados de
 * carga) — nunca redibujado a mano en cada sitio donde aparezca.
 */
export default function SimboloMolnip({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="Símbolo de Molnip">
      <rect width="64" height="64" rx="18" className="fill-brand-600" />
      <polygon points="36,26 32,8 52.78,20" className="fill-gold-500" />
      <polygon points="36,26 52.78,20 52.78,44" fill="#ffffff" fillOpacity="0.85" />
      <polygon points="36,26 52.78,44 32,56" fill="#ffffff" fillOpacity="0.55" />
      <polygon points="36,26 32,56 11.22,44" fill="#ffffff" fillOpacity="0.3" />
      <polygon points="36,26 11.22,44 11.22,20" fill="#ffffff" fillOpacity="0.55" />
      <polygon points="36,26 11.22,20 32,8" fill="#ffffff" fillOpacity="0.85" />
    </svg>
  );
}
