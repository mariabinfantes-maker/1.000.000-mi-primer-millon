"use client";

import { useState } from "react";
import { VarianteA, VarianteB, type Camino as CaminoDetallado } from "./Variantes";

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
      <div className="mt-1 h-7 w-7 shrink-0 rounded-xl bg-brand-600" aria-hidden />
      <div className="max-w-[85%] rounded-2xl bg-slate-100 px-4 py-3 text-slate-800">{children}</div>
    </div>
  );
}
function Digo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-brand-100 px-4 py-3 text-brand-900">{children}</div>
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
   * Las tres formas de enseñar el mismo consejo, para elegir usándolas.
   * No es una opción del producto: es un banco de pruebas y se quita al
   * decidir cuál se queda.
   */
  const [diseno, setDiseno] = useState<"conversacion" | "a" | "b">("conversacion");

  async function enviar(cuerpo: { texto?: string; necesidadIds?: string[] }) {
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 pt-28 pb-8 sm:px-6">
      <header className="mb-6">
        <p className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          Versión de prueba · la web actual no cambia
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-slate-900">Tu asesor de software</h1>
        <div className="mt-3 flex gap-1 rounded-full bg-slate-100 p-1 text-sm">
          {([["conversacion", "Conversación"], ["a", "A · Consejo"], ["b", "B · Tarjetas"]] as const).map(([k, n]) => (
            <button
              key={k}
              onClick={() => setDiseno(k)}
              className={`flex-1 rounded-full px-3 py-1.5 font-semibold ${diseno === k ? "bg-white text-brand-700 shadow-sm" : "text-slate-600"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 space-y-5">
        {dicho.length === 0 && (
          <Dice>
            <p>Cuéntame qué te pasa en tu negocio, con tus palabras.</p>
            <p className="mt-1 text-sm text-slate-600">No hace falta que sepas qué herramienta necesitas.</p>
          </Dice>
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
                  className={`rounded-full border px-3 py-1 text-sm ${elegidas.includes(n.id) ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-300 text-slate-600"}`}
                >
                  {n.titulo}
                </button>
              ))}
            </div>
            <button
              onClick={() => enviar({ texto, necesidadIds: elegidas })}
              disabled={!elegidas.length}
              className="mt-3 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Seguir con esto
            </button>
          </Dice>
        )}

        {c && (
          <>
            <Dice>
              <p>
                He entendido que necesitas {r?.comprension?.necesidades.map((n) => `«${n.necesidad.titulo.toLowerCase()}»`).join(" y ")}.
              </p>
              {c.caminos.length > 1 && (
                <p className="mt-2">Se puede abordar de dos maneras, y la elección es tuya.</p>
              )}
              {!r?.leyoLaIA && <p className="mt-2 text-sm text-slate-500">Esto lo has elegido tú, no lo he leído de tu texto.</p>}
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

            {c.sinComprobar.length > 0 && (
              <Dice>
                <p className="font-semibold">Lo que no te puedo asegurar</p>
                <ul className="mt-1 space-y-1 text-sm">{c.sinComprobar.map((s) => <li key={s}>· {s}</li>)}</ul>
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
              <button key={e} onClick={() => setTexto(e)} className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600 hover:border-brand-600">
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
          className="flex items-center gap-2 rounded-full border border-slate-300 bg-white p-2 pl-5 shadow-sm"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pregúntame o cuéntame algo más…"
            className="flex-1 bg-transparent text-slate-900 outline-none"
          />
          <button type="submit" disabled={!texto.trim() || cargando} className="rounded-full bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40">
            {cargando ? "…" : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
