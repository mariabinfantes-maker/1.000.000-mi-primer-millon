import type { Metadata } from "next";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import CuestionarioLibreClient from "./CuestionarioLibreClient";

export const metadata: Metadata = metadataFlujo("Cuestionario", "Cuéntanos tu problema y te recomendamos la tecnología exacta para resolverlo.");

export default function CuestionarioLibrePage() {
  return <CuestionarioLibreClient />;
}
