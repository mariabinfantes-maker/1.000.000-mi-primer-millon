import type { MetadataRoute } from "next";

/**
 * Manifest básico: sobre todo para que el símbolo Prisma (no un icono
 * genérico del navegador) aparezca si alguien añade Molnip a la
 * pantalla de inicio de Android. No se pide instalación como PWA en
 * ningún sitio de la web — esto es solo la ficha que el navegador lee
 * si el usuario decide hacerlo por su cuenta.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Molnip — El asesor que recomienda la herramienta exacta para tu empresa",
    short_name: "Molnip",
    description: "Molnip analiza tu negocio y te recomienda la tecnología exacta para resolver tu problema.",
    start_url: "/",
    display: "browser",
    background_color: "#faf9fc",
    theme_color: "#4f3fe0",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
