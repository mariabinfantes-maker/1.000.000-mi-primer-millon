import { ImageResponse } from "next/og";

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
          background: "#6e5fe4",
          display: "flex",
        }}
      >
        <svg width="512" height="512" viewBox="0 0 64 64">
          <polygon points="36,26 32,8 52.78,20" fill="#c99a3d" />
          <polygon points="36,26 52.78,20 52.78,44" fill="#ffffff" fillOpacity={0.85} />
          <polygon points="36,26 52.78,44 32,56" fill="#ffffff" fillOpacity={0.55} />
          <polygon points="36,26 32,56 11.22,44" fill="#ffffff" fillOpacity={0.3} />
          <polygon points="36,26 11.22,44 11.22,20" fill="#ffffff" fillOpacity={0.55} />
          <polygon points="36,26 11.22,20 32,8" fill="#ffffff" fillOpacity={0.85} />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
