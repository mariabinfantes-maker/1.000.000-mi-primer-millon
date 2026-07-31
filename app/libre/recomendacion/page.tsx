import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import PantallaRecomendacion from "@/components/PantallaRecomendacion";

const ORIGEN_LIBRE: OrigenDiagnostico = {
  tipo: "libre",
  id: "libre",
  titulo: "Tu diagnóstico",
  rutaBase: "/libre",
};

export default function RecomendacionLibrePage() {
  return <PantallaRecomendacion origen={ORIGEN_LIBRE} />;
}
