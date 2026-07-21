import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Award,
  CheckCircle2,
} from "lucide-react";
import { problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Etiqueta from "@/components/ui/Etiqueta";
import IconoProblema from "@/components/ui/IconoProblema";
import IlustracionHero from "@/components/ui/IlustracionHero";
import Boton from "@/components/ui/Boton";

const PASOS_COMO_FUNCIONA = [
  {
    icono: ClipboardList,
    titulo: "Describe tu problema",
    descripcion: "Cuéntanos, en pocas palabras, qué quieres mejorar en tu empresa.",
  },
  {
    icono: Sparkles,
    titulo: "Atlas analiza tus necesidades",
    descripcion: "Cruzamos tus respuestas con un catálogo curado de herramientas reales.",
  },
  {
    icono: Award,
    titulo: "Recibe la mejor herramienta",
    descripcion: "Una recomendación clara y personalizada, lista para poner en marcha.",
  },
];

const SENALES_DE_CONFIANZA = [
  "Recomendaciones objetivas",
  "Comparación rápida",
  "Sin publicidad invasiva",
  "Ahorra horas de investigación",
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="fondo-puntos pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-0 -top-32 flex justify-center"
          aria-hidden="true"
        >
          <div className="h-[420px] w-[820px] rounded-full bg-brand-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <Etiqueta variante="marca">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Asesor tecnológico, no un directorio
              </Etiqueta>
            </div>

            <h1 className="mx-auto mt-6 max-w-xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:mx-0">
              Deja de adivinar qué herramienta
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                {" "}
                necesita tu empresa
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0">
              Atlas analiza tu negocio y te recomienda la tecnología exacta
              para resolver tu problema, sin listas interminables ni sesgos
              publicitarios.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Boton href="#elige-problema" tamano="grande">
                Empezar diagnóstico gratuito
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Boton>
              <Boton href="#como-funciona" variante="fantasma" tamano="grande">
                Ver cómo funciona
              </Boton>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <IlustracionHero className="w-full" />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              De la duda a la decisión, en tres pasos
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {PASOS_COMO_FUNCIONA.map((paso, i) => (
              <div key={paso.titulo} className="relative text-center sm:text-left">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-premium ring-1 ring-brand-100 sm:mx-0">
                  <paso.icono className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="mt-5 text-sm font-semibold text-brand-600">Paso {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {paso.descripcion}
                </p>

                {i < PASOS_COMO_FUNCIONA.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-7 hidden h-5 w-5 text-slate-300 sm:block"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:grid-cols-2 sm:p-10 lg:grid-cols-4">
            {SENALES_DE_CONFIANZA.map((texto) => (
              <div key={texto} className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-700">{texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selección de problema */}
      <section id="elige-problema" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <Pasos pasoActual={1} />

          <div className="mt-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Empieza aquí
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ¿Qué quieres mejorar en tu empresa?
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {problemas.map((problema) => (
              <Link
                key={problema.id}
                href={`/problema/${problema.id}/cuestionario`}
                className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-premium-lg"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
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
        </div>
      </section>
    </div>
  );
}
