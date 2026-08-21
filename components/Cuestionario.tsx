"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { RANGOS_EMPLEADOS, type RangoEmpleados } from "@/lib/cuestionario";
import type { RespuestasUsuario } from "@/agents/atlas-advisor";
import { PREGUNTA_HERRAMIENTA_GENERICA, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import IconoOrigen from "@/components/ui/IconoOrigen";
import Boton from "@/components/ui/Boton";
import AtlasTrabajando from "@/components/AtlasTrabajando";

type PreferenciaSuite = "todo_en_uno" | "especializada" | "sin_preferencia";

const OPCIONES_PREFERENCIA_SUITE: { valor: PreferenciaSuite; etiqueta: string; descripcion: string }[] = [
  {
    valor: "todo_en_uno",
    etiqueta: "Una plataforma todo en uno",
    descripcion: "Prefiero centralizar en un único sitio, aunque cada función sea algo más básica.",
  },
  {
    valor: "especializada",
    etiqueta: "Herramientas especializadas",
    descripcion: "Prefiero la mejor herramienta posible para cada necesidad, aunque sean varias por separado.",
  },
  {
    valor: "sin_preferencia",
    etiqueta: "No tengo preferencia clara",
    descripcion: "Que Atlas decida por mí según mi situación.",
  },
];

export default function Cuestionario({ origen }: { origen: OrigenDiagnostico }) {
  const router = useRouter();

  // La pregunta de preferencia de suite solo tiene sentido si el usuario todavía no
  // fijó una categoría concreta al entrar (puerta "por categoría") — si ya la fijó,
  // no hay nada que preguntar: esa elección ya manda en el motor de recomendación.
  const mostrarPreguntaSuite = !origen.categoriaIdPrefill;
  const TOTAL_PREGUNTAS = mostrarPreguntaSuite ? 5 : 4;
  const PASO_SUITE = 0;
  const PASO_SECTOR = mostrarPreguntaSuite ? 1 : 0;
  const PASO_EMPLEADOS = PASO_SECTOR + 1;
  const PASO_PROBLEMA = PASO_EMPLEADOS + 1;
  const PASO_HERRAMIENTA = PASO_PROBLEMA + 1;

  const [paso, setPaso] = useState(0);
  const [preferenciaSuite, setPreferenciaSuite] = useState<PreferenciaSuite | null>(null);
  const [sector, setSector] = useState("");
  const [empleados, setEmpleados] = useState<RangoEmpleados | null>(null);
  const [mayorProblema, setMayorProblema] = useState(origen.notasPrefill ?? "");
  const [usaHerramienta, setUsaHerramienta] = useState<boolean | null>(null);
  const [herramientaNombre, setHerramientaNombre] = useState("");

  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [totalHerramientas, setTotalHerramientas] = useState<number | null>(null);

  const puedeAvanzar =
    (mostrarPreguntaSuite && paso === PASO_SUITE && preferenciaSuite !== null) ||
    (paso === PASO_SECTOR && sector.trim().length > 0) ||
    (paso === PASO_EMPLEADOS && empleados !== null) ||
    (paso === PASO_PROBLEMA && mayorProblema.trim().length > 0) ||
    (paso === PASO_HERRAMIENTA && usaHerramienta !== null);

  function irAlSiguientePaso() {
    if (!puedeAvanzar) return;
    if (paso < TOTAL_PREGUNTAS - 1) {
      setPaso((p) => p + 1);
    } else {
      setAnalizando(true);
    }
  }

  function volverAtras() {
    if (paso > 0) setPaso((p) => p - 1);
  }

  const yaLanzado = useRef(false);
  useEffect(() => {
    if (!analizando || yaLanzado.current) return;
    yaLanzado.current = true;

    const notasAdicionales = [
      mayorProblema.trim(),
      usaHerramienta
        ? `Actualmente usa ${herramientaNombre.trim() || "una herramienta parecida"} para esto.`
        : "Todavía no usa ninguna herramienta para esto.",
    ]
      .filter(Boolean)
      .join(" ");

    const respuestas: RespuestasUsuario = {
      categoriaId: origen.categoriaIdPrefill,
      problemaIdsCandidatos: origen.problemaIdPrefill ? [origen.problemaIdPrefill] : undefined,
      preferenciaSuite:
        preferenciaSuite === "todo_en_uno" || preferenciaSuite === "especializada" ? preferenciaSuite : undefined,
      industria: sector.trim(),
      tamanoEmpresa: empleados as RangoEmpleados,
      notasAdicionales,
    };

    const intervalo = setInterval(() => {
      setProgreso((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 220);

    fetch("/api/recomendaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuestas, origenTipo: origen.tipo, origenId: origen.id }),
    })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("La API de recomendaciones respondió con un error.");
        return respuesta.json() as Promise<{ token: string; totalEvaluadas: number }>;
      })
      .then(({ token, totalEvaluadas }) => {
        setProgreso(100);
        setTotalHerramientas(totalEvaluadas);
        setTimeout(() => {
          router.push(`/resultado/${token}`);
        }, 500);
      })
      .catch(() => {
        // Si el motor de recomendaciones falla, llevamos al usuario de
        // vuelta al inicio como red de seguridad, en vez de a una ruta que
        // ya no forma parte del recorrido principal.
        router.push("/");
      })
      .finally(() => {
        clearInterval(intervalo);
      });

    return () => {
      clearInterval(intervalo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analizando]);

  if (analizando) {
    return <AtlasTrabajando progreso={progreso} totalHerramientas={totalHerramientas} />;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Cada pregunta ya lleva su propio encabezado visual (label/legend, ver más abajo) del
          tamaño y peso de un h1 — este es solo para la jerarquía semántica de la página. */}
      <h1 className="sr-only">Cuestionario de Molnip: {origen.titulo}</h1>

      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <IconoOrigen tipo={origen.tipo} id={origen.id} className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-brand-700">{origen.titulo}</p>
      </div>

      <div className="mt-6 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_PREGUNTAS }).map((_, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i <= paso ? "bg-brand-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">
        Pregunta {paso + 1} de {TOTAL_PREGUNTAS}
      </p>

      <form
        className="relative mt-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium ring-1 ring-black/[0.02] sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          irAlSiguientePaso();
        }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 opacity-[0.14]" aria-hidden="true">
          <Image
            src="/imagenes/marca/cuestionario-formacion.png"
            alt=""
            width={448}
            height={448}
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <div className="relative">
        {mostrarPreguntaSuite && paso === PASO_SUITE && (
          <fieldset>
            <legend className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ¿Prefieres una plataforma todo en uno o herramientas especializadas?
            </legend>
            <div className="mt-5 flex flex-col gap-3">
              {OPCIONES_PREFERENCIA_SUITE.map((opcion) => {
                const seleccionado = preferenciaSuite === opcion.valor;
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() => setPreferenciaSuite(opcion.valor)}
                    className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all ${
                      seleccionado
                        ? "border-brand-600 bg-brand-50 shadow-premium ring-1 ring-brand-100"
                        : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40"
                    }`}
                  >
                    <span>
                      <span className={`block text-sm font-semibold ${seleccionado ? "text-brand-700" : "text-slate-700"}`}>
                        {opcion.etiqueta}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-500">{opcion.descripcion}</span>
                    </span>
                    {seleccionado && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {paso === PASO_SECTOR && (
          <div>
            <label
              htmlFor="sector"
              className="block font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              ¿A qué se dedica tu empresa?
            </label>
            <input
              id="sector"
              type="text"
              autoFocus
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Ej. tienda de ropa online, agencia de marketing, clínica dental..."
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        )}

        {paso === PASO_EMPLEADOS && (
          <fieldset>
            <legend className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ¿Cuántos empleados tiene?
            </legend>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {RANGOS_EMPLEADOS.map((rango) => {
                const seleccionado = empleados === rango.valor;
                return (
                  <button
                    key={rango.valor}
                    type="button"
                    onClick={() => setEmpleados(rango.valor)}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      seleccionado
                        ? "border-brand-600 bg-brand-50 text-brand-700 shadow-premium ring-1 ring-brand-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40"
                    }`}
                  >
                    {rango.etiqueta}
                    {seleccionado && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {paso === PASO_PROBLEMA && (
          <div>
            <label
              htmlFor="mayorProblema"
              className="block font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              {origen.notasPrefill ? "Esto es lo que nos has contado" : "¿Cuál es tu mayor problema?"}
            </label>
            {origen.notasPrefill && (
              <p className="mt-2 text-sm text-slate-500">Puedes ajustarlo si quieres precisar algo.</p>
            )}
            <textarea
              id="mayorProblema"
              autoFocus
              rows={4}
              value={mayorProblema}
              onChange={(e) => setMayorProblema(e.target.value)}
              placeholder="Cuéntanos con tus palabras qué es lo que más te cuesta"
              className="mt-5 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        )}

        {paso === PASO_HERRAMIENTA && (
          <fieldset>
            <legend className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {origen.preguntaHerramienta ?? PREGUNTA_HERRAMIENTA_GENERICA}
            </legend>
            <div className="mt-5 flex gap-3">
              {[
                { valor: true, etiqueta: "Sí" },
                { valor: false, etiqueta: "No" },
              ].map((opcion) => {
                const seleccionado = usaHerramienta === opcion.valor;
                return (
                  <button
                    key={String(opcion.valor)}
                    type="button"
                    onClick={() => setUsaHerramienta(opcion.valor)}
                    className={`flex items-center gap-1.5 rounded-xl border px-6 py-3 text-sm font-semibold transition-all ${
                      seleccionado
                        ? "border-brand-600 bg-brand-50 text-brand-700 shadow-premium ring-1 ring-brand-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/40"
                    }`}
                  >
                    {opcion.etiqueta}
                    {seleccionado && <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {usaHerramienta && (
              <input
                type="text"
                value={herramientaNombre}
                onChange={(e) => setHerramientaNombre(e.target.value)}
                placeholder="¿Cuál? (opcional)"
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            )}
          </fieldset>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={volverAtras}
            disabled={paso === 0}
            className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Atrás
          </button>
          <Boton type="submit" disabled={!puedeAvanzar}>
            {paso < TOTAL_PREGUNTAS - 1 ? "Siguiente" : "Obtener recomendación"}
          </Boton>
        </div>
        </div>
      </form>
    </div>
  );
}
