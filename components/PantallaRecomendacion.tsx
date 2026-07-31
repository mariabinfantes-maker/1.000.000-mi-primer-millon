"use client";

import { useEffect, useState } from "react";
import { leerResultadosGuardados } from "@/lib/resultadosSesion";
import { aVistaDeTarjeta } from "@/lib/vistaRecomendacion";
import { claveOrigen, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/lib/recommendationEngine";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import AvatarAgente from "@/components/ui/AvatarAgente";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

const RECOMENDADOR = getAgente("recomendador");

/**
 * Pantalla de resultados (P-03), compartida por las tres puertas de
 * entrada: solo cambia qué `OrigenDiagnostico` recibe. Antes vivía
 * duplicada dentro de cada ruta `/problema/[id]/recomendacion`; extraída
 * aquí para que una puerta nueva no implique reescribir esta pantalla.
 */
export default function PantallaRecomendacion({ origen }: { origen: OrigenDiagnostico }) {
  const [estado, setEstado] = useState<{ cargando: boolean; top: HerramientaEvaluada[] | null }>({
    cargando: true,
    top: null,
  });

  useEffect(() => {
    // Los resultados los calculó la API al terminar el cuestionario;
    // sessionStorage es un sistema externo al render de React, de ahí el efecto.
    const top = leerResultadosGuardados(claveOrigen(origen));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado({ cargando: false, top });
  }, [origen]);

  const { cargando, top } = estado;

  if (cargando) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-slate-400">
        Cargando tu recomendación...
      </div>
    );
  }

  if (!top || top.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Todavía no tenemos tu recomendación
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Responde primero a unas preguntas rápidas sobre tu empresa y Atlas te mostrará las
          herramientas que mejor encajan.
        </p>
        <Boton href={`${origen.rutaBase}/cuestionario`} className="mt-6">
          Empezar el cuestionario
        </Boton>
      </div>
    );
  }

  const vistas = top.map((evaluada, indice) => aVistaDeTarjeta(evaluada, indice + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`${origen.rutaBase}/cuestionario`}>Repetir el cuestionario</EnlaceAtras>

      <div className="mt-6 flex items-center gap-3">
        <AvatarAgente id="recomendador" />
        <div>
          <p className="text-sm font-semibold text-agente-recomendador">{RECOMENDADOR.nombre}</p>
          <p className="text-xs text-slate-500">{RECOMENDADOR.rol}</p>
        </div>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Tus {vistas.length} mejores opciones
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
        Hemos cruzado tus respuestas con nuestra base de herramientas y estas son las que mejor
        encajan contigo, de mejor a peor ajuste.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {vistas.map((vista) => (
          <TarjetaHerramientaRecomendada key={vista.nombre} {...vista} />
        ))}
      </div>
    </div>
  );
}
