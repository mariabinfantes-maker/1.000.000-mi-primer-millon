import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import PantallaComparador from "@/components/PantallaComparador";

const ORIGEN_LIBRE: OrigenDiagnostico = {
  tipo: "libre",
  id: "libre",
  titulo: "Tu diagnóstico",
  rutaBase: "/libre",
};

export default function ComparadorLibrePage() {
  return <PantallaComparador origen={ORIGEN_LIBRE} />;
}
