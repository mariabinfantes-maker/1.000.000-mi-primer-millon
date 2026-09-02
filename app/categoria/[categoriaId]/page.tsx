import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ClipboardList } from "lucide-react";
import { getCategoria, getCategorias, getHerramientasPorCategoria } from "@/data/repositorio";
import { MINIMO_POR_SUBTIPO, cubreSubtipo, esCategoriaPublica } from "@/data/taxonomia";
import { subtiposConContenido } from "@/agents/atlas-generador-contenido/contenidoSubtipos";
import SelectorSubtipo from "@/components/SelectorSubtipo";
import { aVistaDeTarjetaGenerica, ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import { metadataCategoria } from "@/agents/atlas-generador-contenido/metadatos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import EstadoVacio from "@/components/ui/EstadoVacio";
import { construirRutaOrigen } from "@/agents/atlas-revenue/rutaOrigen";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

export function generateStaticParams() {
  return getCategorias().map((c) => ({ categoriaId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}): Promise<Metadata> {
  const { categoriaId } = await params;
  const categoria = getCategoria(categoriaId);
  // Una categoría todavía "pendiente" existe para Curator, no para el público.
  return categoria && esCategoriaPublica(categoria) ? metadataCategoria(categoria) : {};
}

/**
 * Landing de categoría (Atlas Generador de Contenido, Capa 1) — la URL que
 * antes no existía: `/categoria/[categoriaId]` solo tenía las subrutas del
 * cuestionario. 100% derivada de datos ya reales, sin IA: el catálogo
 * público y la Puntuación Atlas que ya calcula Evaluador
 * (`lib/puntuacionAtlas.ts`). El CTA hacia cada herramienta pasa siempre
 * por `TarjetaHerramientaRecomendada`, que ya enlaza a `/herramienta/[id]/ir`
 * — nunca directo a la web oficial — así el contenido hereda cualquier
 * enlace de afiliado que Affiliate Manager active, sin leer ningún dato
 * interno de afiliación aquí.
 */
export default async function LandingCategoriaPage({
  params,
}: {
  params: Promise<{ categoriaId: string }>;
}) {
  const { categoriaId } = await params;
  const categoria = getCategoria(categoriaId);

  // Una categoría todavía "pendiente" existe solo para el catálogo interno
  // y para Curator: nunca debe tener página pública ni puerta de cuestionario.
  if (!categoria || !esCategoriaPublica(categoria)) notFound();

  const herramientas = ordenarPorPuntuacionAtlas(getHerramientasPorCategoria(categoriaId));
  const vistas = herramientas.map((herramienta, indice) => aVistaDeTarjetaGenerica(herramienta, indice + 1));

  // Solo se ofrecen los subtipos que de verdad permiten comparar: con
  // contenido editorial escrito y con al menos `MINIMO_POR_SUBTIPO`
  // alternativas. Mandar a alguien a una pantalla con una sola herramienta
  // sería justo lo contrario de lo que hace este selector.
  const opcionesSubtipo = subtiposConContenido(categoriaId)
    .map((subtipo) => ({
      id: subtipo.id,
      nombre: subtipo.nombre,
      cuantas: herramientas.filter((herramienta) => cubreSubtipo(herramienta, subtipo.id)).length,
    }))
    .filter((subtipo) => subtipo.cuantas >= MINIMO_POR_SUBTIPO);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href="/">Volver al inicio</EnlaceAtras>

      <div className="relative lg:pr-44">
        <div className="absolute -top-4 -right-4 hidden h-36 w-36 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/categoria-gema.png"
            alt=""
            width={288}
            height={288}
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {categoria.nombre}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{categoria.descripcion}</p>

        <Boton href={`/categoria/${categoria.id}/cuestionario`} className="mt-6">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Encuentra la que mejor encaja contigo
        </Boton>
      </div>

      <SelectorSubtipo categoriaId={categoria.id} opciones={opcionesSubtipo} />

      {vistas.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {vistas.map((vista) => (
            <TarjetaHerramientaRecomendada key={vista.id} {...vista} rutaOrigen={construirRutaOrigen("categoria", categoria.id)} />
          ))}
        </div>
      ) : (
        <EstadoVacio mensaje="Todavía no hemos investigado ninguna herramienta en esta categoría." />
      )}
    </div>
  );
}
