"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { RANGOS_EMPLEADOS, type RangoEmpleados } from "@/lib/cuestionario";
import type { HerramientaEvaluada, RespuestasUsuario } from "@/agents/atlas-advisor";
import { guardarResultados } from "@/lib/resultadosSesion";
import { claveOrigen, PREGUNTA_HERRAMIENTA_GENERICA, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import IconoOrigen from "@/components/ui/IconoOrigen";
import Boton from "@/components/ui/Boton";
import AtlasTrabajando from "@/components/AtlasTrabajando";

const TOTAL_PREGUNTAS = 4;

export default function Cuestionario({ origen }: { origen: OrigenDiagnostico }) {
  const router = useRouter();

  const [paso, setPaso] = useState(0); // 0-3 preguntas, 4 = analizando
  const [sector, setSector] = useState("");
  const [empleados, setEmpleados] = useState<RangoEmpleados | null>(null);
  const [mayorProblema, setMayorProblema] = useState(origen.notasPrefill ?? "");
  const [usaHerramienta, setUsaHerramienta] = useState<boolean | null>(null);
  const [herramientaNombre, setHerramientaNombre] = useState("");

  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [totalHerramientas, setTotalHerramientas] = useState<number | null>(null);

  const puedeAvanzar =
    (paso === 0 && sector.trim().length > 0) ||
    (paso === 1 && empleados !== null) ||
    (paso === 2 && mayorProblema.trim().length > 0) ||
    (paso === 3 && usaHerramienta !== null);

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
      body: JSON.stringify(respuestas),
    })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("La API de recomendaciones respondió con un error.");
        return respuesta.json() as Promise<{ top: HerramientaEvaluada[]; totalEvaluadas: number }>;
      })
      .then(({ top, totalEvaluadas }) => {
        setProgreso(100);
        setTotalHerramientas(totalEvaluadas);
        guardarResultados(claveOrigen(origen), top);
        setTimeout(() => {
          router.push(`${origen.rutaBase}/recomendacion`);
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
        {paso === 0 && (
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

        {paso === 1 && (
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

        {paso === 2 && (
          <div>
            <label
              htmlFor="mayorProblema"
              className="block font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              ¿Cuál es tu mayor problema?
            </label>
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

        {paso === 3 && (
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
