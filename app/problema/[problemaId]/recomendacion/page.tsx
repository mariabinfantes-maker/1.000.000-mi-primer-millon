import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProblema, getProblemas } from "@/data/repositorio";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import PantallaRecomendacion from "@/components/PantallaRecomendacion";

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
  return metadataFlujo(`Tu recomendación: ${problema.titulo}`, problema.descripcion);
}

export default async function RecomendacionPage({
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
    rutaBase: `/problema/${problema.id}`,
  };

  return <PantallaRecomendacion origen={origen} />;
}
