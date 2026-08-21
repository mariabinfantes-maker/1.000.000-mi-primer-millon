"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import type { EventoClic } from "@/lib/analitica/proveedorAnalitica";

/**
 * Registra el clic saliente (fase 2 del plan de lanzamiento, ver ATLAS.md,
 * "Seguimiento de clics") justo antes de navegar. `sendBeacon` es la forma
 * correcta de hacerlo: entrega la petición de forma asíncrona sin
 * bloquear ni retrasar la navegación real, y el navegador la completa
 * aunque la pestaña actual ya haya empezado a cargar el destino — a
 * diferencia de un `fetch` normal, que un `unload` inminente podría
 * cancelar a medias. `fetch(..., { keepalive: true })` es el único
 * respaldo razonable si `sendBeacon` no existiera (navegadores muy
 * antiguos); nunca bloquea el `<a>` real, que sigue siendo un enlace
 * normal del navegador.
 */
function registrarClic(evento: EventoClic) {
  try {
    const cuerpo = JSON.stringify(evento);
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/clic", new Blob([cuerpo], { type: "application/json" }));
    } else {
      fetch("/api/clic", { method: "POST", headers: { "Content-Type": "application/json" }, body: cuerpo, keepalive: true });
    }
  } catch {
    // El seguimiento nunca debe impedir que el usuario llegue al proveedor.
  }
}

/**
 * El único CTA de P-07: abre la página real del proveedor en una pestaña
 * nueva (es un `<a>` normal, el navegador no espera a React para eso) y,
 * en paralelo, muestra una micro-confirmación en esta misma pestaña — sin
 * interrumpir ni retrasar la salida real, tal como especifica la Sheet 05
 * del documento de arquitectura UX.
 */
export default function BotonIrAlProveedor({
  href,
  nombre,
  evento,
}: {
  href: string;
  nombre: string;
  /** Datos del seguimiento de clics. Opcional: si no se pasa, el clic simplemente no se registra (nunca bloquea la navegación). */
  evento?: EventoClic;
}) {
  const [confirmado, setConfirmado] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setConfirmado(true);
        if (evento) registrarClic(evento);
      }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-premium transition ${
        confirmado ? "bg-emerald-600 hover:bg-emerald-600" : "bg-brand-600 hover:bg-brand-700 hover:shadow-premium-lg"
      }`}
    >
      {confirmado ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Abriendo {nombre}...
        </>
      ) : (
        <>
          Ir a {nombre}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </a>
  );
}
