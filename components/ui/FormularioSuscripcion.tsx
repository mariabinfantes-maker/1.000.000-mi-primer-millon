"use client";

import { useState } from "react";
import { Check, FileDown, Loader2, Mail, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import type { OrigenSuscripcion } from "@/lib/email/proveedorEmail";

type Variante = "pie-de-pagina" | "resultados";

type Props = {
  variante: Variante;
  /** Solo relevante en la página de resultados: la categoría o el problema de la recomendación que se le acaba de mostrar al usuario, para poder segmentar campañas futuras por interés real. */
  categoriaId?: string;
  problemaId?: string;
};

const COPY: Record<
  Variante,
  { icono: ComponentType<{ className?: string }>; titulo: string; descripcion: string; etiquetaBoton: string }
> = {
  "pie-de-pagina": {
    icono: Sparkles,
    titulo: "Recibe las novedades, sin ruido",
    descripcion:
      "Herramientas nuevas y guías prácticas, escritas por el mismo equipo que investiga cada ficha del catálogo. Cero spam — date de baja cuando quieras.",
    etiquetaBoton: "Quiero recibirlo",
  },
  resultados: {
    icono: FileDown,
    titulo: "Llévate la chuleta antes de decidir",
    descripcion:
      "7 preguntas que deberías hacerte antes de elegir cualquier software — en PDF, lista en tu correo ahora mismo.",
    etiquetaBoton: "Enviarme la guía gratis",
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
  const Icono = copy.icono;
  // Cada variante lleva su propio tratamiento visual: la del pie de página
  // necesita peso propio para no diluirse en el fondo blanco del footer
  // (antes era solo texto suelto); la de resultados hereda el mismo cartón
  // premium que ya usaba `PantallaRecomendacion`, ahora movido aquí para
  // que el componente sea responsable de su propia presencia, no quien lo
  // llama.
  const contenedor =
    variante === "pie-de-pagina"
      ? "mx-auto max-w-md rounded-3xl bg-gradient-to-br from-brand-50 to-white p-6 text-center ring-1 ring-brand-100/80 sm:p-8"
      : "mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-premium ring-1 ring-contorno sm:p-8";

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
      <div className={contenedor}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-exito-100 text-exito-700">
            <Check className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Listo, revisa tu bandeja de entrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={contenedor}>
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
          <Icono className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-slate-900">{copy.titulo}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{copy.descripcion}</p>
        </div>
      </div>

      <form onSubmit={enviar} className="mt-5 flex flex-col gap-2 sm:flex-row">
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
