import { notFound } from "next/navigation";
import { getCategoria, getCategorias } from "@/data/repositorio";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import Cuestionario from "@/components/Cuestionario";

export function generateStaticParams() {
  return getCategorias().map((c) => ({ categoriaId: c.id }));
}

export default async function CuestionarioCategoriaPage({
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
    descripcion: categoria.descripcion,
    categoriaIdPrefill: categoria.id,
    rutaBase: `/categoria/${categoria.id}`,
  };

  return <Cuestionario origen={origen} />;
}
