import Image from "next/image";
import { Scale } from "lucide-react";
import { aVistaDeTarjeta } from "@/lib/vistaRecomendacion";
import type { OrigenDiagnostico } from "@/lib/origenDiagnostico";
import { getAgente } from "@/lib/agentes";
import type { HerramientaEvaluada } from "@/agents/atlas-advisor";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import BotonCompartir from "@/components/ui/BotonCompartir";
import AvatarAgente from "@/components/ui/AvatarAgente";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

const RECOMENDADOR = getAgente("recomendador");

/**
 * Pantalla de resultados (P-03): puramente presentacional, sin estado
 * propio. El resultado ya llega resuelto desde `/resultado/[token]/page.tsx`
 * (`lib/resultadoCompartido.ts`), que es quien decide qué mostrar cuando
 * un enlace no es válido — esta pantalla solo pinta un resultado que ya
 * se sabe válido.
 */
export default function PantallaRecomendacion({
  origen,
  token,
  top,
}: {
  origen: OrigenDiagnostico;
  token: string;
  top: HerramientaEvaluada[];
}) {
  const vistas = top.map((evaluada, indice) => aVistaDeTarjeta(evaluada, indice + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`${origen.rutaBase}/cuestionario`}>Repetir el cuestionario</EnlaceAtras>

      <div className="relative">
        <div className="absolute -top-6 -right-4 hidden h-40 w-40 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/resultados-cristal.png"
            alt="Un cristal facetado índigo con una faceta iluminada en dorado, la opción que destaca"
            width={320}
            height={320}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:pr-44">
          <div>
            <div className="flex items-center gap-3">
              <AvatarAgente id="recomendador" />
              <div>
                <p className="text-sm font-semibold text-agente-recomendador">{RECOMENDADOR.nombre}</p>
                <p className="text-xs text-slate-500">{RECOMENDADOR.rol}</p>
              </div>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {vistas.length === 1 ? "Tu mejor opción" : `Tus ${vistas.length} mejores opciones`}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
              {vistas.length === 1
                ? "Hemos cruzado tus respuestas con nuestra base de herramientas. Esta es la que mejor encaja contigo — todavía no tenemos otra opción investigada en esta categoría con la que compararla."
                : "Hemos cruzado tus respuestas con nuestra base de herramientas. El orden refleja qué tan bien encaja cada una con tu situación concreta — no siempre coincide con la Puntuación Molnip de cada tarjeta, que valora la herramienta en general, para cualquier empresa."}
            </p>
          </div>

          <div className="flex shrink-0 gap-3">
            <BotonCompartir
              titulo="Mi recomendación de Molnip"
              texto={`Molnip me recomienda ${vistas[0]?.nombre ?? "estas herramientas"} para mi empresa.`}
            />
            {vistas.length >= 2 && (
              <Boton href={`/resultado/${token}/comparar`} variante="secundario">
                <Scale className="h-4 w-4" aria-hidden="true" />
                Comparar
              </Boton>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {vistas.map((vista) => (
          <TarjetaHerramientaRecomendada key={vista.nombre} {...vista} />
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-slate-400">
        Puedes cerrar esta página y volver cuando quieras: esta misma dirección siempre te devuelve a esta
        recomendación.
      </p>
    </div>
  );
}
