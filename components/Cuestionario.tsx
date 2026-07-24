"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Problema } from "@/lib/data";
import { RANGOS_EMPLEADOS, type RangoEmpleados } from "@/lib/cuestionario";
import type { HerramientaEvaluada, RespuestasUsuario } from "@/lib/recommendationEngine";
import { guardarResultados } from "@/lib/resultadosSesion";
import IconoProblema from "@/components/ui/IconoProblema";
import Boton from "@/components/ui/Boton";

const TOTAL_PREGUNTAS = 4;

const MENSAJES_ANALISIS = [
  "Entendiendo tu negocio...",
  "Cruzando tus respuestas con nuestra base de herramientas...",
  "Preparando tus recomendaciones...",
];

export default function Cuestionario({ problema }: { problema: Problema }) {
  const router = useRouter();

  const [paso, setPaso] = useState(0); // 0-3 preguntas, 4 = analizando
  const [sector, setSector] = useState("");
  const [empleados, setEmpleados] = useState<RangoEmpleados | null>(null);
  const [mayorProblema, setMayorProblema] = useState("");
  const [usaHerramienta, setUsaHerramienta] = useState<boolean | null>(null);
  const [herramientaNombre, setHerramientaNombre] = useState("");

  const [analizando, setAnalizando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [mensajeIndice, setMensajeIndice] = useState(0);

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
      industria: sector.trim(),
      tamanoEmpresa: empleados as RangoEmpleados,
      notasAdicionales,
    };

    const intervalo = setInterval(() => {
      setProgreso((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 220);

    const mensajes = setInterval(() => {
      setMensajeIndice((i) => (i + 1) % MENSAJES_ANALISIS.length);
    }, 1100);

    fetch("/api/recomendaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(respuestas),
    })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("La API de recomendaciones respondió con un error.");
        return respuesta.json() as Promise<{ top: HerramientaEvaluada[] }>;
      })
      .then(({ top }) => {
        setProgreso(100);
        guardarResultados(problema.id, top);
        setTimeout(() => {
          router.push(`/problema/${problema.id}/recomendacion`);
        }, 400);
      })
      .catch(() => {
        // Si el motor de recomendaciones falla, llevamos igualmente al
        // usuario a las categorías disponibles como red de seguridad.
        router.push(`/problema/${problema.id}`);
      })
      .finally(() => {
        clearInterval(intervalo);
        clearInterval(mensajes);
      });

    return () => {
      clearInterval(intervalo);
      clearInterval(mensajes);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analizando]);

  if (analizando) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <IconoProblema problemaId={problema.id} className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Analizando tu empresa...
        </h1>
        <p className="mt-2 min-h-6 text-sm text-slate-500">
          {MENSAJES_ANALISIS[mensajeIndice]}
        </p>

        <div className="mt-8 w-full max-w-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.min(progreso, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-medium text-slate-400">
            {Math.round(Math.min(progreso, 100))}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        <IconoProblema problemaId={problema.id} className="h-4 w-4" />
        {problema.titulo}
      </p>

      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: TOTAL_PREGUNTAS }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= paso ? "bg-brand-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-400">
        Pregunta {paso + 1} de {TOTAL_PREGUNTAS}
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          irAlSiguientePaso();
        }}
      >
        {paso === 0 && (
          <div>
            <label
              htmlFor="sector"
              className="block text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
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
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        )}

        {paso === 1 && (
          <fieldset>
            <legend className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              ¿Cuántos empleados tiene?
            </legend>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {RANGOS_EMPLEADOS.map((rango) => (
                <button
                  key={rango.valor}
                  type="button"
                  onClick={() => setEmpleados(rango.valor)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    empleados === rango.valor
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {rango.etiqueta}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {paso === 2 && (
          <div>
            <label
              htmlFor="mayorProblema"
              className="block text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
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
              className="mt-4 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        )}

        {paso === 3 && (
          <fieldset>
            <legend className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {problema.preguntaHerramienta}
            </legend>
            <div className="mt-4 flex gap-3">
              {[
                { valor: true, etiqueta: "Sí" },
                { valor: false, etiqueta: "No" },
              ].map((opcion) => (
                <button
                  key={String(opcion.valor)}
                  type="button"
                  onClick={() => setUsaHerramienta(opcion.valor)}
                  className={`rounded-xl border px-6 py-3 text-sm font-semibold transition ${
                    usaHerramienta === opcion.valor
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-brand-300"
                  }`}
                >
                  {opcion.etiqueta}
                </button>
              ))}
            </div>

            {usaHerramienta && (
              <input
                type="text"
                value={herramientaNombre}
                onChange={(e) => setHerramientaNombre(e.target.value)}
                placeholder="¿Cuál? (opcional)"
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            )}
          </fieldset>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={volverAtras}
            disabled={paso === 0}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 disabled:invisible"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Atrás
          </button>
          <Boton type="submit" disabled={!puedeAvanzar}>
            {paso < TOTAL_PREGUNTAS - 1 ? "Siguiente" : "Obtener recomendación"}
          </Boton>
        </div>
      </form>
    </div>
  );
}
