"use client";

import { useState } from "react";
import Boton from "@/components/ui/Boton";
import Etiqueta from "@/components/ui/Etiqueta";
import type { HerramientaPropuesta, NivelConfianza } from "@/agents/atlas-researcher/tipos";

/**
 * Pantalla de prueba interna, sin enlazar desde ninguna navegación.
 * Objetivo único: confirmar a mano que Molnip Researcher investiga una
 * herramienta real de extremo a extremo en producción (Vercel +
 * GEMINI_API_KEY configurada). No forma parte del producto.
 */
export default function TestInvestigadorClient() {
  const [nombreHerramienta, setNombreHerramienta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<HerramientaPropuesta | null>(null);

  async function investigar() {
    if (!nombreHerramienta.trim() || cargando) return;

    setCargando(true);
    setError(null);
    setPropuesta(null);

    try {
      const respuesta = await fetch("/api/investigar-herramienta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreHerramienta: nombreHerramienta.trim() }),
      });

      const datos = (await respuesta.json().catch(() => null)) as {
        propuesta?: HerramientaPropuesta;
        error?: string;
      } | null;

      if (!respuesta.ok || !datos?.propuesta) {
        throw new Error(datos?.error || `Error ${respuesta.status} al investigar la herramienta.`);
      }

      setPropuesta(datos.propuesta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido al investigar la herramienta.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prueba: Molnip Researcher</h1>
      <p className="mt-2 text-sm text-slate-500">
        Pantalla interna para verificar /api/investigar-herramienta en producción. No forma parte del
        producto.
      </p>

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          investigar();
        }}
      >
        <input
          type="text"
          value={nombreHerramienta}
          onChange={(e) => setNombreHerramienta(e.target.value)}
          placeholder="Ej. Notion"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <Boton type="submit" disabled={!nombreHerramienta.trim() || cargando}>
          {cargando ? "Investigando..." : "Investigar"}
        </Boton>
      </form>

      {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {propuesta && (
        <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 p-6 shadow-premium">
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta variante={colorConfianza(propuesta.confianza)}>Confianza: {propuesta.confianza}</Etiqueta>
            {propuesta.fuentes.map((fuente) => (
              <Etiqueta key={fuente}>{fuente}</Etiqueta>
            ))}
          </div>

          {propuesta.advertencias.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-atencion-600">Advertencias</h2>
              <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                {propuesta.advertencias.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {propuesta.camposFaltantes.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Campos faltantes</h2>
              <p className="mt-1 text-sm text-slate-600">{propuesta.camposFaltantes.join(", ")}</p>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Datos investigados (ficha pública)
            </h2>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              {JSON.stringify(propuesta.datos, null, 2)}
            </pre>
          </div>

          <div>
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              AffiliateData
              <Etiqueta variante="neutra">Interno — no visible para el usuario final</Etiqueta>
            </h2>
            <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
              {JSON.stringify(propuesta.datosAfiliados, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function colorConfianza(confianza: NivelConfianza): "exito" | "neutra" | "marca" {
  if (confianza === "alta") return "exito";
  if (confianza === "media") return "marca";
  return "neutra";
}
