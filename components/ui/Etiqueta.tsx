import type { ReactNode } from "react";

type Variante = "neutra" | "marca" | "exito";

const ESTILOS: Record<Variante, string> = {
  neutra: "bg-slate-100 text-slate-600",
  marca: "bg-brand-600 text-white",
  exito: "bg-emerald-50 text-emerald-700",
};

/** Etiqueta/pill del sistema de diseño: mismo estilo para categorías, badges y estados. */
export default function Etiqueta({
  variante = "neutra",
  children,
  className = "",
}: {
  variante?: Variante;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${ESTILOS[variante]} ${className}`}
    >
      {children}
    </span>
  );
}
