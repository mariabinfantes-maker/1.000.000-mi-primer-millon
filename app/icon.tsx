import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon generado a partir del mismo símbolo de marca que usa la
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
          background: "#4f3fe0",
          display: "flex",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <path d="M16 5 L27 16 L16 16 Z" fill="#ffffff" fillOpacity={0.92} />
          <path d="M16 16 L27 16 L16 27 Z" fill="#ffffff" fillOpacity={0.55} />
          <path d="M16 16 L16 27 L5 16 Z" fill="#c99a3d" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
