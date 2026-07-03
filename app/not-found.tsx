import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 text-slate-600">
        No hemos encontrado lo que buscas. Vuelve al inicio para elegir un
        problema y encontrar tu herramienta ideal.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
