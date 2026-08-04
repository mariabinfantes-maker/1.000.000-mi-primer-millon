import type { Metadata } from "next";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import PantallaRecomendacion from "@/components/PantallaRecomendacion";

const ORIGEN_LIBRE: OrigenDiagnostico = {
  tipo: "libre",
  id: "libre",
  titulo: "Tu diagnóstico",
  rutaBase: "/libre",
};

export const metadata: Metadata = metadataFlujo("Tu recomendación", "Tu recomendación personalizada de Atlas.");

export default function RecomendacionLibrePage() {
  return <PantallaRecomendacion origen={ORIGEN_LIBRE} />;
}
