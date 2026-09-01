"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bot, RotateCcw, Search, User } from "lucide-react";
import { COOKIE_CSRF } from "@/lib/admin/cookies";
import type { EventoHistorial } from "@/data/repositorioEstrategiaAfiliacion";
import { describirCampo, describirFecha, describirUsuario, describirValor } from "@/agents/atlas-affiliate-manager/etiquetasHistorial";

/**
 * Historial de cambios de la estrategia de afiliación.
 *
 * Cada apunte es inmutable: la base de datos rechaza modificarlo o
 * borrarlo (ver `data/db/esquema.ts`). Restaurar un valor anterior no
 * reescribe nada, crea un apunte NUEVO — por eso el botón dice "Restaurar
 * este valor" y no "Deshacer": lo que hace es volver a poner el valor de
 * antes, dejando constancia de que se hizo.
 */

function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

type Props = {
  eventosIniciales: EventoHistorial[];
  totalInicial: number;
  nombresDeHerramienta: Record<string, string>;
  porPagina: number;
};

export default function PanelHistorial({ eventosIniciales, totalInicial, nombresDeHerramienta, porPagina }: Props) {
  const [eventos, setEventos] = useState(eventosIniciales);
  const [total, setTotal] = useState(totalInicial);
  const [busqueda, setBusqueda] = useState("");
  const [herramientaId, setHerramientaId] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: "ok" | "error" } | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const primeraCarga = useRef(true);

  const herramientasConHistorial = useMemo(() => {
    // Se listan las del catálogo, ordenadas por nombre, para poder filtrar
    // por cualquiera aunque su historial esté fuera de la página actual.
    return Object.entries(nombresDeHerramienta).sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [nombresDeHerramienta]);

  async function cargar(opciones: { busqueda: string; herramientaId: string; desplazamiento: number; añadir: boolean }) {
    setCargando(true);
    const parametros = new URLSearchParams({ limite: String(porPagina), desplazamiento: String(opciones.desplazamiento) });
    if (opciones.busqueda.trim()) parametros.set("busqueda", opciones.busqueda.trim());
    if (opciones.herramientaId) parametros.set("herramientaId", opciones.herramientaId);

    try {
      const respuesta = await fetch(`/api/admin/afiliacion/historial?${parametros}`);
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ texto: datos.error ?? "No se pudo cargar el historial.", tipo: "error" });
      } else {
        setEventos((previos) => (opciones.añadir ? [...previos, ...datos.historial] : datos.historial));
        setTotal(datos.total);
      }
    } catch {
      setMensaje({ texto: "Error de red al cargar el historial.", tipo: "error" });
    }
    setCargando(false);
  }

  // Búsqueda con retardo: no se lanza una consulta por cada tecla.
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    const temporizador = setTimeout(() => {
      cargar({ busqueda, herramientaId, desplazamiento: 0, añadir: false });
    }, 300);
    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, herramientaId]);

  async function restaurar(evento: EventoHistorial) {
    setCargando(true);
    setMensaje(null);
    const csrf = leerCookie(COOKIE_CSRF);
    try {
      const respuesta = await fetch("/api/admin/afiliacion/restaurar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
        body: JSON.stringify({ idEvento: evento.id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ texto: datos.error ?? "No se pudo restaurar.", tipo: "error" });
      } else {
        const { etiqueta } = describirCampo(evento.campo);
        setMensaje({
          texto: `"${etiqueta}" de ${nombreDe(evento.herramientaId)} ha vuelto a su valor anterior. Se ha añadido un apunte nuevo al historial.`,
          tipo: "ok",
        });
        await cargar({ busqueda, herramientaId, desplazamiento: 0, añadir: false });
      }
    } catch {
      setMensaje({ texto: "Error de red al restaurar.", tipo: "error" });
    }
    setConfirmando(null);
    setCargando(false);
  }

  function nombreDe(id: string): string {
    return nombresDeHerramienta[id] ?? id;
  }

  const hayMas = eventos.length < total;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Historial de cambios</h1>
          <p className="mt-1 text-sm text-slate-600">
            {total.toLocaleString("es-ES")} {total === 1 ? "cambio registrado" : "cambios registrados"}
            {(busqueda || herramientaId) && " con los filtros actuales"}.
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
        Cada modificación del panel queda registrada aquí y <strong className="font-semibold text-slate-800">no se puede borrar ni alterar</strong> —
        la propia base de datos lo impide. Restaurar un valor anterior no borra nada: vuelve a ponerlo y deja constancia
        de ello con un apunte nuevo.
      </p>

      {/* ── Filtros ─────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por campo, usuario o contenido…"
            aria-label="Buscar en el historial"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <select
          value={herramientaId}
          onChange={(e) => setHerramientaId(e.target.value)}
          aria-label="Filtrar por herramienta"
          className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="">Todas las herramientas</option>
          {herramientasConHistorial.map(([id, nombre]) => (
            <option key={id} value={id}>
              {nombre}
            </option>
          ))}
        </select>

        {(busqueda || herramientaId) && (
          <button
            type="button"
            onClick={() => {
              setBusqueda("");
              setHerramientaId("");
            }}
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Quitar filtros
          </button>
        )}
      </div>

      {mensaje && (
        <p
          role="status"
          className={`mt-4 rounded-xl px-4 py-3 text-sm ring-1 ${
            mensaje.tipo === "ok" ? "bg-exito-50 text-exito-800 ring-exito-200" : "bg-error-50 text-error-800 ring-error-200"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {/* ── Lista de cambios ────────────────────────────────────── */}
      {eventos.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold text-slate-700">No hay ningún cambio que coincida</p>
          <p className="mt-1 text-sm text-slate-500">
            {busqueda || herramientaId ? "Prueba con otros filtros." : "Los cambios que hagas en el panel aparecerán aquí."}
          </p>
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {eventos.map((evento) => (
            <ApunteHistorial
              key={evento.id}
              evento={evento}
              nombreHerramienta={nombreDe(evento.herramientaId)}
              confirmando={confirmando === evento.id}
              onPedirConfirmacion={() => {
                setMensaje(null);
                setConfirmando(evento.id);
              }}
              onCancelar={() => setConfirmando(null)}
              onRestaurar={() => restaurar(evento)}
              cargando={cargando}
            />
          ))}
        </ol>
      )}

      {hayMas && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={cargando}
            onClick={() => cargar({ busqueda, herramientaId, desplazamiento: eventos.length, añadir: true })}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {cargando ? "Cargando…" : `Ver más (${(total - eventos.length).toLocaleString("es-ES")} restantes)`}
          </button>
        </div>
      )}
    </div>
  );
}

