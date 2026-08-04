import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProblema, getProblemas } from "@/data/repositorio";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import Cuestionario from "@/components/Cuestionario";

export function generateStaticParams() {
  return getProblemas().map((p) => ({ problemaId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ problemaId: string }>;
}): Promise<Metadata> {
  const { problemaId } = await params;
  const problema = getProblema(problemaId);
  if (!problema) return {};
  return metadataFlujo(`Cuestionario: ${problema.titulo}`, problema.descripcion);
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
