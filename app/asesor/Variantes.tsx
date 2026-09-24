"use client";

import { useState } from "react";
import {
  CalendarCheck, LayoutGrid, Check, Coins, FileText, ChevronRight, Sparkles, Search, SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import Boton from "@/components/ui/Boton";

/**
 * Las formas de enseñar el mismo consejo, para elegir usándolas.
 *
 * Reescrito el 2026-09-24. La versión anterior aplicaba el sistema de color y
 * de sombra pero **no tenía identidad**: ni un icono, filas con un «+» que
 * parecían un FAQ, y el nombre de la herramienta en grande donde los bocetos
 * de la propietaria ponen el RESULTADO. De ahí venía que «Agiled pareciera la
 * dueña de todo».
 *
 * Tres cosas se corrigen aquí, y las tres son suyas:
 *
 *  1. **Manda el resultado, no la marca.** El titular de una opción dice qué
 *     consigue —«las dos cosas en una sola herramienta»—, y los nombres van
 *     debajo, del mismo tamaño entre ellos. Cuando varias empatan, empatan.
 *  2. **Iconos con tinte.** Cada opción y cada puerta lleva su cuadrado
 *     redondeado con su icono, que es lo que da aire y carácter.
 *  3. **Las puertas se abren, no se despliegan.** Fila con galón, como algo a
 *     donde se va, no como una pregunta frecuente.
 */

export type QueResuelve = { necesidad: string; url?: string; fecha?: string };
export type Coste = {
  desde?: string; comprobadoEl?: string; urlPrecios?: string;
  tienePlanGratuito?: boolean; curva?: string; enEspanol?: boolean;
};
export type Pieza = {
  herramientaId: string; nombre: string; cubre: string[]; casas: string[];
  queResuelve: QueResuelve[]; coste: Coste; faltaPorConfirmar: string[];
};
export type Opcion = { piezas: Pieza[]; laConexionNoEstaComprobada: boolean };
export type Camino = { forma: string; titulo: string; queImplica: string; opciones: Opcion[]; hayMas: number };

/** La receta única de tarjeta de MOLNIP VISUAL v1. 30 apariciones idénticas. */
const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

const CURVA: Record<string, string> = {
  muy_facil: "Se coge muy rápido", facil: "Se coge rápido",
  media: "Lleva un rato aprenderla", dificil: "Cuesta aprenderla",
};

/** El cuadrado con tinte que lleva cada icono. Es la firma visual de los bocetos. */
function Baldosa({ icono: Icono, fuerte = false }: { icono: LucideIcon; fuerte?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
        fuerte ? "bg-brand-600 text-white shadow-premium" : "bg-brand-50 text-brand-600 ring-1 ring-brand-100"
      }`}
    >
      <Icono className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

/** Una puerta: fila con su icono y su galón, que se abre en el sitio. */
function Puerta({ icono: Icono, titulo, abierta, alPulsar, children }: {
  icono: LucideIcon; titulo: string; abierta: boolean; alPulsar: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-200/80">
      <button onClick={alPulsar} className="flex w-full items-center gap-3 py-3.5 text-left">
        <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icono className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-800">{titulo}</span>
        <ChevronRight
          aria-hidden
          className={`h-4 w-4 text-slate-400 transition-transform ${abierta ? "rotate-90" : ""}`}
        />
      </button>
      {abierta && <div className="pb-4 pl-11 text-sm leading-relaxed text-slate-600">{children}</div>}
    </div>
  );
}

function Detalle({ p }: { p: Pieza }) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const alt = (k: string) => setAbierta(abierta === k ? null : k);
  return (
    <div className="mt-4">
      <Puerta icono={Check} titulo="Qué te resuelve" abierta={abierta === "resuelve"} alPulsar={() => alt("resuelve")}>
        <ul className="space-y-2.5">
          {p.queResuelve.map((q) => (
            <li key={q.necesidad}>
              <p className="text-slate-800">{q.necesidad}</p>
              {q.url && (
                <p className="text-xs text-slate-500">
                  Lo vimos en <a href={q.url} target="_blank" rel="noreferrer noopener" className="underline">su página</a> el {q.fecha}.
                </p>
              )}
            </li>
          ))}
        </ul>
      </Puerta>

      <Puerta icono={Coins} titulo="Coste y puesta en marcha" abierta={abierta === "coste"} alPulsar={() => alt("coste")}>
        <p className="font-semibold text-slate-800">{p.coste.desde ?? "No tenemos su precio comprobado."}</p>
        {p.coste.comprobadoEl && (
          <p className="text-xs text-slate-500">
            Comprobado el {p.coste.comprobadoEl}
            {p.coste.urlPrecios && (
              <> en <a href={p.coste.urlPrecios} target="_blank" rel="noreferrer noopener" className="underline">su tarifa</a></>
            )}. Míralo antes de decidir: los precios cambian.
          </p>
        )}
        <ul className="mt-2.5 space-y-1">
          {p.coste.tienePlanGratuito && <li>Tiene plan gratuito, así que puedes probarla sin pagar.</li>}
          {p.coste.curva && <li>{CURVA[p.coste.curva] ?? p.coste.curva}.</li>}
          <li>{p.coste.enEspanol ? "Está en español." : "No hemos confirmado que esté en español."}</li>
        </ul>
      </Puerta>

      <Puerta icono={FileText} titulo="Qué falta por confirmar" abierta={abierta === "falta"} alPulsar={() => alt("falta")}>
        {p.faltaPorConfirmar.length === 0 ? (
          <p>De lo que nos pediste, no nos queda nada pendiente de comprobar en ésta.</p>
        ) : (
          <ul className="space-y-1.5">{p.faltaPorConfirmar.map((f) => <li key={f}>{f}</li>)}</ul>
        )}
        <p className="mt-2.5 text-xs text-slate-500">
          Que algo no nos conste no significa que no lo haga: significa que no lo hemos podido comprobar.
        </p>
      </Puerta>
    </div>
  );
}

/** Lo que consigue el camino, en una línea. El titular, antes que ninguna marca. */
function tituloDelCamino(forma: string, cuantas: number) {
  return forma === "todo-en-uno"
    ? cuantas > 1 ? "Las dos cosas en una sola herramienta" : "Todo en una sola herramienta"
    : "Cada cosa en su herramienta";
}

const ICONO_CAMINO: Record<string, LucideIcon> = { "todo-en-uno": CalendarCheck, "por-separado": LayoutGrid };

/** Las herramientas de un camino, TODAS del mismo tamaño. Ninguna es la dueña. */
function Candidatas({ opciones, hayMas }: { opciones: Opcion[]; hayMas: number }) {
  return (
    <>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {opciones.length > 1 ? `${opciones.length + hayMas} lo hacen igual de bien` : "Con esta herramienta"}
      </p>
      <ul className="mt-2 space-y-2">
        {opciones.map((o, j) => (
          <li key={j} className={`${TARJETA} px-4 py-3`}>
            <p className="font-semibold text-slate-900">{o.piezas.map((p) => p.nombre).join("  +  ")}</p>
            {o.laConexionNoEstaComprobada && (
              <p className="mt-0.5 text-xs text-slate-500">No hemos comprobado que se entiendan entre sí.</p>
            )}
            {o.piezas.map((p) => <Detalle key={p.herramientaId} p={p} />)}
          </li>
        ))}
        {hayMas > 0 && <li className="px-1 text-sm text-slate-600">Y {hayMas} más que también lo cubren.</li>}
      </ul>
    </>
  );
}

function Caso({ titulo, quePide }: { titulo: string; quePide: string[] }) {
  return (
    <section className={`${TARJETA} p-5 shadow-premium`}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{titulo}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {quePide.map((q) => (
          <span key={q} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
            {q}
          </span>
        ))}
      </div>
    </section>
  );
}

/** A · El consejo manda: los caminos, y dentro las candidatas en igualdad. */
export function VarianteA({ caminos, quePide }: { caminos: Camino[]; quePide: string[] }) {
  const [abierto, setAbierto] = useState<string | null>(caminos[0]?.forma ?? null);
  if (caminos.length === 0) return null;
  return (
    <div className="space-y-4">
      <Caso titulo="Lo que quieres resolver" quePide={quePide} />
      <h2 className="pt-2 font-display text-2xl font-bold tracking-tight text-slate-900">Opciones para tu negocio</h2>

      {caminos.map((cam, i) => {
        const activo = abierto === cam.forma;
        return (
          <section
            key={cam.forma}
            className={`rounded-2xl p-5 transition ${activo ? "bg-brand-50 ring-1 ring-brand-100 shadow-premium-lg" : `${TARJETA} shadow-premium`}`}
          >
            <button onClick={() => setAbierto(activo ? null : cam.forma)} className="flex w-full items-start gap-4 text-left">
              <Baldosa icono={ICONO_CAMINO[cam.forma] ?? Sparkles} fuerte={activo} />
              <span className="flex-1">
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
                  Opción {String.fromCharCode(65 + i)} · {cam.titulo}
                </span>
                <span className="mt-1 block font-display text-lg font-bold leading-snug text-slate-900">
                  {tituloDelCamino(cam.forma, quePide.length)}
                </span>
                <span className="mt-1 block text-sm text-brand-700">
                  {activo ? "Ocultar funciones, coste y límites" : "Ver funciones, coste y límites"}
                </span>
              </span>
              <ChevronRight aria-hidden className={`mt-1 h-5 w-5 shrink-0 text-brand-400 transition-transform ${activo ? "rotate-90" : ""}`} />
            </button>
            {activo && (
              <>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{cam.queImplica}</p>
                <Candidatas opciones={cam.opciones} hayMas={cam.hayMas} />
              </>
            )}
          </section>
        );
      })}

      <section className="flex items-center gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
        <Baldosa icono={SlidersHorizontal} />
        <div className="flex-1">
          <p className="font-semibold text-slate-900">Afinar el consejo</p>
          <p className="text-sm text-slate-600">Añade un detalle o hazme una pregunta, abajo.</p>
        </div>
      </section>
    </div>
  );
}

/** B · Explorar: la orientación aparte, y los caminos como tarjetas. */
export function VarianteB({ caminos, quePide }: { caminos: Camino[]; quePide: string[] }) {
  const [mas, setMas] = useState(false);
  if (caminos.length === 0) return null;
  return (
    <div className="space-y-4">
      <Caso titulo="Buscas resolver" quePide={quePide} />

      <section className="flex gap-4 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
        <Baldosa icono={Sparkles} fuerte />
        <div>
          <p className="font-semibold text-brand-800">La orientación de Molnip</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {caminos.length > 1
              ? "Puedes resolverlo en un solo sitio o separarlo. Abajo tienes las dos, con lo que implica cada una."
              : caminos[0].queImplica}
          </p>
        </div>
      </section>

      {caminos.slice(0, mas ? caminos.length : 2).map((cam) => (
        <section key={cam.forma} className={`${TARJETA} p-5 shadow-premium`}>
          <div className="flex items-start gap-4">
            <Baldosa icono={ICONO_CAMINO[cam.forma] ?? Sparkles} />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">{cam.titulo}</p>
              <p className="mt-1 font-display text-lg font-bold leading-snug text-slate-900">
                {tituloDelCamino(cam.forma, quePide.length)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{cam.queImplica}</p>
          <Candidatas opciones={cam.opciones} hayMas={cam.hayMas} />
        </section>
      ))}

      {caminos.length > 2 && (
        <Boton variante="secundario" onClick={() => setMas(!mas)} className="w-full">
          <Search className="h-4 w-4" aria-hidden />
          {mas ? "Mostrar menos" : "Explorar más alternativas"}
        </Boton>
      )}
    </div>
  );
}
