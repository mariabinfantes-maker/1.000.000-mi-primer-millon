"use client";

import { useEffect, useState } from "react";
import { VarianteA, VarianteB, type Camino as CaminoDetallado } from "./Variantes";
import TarjetaDelConsejo, { type Abierta } from "./TarjetaDelConsejo";
import FichaDeUnaOpcion from "./FichaDeUnaOpcion";
import Boton from "@/components/ui/Boton";
import SimboloMolnip from "@/components/ui/SimboloMolnip";

/** La receta única de tarjeta de MOLNIP VISUAL v1. No se compone a mano. */
const TARJETA = "rounded-2xl border border-slate-200/80 bg-white";

/**
 * La versión de PRUEBA del asesor. Vive en /asesor y no sustituye a nada.
 *
 * Es una CONVERSACIÓN, no una pila de bloques (boceto de la propietaria,
 * 2026-09-24). Tres cosas que vienen de ahí y que no son decoración:
 *
 *  1. La pregunta va ANTES de las opciones. Si una pregunta cambia el
 *     consejo, preguntarla después es enseñarle un consejo que sabíamos
 *     incompleto.
 *  2. Lo que ella elige primero no es una herramienta: es una FORMA de
 *     resolverlo —todo en un sitio o por separado—. Los nombres van detrás.
 *  3. La caja de texto se queda abajo. Puede responder y ajustar.
 */

type Necesidad = { id: string; titulo: string; enCorto: string };
type Oficio = { id: string; nombre: string; cubiertasHoy: number; deCuantas: number };
type Opcion = CaminoDetallado["opciones"][number];
type Pieza = Opcion["piezas"][number];
type Camino = CaminoDetallado;
type Consejo = {
  caminos: Camino[];
  loQueHaria: (Opcion & { desempate?: { criterio: string; porQue: string } }) | null;
  sinComprobar: string[];
  dondeSeBusco: { herramientas: number; casas: number };
};
type Pregunta = { id: string; pregunta: string; porQuePreguntamos: string; respuestas: { id: string; texto: string }[] };
type Respuesta = {
  sinIA?: boolean;
  necesidades?: Necesidad[];
  leyoLaIA?: boolean;
  comprension?: { necesidades: { necesidad: Necesidad }[]; noEntendido: string[] };
  preguntas?: Pregunta[];
  consejo?: Consejo;
};

/**
 * Ejemplos para arrancar, no personajes.
 *
 * Los de antes eran retratos —«tengo una peluquería», «soy diseñadora»— y la
 * propietaria pidió dejarlos: «quiero que olvides el diseño con la peluquera o
 * el albañil». Un ejemplo sirve para enseñar CÓMO se escribe aquí, no para
 * decirle a quién servimos. Éstos describen una situación de negocio y valen
 * igual para un taller, una clínica o una agencia.
 */
const EJEMPLOS = [
  "Paso los presupuestos a factura a mano y repito el trabajo",
  "Quiero que los clientes reserven sin llamar por teléfono",
  "Llevamos el inventario en una hoja de cálculo",
];

function Dice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <SimboloMolnip className="mt-1 h-8 w-8 shrink-0 rounded-xl shadow-premium" />
      <div className="max-w-[85%] rounded-2xl border border-slate-200/80 bg-white px-4 py-3 leading-relaxed text-slate-700 shadow-premium">
        {children}
      </div>
    </div>
  );
}
function Digo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-brand-600 px-4 py-3 leading-relaxed text-white shadow-premium">{children}</div>
    </div>
  );
}

