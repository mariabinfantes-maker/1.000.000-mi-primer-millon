"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { leerResultadosGuardados } from "@/lib/resultadosSesion";
import { claveOrigen, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import AvatarAgente from "@/components/ui/AvatarAgente";
import TablaComparativa from "@/components/TablaComparativa";

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
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Todavía no hay nada que comparar</h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Completa primero el cuestionario para que Molnip elija las opciones que quieres comparar.
        </p>
        <Boton href={`${origen.rutaBase}/cuestionario`} className="mt-6">
          Empezar el cuestionario
        </Boton>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`${origen.rutaBase}/recomendacion`}>Volver a tus opciones</EnlaceAtras>

      <div className="relative lg:pr-44">
        <div className="absolute -top-2 -right-4 hidden h-36 w-36 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/comparador-gemas.png"
            alt="Dos cristales facetados uno junto al otro, uno dorado y otro neutro — comparar para elegir"
            width={480}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <AvatarAgente id="evaluador" />
          <div>
            <p className="text-sm font-semibold text-agente-evaluador">{EVALUADOR.nombre}</p>
            <p className="text-xs text-slate-500">{EVALUADOR.rol}</p>
          </div>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Comparativa guiada
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Solo se muestran los criterios en los que estas opciones realmente se diferencian, no una tabla exhaustiva.
        </p>
      </div>

      <div className="mt-8">
        <TablaComparativa evaluadas={top} />
      </div>
    </div>
  );
}
