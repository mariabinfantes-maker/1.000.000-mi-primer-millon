import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoria, problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Valoracion from "@/components/Valoracion";

export function generateStaticParams() {
  return problemas.flatMap((p) =>
    p.categorias.map((c) => ({ problemaId: p.id, categoriaId: c.id }))
  );
}

export default async function ComparativaPage({
  params,
}: {
  params: Promise<{ problemaId: string; categoriaId: string }>;
}) {
  const { problemaId, categoriaId } = await params;
  const datos = getCategoria(problemaId, categoriaId);

  if (!datos) notFound();
  const { problema, categoria } = datos;

  const mejorValorada = [...categoria.herramientas].sort(
    (a, b) => b.valoracion - a.valoracion
  )[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={3} />

      <Link
        href={`/problema/${problema.id}`}
        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        ← Elegir otra categoría
      </Link>

      <div className="mt-4 max-w-2xl">
        <p className="text-sm font-medium text-indigo-600">
          {problema.icono} {problema.titulo} · {categoria.nombre}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Compara las mejores herramientas
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          {categoria.descripcion}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categoria.herramientas.map((herramienta) => {
          const recomendada = herramienta.id === mejorValorada.id;
          return (
            <div
              key={herramienta.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                recomendada
                  ? "border-indigo-400 ring-1 ring-indigo-400"
                  : "border-slate-200"
              }`}
            >
              {recomendada && (
                <span className="mb-3 inline-block w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                  Recomendada por Atlas
                </span>
              )}

              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {herramienta.nombre}
                </h2>
                <Valoracion valor={herramienta.valoracion} />
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {herramienta.descripcion}
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Precio</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {herramienta.precio}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Ideal para</dt>
                  <dd className="text-right font-medium text-slate-700">
                    {herramienta.idealPara}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-medium text-emerald-700">Pros</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {herramienta.pros.map((pro) => (
                      <li key={pro} className="flex gap-2">
                        <span className="text-emerald-500">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-rose-700">Contras</p>
                  <ul className="mt-1 space-y-1 text-slate-600">
                    {herramienta.contras.map((contra) => (
                      <li key={contra} className="flex gap-2">
                        <span className="text-rose-500">−</span>
                        <span>{contra}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <a
                href={herramienta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Ir a la web oficial
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
