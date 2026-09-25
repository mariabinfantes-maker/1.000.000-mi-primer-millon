"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowRight, Pencil, type LucideIcon, CalendarCheck, LayoutGrid, Sparkles } from "lucide-react";
import SimboloMolnip from "@/components/ui/SimboloMolnip";
import { type Camino, type Opcion } from "./Variantes";

/**
 * «ESTAS SON TUS OPCIONES» — la imagen 4 del boceto de la propietaria
 * (2026-09-25), seguida de cerca y a propósito.
 *
 * LO QUE HABÍA AQUÍ ANTES, Y POR QUÉ SE APAGA. Dos tarjetas, «Opción A · Todo
 * en un sitio» y «Opción B · Por separado», con un titular que decía
 * «Expedientes, presupuestos y 4 cosas más, en dos herramientas». Tres
 * defectos, y los tres los había diagnosticado yo mismo el día anterior antes
 * de volver a cometerlos:
 *
 *  1. **«y 4 cosas más» es un acertijo.** Para saber cuáles hay que abrir.
 *  2. **Obligaba a elegir entre dos caminos** antes de saber nada de ninguno.
 *  3. **No decía nada.** Ofrecía.
 *
 * Sus palabras, que son el listón: «quien entra a que la ayuden no quiere
 * elegir entre caminos», «lo que a nosotros nos conviene es hacer nosotros el
 * trabajo y dárselo masticadito», «si yo entro a una página donde tengo que
 * entender la página, ya no quiero entrar».
 *
 * LO QUE HACE AHORA, copiado de su imagen 4:
 *
 *  - Una fila por opción, con **el precio a la vista**. «¿Cuánto me cuesta?»
 *    se contesta sin abrir nada.
 *  - La descripción nombra **lo que cubre, con sus palabras y sin acertijo**:
 *    como mucho tres cosas, y las demás están en su ficha. Nunca «y N más».
 *  - **«Mi consejo»**, abajo y en primera persona. Ahí Molnip se moja. Es la
 *    diferencia entre ofrecer y decir, y sale de `desempate.porQue`, que el
 *    motor ya calculaba.
 *
 * La forma de resolverlo —todo junto o repartido— **no desaparece**: era una
 * idea suya del 24 y sigue mandando en el motor. Lo que cambia es que deja de
 * ser una bifurcación que ella tiene que resolver y pasa a ser parte de la
 * frase: «en un mismo sitio», «en dos herramientas».
 */

const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

export type Abierta = { opcion: Opcion; titular: string; porQue?: string };

const ICONO: Record<string, LucideIcon> = { "todo-en-uno": CalendarCheck, "por-separado": LayoutGrid };

/** Como mucho tres cosas, sin anunciar un resto que habría que ir a buscar. */
const A_LA_VISTA = 3;

function enumerar(cosas: string[]): string {
  if (cosas.length === 0) return "lo que me has contado";
  if (cosas.length === 1) return cosas[0];
  return `${cosas.slice(0, -1).join(", ")} y ${cosas[cosas.length - 1]}`;
}

/**
 * Lo mismo en dos palabras, para cuando habla Molnip.
 *
 * Los títulos del vocabulario están en primera persona de ella —«que puedan
 * reservar sin llamarME»— y en la fila eso está bien: es devolverle sus
 * palabras. Pero en «Mi consejo» habla Molnip, y ahí sonaba a que se
 * confundían las voces.
 */
function cubreEnCorto(opcion: Opcion): string[] {
  return [...new Set(opcion.piezas.flatMap((p) => p.cubreEnCorto))].slice(0, A_LA_VISTA);
}

/** Lo que resuelve, con las palabras del vocabulario. Como mucho tres. */
export function queResuelve(opcion: Opcion): string[] {
  return [...new Set(opcion.piezas.flatMap((p) => p.queResuelve.map((q) => q.necesidad)))].slice(0, A_LA_VISTA);
}

