"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";

/**
 * Pantalla de prueba interna, sin enlazar desde ninguna navegación.
 * Objetivo único: confirmar a mano que /api/generar-imagen funciona de
 * extremo a extremo en producción (Vercel + OPENAI_API_KEY configurada).
 * No forma parte del producto ni sigue el flujo de "problema" de Atlas.
 */
export default function TestImagenClient() {
  const [prompt, setPrompt] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);

  async function generarImagen() {
    if (!prompt.trim() || cargando) return;

    setCargando(true);
    setError(null);
    setImagenUrl(null);

    try {
      const respuesta = await fetch("/api/generar-imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const datos = (await respuesta.json().catch(() => null)) as {
        url?: string | null;
        b64_json?: string | null;
        error?: string;
      } | null;

      if (!respuesta.ok) {
        throw new Error(datos?.error || `Error ${respuesta.status} al generar la imagen.`);
      }

      if (datos?.url) {
        setImagenUrl(datos.url);
      } else if (datos?.b64_json) {
        setImagenUrl(`data:image/png;base64,${datos.b64_json}`);
      } else {
        throw new Error("La respuesta no incluía ninguna imagen.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al generar la imagen.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Prueba: generación de imágenes
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Pantalla interna para verificar /api/generar-imagen en producción. No forma parte del
        producto.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          generarImagen();
        }}
      >
        <label htmlFor="prompt" className="block text-sm font-semibold text-slate-700">
          Prompt
        </label>
        <textarea
          id="prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej. un gato astronauta pintado al óleo"
          className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />

        <Boton type="submit" disabled={!prompt.trim() || cargando} className="mt-4">
          {cargando ? "Generando..." : "Generar imagen"}
        </Boton>
      </form>

      {error && (
        <p className="mt-6 rounded-xl bg-error-50 p-4 text-sm text-error-700">{error}</p>
      )}

      {imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- imagen dinámica (url externa o data URI), no apta para next/image sin configurar dominios remotos.
        <img
          src={imagenUrl}
          alt={prompt}
          className="mt-6 w-full rounded-2xl border border-slate-200 shadow-premium"
        />
      )}
    </div>
  );
}
