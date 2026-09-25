"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronDown, CalendarCheck, FileText, Users, Coins,
  BookOpen, type LucideIcon,
} from "lucide-react";
import Boton from "@/components/ui/Boton";
import SimboloMolnip from "@/components/ui/SimboloMolnip";
import type { Opcion, Pieza } from "./Variantes";

/**
 * PANTALLA 1 DEL BOCETO — «Abres una opción» (propietaria, 2026-09-25).
 *
 * De cuatro pantallas que dibujó, señaló dos: «me gusta mucho cómo se ven la 1
 * y la 3 (...) se ven muy bien visualmente». Ésta es la 1.
 *
 * Lo que resuelve, y que ninguna versión anterior resolvía: **una pantalla,
 * una cosa**. Aquí no hay nada que comparar ni entre lo que elegir. Se entra
 * habiendo elegido ya, y lo único que se hace es mirar esto.
 *
 * Las seis piezas de su boceto, y de dónde sale cada una. Ninguna se inventa:
 *
 *  1. **Vuelta atrás siempre visible** («← Mis opciones»). Abrir no es
 *     encerrarse.
 *  2. **El consejo en primera persona, y comprometido**: «la miraría primero
 *     porque reúne las dos tareas que quieres resolver». Sale de
 *     `desempate.porQue`, que ya existía y no se enseñaba en ningún sitio.
 *  3. **Lo que hace, contado como su vida**, una línea por cosa con su icono.
 *     Sale de `queResuelve`, que son SUS necesidades — no funciones del
 *     fabricante.
 *  4. **«Para empezar»**: lo que le va a tocar hacer a ella. Sale de
 *     `loQueTeCuesta` del vocabulario, que cuelga de la necesidad y no de la
 *     marca, porque dar de alta tus servicios hay que hacerlo con cualquier
 *     programa. Llevaba escrito desde F1 y no lo leía nadie.
 *  5. **El precio y las fuentes, plegados.** Ahí va toda la evidencia: la
 *     fecha, la página que se abrió, lo que falta por confirmar. No desaparece
 *     y no pesa. «La honestidad no cuesta pantalla: cuesta un clic.»
 *  6. **Un solo botón.** Una pantalla, una acción.
 */

const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

/**
 * Tres tintes para las filas, rotando. En su boceto cada fila lleva un color
 * distinto y por eso el ojo las separa sin leerlas. Los tres salen del sistema
 * —`brand`, `info`, `exito`—: no hay ni un color escrito a mano.
 */
const TINTES = [
  "bg-brand-50 text-brand-600 ring-brand-100",
  "bg-info-50 text-info-600 ring-info-100",
  "bg-exito-50 text-exito-600 ring-exito-100",
];
const ICONOS: LucideIcon[] = [CalendarCheck, Users, FileText];

