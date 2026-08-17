"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutGrid, MessageCircle, Send, Target } from "lucide-react";
import { guardarTextoLibre } from "@/lib/textoLibreSesion";
import IconoProblema from "@/components/ui/IconoProblema";

type Puerta = "objetivo" | "categoria" | "libre";

type ProblemaResumen = { id: string; titulo: string; descripcion: string };
type CategoriaResumen = { id: string; nombre: string; descripcion: string };

const PUERTAS: { id: Puerta; etiqueta: string; Icono: typeof Target; ayuda: string }[] = [
  {
    id: "objetivo",
    etiqueta: "Por objetivo",
    Icono: Target,
    ayuda: "¿No sabes por dónde empezar? Empieza por objetivo.",
  },
  {
    id: "categoria",
    etiqueta: "Por categoría",
    Icono: LayoutGrid,
    ayuda: "Si ya sabes qué tipo de herramienta buscas, ve directo al grano.",
  },
  {
    id: "libre",
    etiqueta: "Cuéntanoslo",
    Icono: MessageCircle,
    ayuda: "Explícalo con tus palabras, como se lo dirías a un compañero.",
  },
];

const EJEMPLOS_TEXTO_LIBRE = [
  "Se me acumulan los presupuestos y pierdo horas cada semana...",
  "No doy abasto respondiendo a clientes por WhatsApp...",
  "Llevo las facturas en una hoja de cálculo y ya se me escapan cosas...",
  "Quiero dejar de perder leads porque nadie los sigue a tiempo...",
];

export default function SelectorEntrada({
  problemas,
  categorias,
}: {
  problemas: ProblemaResumen[];
  categorias: CategoriaResumen[];
}) {
  const [puertaActiva, setPuertaActiva] = useState<Puerta>("objetivo");

  return (
    <div>
      <div
        role="tablist"
        aria-label="Cómo quieres empezar"
        className="inline-flex w-full flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:w-auto sm:flex-row"
      >
        {PUERTAS.map((puerta) => {
          const activa = puerta.id === puertaActiva;
          return (
            <button
              key={puerta.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setPuertaActiva(puerta.id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activa
                  ? "bg-brand-600 text-white shadow-premium"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <puerta.Icono className="h-4 w-4" aria-hidden="true" />
              {puerta.etiqueta}
            </button>
          );
        })}
      </div>

      <p className="mt-3 min-h-5 text-sm text-slate-500">
        {PUERTAS.find((p) => p.id === puertaActiva)?.ayuda}
      </p>

      <div className="mt-6">
        {puertaActiva === "objetivo" && <PanelObjetivo problemas={problemas} />}
        {puertaActiva === "categoria" && <PanelCategoria categorias={categorias} />}
        {puertaActiva === "libre" && <PanelTextoLibre />}
      </div>
    </div>
  );
}

function PanelObjetivo({ problemas }: { problemas: ProblemaResumen[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {problemas.map((problema) => (
        <Link
          key={problema.id}
          href={`/problema/${problema.id}/cuestionario`}
          className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-premium-lg"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
            <IconoProblema problemaId={problema.id} />
          </span>
          <span className="flex-1">
            <span className="block font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">
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
  );
}

function PanelCategoria({ categorias }: { categorias: CategoriaResumen[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {categorias.map((categoria) => (
        <Link
          key={categoria.id}
          href={`/categoria/${categoria.id}/cuestionario`}
          className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02] transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-premium-lg"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100 transition group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
            <LayoutGrid className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">
              {categoria.nombre}
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-slate-500">
              {categoria.descripcion}
            </span>
            <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-600 opacity-0 transition group-hover:opacity-100">
              Empezar diagnóstico
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function PanelTextoLibre() {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [ejemploIndice, setEjemploIndice] = useState(0);
  const enviando = useRef(false);

  useEffect(() => {
    if (texto.trim().length > 0) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const intervalo = setInterval(() => {
      setEjemploIndice((i) => (i + 1) % EJEMPLOS_TEXTO_LIBRE.length);
    }, 3200);
    return () => clearInterval(intervalo);
  }, [texto]);

  function enviar() {
    if (!texto.trim() || enviando.current) return;
    enviando.current = true;
    guardarTextoLibre(texto.trim());
    router.push("/libre/cuestionario");
  }

  return (
    <form
      className="rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-black/[0.02]"
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <label htmlFor="texto-libre" className="sr-only">
        Cuéntanos tu problema
      </label>
      <textarea
        id="texto-libre"
        rows={4}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={EJEMPLOS_TEXTO_LIBRE[ejemploIndice]}
        className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
      <div className="mt-4 flex items-center justify-end">
        <button
          type="submit"
          disabled={!texto.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition hover:bg-brand-700 hover:shadow-premium-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continuar
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
