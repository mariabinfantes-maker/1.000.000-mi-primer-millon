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

  const [mostrarAyuda, setMostrarAyuda] = useState(false);

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

  const [principal, ...otrasHerramientas] = recomendacion.herramientas;

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

      {recomendacion.categorias.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
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

      {/* Recomendación principal — el elemento más destacado de la pantalla */}
      <section className="mt-4 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-indigo-100">
        <div className="bg-gradient-to-br from-indigo-50 to-white px-6 py-8 sm:px-10 sm:py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            ✦ Recomendado para ti
          </span>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {principal.nombre}
              </h2>
              <p className="mt-2 max-w-xl text-slate-600">{principal.descripcionCorta}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Precio inicial
              </p>
              <p className="text-xl font-bold text-slate-900">{principal.precioInicial}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={principal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700"
            >
              Ver herramienta
              <span aria-hidden="true">↗</span>
            </a>
            <button
              type="button"
              onClick={() => setMostrarAyuda(true)}
              className="rounded-lg border border-indigo-200 bg-white px-6 py-3.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              ¿Prefieres que te ayudemos a implementarlo?
            </button>
          </div>

          {mostrarAyuda && (
            <p className="mt-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700">
              🚧 Muy pronto podrás pedir ayuda a nuestro equipo directamente desde aquí.
              Esta función está en camino.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Por qué encaja contigo
            </h3>
            <p className="mt-3 leading-relaxed text-slate-700">{recomendacion.porQueEncaja}</p>
          </div>
          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Beneficios para tu negocio
            </h3>
            <ul className="mt-3 space-y-2">
              {recomendacion.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex gap-2 text-slate-700">
                  <span className="text-emerald-500">✓</span>
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 sm:px-10 sm:py-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Siguiente paso recomendado
          </h3>
          <p className="mt-2 text-slate-700">{recomendacion.siguientePaso}</p>
        </div>
      </section>

      {/* Otras opciones */}
      {otrasHerramientas.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-slate-900">También puedes considerar</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otrasHerramientas.map((herramienta) => (
              <div
                key={herramienta.id}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  {herramienta.categoria}
                </span>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {herramienta.nombre}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{herramienta.descripcionCorta}</p>

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
        </div>
      )}

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
