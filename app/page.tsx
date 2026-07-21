import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  ArrowRight,
  ClipboardList,
  Award,
  Scale,
  Zap,
  ShieldCheck,
  Timer,
  CheckCircle2,
} from "lucide-react";
import { problemas } from "@/lib/data";
import Pasos from "@/components/Pasos";
import Etiqueta from "@/components/ui/Etiqueta";
import IconoProblema from "@/components/ui/IconoProblema";
import IlustracionHero from "@/components/ui/IlustracionHero";
import Boton from "@/components/ui/Boton";
import RevelarAlScroll from "@/components/ui/RevelarAlScroll";

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
  {
    icono: Scale,
    titulo: "Recomendaciones objetivas",
    descripcion: "Sin marcas patrocinadas ni rankings pagados.",
  },
  {
    icono: Zap,
    titulo: "Comparación rápida",
    descripcion: "Todo lo que necesitas saber, en una sola pantalla.",
  },
  {
    icono: ShieldCheck,
    titulo: "Sin publicidad invasiva",
    descripcion: "Cero banners, cero pop-ups, cero ruido.",
  },
  {
    icono: Timer,
    titulo: "Ahorra horas de investigación",
    descripcion: "Analizamos el mercado por ti, no al revés.",
  },
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
            <div
              className="animar-entrada flex justify-center lg:justify-start"
              style={{ animationDelay: "0ms" }}
            >
              <Etiqueta variante="marca">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Asesor tecnológico, no un directorio
              </Etiqueta>
            </div>

            <h1
              className="animar-entrada mx-auto mt-6 max-w-xl text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:mx-0"
              style={{ animationDelay: "90ms" }}
            >
              Deja de adivinar qué herramienta
              <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                {" "}
                necesita tu empresa
              </span>
            </h1>

            <p
              className="animar-entrada mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-600 lg:mx-0"
              style={{ animationDelay: "180ms" }}
            >
              Atlas analiza tu negocio y te recomienda la tecnología exacta
              para resolver tu problema, sin listas interminables ni sesgos
              publicitarios.
            </p>

            <div
              className="animar-entrada mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              style={{ animationDelay: "270ms" }}
            >
              <Boton href="#elige-problema" tamano="grande">
                Empezar diagnóstico gratuito
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Boton>
              <Boton href="#como-funciona" variante="fantasma" tamano="grande">
                Ver cómo funciona
              </Boton>
            </div>
          </div>

          <div
            className="animar-entrada relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ animationDelay: "200ms" }}
          >
            <div className="animar-flotar">
              <IlustracionHero className="w-full" />
            </div>

            <div
              className="animar-flotar absolute -left-4 bottom-8 hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-premium backdrop-blur sm:flex"
              style={{ animationDelay: "1.2s" }}
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-700">
                Recomendación personalizada
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <RevelarAlScroll className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              De la duda a la decisión, en tres pasos
            </h2>
          </RevelarAlScroll>

          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {PASOS_COMO_FUNCIONA.map((paso, i) => (
              <RevelarAlScroll
                key={paso.titulo}
                retrasoMs={i * 120}
                className="relative text-center sm:text-left"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-brand-50 text-brand-600 shadow-premium ring-1 ring-brand-100 sm:mx-0">
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
              </RevelarAlScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <RevelarAlScroll className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Por qué Atlas
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Pensado para que confíes en la recomendación
            </h2>
          </RevelarAlScroll>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SENALES_DE_CONFIANZA.map((señal, i) => (
              <RevelarAlScroll key={señal.titulo} retrasoMs={i * 100}>
                <div className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-premium">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105">
                    <señal.icono className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">
                    {señal.titulo}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {señal.descripcion}
                  </p>
                </div>
              </RevelarAlScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Selección de problema */}
      <section id="elige-problema" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <Pasos pasoActual={1} />

          <RevelarAlScroll className="mt-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Empieza aquí
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ¿Qué quieres mejorar en tu empresa?
            </h2>
          </RevelarAlScroll>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {problemas.map((problema, i) => (
              <RevelarAlScroll key={problema.id} retrasoMs={i * 80}>
                <Link
                  href={`/problema/${problema.id}/cuestionario`}
                  className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-premium-lg"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
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
              </RevelarAlScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
