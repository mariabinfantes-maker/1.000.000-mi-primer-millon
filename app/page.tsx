import Link from "next/link";
import { problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={1} />

      <div className="mt-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          ¿Qué quieres mejorar en tu empresa?
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Elige tu problema y Atlas te recomendará las mejores herramientas
          para resolverlo. Compara opciones y ve directo al proveedor en
          menos de un minuto.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {problemas.map((problema) => (
          <Link
            key={problema.id}
            href={`/problema/${problema.id}`}
            className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
          >
            <span className="text-3xl">{problema.icono}</span>
            <span>
              <span className="block text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
                {problema.titulo}
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {problema.descripcion}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
