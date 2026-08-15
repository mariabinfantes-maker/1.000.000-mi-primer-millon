import type { CSSProperties } from "react";

const RADIO = 40;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 * Anillo de la Puntuación Atlas (0-100), calculada de verdad por
 * `lib/puntuacionAtlas.ts` — nunca un número inventado en la interfaz. El
 * trazo se anima al montar (respeta prefers-reduced-motion vía la clase
 * `animar-anillo` definida en globals.css).
 */
export default function AnilloPuntuacion({
  puntuacion,
  tamano = "normal",
}: {
  puntuacion: number;
  tamano?: "normal" | "grande";
}) {
  const clamped = Math.max(0, Math.min(100, puntuacion));
  const offset = CIRCUNFERENCIA - (clamped / 100) * CIRCUNFERENCIA;
  const tamanoPx = tamano === "grande" ? 92 : 68;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: tamanoPx, height: tamanoPx }}
    >
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" role="img" aria-label={`Puntuación Molnip: ${clamped} de 100`}>
        <circle cx="48" cy="48" r={RADIO} fill="none" className="stroke-brand-100" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={RADIO}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          className="stroke-brand-600 animar-anillo"
          style={
            {
              strokeDashoffset: offset,
              "--anillo-circunferencia": CIRCUNFERENCIA,
              "--anillo-offset": offset,
            } as CSSProperties
          }
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-slate-900 ${tamano === "grande" ? "text-2xl" : "text-lg"}`}>
          {clamped}
        </span>
        <span className="text-[10px] font-medium text-slate-400">/100</span>
      </span>
    </div>
  );
}
