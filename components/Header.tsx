import Link from "next/link";
import SimboloMolnip from "@/components/ui/SimboloMolnip";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <SimboloMolnip className="h-9 w-9 shrink-0 shadow-sm shadow-brand-200" />
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            Molnip
          </span>
        </Link>
        <p className="hidden text-sm text-slate-500 sm:block">
          El asesor que encuentra tu mejor herramienta
        </p>
      </div>
    </header>
  );
}
