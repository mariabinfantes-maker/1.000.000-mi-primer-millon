"use client";

import { useMemo, useRef, useState } from "react";
import { COOKIE_CSRF } from "@/lib/admin/cookies";
import { leerCsv, normalizarEncabezado } from "@/agents/atlas-affiliate-manager/importacion/leerCsv";
import {
  proponerEmparejamiento,
  aEntradaLote,
  SINONIMOS,
  PLANTILLA_CSV,
  type CampoLote,
  type Emparejamiento,
} from "@/agents/atlas-affiliate-manager/importacion/columnas";
import type {
  ResumenPrevisualizacion,
  FilaPrevisualizada,
} from "@/agents/atlas-affiliate-manager/importacion/previsualizar";
import type { EntradaLoteEstrategia } from "@/agents/atlas-affiliate-manager/lote";

/**
 * Importación en bloque, en cinco pasos.
 *
 * El archivo se lee aquí, en el navegador, y no se envía hasta que hay que
 * previsualizar. Lo que gobierna el diseño es una idea: nada se escribe sin
 * que se haya visto antes qué iba a pasar, y las activaciones —que cambian
 * lo que hace la web pública— se confirman aparte del resto.
 */

function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const encaje = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return encaje ? decodeURIComponent(encaje[1]) : undefined;
}

async function llamar<T>(cuerpo: unknown): Promise<{ ok: boolean; datos?: T; error?: string }> {
  const csrf = leerCookie(COOKIE_CSRF);
  const respuesta = await fetch("/api/admin/afiliacion/importar-lote", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
    body: JSON.stringify(cuerpo),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) return { ok: false, error: datos.error ?? `Error ${respuesta.status}` };
  return { ok: true, datos };
}

type ResultadoAplicar = {
  aplicadas: number;
  fallidas: number;
  activacionesAplicadas: number;
  activacionesPendientes: number;
  resultados: { fila: number; id: string; ok: boolean; error?: string }[];
};

const CAMPOS: CampoLote[] = Object.keys(SINONIMOS) as CampoLote[];

const COLOR_VEREDICTO: Record<FilaPrevisualizada["veredicto"], string> = {
  creara: "bg-sky-100 text-sky-800",
  cambiara: "bg-amber-100 text-amber-900",
  sin_cambios: "bg-slate-100 text-slate-600",
  error: "bg-red-100 text-red-800",
};

const ETIQUETA_VEREDICTO: Record<FilaPrevisualizada["veredicto"], string> = {
  creara: "Se creará",
  cambiara: "Cambiará",
  sin_cambios: "Sin cambios",
  error: "Error",
};

