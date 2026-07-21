import { Check } from "lucide-react";

const PASOS = ["Problema", "Categoría", "Comparar", "Proveedor"];

export default function Pasos({ pasoActual }: { pasoActual: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm">
      {PASOS.map((paso, i) => {
        const numero = i + 1;
        const activo = numero === pasoActual;
        const completado = numero < pasoActual;
        return (
          <li key={paso} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition ${
                activo
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-200"
                  : completado
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {completado ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : numero}
            </span>
            <span
              className={`hidden sm:inline ${
                activo ? "font-semibold text-slate-900" : "text-slate-400"
              }`}
            >
              {paso}
            </span>
            {numero !== PASOS.length && (
              <span className="mx-1 h-px w-4 bg-slate-200 sm:w-8" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
