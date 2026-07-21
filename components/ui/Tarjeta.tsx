import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  destacada?: boolean;
};

/** Tarjeta base del sistema de diseño: mismo radio, borde y sombra premium en toda la web. */
export default function Tarjeta({ destacada = false, className = "", children, ...resto }: Props) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 ring-1 ring-black/[0.02] transition ${
        destacada
          ? "border-brand-300 shadow-premium ring-brand-100"
          : "border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      } ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
