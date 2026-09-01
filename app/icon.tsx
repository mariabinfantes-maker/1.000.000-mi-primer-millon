import { ImageResponse } from "next/og";
import { PALETA_MOLNIP } from "@/lib/marca/paleta";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon generado a partir del mismo símbolo "Prisma" que usa la
 * cabecera (`components/ui/SimboloMolnip.tsx`) — no un archivo .ico
 * suelto y desincronizado del resto de la identidad visual. Los colores
 * van en literal (no como clases de Tailwind ni `var(--color-...)`)
 * porque este árbol lo renderiza `satori`, fuera del pipeline normal de
 * CSS del sitio.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: PALETA_MOLNIP.brand[600],
          display: "flex",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 64 64">
          <polygon points="36,26 32,8 52.78,20" fill={PALETA_MOLNIP.gold[500]} />
          <polygon points="36,26 52.78,20 52.78,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
          <polygon points="36,26 52.78,44 32,56" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
          <polygon points="36,26 32,56 11.22,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.3} />
          <polygon points="36,26 11.22,44 11.22,20" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
          <polygon points="36,26 11.22,20 32,8" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
        </svg>
      </div>
    ),
    { ...size }
  );
}
