import Image from "next/image";
import Boton from "@/components/ui/Boton";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="h-36 w-36 overflow-hidden rounded-3xl shadow-premium-lg">
        <Image
          src="/imagenes/marca/404-grieta.png"
          alt="Un cristal facetado con una fina grieta, la luz dispersándose sin encontrar su camino"
          width={480}
          height={480}
          className="h-full w-full object-cover"
        />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900">
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