function ApunteHistorial({
  evento,
  nombreHerramienta,
  confirmando,
  onPedirConfirmacion,
  onCancelar,
  onRestaurar,
  cargando,
}: {
  evento: EventoHistorial;
  nombreHerramienta: string;
  confirmando: boolean;
  onPedirConfirmacion: () => void;
  onCancelar: () => void;
  onRestaurar: () => void;
  cargando: boolean;
}) {
  const { etiqueta, cuentaId } = describirCampo(evento.campo);
  const autor = describirUsuario(evento.usuario);
  const anterior = describirValor(evento.valorAnterior);
  const nuevo = describirValor(evento.valorNuevo);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-semibold text-slate-900">
          {nombreHerramienta}
          <span className="ml-2 font-normal text-slate-500">· {etiqueta}</span>
        </p>
        <p className="text-xs tabular-nums text-slate-400">{describirFecha(evento.fecha)}</p>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-3">
        <ValorMostrado titulo="Antes" texto={anterior} tono="antes" />
        <ArrowRight className="hidden h-4 w-4 shrink-0 self-center text-slate-300 sm:block" aria-hidden="true" />
        <ValorMostrado titulo="Después" texto={nuevo} tono="despues" />
      </div>

      {evento.motivo && <p className="mt-3 text-xs italic text-slate-500">{evento.motivo}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          {autor.esAutomatico ? <Bot className="h-3.5 w-3.5" aria-hidden="true" /> : <User className="h-3.5 w-3.5" aria-hidden="true" />}
          {autor.nombre}
          {cuentaId && <span className="text-slate-400">· cuenta {cuentaId}</span>}
        </p>

        {confirmando ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600">¿Volver al valor de antes?</span>
            <button
              type="button"
              onClick={onRestaurar}
              disabled={cargando}
              className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {cargando ? "Restaurando…" : "Sí, restaurar"}
            </button>
            <button
              type="button"
              onClick={onCancelar}
              disabled={cargando}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={onPedirConfirmacion}
            disabled={cargando}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restaurar este valor
          </button>
        )}
      </div>
    </li>
  );
}

function ValorMostrado({ titulo, texto, tono }: { titulo: string; texto: string; tono: "antes" | "despues" }) {
  const vacio = texto === "(vacío)" || texto === "(ninguno)";
  return (
    <div className={`rounded-xl px-3 py-2 ${tono === "antes" ? "bg-slate-50" : "bg-exito-50/60"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm ${vacio ? "italic text-slate-400" : "text-slate-800"}`}>{texto}</p>
    </div>
  );
}
