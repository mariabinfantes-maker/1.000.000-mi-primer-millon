import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import AvatarAgente from "@/components/ui/AvatarAgente";
import TablaComparativa from "@/components/TablaComparativa";

const EVALUADOR = getAgente("evaluador");

/**
 * Comparador guiado (P-05): puramente presentacional, igual que
 * `PantallaRecomendacion.tsx` — el resultado ya llega resuelto y validado
 * desde `/resultado/[token]/comparar/page.tsx`. Nunca deja elegir filas
 * libremente de todo el catálogo, que es justo lo que convertía al
 * comparador anterior (`/problema/[id]/[categoriaId]`) en un directorio.
 */
export default function PantallaComparador({
  token,
  top,
  rutaOrigen,
  usoSinConfirmar,
}: {
  token: string;
  top: HerramientaEvaluada[];
  /** Atlas Revenue: de qué recorrido salió la recomendación que se está comparando. */
  rutaOrigen?: string;
  /**
   * El aviso de uso sin confirmar de la pantalla de resultados. Viaja hasta
   * aquí porque comparar es el momento de decidir: si el aviso se quedara en
   * la pantalla anterior, la tabla presentaría como equivalentes unas
   * candidatas cuyo uso no está confirmado.
   */
  usoSinConfirmar?: { tarjeta: string; grupo: string };
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`/resultado/${token}`}>Volver a tus opciones</EnlaceAtras>

      <div className="relative lg:pr-44">
        <div className="absolute -top-2 -right-4 hidden h-36 w-36 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/comparador-gemas.png"
            alt="Dos cristales facetados uno junto al otro, uno dorado y otro neutro — comparar para elegir"
            width={288}
            height={288}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <AvatarAgente id="evaluador" />
          <div>
            <p className="text-sm font-semibold text-agente-evaluador">{EVALUADOR.nombre}</p>
            <p className="text-xs text-slate-500">{EVALUADOR.rol}</p>
          </div>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {usoSinConfirmar ? "Comparativa guiada de las candidatas" : "Comparativa guiada"}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Solo se muestran los criterios en los que estas opciones realmente se diferencian, no una tabla exhaustiva.
        </p>
      </div>

      {usoSinConfirmar && (
        <section
          aria-labelledby="comparador-uso-sin-confirmar"
          className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-contorno"
        >
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-atencion-700">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {usoSinConfirmar.grupo}
          </p>
          <h2 id="comparador-uso-sin-confirmar" className="sr-only">
            {usoSinConfirmar.grupo}
          </h2>
          <p className="mt-2 leading-relaxed text-slate-600">{usoSinConfirmar.tarjeta}</p>
        </section>
      )}

      <div className="mt-8">
        <TablaComparativa evaluadas={top} rutaOrigen={rutaOrigen} />
      </div>
    </div>
  );
}
