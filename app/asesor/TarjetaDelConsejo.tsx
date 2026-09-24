"use client";

import { useState } from "react";
import { CalendarCheck, LayoutGrid, ChevronRight, Search, Sparkles, type LucideIcon } from "lucide-react";
import { Detalle, type Camino, type Opcion } from "./Variantes";

/**
 * LA TARJETA QUE SE CONTESTA MIRANDO.
 *
 * Nace de lo único que la propietaria supo decir con sus palabras sobre
 * diseño, el 2026-09-24, y que vale más que cualquier regla que me inventara
 * yo:
 *
 *   «Me gusta que el ojo sabe dónde mirar, la tarjeta ya te señala dónde
 *    tengo que mirar (...) quiero que los puntos clave sean fáciles de
 *    identificar para mi ojo, así ahorro tiempo y veo si es útil o no (...)
 *    en tus diseños me aburro y me agobio inmediatamente porque pienso que
 *    tendré que leer todo eso para saber si esa página me sirve.»
 *
 * El fallo que describe era real y medible: la versión anterior llegaba con
 * el primer camino ABIERTO, y dentro cada herramienta traía sus tres puertas.
 * Una peluquera aterrizaba en una columna de texto y tenía que leerla entera
 * para saber si le servía. Nadie hace eso: se va.
 *
 * Cinco reglas, sacadas de su boceto. Si alguna se rompe, la pantalla vuelve
 * a ser deberes:
 *
 *  1. MANDA EL RESULTADO, NO LA MARCA. El titular dice qué consigue. Los
 *     nombres de las herramientas están detrás del clic. Así ninguna vuelve
 *     a «parecer la dueña de todo».
 *  2. EL COLOR DICE CUÁL ES CUÁL. La recomendada va sobre fondo de marca; las
 *     otras, en blanco. Y el color va atado al ORDEN, no a si está abierta:
 *     antes teñía la abierta, así que el color decía «estás mirando esto» en
 *     vez de «ésta es la que te propongo», que es lo que ella necesita ver.
 *  3. UNA LÍNEA POR TARJETA, EL RESTO DETRÁS. «Ver funciones, coste y
 *     límites» es un enlace, no un párrafo. Las tres puertas —qué resuelve,
 *     coste, qué falta por confirmar— siguen enteras dentro. La honestidad no
 *     cuesta pantalla: cuesta un clic. El dilema entre enseñar las pruebas y
 *     no agobiar me lo había inventado yo.
 *  4. EL ICONO ADELANTA EL SIGNIFICADO. Calendario, todo junto; bloques, por
 *     separado.
 *  5. NADA LLEGA ABIERTO. Al aterrizar se ve el mapa entero: dos tarjetas y
 *     una salida. La decisión de leer es suya.
 */

const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

const ICONO: Record<string, LucideIcon> = { "todo-en-uno": CalendarCheck, "por-separado": LayoutGrid };

/**
 * Qué consigue, en una línea y CON SUS PALABRAS. Nunca un nombre de marca.
 *
 * Decía «una herramienta para cada cosa». Es exacto y no significa nada:
 * «cosa» es como lo llamamos nosotros. Ahora dice «Reservas y facturas, en
 * dos herramientas», que es lo que ella ha venido a resolver. De ahí sale el
 * `enCorto` del vocabulario.
 */
function enumerar(cosas: string[]): string {
  if (cosas.length === 0) return "lo que me has contado";
  if (cosas.length === 1) return cosas[0];
  if (cosas.length === 2) return `${cosas[0]} y ${cosas[1]}`;
  return `${cosas[0]}, ${cosas[1]} y ${cosas.length - 2} cosas más`;
}

/**
  * Lo que resuelve ESTA opción, no todo lo que ella pidió.
  *
  * Primero decía «reservas, agenda y 8 cosas más» porque contaba las diez que
  * trae el oficio. La peluquera leía que esto se lo resuelve todo, y no es
  * verdad: estas dos herramientas cubren lo que cubren. El titular tiene que
  * decir eso y nada más.
  */
