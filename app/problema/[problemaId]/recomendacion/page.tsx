"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, Sparkles, Check, ArrowUpRight, Construction } from "lucide-react";
import { getProblema } from "@/lib/data";
import {
  RANGOS_EMPLEADOS,
  claveRecomendacionGuardada,
  type Recomendacion,
} from "@/lib/recomendaciones";
import Pasos from "@/components/Pasos";
import IconoProblema from "@/components/ui/IconoProblema";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Etiqueta from "@/components/ui/Etiqueta";
import Tarjeta from "@/components/ui/Tarjeta";
import Boton from "@/components/ui/Boton";

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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Problema no encontrado
        </h1>
        <Boton href="/" className="mt-6">
          Volver al inicio
        </Boton>
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Todavía no tenemos tu recomendación
        </h1>
        <p className="mt-2 leading-relaxed text-slate-600">
          Responde primero a unas preguntas rápidas sobre tu empresa y Atlas
          te mostrará las herramientas que mejor encajan.
        </p>
        <Boton href={`/problema/${problema.id}/cuestionario`} className="mt-6">
          Empezar el cuestionario
        </Boton>
      </div>
    );
  }

  const [principal, ...otrasHerramientas] = recomendacion.herramientas;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <Pasos pasoActual={3} />

      <EnlaceAtras href={`/problema/${problema.id}/cuestionario`}>
        Repetir el cuestionario
      </EnlaceAtras>

      {/* Resumen del diagnóstico */}
      <div className="mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-slate-900 p-8 text-white shadow-lg sm:p-10">
        <div className="flex items-center gap-2 text-sm font-medium text-brand-300">
          <IconoProblema problemaId={problema.id} className="h-4 w-4" />
          {problema.titulo}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hemos analizado tu empresa
          </h1>
        </div>
        <p className="mt-3 max-w-2xl leading-relaxed text-brand-100">{recomendacion.mensaje}</p>

        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-brand-300">
              Sector
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-white">
              {recomendacion.respuestas.sector || "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-brand-300">
              Tamaño
            </dt>
            <dd className="mt-1 text-sm font-semibold text-white">
              {RANGOS_EMPLEADOS.find((r) => r.valor === recomendacion.respuestas.empleados)
                ?.etiqueta ?? recomendacion.respuestas.empleados}{" "}
              empleados
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-brand-300">
              Reto principal
            </dt>
            <dd className="mt-1 line-clamp-2 text-sm font-semibold text-white">
              {recomendacion.respuestas.mayorProblema || "—"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-brand-300">
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
            <Etiqueta key={categoria}>{categoria}</Etiqueta>
          ))}
        </div>
      )}

      {/* Recomendación principal — el elemento más destacado de la pantalla */}
      <section className="mt-4 overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-xl shadow-brand-100">
        <div className="bg-gradient-to-br from-brand-50 to-white px-6 py-8 sm:px-10 sm:py-10">
          <Etiqueta variante="marca">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Recomendado para ti
          </Etiqueta>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {principal.nombre}
              </h2>
              <p className="mt-2 max-w-xl leading-relaxed text-slate-600">
                {principal.descripcionCorta}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Precio inicial
              </p>
              <p className="text-xl font-bold text-slate-900">{principal.precioInicial}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Boton href={principal.url} externo tamano="grande">
              Ver herramienta
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Boton>
            <Boton
              variante="secundario"
              tamano="grande"
              onClick={() => setMostrarAyuda(true)}
            >
              ¿Prefieres que te ayudemos a implementarlo?
            </Boton>
          </div>

          {mostrarAyuda && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
              <Construction className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Muy pronto podrás pedir ayuda a nuestro equipo directamente desde aquí.
              Esta función está en camino.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Por qué encaja contigo
            </h3>
            <p className="mt-3 leading-relaxed text-slate-700">{recomendacion.porQueEncaja}</p>
          </div>
          <div className="px-6 py-6 sm:px-10 sm:py-8">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Beneficios para tu negocio
            </h3>
            <ul className="mt-3 space-y-2">
              {recomendacion.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex gap-2 text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-6 sm:px-10 sm:py-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Siguiente paso recomendado
          </h3>
          <p className="mt-2 leading-relaxed text-slate-700">{recomendacion.siguientePaso}</p>
        </div>
      </section>

      {/* Otras opciones */}
      {otrasHerramientas.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            También puedes considerar
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otrasHerramientas.map((herramienta) => (
              <Tarjeta key={herramienta.id} className="flex flex-col">
                <Etiqueta>{herramienta.categoria}</Etiqueta>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {herramienta.nombre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                      <span>{ventaja}</span>
                    </li>
                  ))}
                </ul>

                <Boton href={herramienta.url} externo className="mt-6 w-full">
                  Ver herramienta
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Boton>
              </Tarjeta>
            ))}
          </div>
        </div>
      )}

      <p className="mt-10 text-sm text-slate-500">
        ¿Quieres explorar más a fondo?{" "}
        <Link
          href={`/problema/${problema.id}`}
          className="font-medium text-brand-600 hover:text-brand-800"
        >
          Ve todas las herramientas de {problema.titulo.toLowerCase()} por categoría
        </Link>
        .
      </p>
    </div>
  );
}
