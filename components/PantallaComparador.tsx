"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { leerResultadosGuardados } from "@/lib/resultadosSesion";
import { claveOrigen, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { construirComparativa } from "@/lib/comparador";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/lib/recommendationEngine";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import AvatarAgente from "@/components/ui/AvatarAgente";
import AnilloPuntuacion from "@/components/ui/AnilloPuntuacion";

const EVALUADOR = getAgente("evaluador");

/**
 * Comparador guiado (P-05): entra desde P-03 con las opciones ya
 * preseleccionadas por Atlas (el mismo top ya guardado en sessionStorage
 * para esa pantalla) — nunca deja elegir filas libremente de todo el
 * catálogo, que es justo lo que convertía al comparador anterior
 * (`/problema/[id]/[categoriaId]`) en un directorio.
 */
export default function PantallaComparador({ origen }: { origen: OrigenDiagnostico }) {
  const [estado, setEstado] = useState<{ cargando: boolean; top: HerramientaEvaluada[] | null }>({
    cargando: true,
    top: null,
  });

  useEffect(() => {
    const top = leerResultadosGuardados(claveOrigen(origen));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado({ cargando: false, top });
  }, [origen]);

  const { cargando, top } = estado;

  if (cargando) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-sm text-slate-400">
        Cargando comparación...
      </div>
    );
  }

  if (!top || top.length < 2) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Todavía no hay nada que comparar</h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Completa primero el cuestionario para que Atlas elija las opciones que quieres comparar.
        </p>
        <Boton href={`${origen.rutaBase}/cuestionario`} className="mt-6">
          Empezar el cuestionario
        </Boton>
      </div>
    );
  }

  const filas = construirComparativa(top);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`${origen.rutaBase}/recomendacion`}>Volver a tus opciones</EnlaceAtras>

      <div className="mt-6 flex items-center gap-3">
        <AvatarAgente id="evaluador" />
        <div>
          <p className="text-sm font-semibold text-agente-evaluador">{EVALUADOR.nombre}</p>
          <p className="text-xs text-slate-500">{EVALUADOR.rol}</p>
        </div>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Comparativa guiada</h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
        Solo se muestran los criterios en los que estas opciones realmente se diferencian, no una tabla exhaustiva.
      </p>

      <div
        className="comparador-grid mt-8 gap-4"
        style={{ "--comparador-columnas": top.length } as CSSProperties}
      >
        {top.map((evaluada) => {
          const puntuacion = calcularPuntuacionAtlas(evaluada.herramienta);
          return (
            <div
              key={evaluada.herramienta.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 text-center"
            >
              {puntuacion && <AnilloPuntuacion puntuacion={puntuacion.puntuacion} />}
              <span className="text-sm font-semibold text-slate-900">{evaluada.herramienta.nombre}</span>
            </div>
          );
        })}
      </div>

      {filas.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 text-sm leading-relaxed text-slate-600">
          Estas opciones están muy igualadas: no hay diferencias claras entre ellas en los criterios que
          evaluamos para tu caso.
        </p>
      ) : (
        <div className="mt-10 space-y-5">
          {filas.map((fila) => (
            <div key={fila.criterio} className="rounded-2xl border border-slate-200/80 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">{fila.etiqueta}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{fila.explicacionCriterio}</p>

              <div
                className="comparador-grid mt-4 gap-3"
                style={{ "--comparador-columnas": fila.celdas.length } as CSSProperties}
              >
                {fila.celdas.map((celda) => (
                  <div
                    key={celda.herramientaId}
                    className={`rounded-xl border p-3 text-sm leading-relaxed transition-colors ${
                      celda.gana
                        ? "border-agente-evaluador bg-agente-evaluador-soft text-slate-800"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500">{celda.nombre}</p>
                    <p className="mt-1">{celda.explicacion || "Sin diferencia destacable aquí."}</p>
                  </div>
                ))}
              </div>

              {fila.hayGanadorUnico && (
                <p className="mt-3 text-xs font-semibold text-agente-evaluador">
                  En {fila.etiqueta.toLowerCase()}, gana {fila.celdas.find((c) => c.gana)?.nombre}.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
