import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoria, getCategorias } from "@/data/repositorio";
import { esCategoriaPublica, subtipoDeCategoria } from "@/data/taxonomia";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import Cuestionario from "@/components/Cuestionario";

export function generateStaticParams() {
  return getCategorias().map((c) => ({ categoriaId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}): Promise<Metadata> {
  const { categoriaId } = await params;
  const categoria = getCategoria(categoriaId);
  if (!categoria) return {};
  return metadataFlujo(`Cuestionario: ${categoria.nombre}`, categoria.descripcion);
}

export default async function CuestionarioCategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoriaId: string }>;
  searchParams: Promise<{ subtipo?: string }>;
}) {
  const { categoriaId } = await params;
  const { subtipo } = await searchParams;
  const categoria = getCategoria(categoriaId);

  // Una categoría todavía "pendiente" existe solo para el catálogo interno
  // y para Curator: nunca debe tener página pública ni puerta de cuestionario.
  if (!categoria || !esCategoriaPublica(categoria)) notFound();

  const origen: OrigenDiagnostico = {
    tipo: "categoria",
    id: categoria.id,
    titulo: categoria.nombre,
    descripcion: categoria.descripcion,
    categoriaIdPrefill: categoria.id,
    rutaBase: `/categoria/${categoria.id}`,
  };

  // El subtipo llega por parámetro y se valida contra la TAXONOMÍA: tiene que
  // ser un subtipo declarado de esta categoría concreta. Cualquier otro valor
  // se ignora en silencio, así que nadie puede colar un filtro por la
  // dirección ni provocar una lista vacía escribiendo cualquier cosa.
  //
  // Antes la condición era tener una pregunta de diferenciación declarada, y
  // eso descartaba cuatro de los seis subtipos de "IA y productividad": el
  // parámetro se tiraba y el motor recomendaba sobre la categoría entera.
  // Tenía sentido mientras esos subtipos estaban incompletos —filtrar a dos
  // herramientas no es comparar—, pero desde que los seis cumplen
  // `MINIMO_POR_SUBTIPO` el cerrojo solo estorbaba. La pregunta de
  // diferenciación sigue siendo opcional y se muestra si existe: es una
  // pregunta de más, no el permiso para usar el subtipo.
  const subtipoValido = subtipo && subtipoDeCategoria(categoria.id, subtipo) ? subtipo : undefined;

  return <Cuestionario origen={origen} subtipoId={subtipoValido} />;
}
