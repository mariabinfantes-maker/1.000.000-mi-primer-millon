import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Atlas
          </span>
        </Link>
        <p className="hidden text-sm text-slate-500 sm:block">
          El asesor que encuentra tu mejor herramienta
        </p>
      </div>
    </header>
  );
}
