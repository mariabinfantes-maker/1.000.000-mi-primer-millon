import type { Metadata } from "next";
import AsesorPrueba from "./AsesorPrueba";

export const metadata: Metadata = {
  title: "Asesor (prueba) · Molnip",
  robots: { index: false, follow: false },
};

/** Versión de prueba. No enlazada desde la web: se entra escribiendo /asesor. */
export default function Pagina() {
  return <AsesorPrueba />;
}
