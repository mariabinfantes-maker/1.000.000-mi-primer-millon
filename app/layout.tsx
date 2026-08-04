import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { DESCRIPCION_ATLAS, TITULO_ATLAS } from "@/agents/atlas-generador-contenido/metadatos";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: TITULO_ATLAS, template: "%s | Atlas" },
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
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          Atlas — recomendaciones independientes de tecnología para empresas
        </footer>
      </body>
    </html>
  );
}
