import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProblema, problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import MigaProblema from "@/components/ui/MigaProblema";

export function generateStaticParams() {
  return problemas.map((p) => ({ problemaId: p.id }));
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ problemaId: string }>;
}) {
  const { problemaId } = await params;
  const problema = getProblema(problemaId);

  if (!problema) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={2} />

      <EnlaceAtras href="/">Elegir otro problema</EnlaceAtras>

      <div className="mt-4 max-w-2xl">
        <MigaProblema problemaId={problema.id} titulo={problema.titulo} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          ¿En qué área quieres actuar?
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
          Elige una categoría para ver las herramientas mejor valoradas.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {problema.categorias.map((categoria) => (
          <Link
            key={categoria.id}
            href={`/problema/${problema.id}/${categoria.id}`}
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                {categoria.nombre}
              </span>
              <ChevronRight
                className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                aria-hidden="true"
              />
            </div>
            <span className="text-sm leading-relaxed text-slate-500">
              {categoria.descripcion}
            </span>
            <span className="mt-2 text-xs font-medium text-slate-400">
              {categoria.herramientas.length} herramientas comparadas
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
