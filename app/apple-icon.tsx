import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Icono de alta resolución para "Añadir a pantalla de inicio" en iOS
 * (Android usa `icon.tsx` vía `manifest.ts`). Mismo símbolo Prisma que el
 * resto de la identidad — iOS aplica su propia máscara redondeada, así
 * que este icono no lleva esquinas redondeadas ni transparencia propias.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#6e5fe4",
          display: "flex",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64">
          <polygon points="36,26 32,8 52.78,20" fill="#c99a3d" />
          <polygon points="36,26 52.78,20 52.78,44" fill="#ffffff" fillOpacity={0.85} />
          <polygon points="36,26 52.78,44 32,56" fill="#ffffff" fillOpacity={0.55} />
          <polygon points="36,26 32,56 11.22,44" fill="#ffffff" fillOpacity={0.3} />
          <polygon points="36,26 11.22,44 11.22,20" fill="#ffffff" fillOpacity={0.55} />
          <polygon points="36,26 11.22,20 32,8" fill="#ffffff" fillOpacity={0.85} />
        </svg>
      </div>
    ),
    { ...size }
  );
}
