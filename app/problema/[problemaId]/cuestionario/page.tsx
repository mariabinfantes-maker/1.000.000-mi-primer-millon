import { notFound } from "next/navigation";
import { getProblema, problemas } from "@/lib/data";
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

  return <Cuestionario problema={problema} />;
}
