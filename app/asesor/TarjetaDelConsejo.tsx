"use client";

import { useState } from "react";
import { CalendarCheck, LayoutGrid, ChevronRight, Search, Sparkles, type LucideIcon } from "lucide-react";
import { type Camino, type Opcion } from "./Variantes";

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
 * Aquí vivía `Dentro`, que abría la opción EN EL SITIO: la combinación, y
 * debajo sus tres puertas, y debajo las de la otra pieza. Se apagó el
 * 2026-09-25 al construir la pantalla 1 del boceto de la propietaria.
 *
 * El motivo no es de estilo. Abrir en el sitio obliga a sostener a la vez la
 * lista y el detalle, y eso es lo que ella no quiere hacer: «si yo entro a una
 * página donde tengo que entender la página, ya no quiero entrar». Abrir una
 * opción ahora LLEVA a su pantalla, donde no hay nada que comparar. Una
 * pantalla, una cosa. Lo que se enseña dentro no se ha recortado: está entero
 * en `FichaDeUnaOpcion`.
 */

export type Abierta = { opcion: Opcion; titular: string; porQue?: string };

/**
 * La ficha NO se abre aquí dentro, y no es un detalle de implementación.
 *
 * La primera versión la pintaba debajo de las tarjetas, así que encima de la
 * pantalla 1 seguían la cabecera, la conversación y la pregunta. El boceto de
 * la propietaria es una pantalla ENTERA: arriba del todo «← Mis opciones» y
 * nada por encima. Por eso el padre se entera de que hay una opción abierta y
 * esconde lo demás.
 */
export default function TarjetaDelConsejo({
  caminos, porQue, alAbrir,
}: { caminos: Camino[]; porQue?: string; alAbrir: (a: Abierta) => void }) {
  const [mas, setMas] = useState(false);
  if (caminos.length === 0) return null;

  // Las demás combinaciones de todos los caminos, sin la que encabeza cada uno.
  const otras = caminos.flatMap((cam) =>
    cam.opciones.slice(1).map((o) => ({ opcion: o, titular: titular(cam.forma, o) }))
  );

  return (
    <div className="space-y-3">
      {caminos.map((cam, i) => {
        const manda = i === 0;
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
              onClick={() => alAbrir({ opcion: cam.opciones[0], titular: titular(cam.forma, cam.opciones[0]), porQue: manda ? porQue : undefined })}
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
                <span className="mt-1 block text-sm font-semibold text-brand-700">Ver funciones, coste y límites</span>
              </span>
              <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-brand-400" />
            </button>
          </section>
        );
      })}

      {otras.length > 0 && (
        <>
          <button onClick={() => setMas(!mas)} className={`${TARJETA} flex w-full items-center gap-3 px-5 py-4 text-left`}>
            <Search className="h-5 w-5 shrink-0 text-brand-500" aria-hidden />
            <span className="flex-1 text-sm font-semibold text-slate-800">
              {mas ? "Ocultar las demás" : `Explorar ${otras.length} alternativas más`}
            </span>
            <ChevronRight aria-hidden className={`h-5 w-5 shrink-0 text-slate-300 transition-transform ${mas ? "rotate-90" : ""}`} />
          </button>
          {mas &&
            otras.map((o, i) => (
              <button key={i} onClick={() => alAbrir(o)} className={`${TARJETA} flex w-full items-center gap-3 px-5 py-4 text-left`}>
                <span className="flex-1">
                  <span className="block font-semibold text-slate-900">{o.opcion.piezas.map((p) => p.nombre).join("  +  ")}</span>
                  <span className="block text-sm text-brand-700">Ver esta opción</span>
                </span>
                <ChevronRight aria-hidden className="h-5 w-5 shrink-0 text-slate-300" />
              </button>
            ))}
        </>
      )}
    </div>
  );
}
