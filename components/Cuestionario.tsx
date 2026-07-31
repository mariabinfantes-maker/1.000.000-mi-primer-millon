"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { RANGOS_EMPLEADOS, type RangoEmpleados } from "@/lib/cuestionario";
import type { HerramientaEvaluada, RespuestasUsuario } from "@/lib/recommendationEngine";
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
      <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
        <IconoOrigen tipo={origen.tipo} id={origen.id} className="h-4 w-4" />
        {origen.titulo}
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
              {origen.preguntaHerramienta ?? PREGUNTA_HERRAMIENTA_GENERICA}
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