function Fila({ i, children }: { i: number; children: React.ReactNode }) {
  const Icono = ICONOS[i % ICONOS.length];
  return (
    <li className="flex items-center gap-3.5 py-2.5">
      <span aria-hidden className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${TINTES[i % TINTES.length]}`}>
        <Icono className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="text-slate-800">{children}</span>
    </li>
  );
}

/** Una sección plegada: icono, título y galón. Cerrada al llegar. */
function Plegada({ icono: Icono, titulo, children }: { icono: LucideIcon; titulo: string; children: React.ReactNode }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="border-t border-slate-200/80">
      <button onClick={() => setAbierta(!abierta)} className="flex w-full items-center gap-3 py-4 text-left">
        <span aria-hidden className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icono className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="flex-1 font-semibold text-slate-800">{titulo}</span>
        <ChevronDown aria-hidden className={`h-5 w-5 text-slate-400 transition-transform ${abierta ? "rotate-180" : ""}`} />
      </button>
      {abierta && <div className="pb-4 pl-11 text-sm leading-relaxed text-slate-600">{children}</div>}
    </div>
  );
}

const CURVA: Record<string, string> = {
  muy_facil: "Se aprende muy rápido", facil: "Se aprende rápido",
  media: "Lleva un rato aprenderla", dificil: "Cuesta aprenderla",
};

function Coste({ p }: { p: Pieza }) {
  return (
    <>
      <p className="text-base font-semibold text-slate-900">{p.coste.desde ?? "Consúltalo en su web"}</p>
      {p.coste.comprobadoEl && (
        <p className="mt-1 text-xs text-slate-500">
          Comprobado el {p.coste.comprobadoEl}
          {p.coste.urlPrecios && (
            <> en <a href={p.coste.urlPrecios} target="_blank" rel="noreferrer noopener" className="underline">su tarifa</a></>
          )}
        </p>
      )}
      <ul className="mt-2.5 space-y-1">
        {p.coste.tienePlanGratuito && <li>Tiene plan gratuito.</li>}
        {p.coste.curva && <li>{CURVA[p.coste.curva] ?? p.coste.curva}.</li>}
        {/*
          El idioma se dice cuando lo sabemos y es una ventaja suya. Antes se
          escribía también cuando NO lo sabíamos —«en español: sin
          comprobar»—, que no le sirve para nada: es el estado de nuestro
          trabajo, no una característica del programa. Quien elige por idioma
          sigue protegida: el consejo lo dice en voz alta cuando decide.
        */}
        {p.coste.enEspanol && <li>Está en español.</li>}
      </ul>
    </>
  );
}

function Fuentes({ p }: { p: Pieza }) {
  return (
    <>
      {/*
        Esto era «Funciones y fuentes»: cada cosa con la página donde la vimos
        y la fecha en que se abrió, más una lista de lo que nos faltaba por
        confirmar. Era el recibo de nuestro trabajo puesto delante de ella.
        Ahora es lo que incluye, y un enlace a su página por si quiere verlo —
        que es útil, no una prueba. La evidencia sigue entera en la capa de
        verificación, que es donde trabaja: sirve para que no digamos una
        mentira, no para que ella nos audite.
      */}
      <ul className="space-y-2">
        {p.queResuelve.map((q) => (
          <li key={q.necesidad} className="text-slate-800">
            {q.url ? (
              <a href={q.url} target="_blank" rel="noreferrer noopener" className="underline decoration-slate-300 underline-offset-2">
                {q.necesidad}
              </a>
            ) : (
              q.necesidad
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function FichaDeUnaOpcion({
  opcion, titular, porQue, alVolver,
}: {
  opcion: Opcion;
  /** Qué consigue, en una línea. El mismo de la tarjeta. */
  titular: string;
  /** Por qué la miraría primero. Vacío si no hay una razón que dar. */
  porQue?: string;
  alVolver: () => void;
}) {
  const piezas = opcion.piezas;
  const nombre = piezas.map((p) => p.nombre).join(" + ");
  // Sus necesidades, sin repetir cuando dos piezas cubren la misma.
  const resuelve = [...new Map(piezas.flatMap((p) => p.queResuelve).map((q) => [q.necesidad, q])).values()];
  const paraEmpezar = [...new Set(resuelve.map((q) => q.loQueTeCuesta).filter(Boolean))] as string[];

  return (
    <div className="space-y-5">
      <button onClick={alVolver} className="flex items-center gap-2 text-sm font-semibold text-brand-700">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Mis opciones
      </button>

      <div className="flex items-start gap-4">
        <span aria-hidden className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <CalendarCheck className="h-7 w-7" strokeWidth={2} />
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-slate-900">{nombre}</h2>
          <p className="mt-0.5 text-slate-600">{titular}</p>
        </div>
      </div>

      {porQue && (
        <div className="flex gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100">
          <SimboloMolnip className="mt-0.5 h-7 w-7 shrink-0 rounded-xl" />
          <p className="font-semibold leading-relaxed text-brand-900">{porQue}</p>
        </div>
      )}



      <ul>{resuelve.map((q, i) => <Fila key={q.necesidad} i={i}>{q.necesidad}</Fila>)}</ul>

      {paraEmpezar.length > 0 && (
        <div className={`${TARJETA} p-5`}>
          <p className="font-display text-lg font-bold text-slate-900">Para empezar</p>
          <ul className="mt-1.5 space-y-1.5 text-sm leading-relaxed text-slate-600">
            {paraEmpezar.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      )}

      <div>
        {piezas.map((p) => (
          <div key={p.herramientaId}>
            {piezas.length > 1 && (
              <p className="pt-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{p.nombre}</p>
            )}
            <Plegada icono={Coins} titulo="Precio y condiciones"><Coste p={p} /></Plegada>
            <Plegada icono={BookOpen} titulo="Qué incluye"><Fuentes p={p} /></Plegada>
          </div>
        ))}
      </div>

      <Boton tamano="grande" className="w-full">
        Ver cómo funciona
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Boton>
    </div>
  );
}
