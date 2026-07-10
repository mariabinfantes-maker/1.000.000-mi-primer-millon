"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProblema } from "@/lib/data";
import {
  RANGOS_EMPLEADOS,
  claveRecomendacionGuardada,
  type Recomendacion,
} from "@/lib/recomendaciones";
import Pasos from "@/components/Pasos";

export default function RecomendacionPage() {
  const params = useParams<{ problemaId: string }>();
  const problemaId = Array.isArray(params.problemaId)
    ? params.problemaId[0]
    : params.problemaId;
  const problema = getProblema(problemaId);

  const [estado, setEstado] = useState<{
    cargando: boolean;
    recomendacion: Recomendacion | null;
  }>({ cargando: true, recomendacion: null });

  useEffect(() => {
    // Lee la recomendación calculada por el cuestionario (sessionStorage es
    // un sistema externo al render de React, de ahí el efecto).
    let recomendacion: Recomendacion | null = null;
    try {
      const guardada = sessionStorage.getItem(claveRecomendacionGuardada(problemaId));
      if (guardada) recomendacion = JSON.parse(guardada) as Recomendacion;
    } catch {
      // sessionStorage no disponible: se mostrará el fallback.
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado({ cargando: false, recomendacion });
  }, [problemaId]);

  const { cargando, recomendacion } = estado;

  if (!problema) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Problema no encontrado</h1>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-sm text-slate-400">
        Cargando tu recomendación...
      </div>
    );
  }

  if (!recomendacion) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Todavía no tenemos tu recomendación
        </h1>
        <p className="mt-2 text-slate-600">
          Responde primero a unas preguntas rápidas sobre tu empresa y Atlas
          te mostrará las herramientas que mejor encajan.
        </p>
        <Link
          href={`/problema/${problema.id}/cuestionario`}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Empezar el cuestionario
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={3} />

      <Link
        href={`/problema/${problema.id}/cuestionario`}
        className="mt-6 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800"
      >
        ← Repetir el cuestionario
      </Link>

      {/* Resumen del diagnóstico */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-8 text-white shadow-lg sm:p-10">
        <p className="text-sm font-medium text-indigo-300">
          {problema.icono} {problema.titulo}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Hemos analizado tu empresa
        </h1>
        <p className="mt-3 max-w-2xl text-indigo-100">{recomendacion.mensaje}</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-indigo-300">
              Sector
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-white">
              {recomendacion.respuestas.sector || "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-indigo-300">
              Tamaño
            </dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              {RANGOS_EMPLEADOS.find((r) => r.valor === recomendacion.respuestas.empleados)
                ?.etiqueta ?? recomendacion.respuestas.empleados}{" "}
              empleados
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-indigo-300">
              Reto principal
            </dt>
            <dd className="mt-1 line-clamp-2 text-sm font-semibold text-white">
              {recomendacion.respuestas.mayorProblema || "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-indigo-300">
              Herramienta actual
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-white">
              {recomendacion.respuestas.usaHerramientaActual
                ? recomendacion.respuestas.herramientaActualNombre || "Sí, usa una"
                : "Ninguna todavía"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Tu recomendación personalizada
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Estas son las herramientas que mejor encajan con lo que nos has contado.
        </p>
      </div>

      {recomendacion.categorias.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {recomendacion.categorias.map((categoria) => (
            <span
              key={categoria}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
            >
              {categoria}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recomendacion.herramientas.map((herramienta, indice) => (
          <div
            key={herramienta.id}
            className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
              indice === 0 ? "border-indigo-400 ring-1 ring-indigo-400" : "border-slate-200"
            }`}
          >
            {indice === 0 && (
              <span className="mb-3 inline-block w-fit rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                Mejor opción para ti
              </span>
            )}

            <span className="w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              {herramienta.categoria}
            </span>

            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              {herramienta.nombre}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {herramienta.descripcionCorta}
            </p>

            <p className="mt-4 text-sm">
              <span className="text-slate-400">Precio inicial </span>
              <span className="font-semibold text-slate-700">
                {herramienta.precioInicial}
              </span>
            </p>

            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              {herramienta.ventajas.map((ventaja) => (
                <li key={ventaja} className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  <span>{ventaja}</span>
                </li>
              ))}
            </ul>

            <a
              href={herramienta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Ver herramienta
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        ¿Quieres explorar más a fondo?{" "}
        <Link
          href={`/problema/${problema.id}`}
          className="font-medium text-indigo-600 hover:text-indigo-800"
        >
          Ve todas las herramientas de {problema.titulo.toLowerCase()} por categoría
        </Link>
        .
      </p>
    </div>
  );
}
