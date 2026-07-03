import Link from "next/link";
import { notFound } from "next/navigation";
import { getProblema, problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";

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

      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        ← Elegir otro problema
      </Link>

      <div className="mt-4 max-w-2xl">
        <p className="text-sm font-medium text-indigo-600">
          {problema.icono} {problema.titulo}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          ¿En qué área quieres actuar?
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Elige una categoría para ver las herramientas mejor valoradas.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {problema.categorias.map((categoria) => (
          <Link
            key={categoria.id}
            href={`/problema/${problema.id}/${categoria.id}`}
            className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <span className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
              {categoria.nombre}
            </span>
            <span className="text-sm text-slate-500">{categoria.descripcion}</span>
            <span className="mt-2 text-xs font-medium text-slate-400">
              {categoria.herramientas.length} herramientas comparadas
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