function titular(forma: string, opcion: Opcion | undefined): string {
  const cubiertas = [...new Set((opcion?.piezas ?? []).flatMap((p) => p.cubreEnCorto))];
  const lista = enumerar(cubiertas);
  const piezas = opcion?.piezas.length ?? 2;
  const donde = forma === "todo-en-uno" ? "en un solo sitio" : piezas > 2 ? `en ${piezas} herramientas` : "en dos herramientas";
  const frase = `${lista}, ${donde}`;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

/** El cuadrado con el icono. Lleno en la que manda, con tinte en las demás. */
function Baldosa({ icono: Icono, manda }: { icono: LucideIcon; manda: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
        manda ? "bg-brand-600 text-white shadow-premium" : "bg-brand-50 text-brand-600 ring-1 ring-brand-100"
      }`}
    >
      <Icono className="h-5 w-5" strokeWidth={2} />
    </span>
  );
}

/**
 * Las herramientas, ya dentro. Y aquí ESTABA LA PARED.
 *
 * La primera versión pintaba las tres puertas —qué resuelve, coste, qué
 * falta— de CADA pieza de CADA combinación. Con cuatro combinaciones de dos
 * herramientas salían veinticuatro filas casi idénticas, una detrás de otra.
 * Es literalmente lo que ella describe: «me agobio inmediatamente porque
 * pienso que tendré que leer todo eso».
 *
 * Ahora cada combinación es UNA línea. Sus puertas sólo aparecen cuando se
 * abre esa combinación, y sólo la que se abre. Ningún nivel enseña más de lo
 * que cabe de un vistazo.
 */
function Dentro({ opciones, hayMas, queImplica }: { opciones: Opcion[]; hayMas: number; queImplica: string }) {
  const [cual, setCual] = useState<number | null>(null);
  return (
    <div className="mt-4 border-t border-slate-200/80 pt-4">
      <p className="text-sm leading-relaxed text-slate-600">{queImplica}</p>
      <ul className="mt-4 space-y-2">
        {opciones.map((o, j) => {
          const abierta = cual === j;
          return (
            <li key={j} className={`${TARJETA} px-4 py-3`}>
              <button onClick={() => setCual(abierta ? null : j)} className="flex w-full items-center gap-3 text-left">
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{o.piezas.map((p) => p.nombre).join("  +  ")}</span>
                  <span className="block text-sm text-brand-700">{abierta ? "Ocultar" : "Ver el detalle"}</span>
                </span>
                <ChevronRight aria-hidden className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${abierta ? "rotate-90" : ""}`} />
              </button>
              {abierta && (
                <>
                  {o.laConexionNoEstaComprobada && (
                    <p className="mt-2 text-xs text-slate-500">Sin comprobar que se entiendan entre sí.</p>
                  )}
                  {/*
                    Con dos herramientas, las tres puertas salen dos veces. Sin
                    decir de cuál son, se lee como seis filas repetidas: hay que
                    nombrar a quién pertenece cada juego.
                  */}
                  {o.piezas.map((p) => (
                    <div key={p.herramientaId}>
                      {o.piezas.length > 1 && (
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{p.nombre}</p>
                      )}
                      <Detalle p={p} />
                    </div>
                  ))}
                </>
              )}
            </li>
          );
        })}
        {hayMas > 0 && <li className="px-1 text-sm text-slate-600">Y {hayMas} más que también lo cubren.</li>}
      </ul>
    </div>
  );
}

export default function TarjetaDelConsejo({ caminos }: { caminos: Camino[] }) {
  const [abierto, setAbierto] = useState<string | null>(null);
  if (caminos.length === 0) return null;

  return (
    <div className="space-y-3">
      {caminos.map((cam, i) => {
        const manda = i === 0;
        const abierta = abierto === cam.forma;
        return (
          <section
            key={cam.forma}
            className={
              manda
                ? "rounded-2xl bg-brand-50 p-5 ring-1 ring-brand-200 shadow-premium-lg"
                : `${TARJETA} p-5 shadow-premium`
            }
          >
            <button
              onClick={() => setAbierto(abierta ? null : cam.forma)}
              className="flex w-full items-center gap-4 text-left"
            >
              <Baldosa icono={ICONO[cam.forma] ?? Sparkles} manda={manda} />
              <span className="flex-1">
                <span className="inline-block rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                  Opción {String.fromCharCode(65 + i)} · {cam.titulo}
                </span>
                <span className="mt-2 block font-display text-lg font-bold leading-snug text-slate-900">
                  {titular(cam.forma, cam.opciones[0])}
                </span>
                <span className="mt-1 block text-sm font-semibold text-brand-700">
                  {abierta ? "Ocultar el detalle" : "Ver funciones, coste y límites"}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className={`h-5 w-5 shrink-0 text-brand-400 transition-transform ${abierta ? "rotate-90" : ""}`}
              />
            </button>
            {abierta && <Dentro opciones={cam.opciones} hayMas={cam.hayMas} queImplica={cam.queImplica} />}
          </section>
        );
      })}

      <div className={`${TARJETA} flex items-center gap-3 px-5 py-4 text-slate-600`}>
        <Search className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
        <span className="flex-1 text-sm font-semibold text-slate-800">Explorar más alternativas</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
      </div>
    </div>
  );
}
