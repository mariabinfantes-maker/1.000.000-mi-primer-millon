"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COOKIE_CSRF } from "@/lib/admin/cookies";
import type { FilaPanelAfiliacion } from "@/agents/atlas-affiliate-manager/panelDatos";
import type { EstadoPanel } from "@/agents/atlas-affiliate-manager/proximaAccion";
import { enlaceEsUsable, puedeActivarse } from "@/agents/atlas-affiliate-manager/reglasEnlace";
import { SUGERENCIAS_ATRIBUCION, esAtribucionPermanente } from "@/agents/atlas-affiliate-manager/duracionAtribucion";
import {
  AYUDA_ESTADO,
  COLOR_DIAS_ESTANCADA,
  COLOR_ESTADO,
  ETIQUETA_ESTADO,
} from "./estadosAfiliacion";

/**
 * Panel interno de Affiliate Manager — la única superficie visual sobre
 * la lógica ya construida en el Sprint 1A: cada acción de aquí llama a
 * una de las rutas de `/api/admin/afiliacion/*`, que a su vez reutilizan
 * exactamente las mismas funciones puras que el CLI. El panel nunca
 * decide nada por su cuenta que el CLI no pudiera hacer también.
 */

const ESTADOS_AFILIACION_DESTINO: Record<EstadoPanel, string> = {
  // A qué EstadoAfiliacion real (los 5 de producción) traduce elegir cada
  // estado de panel a mano — ver agents/atlas-affiliate-manager/proximaAccion.ts
  // para la correspondencia completa e inversa (cálculo automático).
  pendiente: "no_solicitado",
  preparada: "no_solicitado",
  enviada: "pendiente",
  aprobada: "aprobado",
  activa: "activo",
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
  // Qué herramienta se está gestionando. Antes esto era una fila que se
  // desplegaba dentro de la tabla; el despliegue vivía en la última de nueve
  // columnas de una tabla de 1100px de ancho mínimo, así que en el móvil —y
  // en cualquier pantalla estrecha— quedaba fuera de la vista y había que
  // descubrir que la tabla se desplaza en horizontal. La propietaria no lo
  // encontró, y con razón.
  const [gestionando, setGestionando] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const inputImportarRef = useRef<HTMLInputElement>(null);

  const contadores = useMemo(() => {
    const base: Record<EstadoPanel, number> = { pendiente: 0, preparada: 0, enviada: 0, aprobada: 0, activa: 0, rechazada: 0, seguimiento: 0 };
    for (const fila of filas) base[fila.estadoPanel] += 1;
    return base;
  }, [filas]);

  const filasFiltradas = filtro === "todas" ? filas : filas.filter((f) => f.estadoPanel === filtro);
  const filaGestionada = filas.find((f) => f.herramientaId === gestionando);

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

  async function comprobarEnlaces(herramientaId?: string) {
    setCargando(true);
    setMensaje(null);
    const resultado = await llamarApi<{ resultados: { ok: boolean; estadoHttp?: number; error?: string }[] }>(
      "/api/admin/afiliacion/verificar-enlaces",
      { method: "POST", body: JSON.stringify(herramientaId ? { herramientaId } : {}) }
    );
    if (!resultado.ok) {
      setMensaje(resultado.error ?? "No se pudieron comprobar los enlaces.");
    } else if (herramientaId) {
      const uno = resultado.datos?.resultados?.[0];
      setMensaje(
        !uno
          ? "No hay ningún enlace guardado que comprobar."
          : uno.ok
            ? `El enlace responde correctamente (HTTP ${uno.estadoHttp}).`
            : `El enlace NO responde: ${uno.error ?? `HTTP ${uno.estadoHttp}`}.`
      );
    }
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
            onClick={() => comprobarEnlaces()}
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
        <p className="mt-3 rounded-xl bg-atencion-50 px-4 py-2 text-sm text-atencion-800 ring-1 ring-atencion-200">{mensaje}</p>
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
              // modal en cambio se sigue por herramientaId a secas: si se
              // rastreara por la misma clave que cambia al crear la primera
              // cuenta, se cerraría solo justo al guardar el primer campo —
              // se detectó guardando requisitos por primera vez en una fila
              // sin cuenta todavía.
              const clave = claveFila(fila);
              return (
                <FilaAfiliacion
                  key={clave}
                  fila={fila}
                  onGestionar={() => setGestionando(fila.herramientaId)}
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

      {filaGestionada && (
        <ModalGestion
          fila={filaGestionada}
          cargando={cargando}
          onCerrar={() => setGestionando(null)}
          onGuardar={(cambios) => actualizarFila(filaGestionada, cambios)}
          onComprobarEnlace={() => comprobarEnlaces(filaGestionada.herramientaId)}
          onGenerarRequisitos={() => generarRequisitos(filaGestionada)}
          onGenerarBorrador={() => generarBorrador(filaGestionada)}
        />
      )}
    </div>
  );
}

function FilaAfiliacion({ fila, onGestionar }: { fila: FilaPanelAfiliacion; onGestionar: () => void }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60">
      <td className="px-4 py-3 font-medium text-slate-900">{fila.nombreHerramienta}</td>
      <td className="px-4 py-3 text-slate-600">{fila.programaEncontrado ?? "—"}</td>
      <td className="px-4 py-3 tabular-nums text-slate-700">{fila.prioridad ?? "—"}</td>
      <td className="px-4 py-3 text-slate-600">
        {fila.comision ?? "—"}
        {fila.duracionCookie ? (
          <>
            {" · "}
            {esAtribucionPermanente(fila.duracionCookie) ? (
              // Entre "90 días" y algo que no caduca hay una diferencia de
              // negocio grande, y leyendo texto libre a toda velocidad se pasa
              // por alto.
              <span className="rounded-full bg-exito-50 px-2 py-0.5 text-xs font-semibold text-exito-700">
                {fila.duracionCookie}
              </span>
            ) : (
              fila.duracionCookie
            )}
          </>
        ) : (
          ""
        )}
      </td>
      <td className="px-4 py-3">
        {/* El estado se lee aquí y se cambia en «Gestionar». Antes era un
            desplegable suelto en la fila, y era lo único que se podía pulsar:
            invitaba a cambiar el estado cuando lo que se buscaba era editar
            la ficha. Un cambio de estado accidental es justo lo que no debe
            pasar en esta tabla. */}
        <span
          title={AYUDA_ESTADO[fila.estadoPanel]}
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${COLOR_ESTADO[fila.estadoPanel]}`}
        >
          {ETIQUETA_ESTADO[fila.estadoPanel]}
        </span>
      </td>
      <td className="px-4 py-3 text-slate-600">
        {fila.proximaAccion}
        {fila.diasEstancada !== null && <span className={`ml-1 ${COLOR_DIAS_ESTANCADA}`}>({fila.diasEstancada}d)</span>}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {fila.enlace ? (
          <span className="inline-flex items-center gap-1">
            {fila.enlaceComprobacionOk === false ? (
              <span title="El último chequeo falló" className="text-error-600">●</span>
            ) : fila.enlaceComprobacionOk === true ? (
              <span title="El último chequeo respondió bien" className="text-exito-600">●</span>
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
      {/* Columna pegada al borde derecho: la tabla tiene nueve columnas y
          1100px de ancho mínimo, así que sin `sticky` este botón se va fuera
          de la pantalla en cuanto la ventana es más estrecha —que es lo que
          pasaba en el móvil— y hay que adivinar que la tabla se desplaza. */}
      <td className="sticky right-0 bg-white px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
        <button
          type="button"
          onClick={onGestionar}
          className="rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Gestionar
        </button>
      </td>
    </tr>
  );
}

/**
 * Gestión completa de una afiliación: el enlace, sus condiciones y su estado,
 * en una sola pantalla con un botón de guardar de verdad.
 *
 * Se guarda al pulsar, no al salir de cada campo. Antes cada campo se
 * guardaba en su `onBlur`: si escribías el enlace y cerrabas sin tocar nada
 * más, no se guardaba nada y tampoco se decía. Para el dato del que depende
 * cobrar, eso no vale.
 */
function ModalGestion({
  fila,
  cargando,
  onCerrar,
  onGuardar,
  onComprobarEnlace,
  onGenerarRequisitos,
  onGenerarBorrador,
}: {
  fila: FilaPanelAfiliacion;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (cambios: Record<string, unknown>) => Promise<void>;
  onComprobarEnlace: () => Promise<void>;
  onGenerarRequisitos: () => void;
  onGenerarBorrador: () => void;
}) {
  const [enlace, setEnlace] = useState(fila.enlace ?? "");
  const [comision, setComision] = useState(fila.comision ?? "");
  const [duracionCookie, setDuracionCookie] = useState(fila.duracionCookie ?? "");
  const [requisitos, setRequisitos] = useState(fila.requisitosPrograma ?? "");
  const [borrador, setBorrador] = useState(fila.borradorSolicitud ?? "");
  const [estado, setEstado] = useState<EstadoPanel>(fila.estadoPanel);
  const [guardado, setGuardado] = useState(false);

  // Una cuenta activa sin enlace no puede generar comisión: es la misma regla
  // que ya vigila `consistencia.ts`. Aquí se impide antes de crearla, en vez
  // de detectarla después.
  const enlaceLimpio = enlace.trim();
  const puedeActivar = puedeActivarse(enlace);
  const activarBloqueado = estado === "activa" && !puedeActivar;
  const enlaceMalFormado = enlaceLimpio.length > 0 && !enlaceEsUsable(enlace);

  useEffect(() => {
    function alPulsarEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alPulsarEscape);
    return () => document.removeEventListener("keydown", alPulsarEscape);
  }, [onCerrar]);

  async function guardar() {
    if (activarBloqueado || enlaceMalFormado) return;
    setGuardado(false);
    await onGuardar({
      enlaceUrl: enlace.trim() || undefined,
      segmentoEnlace: enlace.trim() ? "global" : undefined,
      comision: comision.trim() || undefined,
      duracionCookie: duracionCookie.trim() || undefined,
      requisitosPrograma: requisitos.trim() || undefined,
      borradorSolicitud: borrador.trim() || undefined,
      estado: ESTADOS_AFILIACION_DESTINO[estado],
    });
    setGuardado(true);
  }

  const campo =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";
  const etiqueta = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Gestionar la afiliación de ${fila.nombreHerramienta}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-premium-lg sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900">{fila.nombreHerramienta}</h2>
            <p className="mt-0.5 text-sm text-slate-500">{fila.programaEncontrado ?? "Programa sin identificar"}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-xl px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="enlace-afiliada" className={etiqueta}>
              Enlace de afiliada
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Pégalo entero, tal cual te lo da el programa. No se recorta ni se reescribe nada.
            </p>
            <input
              id="enlace-afiliada"
              type="text"
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              placeholder="https://..."
              className={`${campo} font-mono`}
            />
            {enlaceMalFormado && (
              <p role="alert" className="mt-2 rounded-xl border border-atencion-300 bg-atencion-50 px-3 py-2 text-sm text-atencion-900">
                Esto no parece una dirección completa. Tiene que empezar por{" "}
                <code className="font-mono font-semibold">https://</code> — al pegar enlaces largos es fácil
                dejarse las primeras letras, y un enlace así se guardaría sin dar ningún error y sin llevar
                a ninguna parte.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onComprobarEnlace}
                disabled={cargando || !fila.enlace}
                className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Comprobar este enlace
              </button>
              {!fila.enlace && <span className="text-xs text-slate-500">Guarda el enlace antes de poder comprobarlo.</span>}
              {fila.enlaceUltimaComprobacion && (
                <span className="text-xs text-slate-500">
                  Última comprobación: {new Date(fila.enlaceUltimaComprobacion).toLocaleString("es-ES")}
                  {fila.enlaceComprobacionOk === false ? " · falló" : fila.enlaceComprobacionOk ? " · correcta" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="comision" className={etiqueta}>
                Comisión
              </label>
              <input
                id="comision"
                type="text"
                value={comision}
                onChange={(e) => setComision(e.target.value)}
                placeholder="60 % recurrente vitalicio"
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="duracion-cookie" className={etiqueta}>
                Duración de la cookie o atribución
              </label>
              {/* Sigue siendo texto libre —cada programa lo dice a su manera—
                  pero con sugerencias, y la permanencia la primera: hasta
                  ahora el campo se llamaba solo "duración de la cookie" y
                  empujaba a inventarse un número de días para programas cuya
                  atribución no caduca nunca. */}
              <input
                id="duracion-cookie"
                type="text"
                list="sugerencias-atribucion"
                value={duracionCookie}
                onChange={(e) => setDuracionCookie(e.target.value)}
                placeholder="30 días · Permanente — sin caducidad"
                className={campo}
              />
              <datalist id="sugerencias-atribucion">
                {SUGERENCIAS_ATRIBUCION.map((valor) => (
                  <option key={valor} value={valor} />
                ))}
              </datalist>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SUGERENCIAS_ATRIBUCION.slice(0, 3).map((valor) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setDuracionCookie(valor)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                  >
                    {valor}
                  </button>
                ))}
              </div>
              {esAtribucionPermanente(duracionCookie) && (
                <p className="mt-1.5 text-xs text-exito-700">
                  Atribución sin caducidad: la venta se te sigue atribuyendo sin límite de tiempo.
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="estado-afiliacion" className={etiqueta}>
              Estado
            </label>
            <select
              id="estado-afiliacion"
              value={estado}
              onChange={(e) => setEstado(e.target.value as EstadoPanel)}
              className={campo}
            >
              {(Object.keys(ETIQUETA_ESTADO) as EstadoPanel[]).map((valor) => (
                <option key={valor} value={valor} disabled={valor === "activa" && !puedeActivar}>
                  {ETIQUETA_ESTADO[valor]}
                  {valor === "activa" && !puedeActivar ? " — necesita enlace" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">{AYUDA_ESTADO[estado]}</p>
            {activarBloqueado && (
              <p role="alert" className="mt-2 rounded-xl border border-atencion-300 bg-atencion-50 px-3 py-2 text-sm text-atencion-900">
                Para activarla hace falta un enlace: una cuenta activa sin enlace no puede generar comisión.
              </p>
            )}
          </div>

          <details className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Requisitos y borrador de solicitud
            </summary>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="requisitos" className={etiqueta}>
                    Requisitos del programa
                  </label>
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
                  id="requisitos"
                  rows={3}
                  value={requisitos}
                  onChange={(e) => setRequisitos(e.target.value)}
                  placeholder="Sin investigar todavía."
                  className={campo}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="borrador" className={etiqueta}>
                    Borrador de solicitud
                  </label>
                  <button
                    type="button"
                    disabled={cargando}
                    onClick={onGenerarBorrador}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 disabled:opacity-50"
                  >
                    Redactar con IA
                  </button>
                </div>
                <textarea
                  id="borrador"
                  rows={3}
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  placeholder="Sin generar todavía."
                  className={campo}
                />
              </div>
            </div>
          </details>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={guardar}
            disabled={cargando || activarBloqueado || enlaceMalFormado}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {cargando ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          {guardado && !cargando && (
            <span role="status" className="text-sm font-semibold text-exito-700">
              Cambios guardados.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
