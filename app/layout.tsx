import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { DESCRIPCION_ATLAS, TITULO_ATLAS } from "@/agents/atlas-generador-contenido/metadatos";

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
  title: { default: TITULO_ATLAS, template: "%s | Molnip" },
  description: DESCRIPCION_ATLAS,
  openGraph: {
    title: TITULO_ATLAS,
    description: DESCRIPCION_ATLAS,
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary",
    title: TITULO_ATLAS,
    description: DESCRIPCION_ATLAS,
  },
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
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          Molnip — recomendaciones independientes de tecnología para empresas
        </footer>
      </body>
    </html>
  );
}
