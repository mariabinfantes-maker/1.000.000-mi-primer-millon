import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  destacada?: boolean;
};

/** Tarjeta base del sistema de diseño: mismo radio, borde y sombra en toda la web. */
export default function Tarjeta({ destacada = false, className = "", children, ...resto }: Props) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm transition ${
        destacada
          ? "border-brand-300 shadow-brand-100 ring-1 ring-brand-300"
          : "border-slate-200"
      } ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
