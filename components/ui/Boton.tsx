import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Variante = "primario" | "secundario" | "fantasma";
type Tamano = "normal" | "grande";

const ESTILOS_VARIANTE: Record<Variante, string> = {
  primario: "bg-brand-600 text-white shadow-sm shadow-brand-200 hover:bg-brand-700",
  secundario: "border border-brand-200 bg-white text-brand-700 hover:bg-brand-50",
  fantasma: "text-brand-600 hover:bg-brand-50 hover:text-brand-800",
};

const ESTILOS_TAMANO: Record<Tamano, string> = {
  normal: "px-5 py-2.5 text-sm",
  grande: "px-8 py-3.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
  children: ReactNode;
  variante?: Variante;
  tamano?: Tamano;
  className?: string;
  href?: string;
  externo?: boolean;
  onClick?: MouseEventHandler;
  type?: "button" | "submit";
  disabled?: boolean;
};

/** Botón de marca único para toda la web: mismo look en enlaces internos, externos y acciones. */
export default function Boton({
  children,
  variante = "primario",
  tamano = "normal",
  className = "",
  href,
  externo = false,
  onClick,
  type = "button",
  disabled = false,
}: Props) {
  const clases = `${BASE} ${ESTILOS_VARIANTE[variante]} ${ESTILOS_TAMANO[tamano]} ${className}`;

  if (href) {
    if (externo) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={clases}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={clases}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={clases}>
      {children}
    </button>
  );
}
