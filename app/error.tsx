"use client";

import { useEffect } from "react";
import Image from "next/image";
import Boton from "@/components/ui/Boton";

/**
 * Error boundary de Next.js para cualquier excepción no controlada en una
 * ruta (fuera del layout raíz — para ese caso está `global-error.tsx`).
 * Sin este archivo, un fallo real en producción mostraría la pantalla
 * genérica de Next.js, sin marca y sin salida clara — la misma discordancia
 * que ya se corrigió para 404 (`not-found.tsx`), aquí para el resto de
 * errores. Reutiliza la misma imagen (una grieta en el cristal) porque la
 * metáfora funciona igual de bien para "algo se ha roto" que para "no
 * hemos encontrado esto".
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="h-36 w-36 overflow-hidden rounded-3xl shadow-premium-lg">
        <Image
          src="/imagenes/marca/404-grieta.png"
          alt="Un cristal facetado con una fina grieta, la luz dispersándose sin encontrar su camino"
          width={288}
          height={288}
          className="h-full w-full object-cover"
        />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900">
        Algo ha fallado
      </h1>
      <p className="mt-2 leading-relaxed text-slate-600">
        No ha sido cosa tuya — ha ocurrido un error inesperado al cargar esta pantalla. Puedes
        intentarlo de nuevo o volver al inicio.
      </p>
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
        <Boton onClick={reset}>Reintentar</Boton>
        <Boton href="/" variante="secundario">
          Volver al inicio
        </Boton>
      </div>
    </div>
  );
}
