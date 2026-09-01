import { ImageResponse } from "next/og";
import { PALETA_MOLNIP } from "@/lib/marca/paleta";

/**
 * Icono de 512×512 para el manifest — Android usa el más grande disponible
 * al añadir Molnip a la pantalla de inicio; sin este, el único candidato
 * era `apple-icon` a 180×180, que Android escala perdiendo nitidez. No es
 * una de las convenciones de archivo especiales de Next (`icon.tsx`,
 * `apple-icon.tsx`), así que es una Route Handler normal referenciada a
 * mano desde `app/manifest.ts` — mismo símbolo Prisma, mismo patrón que
 * `apple-icon.tsx`.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: PALETA_MOLNIP.brand[600],
          display: "flex",
        }}
      >
        <svg width="512" height="512" viewBox="0 0 64 64">
          <polygon points="36,26 32,8 52.78,20" fill={PALETA_MOLNIP.gold[500]} />
          <polygon points="36,26 52.78,20 52.78,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
          <polygon points="36,26 52.78,44 32,56" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
          <polygon points="36,26 32,56 11.22,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.3} />
          <polygon points="36,26 11.22,44 11.22,20" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
          <polygon points="36,26 11.22,20 32,8" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
