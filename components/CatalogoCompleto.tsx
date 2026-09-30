"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Globe, Search, Sparkles } from "lucide-react";
import {
  CRITERIOS_VACIOS,
  filtrarCatalogo,
  hayFiltro as hayAlgunFiltro,
  type CriteriosDeCatalogo,
  type FilaDeCatalogo,
  type TipoDeHerramienta,
} from "@/lib/catalogoCompleto";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import EstadoVacio from "@/components/ui/EstadoVacio";

const TIPOS: { valor: TipoDeHerramienta; etiqueta: string }[] = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "todo_en_uno", etiqueta: "Todo en uno" },
  { valor: "especializada", etiqueta: "Especializadas" },
];

const CHIP = "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition";
const CHIP_ACTIVO = "border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-100";
const CHIP_PASIVO = "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/40";

/**
 * El catálogo entero, para verlo y elegir.
 *
 * Decisión de la propietaria (2026-09-17): «el cliente puede elegir entre
 * todas las herramientas especializadas o todo en uno y que pueda verlas y
 * elegir, aunque nosotros le informamos y acompañamos».
 *
 * Esto NO es una recomendación y no debe convertirse en una. Aquí no hay
 * «mejor opción», ni posiciones, ni acento dorado: es una lista ordenada por
 * la misma Puntuación Atlas que ya se ve en cada ficha, con los filtros que
 * hacen falta para encontrar algo entre sesenta y cinco. Recomendar es lo que
 * hace el motor cuando entiende una necesidad concreta; esto es el derecho a
 * mirarlo todo.
 *
 * La lógica de filtrado no está aquí, sino en `lib/catalogoCompleto.ts`, para
 * que se pueda probar sin montar un navegador.
 */
export default function CatalogoCompleto({
  filas,
  categorias,
}: {
  filas: FilaDeCatalogo[];
  categorias: { id: string; nombre: string }[];
}) {
  const [criterios, setCriterios] = useState<CriteriosDeCatalogo>(CRITERIOS_VACIOS);
  const { busqueda, tipo, categoriaId, soloEspanol, soloGratis } = criterios;
  const cambiar = (cambio: Partial<CriteriosDeCatalogo>) => setCriterios((c) => ({ ...c, ...cambio }));

  const visibles = useMemo(() => filtrarCatalogo(filas, criterios), [filas, criterios]);
  const hayFiltro = hayAlgunFiltro(criterios);

  return (
    <div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 ring-1 ring-contorno sm:p-5">
        <label htmlFor="buscar-herramienta" className="sr-only">
          Buscar una herramienta por su nombre
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="buscar-herramienta"
            type="search"
            value={busqueda}
            onChange={(e) => cambiar({ busqueda: e.target.value })}
            placeholder="Busca por nombre, por lo que hace..."
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-4 pl-9 text-base text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {TIPOS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => cambiar({ tipo: opcion.valor })}
              aria-pressed={tipo === opcion.valor}
              className={`${CHIP} ${tipo === opcion.valor ? CHIP_ACTIVO : CHIP_PASIVO}`}
            >
              {opcion.etiqueta}
            </button>
          ))}

          <label htmlFor="filtro-categoria" className="sr-only">
            Filtrar por tipo de herramienta
          </label>
          <select
            id="filtro-categoria"
            value={categoriaId}
            onChange={(e) => cambiar({ categoriaId: e.target.value })}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="">Cualquier categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => cambiar({ soloEspanol: !soloEspanol })}
            aria-pressed={soloEspanol}
            className={`inline-flex items-center gap-1.5 ${CHIP} ${soloEspanol ? CHIP_ACTIVO : CHIP_PASIVO}`}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            En español
          </button>

          <button
            type="button"
            onClick={() => cambiar({ soloGratis: !soloGratis })}
            aria-pressed={soloGratis}
            className={`${CHIP} ${soloGratis ? CHIP_ACTIVO : CHIP_PASIVO}`}
          >
            Con plan gratuito
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-slate-500" aria-live="polite">
          {visibles.length === filas.length ? (
            <>
              Las <strong className="font-semibold text-slate-900">{filas.length}</strong> herramientas del catálogo
            </>
          ) : (
            <>
              <strong className="font-semibold text-slate-900">{visibles.length}</strong> de {filas.length}
            </>
          )}
        </p>
        {hayFiltro && (
          <button
            type="button"
            onClick={() => setCriterios(CRITERIOS_VACIOS)}
            className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline"
          >
            Quitar los filtros
          </button>
        )}
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio mensaje="No hay ninguna herramienta que cumpla eso. Prueba a quitar algún filtro." />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((fila) => (
            <li key={fila.id}>
              <Tarjeta className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
                    <Link href={`/herramienta/${fila.id}`} className="transition hover:text-brand-700">
                      {fila.nombre}
                    </Link>
                  </h2>
                  {fila.puntuacionAtlas !== null && (
                    <span className="shrink-0 text-sm font-semibold text-slate-400">{fila.puntuacionAtlas}</span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Etiqueta>{fila.categoriaNombre}</Etiqueta>
                  {fila.esTodoEnUno && (
                    <Etiqueta variante="marca">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Todo en uno
                    </Etiqueta>
                  )}
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{fila.descripcion}</p>

                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium text-slate-800">{fila.precioInicial}</p>
                  {fila.comprobado && <p className="mt-1 text-xs text-slate-400">{fila.comprobado}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                    {fila.tienePlanGratuito && (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-exito-500" aria-hidden="true" />
                        Plan gratuito
                      </span>
                    )}
                    {fila.disponibleEnEspanol && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        Español
                      </span>
                    )}
                  </div>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
