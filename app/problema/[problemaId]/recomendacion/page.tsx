"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getProblema } from "@/lib/data";
import { leerResultadosGuardados } from "@/lib/resultadosSesion";
import { aVistaDeTarjeta } from "@/lib/vistaRecomendacion";
import type { HerramientaEvaluada } from "@/lib/recommendationEngine";
import Pasos from "@/components/Pasos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

export default function RecomendacionPage() {
  const params = useParams<{ problemaId: string }>();
  const problemaId = Array.isArray(params.problemaId) ? params.problemaId[0] : params.problemaId;
  const problema = getProblema(problemaId);

  const [estado, setEstado] = useState<{ cargando: boolean; top: HerramientaEvaluada[] | null }>({
    cargando: true,
    top: null,
  });

  useEffect(() => {
    // Los resultados los calculó la API al terminar el cuestionario;
    // sessionStorage es un sistema externo al render de React, de ahí el efecto.
    const top = leerResultadosGuardados(problemaId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado({ cargando: false, top });
  }, [problemaId]);

  const { cargando, top } = estado;

  if (!problema) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Problema no encontrado</h1>
        <Boton href="/" className="mt-6">
          Volver al inicio
        </Boton>
      </div>
    );
  }

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
        <Boton href={`/problema/${problema.id}/cuestionario`} className="mt-6">
          Empezar el cuestionario
        </Boton>
      </div>
    );
  }

  const vistas = top.map((evaluada, indice) => aVistaDeTarjeta(evaluada, indice + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={3} />

      <EnlaceAtras href={`/problema/${problema.id}/cuestionario`}>Repetir el cuestionario</EnlaceAtras>

      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-brand-600">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Recomendación personalizada de Atlas
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
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
