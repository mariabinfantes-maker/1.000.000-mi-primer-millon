import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import ChromePublico from "@/components/ChromePublico";
import RecuperacionDeVersion from "@/components/RecuperacionDeVersion";
import { DESCRIPCION_ATLAS, TITULO_ATLAS } from "@/agents/atlas-generador-contenido/metadatos";
import { URL_BASE } from "@/lib/urlBase";

/**
 * Sistema tipográfico de Molnip (ver la guía de Dirección de Arte, fase 0):
 * una display con carácter propio solo para titulares, una cuerpo/interfaz
 * cálida y legible, y una mono para cifras y datos verificados
 * (Puntuación Molnip, precios). Sustituye a Geist Sans/Mono, la pareja por
 * defecto de cualquier proyecto Next.js sin tocar.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plexmono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  // Sin esto, Next.js resuelve las URLs relativas de openGraph/twitter
  // (como la de `opengraph-image.tsx`) contra "localhost" incluso en
  // producción — el enlace resultante no cargaría en ninguna plataforma
  // externa. Misma fuente de verdad que sitemap.ts/robots.ts
  // (`NEXT_PUBLIC_SITE_URL`, ver lib/urlBase.ts) para no hardcodear el
  // dominio en dos sitios distintos.
  metadataBase: new URL(URL_BASE),
  title: { default: TITULO_ATLAS, template: "%s | Molnip" },
  description: DESCRIPCION_ATLAS,
  openGraph: {
    title: TITULO_ATLAS,
    description: DESCRIPCION_ATLAS,
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_ATLAS,
    description: DESCRIPCION_ATLAS,
  },
};

// Tinta la barra de direcciones del navegador móvil con el índigo de marca
// en vez de dejarla en blanco por defecto.
export const viewport: Viewport = {
  themeColor: "#6e5fe4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${manrope.variable} ${plexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <ChromePublico>{children}</ChromePublico>
        {/* No pinta nada mientras todo va bien: solo vigila que el navegador
            no se haya quedado con una versión antigua de la web. */}
        <RecuperacionDeVersion />
      </body>
    </html>
  );
}
