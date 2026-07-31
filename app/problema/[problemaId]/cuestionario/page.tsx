import { notFound } from "next/navigation";
import { getProblema, problemas } from "@/lib/data";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import Cuestionario from "@/components/Cuestionario";

export function generateStaticParams() {
  return problemas.map((p) => ({ problemaId: p.id }));
}

export default async function CuestionarioPage({
  params,
}: {
  params: Promise<{ problemaId: string }>;
}) {
  const { problemaId } = await params;
  const problema = getProblema(problemaId);

  if (!problema) notFound();

  const origen: OrigenDiagnostico = {
    tipo: "objetivo",
    id: problema.id,
    titulo: problema.titulo,
    descripcion: problema.descripcion,
    preguntaHerramienta: problema.preguntaHerramienta,
    rutaBase: `/problema/${problema.id}`,
  };

  return <Cuestionario origen={origen} />;
}
