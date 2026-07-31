import { notFound } from "next/navigation";
import { getCategoria, getCategorias } from "@/data/repositorio";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import PantallaRecomendacion from "@/components/PantallaRecomendacion";

export function generateStaticParams() {
  return getCategorias().map((c) => ({ categoriaId: c.id }));
}

export default async function RecomendacionCategoriaPage({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}) {
  const { categoriaId } = await params;
  const categoria = getCategoria(categoriaId);

  if (!categoria) notFound();

  const origen: OrigenDiagnostico = {
    tipo: "categoria",
    id: categoria.id,
    titulo: categoria.nombre,
    rutaBase: `/categoria/${categoria.id}`,
  };

  return <PantallaRecomendacion origen={origen} />;
}
