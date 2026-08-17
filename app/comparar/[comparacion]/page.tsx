import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { getHerramienta } from "@/data/repositorio";
import { analizarSlugComparacion, evaluarParComparacion, generarParesComparacion } from "@/agents/atlas-generador-contenido/comparaciones";
import { metadataComparacion } from "@/agents/atlas-generador-contenido/metadatos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import TablaComparativa from "@/components/TablaComparativa";

export function generateStaticParams() {
  return generarParesComparacion().map((par) => ({ comparacion: par.slug }));
}

/**
 * Página de comparación par a par (Atlas Generador de Contenido, Capa 1) —
 * captura intención de búsqueda de comparación directa ("X vs Y"). El
 * orden de los dos ids en la URL no importa: se resuelven ambos igual y
 * siempre se muestra el mismo contenido, así que no hace falta redirigir
 * la variante no canónica — solo `generateStaticParams` pre-genera la
 * versión alfabética, evitando duplicar la misma comparación bajo dos URLs.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ comparacion: string }>;
}): Promise<Metadata> {
  const { comparacion } = await params;
  const par = analizarSlugComparacion(comparacion);
  if (!par) return {};
  const a = getHerramienta(par.idA);
  const b = getHerramienta(par.idB);
  if (!a || !b) return {};
  return metadataComparacion(a, b);
}

export default async function ComparacionPage({
  params,
}: {
  params: Promise<{ comparacion: string }>;
}) {
  const { comparacion } = await params;
  const par = analizarSlugComparacion(comparacion);
  if (!par) notFound();

  const a = getHerramienta(par.idA);
  const b = getHerramienta(par.idB);
  if (!a || !b) notFound();

  const { evaluadas, filas } = evaluarParComparacion(a, b);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href="/">Volver al inicio</EnlaceAtras>

      <div className="relative lg:pr-40">
        <div className="absolute -top-2 -right-4 hidden h-32 w-32 overflow-hidden rounded-3xl shadow-premium-lg lg:block">
          <Image
            src="/imagenes/marca/comparador-gemas.png"
            alt="Dos cristales facetados uno junto al otro, uno dorado y otro neutro — comparar para elegir"
            width={480}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {a.nombre} vs {b.nombre}
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Comparativa objetiva criterio a criterio, calculada por Molnip — sin cuestionario de por medio.
        </p>
      </div>

      <div className="mt-8">
        <TablaComparativa evaluadas={evaluadas} />
      </div>

      {filas.length === 0 && (
        <p className="mt-4 text-xs text-slate-400">
          Responde al cuestionario para ver cómo cambia esta comparación según tu situación concreta.
        </p>
      )}
    </div>
  );
}
