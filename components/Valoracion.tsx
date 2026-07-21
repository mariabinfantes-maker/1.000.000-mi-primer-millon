import { Star } from "lucide-react";

export default function Valoracion({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-sm font-semibold text-slate-700">
        {valor.toFixed(1)}
      </span>
      <span className="text-xs text-slate-400">/ 5</span>
    </span>
  );
}
