import type { ReactNode } from "react";

/**
 * Envoltorio compartido por las 4 páginas legales (aviso legal, privacidad,
 * cookies, términos): misma cabecera, misma tipografía de sección, sin
 * imaginería decorativa — a diferencia del resto del Sistema Prisma, un
 * documento legal se lee mejor cuanto más sobrio es, no cuanto más
 * "premium" parece.
 */
export default function DocumentoLegal({
  titulo,
  actualizado,
  children,
}: {
  titulo: string;
  actualizado: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-400">Última actualización: {actualizado}</p>
      <div className="mt-10">{children}</div>
    </div>
  );
}

export function SeccionLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-9 first:mt-0">
      <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

/** Bloque de datos pendientes de rellenar por la usuaria — nunca se inventa una identidad legal. */
export function DatoPendiente({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-codigo bg-atencion-100 px-1.5 py-0.5 font-mono text-[13px] text-atencion-800">{children}</span>
  );
}
