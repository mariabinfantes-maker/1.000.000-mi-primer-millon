import type { Metadata } from "next";
import Llegadas from "./Llegadas";

/**
 * EL BANCO DE PRUEBAS DE DISEÑO — para la propietaria, no para la clienta.
 *
 * Nace de dos frases suyas del 2026-09-25 que parecen contrarias y no lo son:
 * «arriba, el cliente para empezar no tiene que elegir» y, después, «primero
 * estamos probando diseños».
 *
 * La lección: comparar versiones es trabajo NUESTRO, y por eso no puede vivir
 * en la pantalla de la clienta. Las cuatro pestañas de antes mezclaban las dos
 * cosas y por eso molestaban. Aquí se comparan; allí se entra y se escribe.
 *
 * Sin enlazar y con noindex, como el resto de la prueba.
 */
export const metadata: Metadata = { title: "Diseños · Molnip", robots: { index: false, follow: false } };

export default function DisenosPage() {
  return <Llegadas />;
}
