import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  destacada?: boolean;
  /** Tratamiento reservado para "la opción elegida" (ver la Dirección de Arte de Molnip): acento dorado, nunca más de una vez por pantalla. */
  ganadora?: boolean;
};

/** Tarjeta base del sistema de diseño: mismo radio, borde y sombra premium en toda la web. */
export default function Tarjeta({ destacada = false, ganadora = false, className = "", children, ...resto }: Props) {
  const estilo = ganadora
    ? "border-gold-300 shadow-premium-lg ring-gold-100"
    : destacada
      ? "border-brand-300 shadow-premium ring-brand-100"
      : "border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

  return (
    <div
      className={`rounded-2xl border bg-white p-6 ring-1 ring-contorno transition ${estilo} ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
