"use client";

import { useState } from "react";

/**
 * La versión de PRUEBA del asesor, para recorrerla antes de decidir nada.
 * No sustituye a la web actual: vive aparte, en /asesor.
 */

type Necesidad = { id: string; titulo: string; loQueDice: string[] };
type Pieza = { herramientaId: string; nombre: string; cubre: string[]; casas: string[] };
type Solucion = { piezas: Pieza[]; laConexionNoEstaComprobada: boolean };
type Respuesta = {
  sinIA?: boolean;
  necesidades?: Necesidad[];
  leyoLaIA?: boolean;
  comprension?: { loQueDijo: string; necesidades: { necesidad: { id: string; titulo: string } }[]; noEntendido: string[]; circunstancias: string[] };
  preguntas?: { id: string; pregunta: string; porQuePreguntamos: string; candidatasQueSeMueven: number }[];
  consejo?: {
    loQueHaria: Solucion | null;
    porQue: string[];
    alternativas: Solucion[];
    sinComprobar: string[];
    dondeSeBusco: { herramientas: number; casas: number };
  };
};

const EJEMPLOS = [
  "Tengo una peluquería, pierdo citas y facturo a mano",
  "Hago reformas, preparo presupuestos y luego repito todo en la factura",
  "Soy diseñadora y cobro según las horas",
];

export default function AsesorPrueba() {
  const [texto, setTexto] = useState("");
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [r, setR] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(cuerpo: { texto?: string; necesidadIds?: string[] }) {
    setCargando(true);
    const res = await fetch("/api/asesor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    setR(await res.json());
    setCargando(false);
  }

  return (
    // El padding de arriba deja sitio a la cabecera fija del sitio, que si no
    // se monta encima del primer bloque de la respuesta.
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-12 sm:px-6">
      <p className="mb-2 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
        Versión de prueba · la web actual no cambia
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Cuéntame qué te pasa en tu negocio
      </h1>
      <p className="mt-3 text-slate-600">Con tus palabras. No hace falta que sepas qué herramienta necesitas.</p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Por ejemplo: tengo una peluquería, pierdo citas y facturo a mano"
        className="mt-6 w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-brand-600"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EJEMPLOS.map((e) => (
          <button key={e} onClick={() => setTexto(e)} className="rounded-full border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:border-brand-600 hover:text-brand-700">
            {e}
          </button>
        ))}
      </div>
      <button
        onClick={() => enviar({ texto })}
        disabled={!texto.trim() || cargando}
        className="mt-4 rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-40"
      >
        {cargando ? "Pensando…" : "A ver qué te digo"}
      </button>

      {r?.sinIA && (
        <section className="mt-10 rounded-xl border border-slate-200 p-5">
          <p className="font-semibold text-slate-900">Todavía no sé leer tu texto en esta prueba.</p>
          <p className="mt-1 text-slate-600">
            El paso de entender necesita la IA, que aquí no está conectada. Para que puedas recorrer el resto,
            elige tú lo que te pasa y sigo desde ahí.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
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
            className="mt-4 rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white disabled:opacity-40"
          >
            Seguir con esto
          </button>
        </section>
      )}

      {r?.consejo && (
        <div className="mt-10 space-y-8">
          <section>
            <h2 className="font-display text-xl font-bold text-slate-900">Lo que he entendido</h2>
            <ul className="mt-2 space-y-1 text-slate-700">
              {r.comprension?.necesidades.map((n) => <li key={n.necesidad.id}>· {n.necesidad.titulo}</li>)}
            </ul>
            {!r.leyoLaIA && <p className="mt-2 text-sm text-slate-500">Esto lo has elegido tú, no lo he leído de tu texto.</p>}
            {r.comprension?.noEntendido.length ? (
              <p className="mt-2 text-sm text-slate-500">Esto no he sabido encajarlo: {r.comprension.noEntendido.join(" · ")}</p>
            ) : null}
          </section>

          {r.consejo.loQueHaria ? (
            <section className="rounded-xl border-2 border-brand-600 p-5">
              <h2 className="font-display text-xl font-bold text-slate-900">Lo que yo haría</h2>
              <p className="mt-2 text-2xl font-semibold text-brand-700">
                {r.consejo.loQueHaria.piezas.map((p) => p.nombre).join("  +  ")}
              </p>
              <ul className="mt-3 space-y-1 text-slate-700">
                {r.consejo.porQue.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </section>
          ) : (
            <section className="rounded-xl border border-slate-300 p-5">
              <h2 className="font-display text-xl font-bold text-slate-900">No tengo nada que proponerte</h2>
              <p className="mt-2 text-slate-700">Y prefiero decírtelo antes que darte algo que no te sirve.</p>
            </section>
          )}

          {r.consejo.alternativas.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-slate-900">Otras que hacen lo mismo</h2>
              <ul className="mt-2 space-y-1 text-slate-700">
                {r.consejo.alternativas.map((a, i) => (
                  <li key={i}>· {a.piezas.map((p) => p.nombre).join(" + ")}{a.laConexionNoEstaComprobada ? " (no sé si se entienden entre sí)" : ""}</li>
                ))}
              </ul>
            </section>
          )}

          {r.consejo.sinComprobar.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-slate-900">Lo que no te puedo asegurar</h2>
              <ul className="mt-2 space-y-2 text-slate-700">
                {r.consejo.sinComprobar.map((s) => <li key={s}>· {s}</li>)}
              </ul>
            </section>
          )}

          {r.preguntas && r.preguntas.length > 0 && (
            <section className="rounded-xl bg-slate-50 p-5">
              <h2 className="font-display text-xl font-bold text-slate-900">Lo que cambiaría mi consejo</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sólo te pregunto lo que de verdad mueve el resultado. De las diez que sé hacer, aquí valen {r.preguntas.length}.
              </p>
              <ul className="mt-3 space-y-3">
                {r.preguntas.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <p className="font-semibold text-slate-900">{p.pregunta}</p>
                    <p className="text-sm text-slate-600">{p.porQuePreguntamos}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-sm text-slate-500">
            Es la información que hemos recogido en sus páginas. Miré {r.consejo.dondeSeBusco.herramientas} herramientas
            repartidas en {r.consejo.dondeSeBusco.casas} casas, sin quedarme en la que parecía la tuya.
          </p>
        </div>
      )}
    </div>
  );
}
