"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Scale } from "lucide-react";
import { leerResultadosGuardados } from "@/lib/resultadosSesion";
import { aVistaDeTarjeta } from "@/lib/vistaRecomendacion";
import { claveOrigen, type OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
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
        <h1 className="text-2xl font-display font-bold tracking-tight text-slate-900">
          Todavía no tenemos tu recomendación
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Responde primero a unas preguntas rápidas sobre tu empresa y Molnip te mostrará las
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

      <div className="relative">
        <div className="absolute -top-6 -right-4 hidden h-40 w-40 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/resultados-cristal.png"
            alt="Un cristal facetado índigo con una faceta iluminada en dorado, la opción que destaca"
            width={320}
            height={320}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:pr-44">
          <div>
            <div className="flex items-center gap-3">
              <AvatarAgente id="recomendador" />
              <div>
                <p className="text-sm font-semibold text-agente-recomendador">{RECOMENDADOR.nombre}</p>
                <p className="text-xs text-slate-500">{RECOMENDADOR.rol}</p>
              </div>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {vistas.length === 1 ? "Tu mejor opción" : `Tus ${vistas.length} mejores opciones`}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
              {vistas.length === 1
                ? "Hemos cruzado tus respuestas con nuestra base de herramientas. Esta es la que mejor encaja contigo — todavía no tenemos otra opción investigada en esta categoría con la que compararla."
                : "Hemos cruzado tus respuestas con nuestra base de herramientas. El orden refleja qué tan bien encaja cada una con tu situación concreta — no siempre coincide con la Puntuación Molnip de cada tarjeta, que valora la herramienta en general, para cualquier empresa."}
            </p>
          </div>

          {vistas.length >= 2 && (
            <Boton href={`${origen.rutaBase}/comparar`} variante="secundario" className="shrink-0">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Comparar estas opciones
            </Boton>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {vistas.map((vista) => (
          <TarjetaHerramientaRecomendada key={vista.nombre} {...vista} />
        ))}
      </div>
    </div>
  );
}
