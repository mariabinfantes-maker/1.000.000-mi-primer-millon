import IconoProblema from "./IconoProblema";

export default function MigaProblema({
  problemaId,
  titulo,
  extra,
}: {
  problemaId: string;
  titulo: string;
  extra?: string;
}) {
  return (
    <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
      <IconoProblema problemaId={problemaId} className="h-4 w-4" />
      {titulo}
      {extra && <span className="font-normal text-slate-400"> · {extra}</span>}
    </p>
  );
}