/** Qué resuelve y de qué forma, en una frase. Nunca «y N cosas más». */
export function titular(forma: string, opcion: Opcion | undefined): string {
  const cubre = [...new Set((opcion?.piezas ?? []).flatMap((p) => p.cubreEnCorto))].slice(0, A_LA_VISTA);
  const piezas = opcion?.piezas.length ?? 1;
  const donde =
    forma === "todo-en-uno" || piezas === 1
      ? "en un mismo sitio"
      : piezas > 2
        ? `en ${piezas} herramientas`
        : "en dos herramientas";
  const frase = `${enumerar(cubre)}, ${donde}`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

/**
 * El precio para la lista: la cifra CORTA de los planes citados.
 *
 * La primera versión ponía `coste.desde`, que en 52 de las 65 fichas es una
 * frase entera. La pantalla se rompió de lado a lado: una fila de la lista
 * llevaba «Gratis para miembros ilimitados, con 2 proyectos activos. De pago
 * desde $10/usuario/mes». Eso no contesta «¿cuánto me cuesta?»: hay que
 * leerlo. Ahora sale de `desdeCorto`, con su unidad y sin convertir.
 */
function precio(opcion: Opcion): { cifra: string; nota?: string } {
  const cortos = opcion.piezas.map((p) => p.coste.desdeCorto).filter(Boolean) as string[];
  const gratis = opcion.piezas.every((p) => p.coste.tienePlanGratuito);
  if (cortos.length < opcion.piezas.length) {
    return gratis ? { cifra: "Tiene plan gratuito", nota: "y planes de pago" } : { cifra: "Precio en su web" };
  }
  return {
    cifra: `desde ${cortos.join(" + ")}`,
    nota: opcion.piezas.length > 1 ? "son dos cuotas" : gratis ? "y plan gratuito" : undefined,
  };
}

function Baldosa({ icono: Icono }: { icono: LucideIcon }) {
  return (
    <span aria-hidden className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
      <Icono className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

function Fila({ opcion, forma, alAbrir }: { opcion: Opcion; forma: string; alAbrir: () => void }) {
  const p = precio(opcion);
  return (
    <button onClick={alAbrir} className={`${TARJETA} w-full p-5 text-left shadow-premium transition hover:border-brand-200`}>
      <div className="flex items-start gap-4">
        <Baldosa icono={ICONO[forma] ?? Sparkles} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight text-slate-900">
            {opcion.piezas.map((x) => x.nombre).join(" + ")}
          </p>
          {/*
            LO QUE LE RESUELVE, CON SUS PALABRAS.
            Antes ponía «reservas y facturas, en un mismo sitio»: nombraba el
            tema y la forma, pero no el trabajo. Propietaria, 2026-09-25:
            «falta conectar la herramienta con el trabajo concreto de esa
            clínica: qué reserva permite gestionar y cómo resuelve la
            facturación». Ahora se escriben las necesidades tal y como están
            dichas en el vocabulario, que son sus palabras; la forma —en un
            sitio o en dos— baja a una etiqueta, que es lo que es.
          */}
          <ul className="mt-1.5 space-y-0.5">
            {queResuelve(opcion).map((t) => (
              <li key={t} className="text-sm leading-relaxed text-slate-600">{t}</li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">
            {forma === "todo-en-uno" || opcion.piezas.length === 1 ? "En un mismo sitio" : `En ${opcion.piezas.length} herramientas`}
          </p>
          {/*
            Lo que NO le resuelve, y lo que le cuesta de verdad si son dos
            programas. Las dos cosas cambian su decisión, así que van en la
            fila y no en letra pequeña.

            Aquí decía además «y no hemos comprobado que se conecten». Eso no
            era información suya: era Molnip enseñando hasta dónde llegó su
            trabajo. Propietaria, 2026-09-25: «nuestro trabajo no es demostrar
            que hicimos los deberes, es dar buena información al cliente».
          */}
          {opcion.piezas.length > 1 && (
            <p className="mt-1.5 text-sm font-semibold text-atencion-700">
              Son {opcion.piezas.length} programas y {opcion.piezas.length} cuotas
            </p>
          )}
          {opcion.noCubre.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">No te cubre {enumerar(opcion.noCubre.slice(0, 3))}</p>
          )}
          <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            Ver herramienta <ArrowRight className="h-4 w-4" aria-hidden />
          </p>
        </div>
        <div className="w-24 shrink-0 text-right">
          <p className="font-display text-sm font-bold leading-snug text-slate-900">{p.cifra}</p>
          {p.nota && <p className="mt-0.5 text-xs leading-snug text-slate-500">{p.nota}</p>}
        </div>
      </div>
    </button>
  );
}

export default function TarjetaDelConsejo({
  caminos, porQue, quePide, alAbrir,
}: {
  caminos: Camino[];
  /** Por qué Molnip miraría ésa primero. Es donde se moja. */
  porQue?: string;
  /** Lo que ella ha contado, para que se vea que Molnip lo tiene presente. */
  quePide?: string[];
  alAbrir: (a: Abierta) => void;
}) {
  const [mas, setMas] = useState(false);
  if (caminos.length === 0) return null;

  /**
   * TRES A LA VISTA, y el resto detrás.
   *
   * La primera versión enseñaba una por camino, así que a un taller mecánico
   * —que sólo tiene un camino— le salía una sola fila. Ni es lo que dibujó la
   * propietaria (tres herramientas con su precio) ni lo que dice el ACUERDO
   * DE RUMBO del 17: «se siguen recomendando tres con explicación».
   *
   * Se ordenan poniendo primero la que encabeza cada camino, para que las
   * formas distintas de resolverlo —todo junto o repartido— aparezcan antes
   * que la cuarta variante de la misma.
   */
  const todas = [
    ...caminos.map((cam) => ({ opcion: cam.opciones[0], forma: cam.forma })),
    ...caminos.flatMap((cam) => cam.opciones.slice(1).map((o) => ({ opcion: o, forma: cam.forma }))),
  ];

  /**
   * LA LISTA ENSEÑA HERRAMIENTAS SUELTAS. Los apilamientos van detrás.
   *
   * Aunque el motor ya pone la sencilla primero, dejar debajo dos montajes de
   * dos y tres programas seguía siendo trabajo para ella: comparar peras con
   * manzanas justo cuando ha venido a que le digan qué hacer. La propietaria,
   * el 2026-09-25: «no le compliques la vida al cliente, por favor».
   *
   * No se pierden: quedan en «explorar», con lo que cuestan de verdad escrito
   * al lado —cuántas cuotas y si sabemos que se conectan—. Y si no hay ni una
   * suelta que sirva, entonces sí encabezan, porque quedarse callado teniendo
   * algo tampoco ayuda.
   */
  const sueltas = todas.filter((o) => o.opcion.piezas.length === 1);
  const apiladas = todas.filter((o) => o.opcion.piezas.length > 1);
  const alaVista = (sueltas.length > 0 ? sueltas : apiladas).slice(0, 3);
  const otras = [...(sueltas.length > 0 ? sueltas : apiladas).slice(3), ...(sueltas.length > 0 ? apiladas : [])];
  const abrir = (o: Opcion, forma: string, primera: boolean) =>
    alAbrir({ opcion: o, titular: titular(forma, o), porQue: primera ? porQue : undefined });

  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Estas son tus opciones</h2>

      {/*
        El recordatorio de su caso. Con diez necesidades, pegarlas todas era
        otro muro: se enseñan las primeras y el resto vive detrás de «Editar».
        No se anuncia un resto («y 7 más») porque eso es el acertijo otra vez.
      */}
      {quePide && quePide.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
          <p className="min-w-0 flex-1 text-sm font-semibold text-brand-900">{quePide.slice(0, 3).join(" · ")}</p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <Pencil className="h-4 w-4" aria-hidden /> Editar
          </span>
        </div>
      )}

      {alaVista.map((o, i) => (
        <Fila key={i} opcion={o.opcion} forma={o.forma} alAbrir={() => abrir(o.opcion, o.forma, i === 0)} />
      ))}

      {porQue && (
        <div className="flex gap-3 rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-100">
          <SimboloMolnip className="mt-0.5 h-8 w-8 shrink-0 rounded-xl" />
          <div>
            <p className="font-display text-base font-bold text-brand-900">Mi consejo</p>
            {/*
              EL ENCAJE PRIMERO, EL DESEMPATE DESPUÉS.
              Decía «empezaría por Agiled. De las que te valen, es la única que
              está en español»: aconsejaba por el idioma sin haber explicado
              nunca por qué le vale. Propietaria, 2026-09-25: «el idioma puede
              apoyar la elección, pero no sustituir esa explicación». Se
              compone con frases que ya existen; no se añade ningún bloque.
            */}
            <p className="mt-1 leading-relaxed text-brand-900">
              Empezaría por {alaVista[0].opcion.piezas.map((x) => x.nombre).join(" + ")}
              {": te lleva "}
              {enumerar(cubreEnCorto(alaVista[0].opcion))}
              {alaVista[0].opcion.piezas.length === 1 ? " desde un mismo sitio" : ""}. {porQue}
            </p>
          </div>
        </div>
      )}

      {otras.length > 0 && (
        <>
          <button onClick={() => setMas(!mas)} className={`${TARJETA} flex w-full items-center gap-3 px-5 py-4 text-left`}>
            <span className="flex-1 text-sm font-semibold text-slate-800">
              {mas ? "Ocultar las demás" : `Explorar ${otras.length} opciones más`}
            </span>
            <ChevronDown aria-hidden className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${mas ? "rotate-180" : ""}`} />
          </button>
          {mas &&
            otras.map((o, i) => (
              <button
                key={i}
                onClick={() => abrir(o.opcion, o.forma, false)}
                className={`${TARJETA} flex w-full items-center gap-3 px-5 py-4 text-left`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{o.opcion.piezas.map((x) => x.nombre).join(" + ")}</span>
                  <span className="block text-sm text-slate-600">{titular(o.forma, o.opcion)}</span>
                  {o.opcion.piezas.length > 1 && (
                    <span className="block text-sm font-semibold text-atencion-700">
                      {o.opcion.piezas.length} programas y {o.opcion.piezas.length} cuotas
                    </span>
                  )}
                </span>
                <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-slate-300" />
              </button>
            ))}
        </>
      )}
    </div>
  );
}
