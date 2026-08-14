"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";

/**
 * El único CTA de P-07: abre la página real del proveedor en una pestaña
 * nueva (es un `<a>` normal, el navegador no espera a React para eso) y,
 * en paralelo, muestra una micro-confirmación en esta misma pestaña — sin
 * interrumpir ni retrasar la salida real, tal como especifica la Sheet 05
 * del documento de arquitectura UX.
 */
export default function BotonIrAlProveedor({ href, nombre }: { href: string; nombre: string }) {
  const [confirmado, setConfirmado] = useState(false);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => setConfirmado(true)}
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
