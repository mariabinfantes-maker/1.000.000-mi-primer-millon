/**
 * Símbolo de marca de Molnip ("Facet" — ver la guía de Dirección de Arte,
 * fase 0): un rombo cortado en facetas desiguales, la más pequeña en
 * dorado, capturando la luz. Un objeto, varias caras, una que destaca —
 * la misma idea que el producto: mirar un catálogo entero y señalar una
 * opción. Deliberadamente geométrico y simple para funcionar igual de
 * bien como favicon de 16px que como marca grande (nunca cerebros,
 * robots, chips, circuitos, engranajes, bombillas ni checks).
 *
 * Un solo componente para toda la web (cabecera, favicon, estados de
 * carga) — nunca redibujado a mano en cada sitio donde aparezca.
 */
export default function SimboloMolnip({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="Símbolo de Molnip">
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <path d="M16 5 L27 16 L16 16 Z" fill="#ffffff" fillOpacity="0.92" />
      <path d="M16 16 L27 16 L16 27 Z" fill="#ffffff" fillOpacity="0.55" />
      <path d="M16 16 L16 27 L5 16 Z" className="fill-gold-500" />
    </svg>
  );
}
