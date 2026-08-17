import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getHerramienta, getHerramientas } from "@/data/repositorio";
import { getAlternativas } from "@/agents/atlas-generador-contenido/alternativas";
import { metadataAlternativas } from "@/agents/atlas-generador-contenido/metadatos";
import { aVistaDeTarjetaGenerica } from "@/lib/vistaRecomendacion";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import EstadoVacio from "@/components/ui/EstadoVacio";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

export function generateStaticParams() {
  return getHerramientas().map((h) => ({ herramientaId: h.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ herramientaId: string }>;
}): Promise<Metadata> {
  const { herramientaId } = await params;
  const herramienta = getHerramienta(herramientaId);
  return herramienta ? metadataAlternativas(herramienta) : {};
}

/**
 * Página "alternativas a X" (Atlas Generador de Contenido, Capa 1) —
 * captura intención de búsqueda de sustitución. Mismo patrón que las
 * landings de categoría/problema: `getAlternativas` ya devuelve el
 * catálogo real ordenado por Puntuación Atlas, `aVistaDeTarjetaGenerica`
 * lo adapta a la misma tarjeta reutilizada en todo el sitio.
 */
export default async function AlternativasPage({
  params,
}: {
  params: Promise<{ herramientaId: string }>;
}) {
  const { herramientaId } = await params;
  const herramienta = getHerramienta(herramientaId);

  if (!herramienta) notFound();

  const alternativas = getAlternativas(herramienta);
  const vistas = alternativas.map((h, indice) => aVistaDeTarjetaGenerica(h, indice + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href={`/herramienta/${herramienta.id}`}>Volver a la ficha</EnlaceAtras>

      <div className="relative lg:pr-40">
        <div className="absolute -top-2 -right-4 hidden h-32 w-32 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/categoria-gema.png"
            alt=""
            width={480}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Alternativas a {herramienta.nombre}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Otras opciones de la misma categoría, ordenadas por Puntuación Atlas.
        </p>
      </div>

      {vistas.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {vistas.map((vista) => (
            <TarjetaHerramientaRecomendada key={vista.id} {...vista} />
          ))}
        </div>
      ) : (
        <EstadoVacio mensaje="Todavía no hemos investigado ninguna otra herramienta en esta categoría." />
      )}
    </div>
  );
}
