import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bricolage = readFileSync(join(process.cwd(), "assets/fonts/bricolage-grotesque-800.ttf"));
const manrope = readFileSync(join(process.cwd(), "assets/fonts/manrope-600.ttf"));

/**
 * Tarjeta social por defecto para toda la web (Next.js la aplica a
 * cualquier ruta que no defina la suya propia): el mismo símbolo Prisma
 * y wordmark de la cabecera, para que compartir un enlace de Molnip en
 * redes o chats no muestre una tarjeta en blanco. Los colores van en
 * literal porque este árbol lo renderiza `satori`, fuera del pipeline
 * normal de CSS del sitio — igual que `icon.tsx`.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #17103f 0%, #35269c 55%, #4f3fe0 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          <div
            style={{
              display: "flex",
              width: 220,
              height: 220,
              borderRadius: 48,
              background: "#4f3fe0",
              boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
            }}
          >
            <svg width="220" height="220" viewBox="0 0 64 64">
              <polygon points="36,26 32,8 52.78,20" fill="#c99a3d" />
              <polygon points="36,26 52.78,20 52.78,44" fill="#ffffff" fillOpacity={0.85} />
              <polygon points="36,26 52.78,44 32,56" fill="#ffffff" fillOpacity={0.55} />
              <polygon points="36,26 32,56 11.22,44" fill="#ffffff" fillOpacity={0.3} />
              <polygon points="36,26 11.22,44 11.22,20" fill="#ffffff" fillOpacity={0.55} />
              <polygon points="36,26 11.22,20 32,8" fill="#ffffff" fillOpacity={0.85} />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Bricolage Grotesque",
                fontSize: 108,
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: -2,
              }}
            >
              Molnip
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: "Manrope",
                fontSize: 34,
                fontWeight: 600,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              El asesor que encuentra tu mejor herramienta
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: bricolage, weight: 800, style: "normal" },
        { name: "Manrope", data: manrope, weight: 600, style: "normal" },
      ],
    }
  );
}