export default function AsesorPrueba() {
  const [texto, setTexto] = useState("");
  const [dicho, setDicho] = useState<string[]>([]);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [r, setR] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [desplegado, setDesplegado] = useState<string | null>(null);
  /**
   * La opción abierta. Mientras haya una, la pantalla es SÓLO esa: ni
   * cabecera, ni conversación, ni pregunta. «Una pantalla, una cosa», del
   * boceto del 2026-09-25.
   */
  const [abierta, setAbierta] = useState<Abierta | null>(null);
  /**
   * Las formas antiguas de enseñar el consejo ya NO están en la pantalla.
   *
   * Eran cuatro pestañas arriba del todo —«Tarjeta · Conversación · A · B»— y
   * la propietaria lo dijo claro el 2026-09-25: «arriba, el cliente para
   * empezar no tiene que elegir; no me queda claro a simple vista para qué
   * son». Tenía razón dos veces: era mi banco de pruebas con cara de producto,
   * y ponía una decisión antes de la primera palabra.
   *
   * No se borran, que sigue habiendo trabajo pensado ahí: se llega a ellas
   * por la dirección, con `?diseno=a`. Quien no lo sepa no las verá nunca, que
   * es justo lo que hace falta.
   */
  const [diseno] = useState<"tarjeta" | "conversacion" | "a" | "b">(() => {
    if (typeof window === "undefined") return "tarjeta";
    const q = new URLSearchParams(window.location.search).get("diseno");
    return q === "a" || q === "b" || q === "conversacion" ? q : "tarjeta";
  });
  /** Igual con la entrada por oficio: existe, pero no es la puerta. */
  const verOficios = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("oficios");
  /**
   * Las casas de Molnip son OFICIOS (decisión de la propietaria, 2026-09-24).
   * Es la puerta principal: se entra diciendo qué eres, no qué software
   * buscas. Lo segundo es comparar, y Molnip no compara.
   */
  const [oficios, setOficios] = useState<Oficio[]>([]);
  const [oficioElegido, setOficioElegido] = useState<Oficio | null>(null);
  useEffect(() => {
    fetch("/api/asesor").then((r) => r.json()).then((d) => setOficios(d.oficios ?? [])).catch(() => {});
  }, []);

  async function enviar(cuerpo: { texto?: string; necesidadIds?: string[]; oficioId?: string }) {
    setCargando(true);
    const res = await fetch("/api/asesor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    setR(await res.json());
    setCargando(false);
  }

  const c = r?.consejo;
  // La pregunta que más mueve, y sólo una: el resto se guarda para después de
  // que conteste. Enseñarle ocho a la vez es el formulario otra vez.
  const laPregunta = r?.preguntas?.[0];
  const quePide = r?.comprension?.necesidades.map((n) => n.necesidad.titulo) ?? [];
  // Los nombres cortos («reservas», «facturas») los saca cada tarjeta de lo
  // que cubre SU opción, no de todo lo que ella pidió.

  if (abierta) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl px-4 pt-28 pb-16 sm:px-6">
        <FichaDeUnaOpcion
          opcion={abierta.opcion}
          titular={abierta.titular}
          porQue={abierta.porQue}
          alVolver={() => setAbierta(null)}
        />
      </div>
    );
  }

  /**
   * LA PANTALLA DE LLEGADA. Lo primero que ve alguien, y lo único.
   *
   * La propietaria, el 2026-09-25: «arriba, el cliente para empezar no tiene
   * que elegir (...) la presentación es lo que en 2 segundos decidirá si se
   * queda o se va, lo que le dirá su cerebro sin pensar».
   *
   * Lo que había aquí pedía DOS decisiones antes de la primera palabra: qué
   * diseño mirar, en cuatro pestañas sin explicar, y a qué te dedicas, en
   * quince botones. Ahora hay una sola cosa que hacer: escribir.
   *
   * Y no hay nada más en pantalla. Ni pestañas, ni rejilla de oficios, ni
   * contadores. Los ejemplos van debajo, pequeños, porque enseñan CÓMO se
   * escribe aquí sin obligar a leerlos.
   */
  if (dicho.length === 0 && !r && !verOficios) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 pb-16 pt-24">
        <div className="text-center">
          <SimboloMolnip className="mx-auto h-16 w-16 rounded-3xl shadow-premium-lg" />
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
            Molnip
          </h1>
          {/*
            Aquí ponía «busco entre 65 herramientas». Fuera, por una razón de
            negocio de la propietaria (2026-09-25): «decir cuántas herramientas
            tenemos sin que nadie lo pregunte es contraproducente: para unas
            será mucho y para otras poco. Es un as en la manga que nadie
            necesita saber, a menos que estemos cerrando un negocio tú a tú».
            El número sigue en los datos; lo que se quita es presumir de él.
          */}
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Cuéntame qué necesita tu negocio y te digo qué usar —{" "}
            <span className="font-semibold text-slate-800">y qué no</span>.
          </p>
        </div>

        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!texto.trim()) return;
            setDicho([texto]);
            enviar({ texto });
            setTexto("");
          }}
          className="mt-10 flex items-center gap-2 rounded-3xl border border-slate-200/80 bg-white p-2 pl-6 shadow-premium-lg"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe aquí lo que te pasa…"
            autoFocus
            className="flex-1 bg-transparent py-3 text-slate-900 outline-none placeholder:text-slate-400"
          />
          <Boton type="submit" tamano="grande" disabled={!texto.trim() || cargando} className="rounded-2xl">
            {cargando ? "Pensando…" : "Empezar"}
          </Boton>
        </form>

        <div className="mt-8">
          <p className="text-center text-sm text-slate-500">Por ejemplo:</p>
          <div className="mt-3 flex flex-col gap-2">
            {EJEMPLOS.map((e) => (
              <button
                key={e}
                onClick={() => { setDicho([e]); enviar({ texto: e }); }}
                className={`${TARJETA} px-5 py-3 text-left text-sm text-slate-600 transition hover:border-brand-200 hover:text-brand-700`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pt-28 pb-10 sm:px-6">
      <header className="mb-8 flex items-center gap-3">
        <SimboloMolnip className="h-10 w-10 rounded-2xl shadow-premium" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Molnip</h1>
      </header>

      <div className="flex-1 space-y-6">
        {verOficios && dicho.length === 0 && !r && (
          <>
            <Dice>
              <p>¿A qué te dedicas?</p>
            </Dice>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {oficios.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setOficioElegido(o); setDicho([`Soy ${o.nombre.toLowerCase()}`]); enviar({ oficioId: o.id }); }}
                  className={`${TARJETA} flex items-center justify-between gap-3 px-4 py-3.5 text-left shadow-premium transition hover:border-brand-200`}
                >
                  <span className="font-semibold text-slate-900">{o.nombre}</span>
                  <span aria-hidden className="text-brand-400">→</span>
                </button>
              ))}
            </div>
          </>
        )}
        {dicho.map((d, i) => <Digo key={i}>{d}</Digo>)}

        {r?.sinIA && (
          <Dice>
            <p className="font-semibold">Todavía no sé leer tu texto en esta prueba.</p>
            <p className="mt-1 text-sm">
              Ese paso necesita la IA, que aquí no está conectada. Dime tú qué te pasa y sigo desde ahí.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {r.necesidades?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setElegidas((p) => (p.includes(n.id) ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${elegidas.includes(n.id) ? "border-brand-200 bg-brand-50 text-brand-800" : "border-slate-200/80 bg-white text-slate-600 hover:border-brand-200"}`}
                >
                  {n.titulo}
                </button>
              ))}
            </div>
            <Boton onClick={() => enviar({ texto, necesidadIds: elegidas })} disabled={!elegidas.length} className="mt-4">
              Seguir con esto
            </Boton>
          </Dice>
        )}

        {c && (
          <>
            <Dice>
              {oficioElegido ? (
                <p>Esto es lo que suele hacer falta en {oficioElegido.nombre.toLowerCase()}.</p>
              ) : (
                <p>
                  He entendido que necesitas {r?.comprension?.necesidades.map((n) => `«${n.necesidad.titulo.toLowerCase()}»`).join(" y ")}.
                </p>
              )}
              {/*
                Aquí iba «se puede abordar de dos maneras, y la elección es
                tuya» y «esto lo has elegido tú, no lo he leído de tu texto».
                Las dos tarjetas ya dicen que hay dos maneras, y la segunda es
                Molnip hablando de Molnip. Fuera: la propietaria lo llamó por
                su nombre el 2026-09-24 —«nuestra página pide perdón por todo,
                parece una rata miedosa»— y tenía razón.
              */}
            </Dice>

            {laPregunta && (
              <Dice>
                <p className="font-semibold">{laPregunta.pregunta}</p>
                {/*
                  Debajo de la pregunta había DOS explicaciones: por qué se
                  pregunta, y por qué se pregunta. Tres textos para una sola
                  pregunta es lo que ella vio como redundante e inseguro. Se
                  queda el motivo, que es información suya; se va el meta.
                  `porQuePreguntamos` sigue en el vocabulario, intacto.
                */}
                <p className="mt-1 text-sm text-slate-600">{laPregunta.porQuePreguntamos}</p>
              </Dice>
            )}

            {c.caminos.length === 0 ? (
              <Dice>
                <p className="font-semibold">No tengo nada que proponerte.</p>
                <p className="mt-1">Y prefiero decírtelo antes que darte algo que no te sirve.</p>
              </Dice>
            ) : diseno === "tarjeta" ? (
              <TarjetaDelConsejo caminos={c.caminos} porQue={c.loQueHaria?.desempate?.porQue} quePide={r?.comprension?.necesidades.map((n) => n.necesidad.enCorto) ?? []} alAbrir={setAbierta} />
            ) : diseno === "a" ? (
              <VarianteA caminos={c.caminos} quePide={r?.comprension?.necesidades.map((n) => n.necesidad.enCorto) ?? []} />
            ) : diseno === "b" ? (
              <VarianteB caminos={c.caminos} quePide={r?.comprension?.necesidades.map((n) => n.necesidad.enCorto) ?? []} />
            ) : (

              <div className="space-y-3">
                {c.caminos.map((cam, i) => (
                  <section key={cam.forma} className={`rounded-2xl border p-4 ${i === 0 ? "border-brand-600 bg-brand-50/40" : "border-slate-200"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      Opción {String.fromCharCode(65 + i)} · {cam.titulo}
                    </p>
                    <p className="mt-1 text-slate-700">{cam.queImplica}</p>
                    <button
                      onClick={() => setAbierto(abierto === cam.forma ? null : cam.forma)}
                      className="mt-2 text-sm font-semibold text-brand-700"
                    >
                      {abierto === cam.forma
                        ? "Ocultar"
                        : cam.opciones.length + cam.hayMas === 1
                          ? "Ver con qué"
                          : `Ver con qué (${cam.opciones.length + cam.hayMas})`}
                    </button>
                    {abierto === cam.forma && (
                      <ul className="mt-3 space-y-2">
                        {cam.opciones.map((o, j) => (
                          <li key={j} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-900">{o.piezas.map((p) => p.nombre).join("  +  ")}</p>
                            {/* Con una sola pieza, lo que cubre ya lo dice el camino entero:
                                repetirlo en cada opción es la misma frase cuatro veces. Con
                                varias sí importa, porque cada una hace una parte distinta. */}
                            {o.piezas.length > 1 && (
                              <p className="text-sm text-slate-600">
                                {o.piezas.map((p) => `${p.nombre} pone ${p.cubre.join(" y ").toLowerCase()}`).join(" · ")}
                              </p>
                            )}
                            {o.laConexionNoEstaComprobada && (
                              <p className="mt-1 text-sm text-slate-500">
                                No hemos comprobado que se entiendan entre sí; sabemos lo que hace cada una por separado.
                              </p>
                            )}
                          </li>
                        ))}
                        {cam.hayMas > 0 && (
                          <li className="px-1 text-sm text-slate-600">
                            Y {cam.hayMas} más que también lo cubren. Dímelo y te las enseño todas.
                          </li>
                        )}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            )}

            {/*
              AQUÍ IBA LA LISTA DE LO QUE NO SABEMOS («8 cosas que todavía no
              sé»). Se apaga, no se borra.

              Pasó por tres versiones: primero siete párrafos idénticos, luego
              una línea con «ver cuáles», y ahora fuera. Lo que no cambiaba en
              ninguna es de quién hablaba: de nosotros. Lo que a ella le sirve
              para decidir —qué NO le cubre cada opción— lo dice ya cada fila.

              Propietaria, 2026-09-25: «siempre estás tratando de demostrar
              algo, y nuestro trabajo no es demostrar que hicimos los deberes.
              Nuestro trabajo es dar buena información al cliente, clara,
              concisa, que lo lleve directamente a elegir lo que nosotros ya
              estudiamos». Y el fondo: «somos personas de bien y no necesitamos
              demostrarle a nadie que lo somos, se da por hecho».

              `consejo.sinComprobar` sigue calculándose y está disponible: la
              verificación sirve para que no digamos una mentira, no para que
              nadie nos audite.
            */}
            {/*
              Aquí se contaba cuántas herramientas había mirado y que no me
              había quedado en la casa que parecía la suya. Es mérito nuestro,
              no información suya, y cerraba la pantalla hablando de nosotros.
              El dato sigue en `dondeSeBusco` para cuando haga falta.
            */}
          </>
        )}
      </div>

      <div className="sticky bottom-4 mt-8">
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (!texto.trim()) return;
            setDicho((p) => [...p, texto]);
            enviar({ texto });
            setTexto("");
          }}
          className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 pl-5 shadow-premium-lg"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pregúntame o cuéntame algo más…"
            className="flex-1 bg-transparent text-slate-900 outline-none"
          />
          <Boton type="submit" disabled={!texto.trim() || cargando}>
            {cargando ? "Pensando…" : "Enviar"}
          </Boton>
        </form>
      </div>
    </div>
  );
}
