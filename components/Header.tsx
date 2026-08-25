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
        <nav className="flex items-center gap-6">
          <Link
            href="/agentes"
            className="hidden text-sm font-medium text-slate-600 transition hover:text-brand-700 sm:block"
          >
            Cómo funciona
          </Link>
          <Link
            href="/#elige-camino"
            className="text-sm font-semibold text-brand-600 transition hover:text-brand-800"
          >
            <span className="sm:hidden">Empezar</span>
            <span className="hidden sm:inline">Empezar diagnóstico</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
