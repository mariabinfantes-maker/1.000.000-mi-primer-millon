import { Compass } from "lucide-react";
import Boton from "@/components/ui/Boton";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
        Página no encontrada
      </h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        No hemos encontrado lo que buscas. Vuelve al inicio para elegir un
        problema y encontrar tu herramienta ideal.
      </p>
      <Boton href="/" className="mt-6">
        Volver al inicio
      </Boton>
    </div>
  );
}
