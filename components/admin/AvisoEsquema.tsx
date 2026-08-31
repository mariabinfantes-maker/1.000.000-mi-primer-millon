"use client";

import { useState } from "react";
import { COOKIE_CSRF } from "@/lib/admin/cookies";

/**
 * Aparece cuando la pantalla de Ingresos no ha podido leer la base de datos.
 *
 * La causa más probable, y la única que se puede arreglar desde aquí, es que
 * falten las tablas de Atlas Revenue. En vez de dejar un aviso que solo dice
 * que algo va mal, esta tarjeta va a mirar qué falta exactamente y ofrece
 * crearlo, porque administrar Molnip no debería exigir abrir un terminal ni
 * conocer la cadena de conexión de Neon.
 *
 * Primero enseña lo que falta y solo después deja aplicar: nadie debería
 * pulsar un botón que toca la base de datos sin ver antes qué va a hacer.
 */

function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const encaje = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return encaje ? decodeURIComponent(encaje[1]) : undefined;
}

type Tabla = { table_name: string; columnas: number };

export default function AvisoEsquema() {
  const [estado, setEstado] = useState<"inicial" | "consultando" | "aplicando">("inicial");
  const [problemas, setProblemas] = useState<string[] | null>(null);
  const [tablas, setTablas] = useState<Tabla[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  async function llamar(metodo: "GET" | "POST") {
    setError(null);
    setEstado(metodo === "GET" ? "consultando" : "aplicando");
    const csrf = leerCookie(COOKIE_CSRF);
    try {
      const respuesta = await fetch("/api/admin/esquema", {
        method: metodo,
        headers: metodo === "POST" && csrf ? { "x-csrf-token": csrf } : undefined,
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(datos.error ?? `Error ${respuesta.status}`);
        return;
      }
      setProblemas(datos.problemas ?? []);
      if (metodo === "POST") {
        setTablas(datos.tablas ?? null);
        setHecho(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido contactar con el servidor.");
    } finally {
      setEstado("inicial");
    }
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
      <h2 className="font-display text-lg font-bold text-amber-900">No se ha podido leer la base de datos</h2>
      <p className="mt-1 text-sm text-amber-900">
        Los datos que ya hubiera siguen guardados; es esta pantalla la que no ha podido leerlos. La causa
        más habitual es que falten las tablas de medición.
      </p>

      {problemas !== null && (
        <div className="mt-4 rounded-xl bg-white/70 p-4">
          {problemas.length === 0 ? (
            <p className="text-sm font-semibold text-emerald-800">
              El esquema está completo. Si esta pantalla sigue vacía, el problema es otro.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-900">Falta esto:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {problemas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tablas && (
        <div className="mt-4 rounded-xl bg-white/70 p-4">
          <p className="text-sm font-semibold text-slate-700">Tablas presentes ahora:</p>
          <ul className="mt-2 space-y-1 text-sm tabular-nums text-slate-600">
            {tablas.map((t) => (
              <li key={t.table_name}>
                {t.table_name} · {t.columnas} columnas
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => llamar("GET")}
          disabled={estado !== "inicial"}
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {estado === "consultando" ? "Comprobando…" : "Comprobar el esquema"}
        </button>

        {problemas !== null && problemas.length > 0 && (
          <button
            type="button"
            onClick={() => llamar("POST")}
            disabled={estado !== "inicial"}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {estado === "aplicando" ? "Creando…" : "Crear lo que falta"}
          </button>
        )}

        {hecho && problemas?.length === 0 && (
          <span role="status" className="text-sm font-semibold text-emerald-700">
            Listo. Recarga la página.
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-amber-800">
        Solo crea lo que falta. No borra, no vacía y no reescribe ninguna fila, y se puede pulsar las veces
        que haga falta sin efecto añadido.
      </p>
    </div>
  );
}
