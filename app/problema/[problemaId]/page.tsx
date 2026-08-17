import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ClipboardList } from "lucide-react";
import { getHerramientasPorProblema, getProblema, getProblemas } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica, ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import { metadataProblema } from "@/agents/atlas-generador-contenido/metadatos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import IconoProblema from "@/components/ui/IconoProblema";
import EstadoVacio from "@/components/ui/EstadoVacio";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

export function generateStaticParams() {
  return getProblemas().map((p) => ({ problemaId: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ problemaId: string }>;
}): Promise<Metadata> {
  const { problemaId } = await params;
  const problema = getProblema(problemaId);
  return problema ? metadataProblema(problema) : {};
}

/**
 * Landing de problema (Atlas Generador de Contenido, Capa 1) — hermana de
 * la landing de categoría, misma disciplina. `getHerramientasPorProblema`
 * puede devolver un array vacío de forma honesta si algún día se añade un
 * objetivo nuevo antes de etiquetar herramientas con ese `problemasIds` —
 * nunca se rellena con nada inventado; en su lugar, un estado vacío
 * explícito que sigue ofreciendo el cuestionario como camino alternativo.
 */
export default async function LandingProblemaPage({
  params,
}: {
  params: Promise<{ problemaId: string }>;
}) {
  const { problemaId } = await params;
  const problema = getProblema(problemaId);

  if (!problema) notFound();

  const herramientas = ordenarPorPuntuacionAtlas(getHerramientasPorProblema(problemaId));
  const vistas = herramientas.map((herramienta, indice) => aVistaDeTarjetaGenerica(herramienta, indice + 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href="/">Volver al inicio</EnlaceAtras>

      <div className="relative lg:pr-40">
        <div className="absolute -top-4 -right-4 hidden h-32 w-32 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/categoria-gema.png"
            alt=""
            width={480}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
            <IconoProblema problemaId={problema.id} />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {problema.titulo}
          </h1>
        </div>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">{problema.descripcion}</p>

        <Boton href={`/problema/${problema.id}/cuestionario`} className="mt-6">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Empezar diagnóstico
        </Boton>
      </div>

      {vistas.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {vistas.map((vista) => (
            <TarjetaHerramientaRecomendada key={vista.id} {...vista} />
          ))}
        </div>
      ) : (
        <EstadoVacio mensaje="Todavía no hemos investigado ninguna herramienta específica para esto — empieza el diagnóstico y te ayudamos igualmente con lo que ya tenemos en el catálogo." />
      )}
    </div>
  );
}
