import { notFound } from "next/navigation";
import { Plus, Minus, ArrowUpRight, Sparkles } from "lucide-react";
import { getCategoria, problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Valoracion from "@/components/Valoracion";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import MigaProblema from "@/components/ui/MigaProblema";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import Boton from "@/components/ui/Boton";

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

      <EnlaceAtras href={`/problema/${problema.id}`}>Elegir otra categoría</EnlaceAtras>

      <div className="mt-4 max-w-2xl">
        <MigaProblema problemaId={problema.id} titulo={problema.titulo} extra={categoria.nombre} />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Compara las mejores herramientas
        </h1>
        <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
          {categoria.descripcion}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {categoria.herramientas.map((herramienta) => {
          const recomendada = herramienta.id === mejorValorada.id;
          return (
            <Tarjeta key={herramienta.id} destacada={recomendada} className="flex flex-col">
              {recomendada && (
                <Etiqueta variante="marca" className="mb-3">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  Recomendada por Atlas
                </Etiqueta>
              )}

              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">
                  {herramienta.nombre}
                </h2>
                <Valoracion valor={herramienta.valoracion} />
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
                        <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
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
                        <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden="true" />
                        <span>{contra}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Boton href={herramienta.url} externo className="mt-6 w-full">
                Ir a la web oficial
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Boton>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
