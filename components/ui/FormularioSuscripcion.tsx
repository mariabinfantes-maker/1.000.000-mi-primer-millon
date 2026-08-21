"use client";

import { useState } from "react";
import { Check, Loader2, Mail } from "lucide-react";
import type { OrigenSuscripcion } from "@/lib/email/proveedorEmail";

type Variante = "pie-de-pagina" | "resultados";

type Props = {
  variante: Variante;
  /** Solo relevante en la página de resultados: la categoría o el problema de la recomendación que se le acaba de mostrar al usuario, para poder segmentar campañas futuras por interés real. */
  categoriaId?: string;
  problemaId?: string;
};

const COPY: Record<Variante, { titulo: string; descripcion: string; etiquetaBoton: string }> = {
  "pie-de-pagina": {
    titulo: "No te pierdas nada",
    descripcion: "Herramientas nuevas y consejos para elegir mejor la tecnología de tu empresa. Sin spam.",
    etiquetaBoton: "Suscribirme",
  },
  resultados: {
    titulo: "¿Quieres la guía gratuita?",
    descripcion: "7 preguntas que debes hacerte antes de elegir cualquier software. Te la mandamos ahora mismo.",
    etiquetaBoton: "Enviarme la guía",
  },
};

type Estado = "reposo" | "cargando" | "exito" | "error";

/**
 * Formulario de captación de emails (Sistema de captación, fase 1 — ver
 * ATLAS.md). Un único componente con dos variantes de copy en vez de dos
 * componentes distintos: la lógica (validación en cliente, llamada a
 * `/api/suscribir`, estados) es idéntica en ambos sitios, solo cambia el
 * texto y el `origen` que se envía.
 */
export default function FormularioSuscripcion({ variante, categoriaId, problemaId }: Props) {
  const [email, setEmail] = useState("");
  const [webComoTeLlamas, setWebComoTeLlamas] = useState("");
  const [estado, setEstado] = useState<Estado>("reposo");
  const [mensajeError, setMensajeError] = useState("");

  const copy = COPY[variante];

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (estado === "cargando") return;

    setEstado("cargando");
    setMensajeError("");

    try {
      const respuesta = await fetch("/api/suscribir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          origen: variante satisfies OrigenSuscripcion,
          categoriaId,
          problemaId,
          webComoTeLlamas,
        }),
      });

      const cuerpo = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setMensajeError(cuerpo.error || "No hemos podido completar la suscripción.");
        setEstado("error");
        return;
      }

      setEstado("exito");
    } catch {
      setMensajeError("No hemos podido conectar. Inténtalo de nuevo en unos minutos.");
      setEstado("error");
    }
  }

  if (estado === "exito") {
    return (
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
        Listo, revisa tu bandeja de entrada.
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{copy.titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{copy.descripcion}</p>

      <form onSubmit={enviar} className="mt-4 flex flex-col gap-2 sm:flex-row">
        {/* Honeypot: invisible para una persona, un bot que rellena todos los campos a ciegas sí lo completa. */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor={`web-${variante}`}>No rellenar</label>
          <input
            id={`web-${variante}`}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={webComoTeLlamas}
            onChange={(e) => setWebComoTeLlamas(e.target.value)}
          />
        </div>

        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            aria-label="Tu email"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <button
          type="submit"
          disabled={estado === "cargando"}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-premium transition hover:bg-brand-700 hover:shadow-premium-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estado === "cargando" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {copy.etiquetaBoton}
        </button>
      </form>

      {estado === "error" && <p className="mt-2 text-xs font-medium text-rose-600">{mensajeError}</p>}
    </div>
  );
}
