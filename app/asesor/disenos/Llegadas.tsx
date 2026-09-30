"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Boton from "@/components/ui/Boton";
import SimboloMolnip from "@/components/ui/SimboloMolnip";

/**
 * Tres llegadas para la misma pantalla de dos segundos.
 *
 * Mismo contenido en las tres —símbolo, nombre, una promesa, una caja y unos
 * ejemplos—, para que lo que se compare sea el diseño y no el texto. Ninguna
 * inventa un dato: los números que aparecen son los reales del catálogo.
 */

const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

const EJEMPLOS = [
  "Paso los presupuestos a factura a mano y repito el trabajo",
  "Quiero que los clientes reserven sin llamar por teléfono",
  "Llevamos el inventario en una hoja de cálculo",
];

/** A · SERENA. Todo centrado, mucho aire, nada compite con la caja. */
function Serena() {
  return (
    <div className="mx-auto flex min-h-[860px] max-w-xl flex-col justify-center px-6 py-20">
      <div className="text-center">
        <SimboloMolnip className="mx-auto h-16 w-16 rounded-3xl shadow-premium-lg" />
        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900">Molnip</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Cuéntame qué necesita tu negocio. Busco entre 65 herramientas y te digo cuál te sirve —{" "}
          <span className="font-semibold text-slate-800">y cuál no</span>.
        </p>
      </div>
      <div className="mt-10 flex items-center gap-2 rounded-3xl border border-slate-200/80 bg-white p-2 pl-6 shadow-premium-lg">
        <span className="flex-1 py-3 text-slate-400">Escribe aquí lo que te pasa…</span>
        <Boton tamano="grande" className="rounded-2xl">Empezar</Boton>
      </div>
      <div className="mt-8">
        <p className="text-center text-sm text-slate-500">Por ejemplo:</p>
        <div className="mt-3 flex flex-col gap-2">
          {EJEMPLOS.map((e) => (
            <p key={e} className={`${TARJETA} px-5 py-3 text-sm text-slate-600`}>{e}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** B · EDITORIAL. Titular grande a la izquierda: el beneficio manda, no la marca. */
function Editorial() {
  return (
    <div className="min-h-[860px] bg-gradient-to-b from-brand-50 to-background px-6 py-20">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2.5">
          <SimboloMolnip className="h-9 w-9 rounded-xl shadow-premium" />
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">Molnip</span>
        </div>
        <h1 className="mt-12 font-display text-5xl font-bold leading-[1.0] tracking-tight text-slate-900">
          El programa
          <br />
          que tu negocio
          <br />
          <span className="text-brand-600">sí necesita.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">
          Cuéntamelo con tus palabras. Miro 65 herramientas una por una y te digo cuál te sirve, cuánto cuesta y qué
          no te resuelve.
        </p>
        <div className="mt-10 rounded-3xl bg-white p-2 pl-6 shadow-premium-lg">
          <div className="flex items-center gap-2">
            <span className="flex-1 py-3.5 text-slate-400">Escribe aquí lo que te pasa…</span>
            <Boton tamano="grande" className="rounded-2xl">
              Empezar <ArrowRight className="h-4 w-4" aria-hidden />
            </Boton>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {EJEMPLOS.map((e) => (
            <p key={e} className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200/80">
              {e}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** C · CON RESPALDO. Igual de limpia, pero dice de dónde sale lo que afirma. */
function ConRespaldo() {
  const PRUEBAS = [
    "65 herramientas, una por una",
    "863 datos comprobados en la web del fabricante",
    "Con la fecha y la página que se abrió",
  ];
  return (
    <div className="mx-auto flex min-h-[860px] max-w-xl flex-col justify-center px-6 py-20">
      <div className="flex items-center gap-3">
        <SimboloMolnip className="h-12 w-12 rounded-2xl shadow-premium" />
        <div>
          <p className="font-display text-2xl font-bold tracking-tight text-slate-900">Molnip</p>
          <p className="text-sm font-semibold text-slate-500">Asesor de software para empresas</p>
        </div>
      </div>
      <h1 className="mt-10 font-display text-3xl font-bold leading-tight tracking-tight text-slate-900">
        Cuéntame qué necesita tu negocio y te digo qué usar.
      </h1>
      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 pl-5 shadow-premium-lg">
        <span className="flex-1 py-3 text-slate-400">Escribe aquí lo que te pasa…</span>
        <Boton tamano="grande" className="rounded-xl">Empezar</Boton>
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        {EJEMPLOS.map((e) => (
          <p key={e} className="text-sm text-brand-700">{e}</p>
        ))}
      </div>
      <div className="mt-10 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Sobre lo que te digo</p>
        <ul className="mt-3 space-y-2.5">
          {PRUEBAS.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const CUAL = { a: Serena, b: Editorial, c: ConRespaldo } as const;

export default function Llegadas() {
  const [cual, setCual] = useState<keyof typeof CUAL>("a");
  const Elegida = CUAL[cual];
  return (
    <div className="pt-24">
      <div className="mx-auto mb-2 flex max-w-xl gap-1 rounded-full border border-slate-200/80 bg-white p-1 text-sm shadow-premium">
        {([["a", "A · Serena"], ["b", "B · Editorial"], ["c", "C · Con respaldo"]] as const).map(([k, n]) => (
          <button
            key={k}
            onClick={() => setCual(k)}
            className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${cual === k ? "bg-brand-600 text-white shadow-premium" : "text-slate-600 hover:text-brand-700"}`}
          >
            {n}
          </button>
        ))}
      </div>
      <Elegida />
    </div>
  );
}