export default function PanelImportacion() {
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [filasArchivo, setFilasArchivo] = useState<Record<string, string>[]>([]);
  const [encabezados, setEncabezados] = useState<string[]>([]);
  const [avisosArchivo, setAvisosArchivo] = useState<string[]>([]);
  const [emparejamiento, setEmparejamiento] = useState<Emparejamiento>({});
  const [resumen, setResumen] = useState<ResumenPrevisualizacion | null>(null);
  const [resultado, setResultado] = useState<ResultadoAplicar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const entradaArchivo = useRef<HTMLInputElement>(null);

  const entradas: EntradaLoteEstrategia[] = useMemo(
    () => filasArchivo.map((fila) => aEntradaLote(fila, emparejamiento)),
    [filasArchivo, emparejamiento]
  );

  function reiniciar() {
    setResumen(null);
    setResultado(null);
    setError(null);
  }

  async function cargarArchivo(archivo: File) {
    reiniciar();
    setNombreArchivo(archivo.name);
    const texto = await archivo.text();

    if (archivo.name.toLowerCase().endsWith(".json")) {
      try {
        const datos = JSON.parse(texto);
        if (!Array.isArray(datos)) throw new Error("El JSON debe ser una lista de filas.");
        const filas = datos.map((d: Record<string, unknown>) =>
          Object.fromEntries(Object.entries(d).map(([k, v]) => [k.toLowerCase(), String(v ?? "")]))
        );
        setFilasArchivo(filas);
        const cabeceras = Object.keys(filas[0] ?? {});
        setEncabezados(cabeceras);
        setEmparejamiento(proponerEmparejamiento(cabeceras).emparejamiento);
        setAvisosArchivo([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "El archivo no es un JSON válido.");
        setFilasArchivo([]);
      }
      return;
    }

    const { filas, encabezados: cabeceras, avisos } = leerCsv(texto);
    setFilasArchivo(filas);
    setEncabezados(cabeceras);
    setAvisosArchivo(avisos);
    setEmparejamiento(proponerEmparejamiento(cabeceras).emparejamiento);
  }

  async function previsualizar() {
    setCargando(true);
    setError(null);
    setResultado(null);
    const r = await llamar<{ resumen: ResumenPrevisualizacion }>({ modo: "previsualizar", entradas });
    if (!r.ok) setError(r.error ?? "No se ha podido previsualizar.");
    else setResumen(r.datos!.resumen);
    setCargando(false);
  }

  async function aplicar(incluirActivaciones: boolean) {
    setCargando(true);
    setError(null);
    const r = await llamar<ResultadoAplicar>({ modo: "aplicar", entradas, incluirActivaciones });
    if (!r.ok) setError(r.error ?? "No se ha podido aplicar.");
    else {
      setResultado(r.datos!);
      // Se vuelve a previsualizar para que la pantalla muestre el estado real
      // después de escribir, no el de antes.
      const nueva = await llamar<{ resumen: ResumenPrevisualizacion }>({ modo: "previsualizar", entradas });
      if (nueva.ok) setResumen(nueva.datos!.resumen);
    }
    setCargando(false);
  }

  function descargarPlantilla() {
    const blob = new Blob([PLANTILLA_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-afiliacion.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const conActivaciones = (resumen?.activaciones ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Importar enlaces en bloque</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Carga un archivo, mira qué va a pasar y aplícalo. Fusiona: una casilla vacía deja el valor que ya
          había, no lo borra. Las cuentas activas, los enlaces ya guardados y Systeme.io no se tocan desde aquí.
        </p>
      </div>

      {/* Paso 1 */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="font-display text-lg font-bold text-slate-900">1. Elige el archivo</h2>
        <p className="mt-1 text-sm text-slate-600">CSV (separado por comas o por punto y coma) o JSON.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => entradaArchivo.current?.click()}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Elegir archivo
          </button>
          <button
            type="button"
            onClick={descargarPlantilla}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Descargar plantilla
          </button>
          <input
            ref={entradaArchivo}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) cargarArchivo(archivo);
              e.target.value = "";
            }}
          />
          {nombreArchivo && (
            <span className="text-sm text-slate-600">
              {nombreArchivo} · <strong className="tabular-nums">{filasArchivo.length}</strong> fila(s)
            </span>
          )}
        </div>

        {avisosArchivo.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {avisosArchivo.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Paso 2 */}
      {filasArchivo.length > 0 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">2. Empareja las columnas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Si los encabezados ya coinciden no tienes que tocar nada. Lo que quede sin emparejar se ignora.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMPOS.map((campo) => (
              <label key={campo} className="block">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {campo}
                  {campo === "id" && <span className="ml-1 text-red-600">obligatorio</span>}
                </span>
                <select
                  value={emparejamiento[campo] ?? ""}
                  onChange={(e) => {
                    reiniciar();
                    setEmparejamiento((previo) => ({ ...previo, [campo]: e.target.value || undefined }));
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">— sin emparejar —</option>
                  {/* La misma normalización que usa el lector: si divergieran,
                      el desplegable ofrecería claves que las filas no tienen. */}
                  {encabezados.map((encabezado) => (
                    <option key={encabezado} value={normalizarEncabezado(encabezado)}>
                      {encabezado}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={previsualizar}
            disabled={cargando || !emparejamiento.id}
            className="mt-5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {cargando ? "Comprobando…" : "Ver qué va a pasar"}
          </button>
          {!emparejamiento.id && (
            <p className="mt-2 text-sm text-amber-800">Empareja la columna «id» para poder continuar.</p>
          )}
        </section>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Paso 3 */}
      {resumen && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">3. Esto es lo que va a pasar</h2>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 tabular-nums">
              {resumen.total} fila(s)
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-800 tabular-nums">
              {resumen.creara} se crearán
            </span>
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900 tabular-nums">
              {resumen.cambiara} cambiarán
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600 tabular-nums">
              {resumen.sinCambios} sin cambios
            </span>
            {resumen.conError > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-800 tabular-nums">
                {resumen.conError} con error
              </span>
            )}
          </div>

          {resumen.bloqueo && (
            <p role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {resumen.bloqueo}
            </p>
          )}

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[54rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">Herramienta</th>
                  <th className="px-3 py-2">Qué pasará</th>
                  <th className="px-3 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumen.filas.map((fila) => (
                  <tr key={fila.fila} className={fila.activa ? "bg-emerald-50/50" : undefined}>
                    <td className="px-3 py-2 tabular-nums text-slate-500">{fila.fila}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {fila.nombre ?? fila.id}
                      <span className="ml-1 text-xs text-slate-400">· {fila.cuentaId}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${COLOR_VEREDICTO[fila.veredicto]}`}>
                        {ETIQUETA_VEREDICTO[fila.veredicto]}
                      </span>
                      {fila.activa && (
                        <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          activa
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {fila.errores.length > 0 ? (
                        <span className="text-red-700">{fila.errores.join(" ")}</span>
                      ) : fila.cambios.length === 0 ? (
                        "—"
                      ) : (
                        <ul className="space-y-0.5">
                          {fila.cambios.map((cambio) => (
                            <li key={cambio.campo}>
                              <span className="font-semibold">{cambio.campo}:</span>{" "}
                              <span className="text-slate-400 line-through">{cambio.antes ?? "vacío"}</span>{" "}
                              → <span>{cambio.despues}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paso 4 */}
          {!resumen.bloqueo && (
            <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => aplicar(false)}
                  disabled={cargando || resumen.aplicables === 0}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {cargando ? "Aplicando…" : `Aplicar ${resumen.aplicables} cambio(s)`}
                </button>
                {resumen.aplicables === 0 && (
                  <span className="text-sm text-slate-500">No hay cambios que aplicar sin activar nada.</span>
                )}
              </div>

              {conActivaciones && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                  <h3 className="font-display text-base font-bold text-emerald-900">
                    {resumen.activaciones} activación(es), aparte
                  </h3>
                  <p className="mt-1 text-sm text-emerald-900">
                    Activar cambia lo que hace la web pública: a partir de ese momento los botones «Ir al
                    proveedor» de esas herramientas llevan su enlace de afiliada. Por eso no van dentro del
                    botón de arriba.
                  </p>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-emerald-900">
                    {resumen.filas
                      .filter((f) => f.activa)
                      .map((f) => (
                        <li key={f.fila}>{f.nombre ?? f.id}</li>
                      ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => aplicar(true)}
                    disabled={cargando}
                    className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                  >
                    Aplicar los cambios y activar {resumen.activaciones}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Paso 5 */}
      {resultado && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h2 className="font-display text-lg font-bold text-slate-900">4. Resultado</h2>
          <p role="status" className="mt-2 text-sm text-slate-700">
            <strong className="tabular-nums">{resultado.aplicadas}</strong> fila(s) aplicadas
            {resultado.fallidas > 0 && (
              <>
                {" · "}
                <strong className="tabular-nums text-red-700">{resultado.fallidas}</strong> fallida(s)
              </>
            )}
            {resultado.activacionesAplicadas > 0 && (
              <> · {resultado.activacionesAplicadas} activada(s)</>
            )}
            {resultado.activacionesPendientes > 0 && (
              <>
                {" · "}
                <span className="text-emerald-800">
                  {resultado.activacionesPendientes} activación(es) siguen pendientes de tu confirmación
                </span>
              </>
            )}
          </p>

          {resultado.resultados.some((r) => !r.ok) && (
            <ul className="mt-3 space-y-1 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {resultado.resultados
                .filter((r) => !r.ok)
                .map((r) => (
                  <li key={r.fila}>
                    Fila {r.fila} ({r.id}): {r.error}
                  </li>
                ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
