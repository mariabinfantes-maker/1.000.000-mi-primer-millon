import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Etiqueta from "@/components/ui/Etiqueta";
import IconoProblema from "@/components/ui/IconoProblema";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={1} />

      <div className="mt-8 max-w-2xl">
        <Etiqueta variante="marca">Asesor de tecnología para empresas</Etiqueta>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          ¿Qué quieres mejorar en tu empresa?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
          Elige tu problema y Atlas te recomendará las mejores herramientas
          para resolverlo. Compara opciones y ve directo al proveedor en
          menos de un minuto.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {problemas.map((problema) => (
          <Link
            key={problema.id}
            href={`/problema/${problema.id}/cuestionario`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
              <IconoProblema problemaId={problema.id} />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-semibold text-slate-900 group-hover:text-brand-700">
                {problema.titulo}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                {problema.descripcion}
              </span>
            </span>
            <ChevronRight
              className="mt-2 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
