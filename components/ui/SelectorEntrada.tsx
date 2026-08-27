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

const PUERTAS: {
  id: Puerta;
  Icono: typeof Target;
  titulo: string;
  descripcion: string;
  boton: string;
  etiqueta?: string;
}[] = [
  {
    id: "objetivo",
    Icono: Target,
    titulo: "Tengo un objetivo",
    descripcion:
      "Quiero ahorrar tiempo, organizarme mejor, vender más o resolver un problema concreto.",
    boton: "Empezar por objetivo",
  },
  {
    id: "categoria",
    Icono: LayoutGrid,
    titulo: "Sé qué herramienta busco",
    descripcion: "Quiero explorar una categoría como reservas, facturación, CRM o automatización.",
    boton: "Explorar por categoría",
  },
  {
    id: "libre",
    Icono: MessageCircle,
    titulo: "Prefiero explicarlo con mis palabras",
    descripcion: "Cuéntale a Molnip lo que necesitas sin formularios complicados.",
    boton: "Contárselo a Molnip",
    etiqueta: "La forma más fácil",
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
  const botonesRef = useRef<Record<Puerta, HTMLButtonElement | null>>({
    objetivo: null,
    categoria: null,
    libre: null,
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const esLaPrimeraVez = useRef(true);
  // Cuenta cada activación, no solo los cambios: tocar la puerta que ya está
  // activa también tiene que enseñarte lo que abre. Si no, quien toca
  // "Empezar por objetivo" —que viene activa de fábrica— no ve moverse nada
  // y concluye, con razón, que la tarjeta no funciona.
  const [activaciones, setActivaciones] = useState(0);

  function activar(puerta: Puerta) {
    setPuertaActiva(puerta);
    setActivaciones((n) => n + 1);
  }

  // En una pantalla ancha las tres puertas van en fila y lo que abren cae
  // justo debajo, a la vista. En un móvil van apiladas, así que el contenido
  // queda por debajo de las tres tarjetas: se toca una puerta y, desde donde
  // está mirando la persona, no pasa nada.
  //
  // Pasó de verdad el 2026-08-27: "esas tres tarjetas no están desplegando
  // nada". No estaban rotas — estaban fuera de la pantalla.
  //
  // Así que, al cambiar de puerta, se trae el contenido a la vista. Solo si
  // hace falta: si ya se ve, no se mueve nada, para no dar un salto molesto
  // a quien lo tenía delante.
  useEffect(() => {
    if (esLaPrimeraVez.current) {
      esLaPrimeraVez.current = false;
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;

    const caja = panel.getBoundingClientRect();
    const alturaVisible = Math.max(0, Math.min(caja.bottom, window.innerHeight) - Math.max(caja.top, 0));
    const suficiente = Math.min(caja.height, window.innerHeight * 0.6);
    if (alturaVisible >= suficiente) return;

    const sinAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ block: "start", behavior: sinAnimacion ? "auto" : "smooth" });
  }, [puertaActiva, activaciones]);

  // Patrón ARIA de tabs con activación automática: las flechas mueven el
  // foco Y seleccionan a la vez (como las pestañas nativas del navegador),
  // con salto circular en los extremos — antes solo funcionaba con
  // Tab+Intro, lo que rompía la expectativa de cualquiera navegando por
  // teclado o con lector de pantalla sobre un `role="tablist"`.
  function alPulsarTecla(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    let siguiente: number | null = null;
    if (evento.key === "ArrowRight" || evento.key === "ArrowDown") {
      siguiente = (indice + 1) % PUERTAS.length;
    } else if (evento.key === "ArrowLeft" || evento.key === "ArrowUp") {
      siguiente = (indice - 1 + PUERTAS.length) % PUERTAS.length;
    } else if (evento.key === "Home") {
      siguiente = 0;
    } else if (evento.key === "End") {
      siguiente = PUERTAS.length - 1;
    }

    if (siguiente === null) return;
    evento.preventDefault();
    const puerta = PUERTAS[siguiente];
    activar(puerta.id);
    botonesRef.current[puerta.id]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Cómo quieres empezar" className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PUERTAS.map((puerta, indice) => {
          const activa = puerta.id === puertaActiva;
          return (
            <div
              key={puerta.id}
              className={`relative flex h-full flex-col gap-3 rounded-2xl border bg-white p-6 ring-1 transition ${
                activa
                  ? "border-brand-300 shadow-premium ring-brand-100"
                  : "border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-black/[0.02]"
              }`}
            >
              {puerta.etiqueta && (
                <span className="absolute -top-3 left-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-premium">
                  {puerta.etiqueta}
                </span>
              )}
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <puerta.Icono className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="font-display text-lg font-bold text-slate-900">{puerta.titulo}</h3>
              <p className="flex-1 text-sm leading-relaxed text-slate-600">{puerta.descripcion}</p>
              <button
                ref={(el) => {
                  botonesRef.current[puerta.id] = el;
                }}
                type="button"
                role="tab"
                id={`puerta-tab-${puerta.id}`}
                aria-selected={activa}
                aria-controls={`puerta-panel-${puerta.id}`}
                tabIndex={activa ? 0 : -1}
                onClick={() => activar(puerta.id)}
                onKeyDown={(evento) => alPulsarTecla(evento, indice)}
                className={`mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activa
                    ? "bg-brand-600 text-white shadow-premium hover:bg-brand-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {puerta.boton}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={`puerta-panel-${puertaActiva}`}
        aria-labelledby={`puerta-tab-${puertaActiva}`}
        tabIndex={0}
        // `scroll-mt-24` deja hueco para la cabecera pegada arriba: sin eso,
        // el contenido se colocaría justo debajo de ella y quedaría tapado.
        className="mt-8 scroll-mt-24"
      >
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
            <span className="mt-1 block text-sm leading-relaxed text-slate-600">
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
            <span className="mt-1 block text-sm leading-relaxed text-slate-600">
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
