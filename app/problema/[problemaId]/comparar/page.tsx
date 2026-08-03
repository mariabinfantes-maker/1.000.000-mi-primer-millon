import { notFound } from "next/navigation";
import { getProblema, getProblemas } from "@/data/repositorio";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import PantallaComparador from "@/components/PantallaComparador";

export function generateStaticParams() {
  return getProblemas().map((p) => ({ problemaId: p.id }));
}

export default async function ComparadorPage({
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

  return <PantallaComparador origen={origen} />;
}
