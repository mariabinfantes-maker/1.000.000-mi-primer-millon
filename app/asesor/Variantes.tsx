"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";

/**
 * Nota de sistema: esto se reescribió el 2026-09-24 para cumplir MOLNIP
 * VISUAL v1, que la primera versión se saltaba. Tres líneas congeladas
 * cruzadas sin darse cuenta: los botones a mano en vez del componente
 * `Boton`, la tarjeta sin su receta única y las superficies sin la sombra de
 * marca. El aspecto «caro» no era algo que hubiera que inventar: estaba ya
 * pagado y escrito.
 */

/** La receta única de tarjeta. 30 apariciones idénticas en el proyecto. */
const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

/**
 * Las tres formas de enseñar el MISMO consejo, para poder elegir usándolas.
 *
 * Vienen de los bocetos de la propietaria (2026-09-24). Se montan sobre los
 * mismos datos a propósito: si cada una trajera su ejemplo, se compararían los
 * ejemplos y no los diseños.
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

const CURVA: Record<string, string> = {
  muy_facil: "Se coge muy rápido", facil: "Se coge rápido",
  media: "Lleva un rato aprenderla", dificil: "Cuesta aprenderla",
};

/** Una puerta que se abre. Las tres del boceto A tienen esta misma forma. */
function Puerta({ titulo, abierta, alPulsar, children }: {
  titulo: string; abierta: boolean; alPulsar: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-200/80 first:border-t-0">
      <button onClick={alPulsar} className="flex w-full items-center justify-between gap-3 py-3.5 text-left">
        <span className="text-sm font-semibold text-slate-800">{titulo}</span>
        <span aria-hidden className={`text-brand-500 transition-transform ${abierta ? "rotate-45" : ""}`}>+</span>
      </button>
      {abierta && <div className="pb-4 text-sm leading-relaxed text-slate-600">{children}</div>}
    </div>
  );
}

function Detalle({ p }: { p: Pieza }) {
  const [abierta, setAbierta] = useState<string | null>("resuelve");
  const alt = (k: string) => setAbierta(abierta === k ? null : k);
  return (
    <div className="mt-3">
      <Puerta titulo="Qué te resuelve" abierta={abierta === "resuelve"} alPulsar={() => alt("resuelve")}>
        <ul className="space-y-2">
          {p.queResuelve.map((q) => (
            <li key={q.necesidad}>
              <p className="text-slate-800">{q.necesidad}</p>
              {q.url && (
                <p className="text-xs text-slate-500">
                  Lo vimos en{" "}
                  <a href={q.url} target="_blank" rel="noreferrer noopener" className="underline">su página</a>{" "}
                  el {q.fecha}.
                </p>
              )}
            </li>
          ))}
        </ul>
      </Puerta>

      <Puerta titulo="Coste y puesta en marcha" abierta={abierta === "coste"} alPulsar={() => alt("coste")}>
        <p className="text-slate-800">{p.coste.desde ?? "No tenemos su precio comprobado."}</p>
        {p.coste.comprobadoEl && (
          <p className="text-xs text-slate-500">
            Precio comprobado el {p.coste.comprobadoEl}
            {p.coste.urlPrecios && (
              <>
                {" "}en{" "}
                <a href={p.coste.urlPrecios} target="_blank" rel="noreferrer noopener" className="underline">su tarifa</a>
              </>
            )}. Míralo antes de decidir: los precios cambian.
          </p>
        )}
        <ul className="mt-2 space-y-1">
          {p.coste.tienePlanGratuito && <li>· Tiene plan gratuito, así que puedes probarla sin pagar.</li>}
          {p.coste.curva && <li>· {CURVA[p.coste.curva] ?? p.coste.curva}.</li>}
          <li>· {p.coste.enEspanol ? "Está en español." : "No hemos confirmado que esté en español."}</li>
        </ul>
      </Puerta>

      <Puerta titulo="Qué falta por confirmar" abierta={abierta === "falta"} alPulsar={() => alt("falta")}>
        {p.faltaPorConfirmar.length === 0 ? (
          <p>De lo que nos pediste, no nos queda nada pendiente de comprobar en ésta.</p>
        ) : (
          <ul className="space-y-1">{p.faltaPorConfirmar.map((f) => <li key={f}>· {f}</li>)}</ul>
        )}
        <p className="mt-2 text-xs text-slate-500">
          Que algo no nos conste no significa que no lo haga: significa que no lo hemos podido comprobar.
        </p>
      </Puerta>
    </div>
  );
}

