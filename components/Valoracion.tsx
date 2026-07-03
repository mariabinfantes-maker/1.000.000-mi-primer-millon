export default function Valoracion({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-amber-500" aria-hidden="true">
        ★
      </span>
      <span className="text-sm font-semibold text-slate-700">
        {valor.toFixed(1)}
      </span>
      <span className="text-xs text-slate-400">/ 5</span>
    </span>
  );
}
