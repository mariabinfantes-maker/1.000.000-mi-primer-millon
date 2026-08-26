"use client";

import { useMemo, useRef, useState } from "react";
import { COOKIE_CSRF } from "@/lib/admin/cookies";
import type { FilaPanelAfiliacion } from "@/agents/atlas-affiliate-manager/panelDatos";
import type { EstadoPanel } from "@/agents/atlas-affiliate-manager/proximaAccion";

/**
 * Panel interno de Affiliate Manager — la única superficie visual sobre
 * la lógica ya construida en el Sprint 1A: cada acción de aquí llama a
 * una de las rutas de `/api/admin/afiliacion/*`, que a su vez reutilizan
 * exactamente las mismas funciones puras que el CLI. El panel nunca
 * decide nada por su cuenta que el CLI no pudiera hacer también.
 */

const ETIQUETA_ESTADO: Record<EstadoPanel, string> = {
  pendiente: "Pendiente",
  preparada: "Preparada",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  seguimiento: "Seguimiento",
};

const COLOR_ESTADO: Record<EstadoPanel, string> = {
  pendiente: "bg-slate-100 text-slate-700",
  preparada: "bg-sky-100 text-sky-700",
  enviada: "bg-amber-100 text-amber-700",
  aprobada: "bg-emerald-100 text-emerald-700",
  rechazada: "bg-red-100 text-red-700",
  seguimiento: "bg-orange-100 text-orange-700",
};

const ESTADOS_AFILIACION_DESTINO: Record<EstadoPanel, string> = {
  // A qué EstadoAfiliacion real (los 5 de producción) traduce elegir cada
  // estado de panel a mano — ver agents/atlas-affiliate-manager/proximaAccion.ts
  // para la correspondencia completa e inversa (cálculo automático).
  pendiente: "no_solicitado",
  preparada: "no_solicitado",
  enviada: "pendiente",
  aprobada: "aprobado",
  rechazada: "rechazado",
  seguimiento: "pendiente",
};

function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

async function llamarApi<T>(ruta: string, opciones: RequestInit = {}): Promise<{ ok: boolean; datos?: T; error?: string }> {
  const csrf = leerCookie(COOKIE_CSRF);
  const cabeceras: Record<string, string> = { "Content-Type": "application/json" };
  if (csrf) cabeceras["x-csrf-token"] = csrf;

  const respuesta = await fetch(ruta, { ...opciones, headers: { ...cabeceras, ...(opciones.headers as Record<string, string>) } });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) return { ok: false, error: datos.error ?? `Error ${respuesta.status}` };
  return { ok: true, datos };
}

function claveFila(fila: FilaPanelAfiliacion): string {
  return `${fila.herramientaId}::${fila.cuentaId ?? "nueva"}`;
}

