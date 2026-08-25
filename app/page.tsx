import {
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
import Image from "next/image";
import { getCategorias, getProblemas } from "@/data/repositorio";
import { AGENTES } from "@/lib/agentes";
import Etiqueta from "@/components/ui/Etiqueta";
import AvatarAgente from "@/components/ui/AvatarAgente";
import Boton from "@/components/ui/Boton";
import RevelarAlScroll from "@/components/ui/RevelarAlScroll";
import SelectorEntrada from "@/components/ui/SelectorEntrada";

const PASOS_COMO_FUNCIONA = [
  {
    icono: ClipboardList,
    titulo: "Describe tu problema",
    descripcion: "Cuéntanos, en pocas palabras, qué quieres mejorar en tu empresa.",
  },
  {
    icono: Sparkles,
    titulo: "Molnip analiza tus necesidades",
    descripcion: "Cruzamos tus respuestas con un catálogo curado de herramientas reales.",
  },
  {
    icono: Award,
    titulo: "Recibe la mejor herramienta",
    descripcion: "Una recomendación clara y personalizada, lista para poner en marcha.",
  },
];

// La primera señal ("Recomendaciones objetivas") declara el modelo de
// afiliación de forma visible en vez de sugerir que Atlas no cobra nada —
// ver Sheet 12 del documento de arquitectura UX, punto P0 "Declarar el
// modelo de afiliación al usuario, de forma visible".
const SENALES_DE_CONFIANZA = [
  {
    icono: Scale,
    titulo: "Recomendaciones objetivas",
    descripcion: "Cobramos comisión de los proveedores, nunca al revés: nunca cambia lo que te recomendamos ni el precio que pagas.",
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
  const categorias = getCategorias();
  const problemas = getProblemas();

  return (
    <div>
      {/* Hero — propuesta 1 (revisión en curso, ver ATLAS.md) */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "#fdfaf5" }}>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
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
              className="animar-entrada mx-auto mt-6 max-w-xl font-display font-bold leading-[1.05] tracking-tight text-slate-900 lg:mx-0"
              style={{ animationDelay: "90ms", fontSize: "clamp(1.875rem, 5vw + 1rem, 3.75rem)" }}
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
              Molnip analiza tu negocio y te recomienda la tecnología exacta para resolver tu
              problema. Por objetivo, por categoría o explicándolo con tus palabras — tú eliges
              por dónde empezar.
            </p>

            <div
              className="animar-entrada mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
              style={{ animationDelay: "270ms" }}
            >
              <Boton href="#elige-camino" tamano="grande">
                Empezar diagnóstico gratuito
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Boton>
              <Boton href="#como-funciona" variante="fantasma" tamano="grande">
                Ver cómo funciona
              </Boton>
            </div>
          </div>

          <div
            className="animar-entrada relative mx-auto h-80 w-full max-w-sm sm:h-96 lg:h-[583px] lg:max-w-none"
            style={{ animationDelay: "200ms" }}
          >
            {/* Forma orgánica de marca, CSS puro (border-radius asimétrico), detrás del recorte de la persona — degradado violeta profundo → azul eléctrico → lavanda. */}
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 h-[110%] w-[92%] -translate-x-1/2 -translate-y-1/2"
              style={{
                borderRadius: "63% 37% 41% 59% / 55% 45% 55% 45%",
                background: "linear-gradient(150deg, #2e1f7a 0%, #4f46e5 46%, #c9c2f7 100%)",
              }}
            />

            {/* La persona se recorta con la MISMA silueta orgánica que la forma
                de detrás (idéntico tamaño, posición y border-radius), en vez de
                un rectángulo — así las piernas "desaparecen" siguiendo la curva
                real del borde inferior de la forma, sin ninguna línea de corte
                recta visible dentro. */}
            <div
              className="absolute top-1/2 left-1/2 h-[110%] w-[92%] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
              style={{ borderRadius: "63% 37% 41% 59% / 55% 45% 55% 45%" }}
            >
              <Image
                src="/images/molnip-owner-final.png"
                alt="Una profesional revisando una recomendación de Molnip en su tablet"
                width={541}
                height={1531}
                priority
                unoptimized
                className="relative mx-auto mt-2 h-auto w-[66%] drop-shadow-2xl sm:w-[58%]"
              />
            </div>

            {/* Tarjeta flotante: una recomendación de software, mismo tratamiento visual que el resto del sitio (nunca datos inventados — texto genérico ilustrativo). Posición en % para que caiga cerca de la cintura sea cual sea el recorte. */}
            <div
              className="animar-flotar absolute right-0 bottom-[15%] flex items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-premium-lg backdrop-blur sm:right-4"
              style={{ animationDelay: "1.2s" }}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-400">Recomendación de Molnip</p>
                <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  Encaja con tu empresa
                </p>
              </div>
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
            <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-slate-900 sm:text-4xl">
              De la duda a la decisión, en tres pasos
            </h2>
          </RevelarAlScroll>

          <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
            {/* Línea que conecta los tres pasos, de índigo a dorado — el dorado
                marca el punto de llegada (la respuesta), igual que en el resto
                del sitio se reserva para "la opción elegida". */}
            <div
              className="absolute top-7 right-[16.5%] left-[16.5%] hidden h-px bg-gradient-to-r from-brand-200 via-brand-300 to-gold-400 sm:block"
              aria-hidden="true"
            />

            {PASOS_COMO_FUNCIONA.map((paso, i) => {
              const esUltimo = i === PASOS_COMO_FUNCIONA.length - 1;
              return (
                <RevelarAlScroll key={paso.titulo} retrasoMs={i * 120} className="relative text-center sm:text-left">
                  <span
                    className="pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 font-display text-7xl font-bold text-slate-200/80 select-none sm:left-0 sm:translate-x-0"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-premium ring-1 sm:mx-0 ${
                      esUltimo
                        ? "bg-gradient-to-br from-white to-gold-50 text-gold-600 ring-gold-200"
                        : "bg-gradient-to-br from-white to-brand-50 text-brand-600 ring-brand-100"
                    }`}
                  >
                    <paso.icono className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className={`relative mt-5 text-sm font-semibold ${esUltimo ? "text-gold-600" : "text-brand-600"}`}>
                    Paso {i + 1}
                  </p>
                  <h3 className="relative mt-1 font-display text-lg font-semibold text-slate-900">{paso.titulo}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{paso.descripcion}</p>
                </RevelarAlScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* Así piensa Atlas */}
      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <RevelarAlScroll className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Así piensa Molnip
            </p>
            <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tres agentes, un mismo objetivo: acertar por ti
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600">
              No es una caja negra. Cada recomendación pasa por tres pares de manos digitales
              distintas, y podrás ver a cada una trabajar.
            </p>
          </RevelarAlScroll>

          <div className="relative mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Línea de conexión índigo → dorado, mismo lenguaje que "Cómo
                funciona": el dorado marca dónde llega el proceso, aquí la
                recomendación final que entrega el Recomendador. */}
            <div
              className="absolute top-1/2 right-[16.5%] left-[16.5%] hidden h-px -translate-y-1/2 bg-gradient-to-r from-brand-200 via-brand-300 to-gold-400 sm:block"
              aria-hidden="true"
            />

            {AGENTES.map((agente, i) => {
              const esUltimo = i === AGENTES.length - 1;
              return (
                <RevelarAlScroll key={agente.id} retrasoMs={i * 100}>
                  <div
                    className={`relative flex h-full flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:shadow-premium ${
                      esUltimo
                        ? "border-gold-200 bg-gradient-to-b from-white to-gold-50/60"
                        : "border-slate-200/80 bg-white"
                    }`}
                  >
                    <AvatarAgente id={agente.id} tamano="grande" />
                    <h3 className="text-base font-semibold text-slate-900">{agente.nombre}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{agente.rol}</p>
                    {esUltimo && (
                      <p className="mt-1 text-xs font-semibold text-gold-600">La recomendación llega aquí</p>
                    )}
                  </div>
                </RevelarAlScroll>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Boton href="/agentes" variante="fantasma">
              Ver cómo trabaja cada agente en detalle
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Boton>
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <RevelarAlScroll className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Por qué Molnip
            </p>
            <h2 className="mt-3 text-3xl font-display font-bold tracking-tight text-slate-900 sm:text-4xl">
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

      {/* Elige tu camino: las tres puertas de entrada */}
      <section id="elige-camino" className="scroll-mt-20 border-t border-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <RevelarAlScroll className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
              Empieza aquí
            </p>
            <h2 className="mt-2 text-2xl font-display font-bold tracking-tight text-slate-900 sm:text-3xl">
              ¿Cómo quieres empezar?
            </h2>
          </RevelarAlScroll>

          <RevelarAlScroll retrasoMs={80} className="mt-8">
            <SelectorEntrada problemas={problemas} categorias={categorias} />
          </RevelarAlScroll>
        </div>
      </section>
    </div>
  );
}
