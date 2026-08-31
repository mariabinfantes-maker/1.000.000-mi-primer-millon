"use client";

import { useState } from "react";
import { ESTADOS_INGRESO } from "@/agents/atlas-revenue/tipos";
import { COOKIE_CSRF } from "@/lib/admin/cookies";

/** La cookie CSRF no es httpOnly a propósito: el navegador tiene que poder devolverla en la cabecera. */
function leerCookie(nombre: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const encaje = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return encaje ? decodeURIComponent(encaje[1]) : undefined;
}

/**
 * Anotar a mano lo que dice un panel de afiliación.
 *
 * El importe se pide en euros y céntimos por separado a propósito: escribir
 * "47,15" en una sola casilla invita a que el navegador o el idioma del
 * teclado decidan si esa coma es un decimal o un separador de miles. Dos
 * casillas de números enteros no admiten esa ambigüedad.
 */
export default function FormularioIngreso({
  herramientas,
}: {
  herramientas: { id: string; nombre: string }[];
}) {
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    // `currentTarget` solo es válido mientras dura el despacho del evento:
    // tras el primer `await` vale null. Se guarda aquí la referencia al
    // formulario porque más abajo hay que vaciarlo, ya con la petición hecha.
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const euros = Number(datos.get("euros") ?? 0);
    const centimos = Number(datos.get("centimos") ?? 0);

    setEnviando(true);
    setMensaje(null);
    try {
      const csrf = leerCookie(COOKIE_CSRF);
      const respuesta = await fetch("/api/admin/ingresos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrf ? { "x-csrf-token": csrf } : {}) },
        body: JSON.stringify({
          herramientaId: datos.get("herramientaId"),
          periodo: datos.get("periodo"),
          conversiones: Number(datos.get("conversiones") ?? 0),
          importeCentimos: Math.round(euros) * 100 + Math.round(centimos),
          moneda: datos.get("moneda") || "EUR",
          estado: datos.get("estado"),
          fuente: datos.get("fuente"),
          nota: datos.get("nota"),
        }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se ha podido guardar.");
      setMensaje({ tipo: "ok", texto: "Apunte guardado. Recarga para verlo en la tabla." });
      // Vaciar el formulario es una comodidad, no parte de guardar. Si algo
      // fallara aquí no puede acabar mostrándose como error: el apunte ya
      // está escrito y la tabla no admite modificaciones, así que quien lo
      // creyera fallido volvería a enviarlo y quedaría duplicado.
      try {
        formulario.reset();
      } catch {
        /* sin consecuencias: el apunte ya está guardado */
      }
    } catch (error) {
      setMensaje({ tipo: "error", texto: error instanceof Error ? error.message : "No se ha podido guardar." });
    } finally {
      setEnviando(false);
    }
  }

  const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";
  const etiqueta = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <form onSubmit={enviar} className="rounded-2xl border border-slate-200/80 bg-white p-5 ring-1 ring-contorno">
      <h2 className="font-display text-lg font-bold text-slate-900">Anotar ingresos</h2>
      <p className="mt-1 text-sm text-slate-600">
        Lo que te comunique el panel de cada programa. Queda registrado con tu usuario y no se puede
        modificar después: para corregir una cifra, anota un apunte nuevo.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={etiqueta} htmlFor="herramientaId">Herramienta</label>
          <select id="herramientaId" name="herramientaId" required className={`mt-1 ${campo}`}>
            {herramientas.map((h) => (
              <option key={h.id} value={h.id}>{h.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={etiqueta} htmlFor="periodo">Periodo</label>
          <input id="periodo" name="periodo" required placeholder="2026-08" pattern="\d{4}-(0[1-9]|1[0-2])" className={`mt-1 ${campo}`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="conversiones">Conversiones</label>
          <input id="conversiones" name="conversiones" type="number" min={0} step={1} defaultValue={0} className={`mt-1 ${campo}`} />
        </div>
        <div>
          <label className={etiqueta} htmlFor="estado">Estado</label>
          <select id="estado" name="estado" required defaultValue="pendiente" className={`mt-1 ${campo}`}>
            {ESTADOS_INGRESO.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 sm:col-span-2">
          <div>
            <label className={etiqueta} htmlFor="euros">Euros</label>
            <input id="euros" name="euros" type="number" min={0} step={1} defaultValue={0} className={`mt-1 ${campo}`} />
          </div>
          <span className="pb-2 text-lg font-bold text-slate-400">,</span>
          <div>
            <label className={etiqueta} htmlFor="centimos">Céntimos</label>
            <input id="centimos" name="centimos" type="number" min={0} max={99} step={1} defaultValue={0} className={`mt-1 ${campo}`} />
          </div>
          <input name="moneda" defaultValue="EUR" aria-label="Moneda" className={`${campo} w-20`} />
        </div>
        <div className="sm:col-span-2">
          <label className={etiqueta} htmlFor="fuente">De dónde sale el dato</label>
          <input id="fuente" name="fuente" placeholder="Panel de Systeme.io" className={`mt-1 ${campo}`} />
        </div>
        <div className="sm:col-span-2">
          <label className={etiqueta} htmlFor="nota">Nota</label>
          <input id="nota" name="nota" placeholder="Opcional" className={`mt-1 ${campo}`} />
        </div>
      </div>

      {mensaje && (
        <p role="alert" className={`mt-4 rounded-xl px-3 py-2 text-sm ${mensaje.tipo === "ok" ? "bg-exito-50 text-exito-800" : "bg-error-50 text-error-700"}`}>
          {mensaje.texto}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition hover:bg-brand-700 disabled:opacity-50"
      >
        {enviando ? "Guardando…" : "Anotar"}
      </button>
    </form>
  );
}
