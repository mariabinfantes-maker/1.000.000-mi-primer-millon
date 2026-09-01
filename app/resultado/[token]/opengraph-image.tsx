import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";
import { resolverResultadoCompartido } from "@/lib/resultadoCompartido";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { PALETA_MOLNIP } from "@/lib/marca/paleta";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const bricolage = readFileSync(join(process.cwd(), "assets/fonts/bricolage-grotesque-800.ttf"));
const manrope = readFileSync(join(process.cwd(), "assets/fonts/manrope-600.ttf"));

/**
 * Tarjeta social del resultado: a diferencia de `app/opengraph-image.tsx`
 * (genérica, para toda la web), esta lleva el nombre de la herramienta
 * top y su Puntuación Molnip — para que compartir un enlace de resultado
 * en WhatsApp/Slack muestre de un vistazo qué recomienda Molnip, no una
 * tarjeta de marca sin contenido. Con token inválido, cae a la misma
 * tarjeta genérica de marca en vez de una imagen rota.
 */
export default async function OpengraphImageResultado({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resultado = resolverResultadoCompartido(token);
  const mejor = resultado?.top[0];
  const puntuacion = mejor ? calcularPuntuacionAtlas(mejor.herramienta)?.puntuacion : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(135deg, ${PALETA_MOLNIP.brand[950]} 0%, ${PALETA_MOLNIP.brand[800]} 55%, ${PALETA_MOLNIP.brand[600]} 100%)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 14, background: PALETA_MOLNIP.brand[600] }}>
            <svg width="56" height="56" viewBox="0 0 64 64">
              <polygon points="36,26 32,8 52.78,20" fill={PALETA_MOLNIP.gold[500]} />
              <polygon points="36,26 52.78,20 52.78,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
              <polygon points="36,26 52.78,44 32,56" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
              <polygon points="36,26 32,56 11.22,44" fill={PALETA_MOLNIP.blanco} fillOpacity={0.3} />
              <polygon points="36,26 11.22,44 11.22,20" fill={PALETA_MOLNIP.blanco} fillOpacity={0.55} />
              <polygon points="36,26 11.22,20 32,8" fill={PALETA_MOLNIP.blanco} fillOpacity={0.85} />
            </svg>
          </div>
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 34, fontWeight: 800, color: PALETA_MOLNIP.blanco }}>
            Molnip
          </div>
        </div>

        {mejor ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontFamily: "Manrope",
                fontSize: 28,
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
                letterSpacing: 3,
              }}
            >
              Tu recomendación
            </div>
            <div
              style={{
                marginTop: 12,
                fontFamily: "Bricolage Grotesque",
                fontSize: 76,
                fontWeight: 800,
                color: PALETA_MOLNIP.blanco,
                letterSpacing: -2,
              }}
            >
              {mejor.herramienta.nombre}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 28 }}>
              {puntuacion !== undefined && puntuacion !== null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.14)",
                    borderRadius: 999,
                    padding: "14px 28px",
                  }}
                >
                  {/*
                    Este dorado NO es el de la paleta (`gold-500` #c99a3d). Se
                    mantiene sin cambios por decisión de la propietaria del
                    2026-09-01, pendiente de una futura revisión de branding
                    de la imagen que se comparte en redes. Ver la sección 7 de
                    `brand-guidelines.md`. No copiar este valor a ningún otro
                    sitio: es el único color del proyecto fuera del sistema.
                  */}
                  <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 32, fontWeight: 800, color: "#f4c15c" }}>
                    {`${puntuacion}/100`}
                  </div>
                  <div style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                    Puntuación Molnip
                  </div>
                </div>
              )}
              {resultado && resultado.top.length > 1 && (
                <div style={{ fontFamily: "Manrope", fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                  {`+${resultado.top.length - 1} ${resultado.top.length > 2 ? "opciones" : "opción"} más`}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: "Bricolage Grotesque", fontSize: 56, fontWeight: 800, color: PALETA_MOLNIP.blanco }}>
            El asesor que encuentra tu mejor herramienta
          </div>
        )}
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
