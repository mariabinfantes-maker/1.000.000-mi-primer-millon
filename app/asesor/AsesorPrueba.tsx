"use client";

import { useEffect, useState } from "react";
import { VarianteA, VarianteB, type Camino as CaminoDetallado } from "./Variantes";
import TarjetaDelConsejo from "./TarjetaDelConsejo";
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

type Necesidad = { id: string; titulo: string };
type Oficio = { id: string; nombre: string; cubiertasHoy: number; deCuantas: number };
type Opcion = CaminoDetallado["opciones"][number];
type Pieza = Opcion["piezas"][number];
type Camino = CaminoDetallado;
type Consejo = {
  caminos: Camino[];
  loQueHaria: Opcion | null;
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

const EJEMPLOS = [
  "Tengo una peluquería, pierdo citas y facturo a mano",
  "Hago reformas, preparo presupuestos y luego repito todo en la factura",
  "Soy diseñadora y cobro según las horas",
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
  const [dudas, setDudas] = useState(false);
  /**
   * Las tres formas de enseñar el mismo consejo, para elegir usándolas.
   * No es una opción del producto: es un banco de pruebas y se quita al
   * decidir cuál se queda.
   */
  const [diseno, setDiseno] = useState<"tarjeta" | "conversacion" | "a" | "b">("tarjeta");
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

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pt-28 pb-10 sm:px-6">
      <header className="mb-10">
        <p className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 ring-1 ring-brand-100">
          Versión de prueba · la web actual no cambia
        </p>
        <div className="mt-4 flex items-center gap-3">
          <SimboloMolnip className="h-12 w-12 rounded-2xl shadow-premium" />
          <div>
            <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-slate-900">Molnip</h1>
            <p className="text-sm font-semibold text-slate-500">Tu asesor de software</p>
          </div>
        </div>
        <p className="mt-3 text-slate-600">Cuéntame tu problema. Yo busco, y te digo lo que sé y lo que no.</p>
        <div className="mt-5 flex gap-1 rounded-full border border-slate-200/80 bg-white p-1 text-sm shadow-premium">
          {([["tarjeta", "Tarjeta"], ["conversacion", "Conversación"], ["a", "A"], ["b", "B"]] as const).map(([k, n]) => (
            <button
              key={k}
              onClick={() => setDiseno(k)}
              className={`flex-1 rounded-full px-3 py-2 font-semibold transition ${diseno === k ? "bg-brand-600 text-white shadow-premium" : "text-slate-600 hover:text-brand-700"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-6">
        {dicho.length === 0 && !r && (
          <>
            <Dice>
              <p>¿A qué te dedicas?</p>
              <p className="mt-1 text-sm text-slate-600">
                Con eso me basta para empezar. Si prefieres contármelo con tus palabras, escríbeme abajo.
              </p>
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
                <p>
                  Con lo que suele hacer falta en {oficioElegido.nombre.toLowerCase()}, he mirado{" "}
                  {r?.comprension?.necesidades.length} cosas. Quita lo que no sea tuyo y dime lo que falte.
                </p>
              ) : (
                <p>
                  He entendido que necesitas {r?.comprension?.necesidades.map((n) => `«${n.necesidad.titulo.toLowerCase()}»`).join(" y ")}.
                </p>
              )}
              {c.caminos.length > 1 && (
                <p className="mt-2">Se puede abordar de dos maneras, y la elección es tuya.</p>
              )}
              {!r?.leyoLaIA && !oficioElegido && (
              <p className="mt-2 text-sm text-slate-500">Esto lo has elegido tú, no lo he leído de tu texto.</p>
            )}
            </Dice>

            {laPregunta && (
              <Dice>
                <p className="font-semibold">{laPregunta.pregunta}</p>
                <p className="mt-1 text-sm text-slate-600">{laPregunta.porQuePreguntamos}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Te pregunto esto porque cambia lo que te voy a recomendar. Lo que no lo cambia, no te lo pregunto.
                </p>
              </Dice>
            )}

            {c.caminos.length === 0 ? (
              <Dice>
                <p className="font-semibold">No tengo nada que proponerte.</p>
                <p className="mt-1">Y prefiero decírtelo antes que darte algo que no te sirve.</p>
              </Dice>
            ) : diseno === "tarjeta" ? (
              <TarjetaDelConsejo caminos={c.caminos} quePide={quePide} />
            ) : diseno === "a" ? (
              <VarianteA caminos={c.caminos} quePide={quePide} />
            ) : diseno === "b" ? (
              <VarianteB caminos={c.caminos} quePide={quePide} />
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
              Esto era la otra pared. Siete párrafos casi idénticos —cambiaba
              el nombre de la necesidad y el resto era la misma frase— en la
              primera pantalla, debajo del consejo. No se quita ni una coma:
              se guarda detrás de una línea, porque lo que agobia no es la
              honestidad, es tenerla que leer entera para saber si sirve.
            */}
            {c.sinComprobar.length > 0 && (
              <Dice>
                <button onClick={() => setDudas(!dudas)} className="flex w-full items-center gap-3 text-left">
                  <span className="flex-1 font-semibold text-slate-900">
                    {c.sinComprobar.length === 1
                      ? "Hay una cosa que no te puedo asegurar"
                      : `Hay ${c.sinComprobar.length} cosas que no te puedo asegurar`}
                  </span>
                  <span className="text-sm font-semibold text-brand-700">{dudas ? "Ocultar" : "Ver cuáles"}</span>
                </button>
                {dudas && (
                  <ul className="mt-3 space-y-2 border-t border-slate-200/80 pt-3 text-sm text-slate-600">
                    {c.sinComprobar.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                )}
              </Dice>
            )}

            <p className="px-1 text-xs text-slate-500">
              Es la información que hemos recogido en sus páginas. Miré {c.dondeSeBusco.herramientas} herramientas
              repartidas en {c.dondeSeBusco.casas} casas, sin quedarme en la que parecía la tuya.
            </p>
          </>
        )}
      </div>

      <div className="sticky bottom-4 mt-8">
        {dicho.length === 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {EJEMPLOS.map((e) => (
              <button key={e} onClick={() => setTexto(e)} className="rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 text-sm text-slate-600 shadow-premium transition hover:border-brand-200 hover:text-brand-700">
                {e}
              </button>
            ))}
          </div>
        )}
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