/** A · El consejo manda. La herramienta que propondría, abierta; el resto detrás. */
export function VarianteA({ caminos, quePide }: { caminos: Camino[]; quePide: string[] }) {
  const [mas, setMas] = useState(false);
  const principal = caminos[0]?.opciones[0];
  const otras = [...(caminos[0]?.opciones.slice(1) ?? []), ...(caminos[1]?.opciones ?? [])];
  if (!principal) return null;
  return (
    <div className="space-y-4">
      <section className={`${TARJETA} p-5 shadow-premium`}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Lo que quieres resolver</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quePide.map((q) => (
            <span key={q} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
              {q}
            </span>
          ))}
        </div>
      </section>

      <p className="text-slate-700">
        {caminos.length > 1
          ? "Podemos verlo con una herramienta que reúna las dos cosas, o resolverlas por separado."
          : "Esto es lo que he encontrado para lo que me cuentas."}
      </p>

      <h2 className="font-display text-xl font-bold text-slate-900">Opciones para tu negocio</h2>

      <section className={`${TARJETA} p-5 shadow-premium-lg ring-1 ring-brand-100`}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">
          {caminos[0].titulo}
        </p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
          {principal.piezas.map((p) => p.nombre).join("  +  ")}
        </p>
        {principal.piezas.map((p) => <Detalle key={p.herramientaId} p={p} />)}
      </section>

      {otras.length > 0 && (
        <>
          <Boton variante="secundario" onClick={() => setMas(!mas)} className="w-full">
            {mas ? "Ocultar alternativas" : `Ver más alternativas (${otras.length})`}
          </Boton>
          {mas && (
            <ul className="space-y-2">
              {otras.slice(0, 8).map((o, i) => (
                <li key={i} className={`${TARJETA} p-4`}>
                  <p className="font-semibold text-slate-900">{o.piezas.map((p) => p.nombre).join(" + ")}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {o.laConexionNoEstaComprobada
                      ? "Dos herramientas, y no hemos comprobado que se entiendan entre sí."
                      : "Otra que hace lo mismo."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** B · La tarjeta manda, y la orientación de Molnip va aparte, dicha como tal. */
export function VarianteB({ caminos, quePide }: { caminos: Camino[]; quePide: string[] }) {
  const [mas, setMas] = useState(false);
  const todas = caminos.flatMap((c) => c.opciones.map((o) => ({ o, camino: c })));
  if (todas.length === 0) return null;
  return (
    <div className="space-y-4">
      <section className={`${TARJETA} p-5 shadow-premium`}>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Buscas resolver</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quePide.map((q) => (
            <span key={q} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-100">
              {q}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
        <p className="text-sm font-semibold text-brand-800">La orientación de Molnip</p>
        <p className="mt-1.5 leading-relaxed text-slate-700">
          {caminos.length > 1
            ? `Puedes resolverlo en un solo sitio o separarlo. ${caminos[1].queImplica}`
            : caminos[0].queImplica}
        </p>
      </section>

      {todas.slice(0, mas ? 8 : 2).map(({ o, camino }, i) => (
        <section key={i} className={`${TARJETA} p-5 ${i === 0 ? "shadow-premium-lg" : "shadow-premium"}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">{camino.titulo}</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
            {o.piezas.map((p) => p.nombre).join("  +  ")}
          </p>
          {o.piezas.map((p) => <Detalle key={p.herramientaId} p={p} />)}
        </section>
      ))}

      {todas.length > 2 && (
        <Boton variante="secundario" onClick={() => setMas(!mas)} className="w-full">
          {mas ? "Mostrar menos" : `Mostrar más alternativas (${todas.length - 2})`}
        </Boton>
      )}
    </div>
  );
}
