import type { Metadata } from "next";
import TestImagenClient from "./TestImagenClient";

/**
 * Pantalla de prueba interna (ver TestImagenClient.tsx): sin enlazar desde
 * ninguna navegación, pero eso no basta para mantenerla fuera de Google —
 * un rastreo puede encontrarla igualmente. `noindex` explícito, mismo
 * patrón que las rutas de flujo (metadataFlujo).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function TestImagenPage() {
  return <TestImagenClient />;
}