export default function PanelAfiliacion({ filasIniciales }: { filasIniciales: FilaPanelAfiliacion[] }) {
  const [filas, setFilas] = useState(filasIniciales);
  const [filtro, setFiltro] = useState<EstadoPanel | "todas">("todas");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const inputImportarRef = useRef<HTMLInputElement>(null);

  const contadores = useMemo(() => {
    const base: Record<EstadoPanel, number> = { pendiente: 0, preparada: 0, enviada: 0, aprobada: 0, rechazada: 0, seguimiento: 0 };
    for (const fila of filas) base[fila.estadoPanel] += 1;
    return base;
  }, [filas]);

  const filasFiltradas = filtro === "todas" ? filas : filas.filter((f) => f.estadoPanel === filtro);

  async function refrescar() {
    const resultado = await llamarApi<{ filas: FilaPanelAfiliacion[] }>("/api/admin/afiliacion");
    if (resultado.ok && resultado.datos) setFilas(resultado.datos.filas);
  }

  async function actualizarFila(fila: FilaPanelAfiliacion, cambios: Record<string, unknown>) {
    setCargando(true);
    setMensaje(null);
    const resultado = await llamarApi("/api/admin/afiliacion/actualizar", {
      method: "POST",
      body: JSON.stringify({ herramientaId: fila.herramientaId, cuentaId: fila.cuentaId ?? undefined, ...cambios }),
    });
    if (!resultado.ok) setMensaje(resultado.error ?? "No se pudo guardar.");
    await refrescar();
    setCargando(false);
  }

  async function generarRequisitos(fila: FilaPanelAfiliacion) {
    setCargando(true);
    setMensaje(null);
    const resultado = await llamarApi("/api/admin/afiliacion/requisitos", {
      method: "POST",
      body: JSON.stringify({ herramientaId: fila.herramientaId, cuentaId: fila.cuentaId ?? undefined, nombrePrograma: fila.programaEncontrado ?? undefined }),
    });
    if (!resultado.ok) setMensaje(resultado.error ?? "No se pudieron investigar los requisitos.");
    await refrescar();
    setCargando(false);
  }

  async function generarBorrador(fila: FilaPanelAfiliacion) {
    setCargando(true);
    setMensaje(null);
    const resultado = await llamarApi("/api/admin/afiliacion/borrador", {
      method: "POST",
      body: JSON.stringify({
        herramientaId: fila.herramientaId,
        cuentaId: fila.cuentaId ?? undefined,
        nombrePrograma: fila.programaEncontrado ?? undefined,
        requisitosPrograma: fila.requisitosPrograma,
      }),
    });
    if (!resultado.ok) setMensaje(resultado.error ?? "No se pudo generar el borrador.");
    await refrescar();
    setCargando(false);
  }

  async function comprobarEnlaces() {
    setCargando(true);
    setMensaje(null);
    const resultado = await llamarApi("/api/admin/afiliacion/verificar-enlaces", { method: "POST" });
    if (!resultado.ok) setMensaje(resultado.error ?? "No se pudieron comprobar los enlaces.");
    await refrescar();
    setCargando(false);
  }

  async function exportarJson() {
    const csrf = leerCookie(COOKIE_CSRF);
    const respuesta = await fetch("/api/admin/afiliacion/exportar", {
      headers: csrf ? { "x-csrf-token": csrf } : undefined,
    });
    if (!respuesta.ok) {
      setMensaje("No se pudo exportar.");
      return;
    }
    const texto = await respuesta.text();
    const blob = new Blob([texto], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `estrategia-afiliacion-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  async function importarJson(archivo: File) {
    setCargando(true);
    setMensaje(null);
    const texto = await archivo.text();
    const resultado = await llamarApi<{ total: number; fallidas: number }>("/api/admin/afiliacion/importar", {
      method: "POST",
      body: texto,
    });
    if (!resultado.ok) {
      setMensaje(resultado.error ?? "No se pudo importar.");
    } else if (resultado.datos) {
      setMensaje(`Importadas ${resultado.datos.total - resultado.datos.fallidas} de ${resultado.datos.total} (${resultado.datos.fallidas} fallida(s)).`);
    }
    await refrescar();
    setCargando(false);
    if (inputImportarRef.current) inputImportarRef.current.value = "";
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFiltro("todas")}
          className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${filtro === "todas" ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
        >
          Todas ({filas.length})
        </button>
        {(Object.keys(ETIQUETA_ESTADO) as EstadoPanel[]).map((estado) => (
          <button
            key={estado}
            type="button"
            onClick={() => setFiltro(estado)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${filtro === estado ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {ETIQUETA_ESTADO[estado]} ({contadores[estado]})
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={comprobarEnlaces}
            disabled={cargando}
            className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Comprobar enlaces
          </button>
          <button
            type="button"
            onClick={exportarJson}
            className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => inputImportarRef.current?.click()}
            className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Importar JSON
          </button>
          <input
            ref={inputImportarRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) importarJson(archivo);
            }}
          />
        </div>
      </div>

      {mensaje && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800 ring-1 ring-amber-200">{mensaje}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Herramienta</th>
              <th className="px-4 py-3">Programa</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Comisión / cookie</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Próxima acción</th>
              <th className="px-4 py-3">Enlace</th>
              <th className="px-4 py-3">Últ. comprobación</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((fila) => {
              // El `key` de React puede ser el más específico (incluye
              // cuentaId, cambia si una fila "sin cuenta" pasa a tener una
              // cuenta real — remonta el componente, sin problema). El
              // estado "expandida" en cambio se sigue por herramientaId a
              // secas: si se rastreara por la misma clave que cambia al
              // crear la primera cuenta, el panel se cerraría solo justo
              // al guardar el primer campo — se detectó guardando
              // requisitos por primera vez en una fila sin cuenta todavía.
              const clave = claveFila(fila);
              const abierta = expandida === fila.herramientaId;
              return (
                <FilaAfiliacion
                  key={clave}
                  fila={fila}
                  abierta={abierta}
                  onToggle={() => setExpandida(abierta ? null : fila.herramientaId)}
                  onActualizar={(cambios) => actualizarFila(fila, cambios)}
                  onGenerarRequisitos={() => generarRequisitos(fila)}
                  onGenerarBorrador={() => generarBorrador(fila)}
                  cargando={cargando}
                />
              );
            })}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  No hay ninguna herramienta en este estado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilaAfiliacion({
  fila,
  abierta,
  onToggle,
  onActualizar,
  onGenerarRequisitos,
  onGenerarBorrador,
  cargando,
}: {
  fila: FilaPanelAfiliacion;
  abierta: boolean;
  onToggle: () => void;
  onActualizar: (cambios: Record<string, unknown>) => void;
  onGenerarRequisitos: () => void;
  onGenerarBorrador: () => void;
  cargando: boolean;
}) {
  const [enlaceLocal, setEnlaceLocal] = useState(fila.enlace ?? "");
  const [requisitosLocal, setRequisitosLocal] = useState(fila.requisitosPrograma ?? "");
  const [borradorLocal, setBorradorLocal] = useState(fila.borradorSolicitud ?? "");
  const [copiado, setCopiado] = useState(false);

  async function copiarBorrador() {
    if (!fila.borradorSolicitud) return;
    try {
      await navigator.clipboard.writeText(fila.borradorSolicitud);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50/60">
        <td className="px-4 py-3 font-medium text-slate-900">{fila.nombreHerramienta}</td>
        <td className="px-4 py-3 text-slate-600">{fila.programaEncontrado ?? "—"}</td>
        <td className="px-4 py-3 tabular-nums text-slate-700">{fila.prioridad ?? "—"}</td>
        <td className="px-4 py-3 text-slate-600">
          {fila.comision ?? "—"}
          {fila.duracionCookie ? ` · ${fila.duracionCookie}` : ""}
        </td>
        <td className="px-4 py-3">
          <select
            value={fila.estadoPanel}
            disabled={cargando}
            onChange={(e) => onActualizar({ estado: ESTADOS_AFILIACION_DESTINO[e.target.value as EstadoPanel] })}
            className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${COLOR_ESTADO[fila.estadoPanel]}`}
          >
            {(Object.keys(ETIQUETA_ESTADO) as EstadoPanel[]).map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETA_ESTADO[estado]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 text-slate-600">
          {fila.proximaAccion}
          {fila.diasEstancada !== null && (
            <span className="ml-1 text-orange-600">({fila.diasEstancada}d)</span>
          )}
        </td>
        <td className="px-4 py-3 text-slate-600">
          {fila.enlace ? (
            <span className="inline-flex items-center gap-1">
              {fila.enlaceComprobacionOk === false ? (
                <span title="El último chequeo falló" className="text-red-600">
                  ●
                </span>
              ) : fila.enlaceComprobacionOk === true ? (
                <span title="El último chequeo respondió bien" className="text-emerald-600">
                  ●
                </span>
              ) : null}
              Guardado
            </span>
          ) : (
            "—"
          )}
        </td>
        <td className="px-4 py-3 text-slate-500">
          {fila.enlaceUltimaComprobacion ? new Date(fila.enlaceUltimaComprobacion).toLocaleString("es-ES") : "—"}
        </td>
        <td className="px-4 py-3 text-right">
          <button type="button" onClick={onToggle} className="text-sm font-semibold text-brand-600 hover:text-brand-800">
            {abierta ? "Cerrar" : "Detalle"}
          </button>
        </td>
      </tr>

      {abierta && (
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Requisitos del programa</label>
                  <button
                    type="button"
                    disabled={cargando}
                    onClick={onGenerarRequisitos}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                  >
                    Investigar con IA
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={requisitosLocal}
                  onChange={(e) => setRequisitosLocal(e.target.value)}
                  onBlur={() => requisitosLocal !== (fila.requisitosPrograma ?? "") && onActualizar({ requisitosPrograma: requisitosLocal })}
                  placeholder="Sin investigar todavía."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Borrador de solicitud</label>
                  <div className="flex items-center gap-3">
                    {fila.borradorSolicitud && (
                      <button type="button" onClick={copiarBorrador} className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                        {copiado ? "Copiado" : "Copiar"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={cargando}
                      onClick={onGenerarBorrador}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                    >
                      Redactar con IA
                    </button>
                  </div>
                </div>
                <textarea
                  rows={3}
                  value={borradorLocal}
                  onChange={(e) => setBorradorLocal(e.target.value)}
                  onBlur={() => borradorLocal !== (fila.borradorSolicitud ?? "") && onActualizar({ borradorSolicitud: borradorLocal })}
                  placeholder="Sin generar todavía."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Enlace de afiliado aprobado</label>
                <input
                  type="text"
                  value={enlaceLocal}
                  onChange={(e) => setEnlaceLocal(e.target.value)}
                  onBlur={() => enlaceLocal !== (fila.enlace ?? "") && onActualizar({ enlaceUrl: enlaceLocal, segmentoEnlace: "global" })}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
