import type { Metadata } from "next";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import PantallaComparador from "@/components/PantallaComparador";

const ORIGEN_LIBRE: OrigenDiagnostico = {
  tipo: "libre",
  id: "libre",
  titulo: "Tu diagnóstico",
  rutaBase: "/libre",
};

export const metadata: Metadata = metadataFlujo("Comparar herramientas", "Compara las herramientas de tu diagnóstico.");

export default function ComparadorLibrePage() {
  return <PantallaComparador origen={ORIGEN_LIBRE} />;
}
