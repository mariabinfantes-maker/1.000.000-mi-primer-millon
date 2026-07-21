import Link from "next/link";
import { ChevronRight, Sparkles, Target, ShieldCheck, Clock } from "lucide-react";
import { problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Etiqueta from "@/components/ui/Etiqueta";
import IconoProblema from "@/components/ui/IconoProblema";

const SENALES_DE_CONFIANZA = [
  { icono: Target, texto: "Recomendación basada en tus respuestas" },
  { icono: ShieldCheck, texto: "Sin sesgos ni publicidad" },
  { icono: Clock, texto: "Menos de 60 segundos" },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 flex justify-center"
          aria-hidden="true"
        >
          <div className="h-[420px] w-[820px] rounded-full bg-brand-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16">
          <div className="flex justify-center">
            <Etiqueta variante="marca">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Asesor tecnológico, no un directorio
            </Etiqueta>
          </div>

          <h1 className="mx-auto mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Deja de adivinar qué herramienta
            <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              {" "}
              necesita tu empresa
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Atlas analiza tu negocio y te recomienda la tecnología exacta para
            resolver tu problema, sin listas interminables ni sesgos
            publicitarios.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
            {SENALES_DE_CONFIANZA.map(({ icono: Icono, texto }) => (
              <span key={texto} className="flex items-center gap-1.5">
                <Icono className="h-4 w-4 text-brand-600" aria-hidden="true" />
                {texto}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Selección de problema */}
      <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 sm:pb-24">
        <Pasos pasoActual={1} />

        <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
          ¿Qué quieres mejorar en tu empresa?
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {problemas.map((problema) => (
            <Link
              key={problema.id}
              href={`/problema/${problema.id}/cuestionario`}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-100"
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
                <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
                  Empezar diagnóstico
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
