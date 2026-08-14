/**
 * Ilustración abstracta del hero: varias "opciones" comparándose y una
 * destacándose como la recomendada. Deliberadamente abstracta (sin
 * cerebros, robots, personas ni manos) para representar comparación
 * inteligente y toma de decisiones.
 */
export default function IlustracionHero({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 420"
      fill="none"
      className={className}
      role="img"
      aria-label="Ilustración de Molnip comparando varias herramientas y destacando la recomendada"
    >
      <defs>
        <filter id="sombraPrincipal" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#4338ca" floodOpacity="0.22" />
        </filter>
        <filter id="sombraSecundaria" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#4338ca" floodOpacity="0.10" />
        </filter>
      </defs>

      {/* Conectores punteados: las opciones convergen hacia la recomendada */}
      <path
        d="M150 130 C 190 90, 210 90, 232 100"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeDasharray="1 8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M330 145 C 290 100, 265 95, 246 100"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeDasharray="1 8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tarjeta de opción — izquierda (descartada) */}
      <g transform="translate(150,195) rotate(-11)" filter="url(#sombraSecundaria)">
        <rect x="-85" y="-105" width="170" height="210" rx="20" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <rect x="-63" y="-83" width="30" height="30" rx="9" fill="#c7d2fe" />
        <rect x="-63" y="-38" width="112" height="9" rx="4.5" fill="#c7d2fe" />
        <rect x="-63" y="-16" width="82" height="9" rx="4.5" fill="#c7d2fe" opacity="0.7" />
        <rect x="-63" y="6" width="96" height="9" rx="4.5" fill="#c7d2fe" opacity="0.7" />
      </g>

      {/* Tarjeta de opción — derecha (descartada) */}
      <g transform="translate(332,205) rotate(13)" filter="url(#sombraSecundaria)">
        <rect x="-85" y="-105" width="170" height="210" rx="20" fill="#e0e7ff" stroke="#c7d2fe" strokeWidth="1.5" />
        <rect x="-63" y="-83" width="30" height="30" rx="9" fill="#a5b4fc" />
        <rect x="-63" y="-38" width="112" height="9" rx="4.5" fill="#a5b4fc" />
        <rect x="-63" y="-16" width="70" height="9" rx="4.5" fill="#a5b4fc" opacity="0.7" />
        <rect x="-63" y="6" width="90" height="9" rx="4.5" fill="#a5b4fc" opacity="0.7" />
      </g>

      {/* Tarjeta recomendada — frente y centro */}
      <g transform="translate(240,214)" filter="url(#sombraPrincipal)">
        <rect x="-98" y="-124" width="196" height="248" rx="24" fill="#ffffff" stroke="#818cf8" strokeWidth="2" />

        <rect x="-74" y="-98" width="36" height="36" rx="11" fill="#4f46e5" />
        <path
          d="M-68 -80 l6 6 l14 -14"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        <rect x="-74" y="-40" width="132" height="11" rx="5.5" fill="#312e81" />
        <rect x="-74" y="-16" width="150" height="9" rx="4.5" fill="#94a3b8" opacity="0.8" />
        <rect x="-74" y="4" width="108" height="9" rx="4.5" fill="#94a3b8" opacity="0.8" />

        {/* Mini indicador de puntuación */}
        <rect x="-74" y="70" width="18" height="18" rx="5" fill="#4f46e5" />
        <rect x="-50" y="70" width="18" height="18" rx="5" fill="#4f46e5" />
        <rect x="-26" y="70" width="18" height="18" rx="5" fill="#4f46e5" />
        <rect x="-2" y="70" width="18" height="18" rx="5" fill="#4f46e5" />
        <rect x="22" y="70" width="18" height="18" rx="5" fill="#e0e7ff" />

        {/* Insignia de recomendado */}
        <circle cx="82" cy="-104" r="24" fill="#4f46e5" stroke="#ffffff" strokeWidth="5" />
        <path
          d="M72 -104 l7 7 l13 -15"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* Destellos de acento */}
      <circle cx="90" cy="90" r="4" fill="#818cf8" opacity="0.6" />
      <circle cx="400" cy="120" r="5" fill="#a5b4fc" opacity="0.5" />
      <circle cx="410" cy="300" r="4" fill="#818cf8" opacity="0.5" />
      <circle cx="70" cy="320" r="3.5" fill="#a5b4fc" opacity="0.5" />
    </svg>
  );
}
