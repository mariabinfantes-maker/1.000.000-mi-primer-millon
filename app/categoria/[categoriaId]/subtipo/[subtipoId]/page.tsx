import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClipboardList, HelpCircle, TriangleAlert } from "lucide-react";
import { getCategoria, getCategorias, getHerramientasPorCategoria } from "@/data/repositorio";
import { MINIMO_POR_SUBTIPO, cubreSubtipo, esCategoriaPublica } from "@/data/taxonomia";
import { aVistaDeTarjetaGenerica, ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import { metadataSubtipo } from "@/agents/atlas-generador-contenido/metadatos";
import { construirDatosEstructuradosSubtipo } from "@/agents/atlas-generador-contenido/datosEstructurados";
import { contenidoDeSubtipo, subtiposConContenido } from "@/agents/atlas-generador-contenido/contenidoSubtipos";
import { construirRutaOrigen } from "@/agents/atlas-revenue/rutaOrigen";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";

/**
 * Landing de subtipo — la puerta que faltaba entre la categoría y el
 * cuestionario.
 *
 * Por qué es una página propia y no un filtro dentro de la categoría:
 * "herramientas para hacer presentaciones" es lo que una persona escribe en
 * Google; "IA y productividad" es un nombre interno nuestro que nadie
 * teclea. Cada subtipo es una consulta real, y merece una URL indexable con
 * contenido propio.
 *
 * Para no caer en seis páginas clonadas —el riesgo evidente al generar una
 * página por elemento de una lista— el texto NO se deriva del catálogo: vive
 * escrito a mano en `contenidoSubtipos.ts`, con el eje de decisión, tres
 * criterios concretos y el error caro de cada ámbito. Un subtipo sin ese
 * contenido no se publica (`generateStaticParams` no lo genera), porque una
 * página de relleno perjudica al dominio entero, no solo a sí misma.
 *
 * Nada de esto cambia la puerta antigua: quien entra en la categoría sin
 * elegir subtipo sigue recibiendo el muestrario que reparte
 * `repartirEntreSubtipos`, que es deliberado.
 */

/** Subtipos publicables: con contenido editorial Y con alternativas suficientes para comparar. */
function subtiposPublicables(categoriaId: string): { id: string; nombre: string; herramientas: ReturnType<typeof getHerramientasPorCategoria> }[] {
  const deLaCategoria = getHerramientasPorCategoria(categoriaId);
  return subtiposConContenido(categoriaId)
    .map((subtipo) => ({
      ...subtipo,
      herramientas: ordenarPorPuntuacionAtlas(deLaCategoria.filter((h) => cubreSubtipo(h, subtipo.id))),
    }))
    .filter((subtipo) => subtipo.herramientas.length >= MINIMO_POR_SUBTIPO);
}

export function generateStaticParams() {
  return getCategorias()
    .filter((categoria) => esCategoriaPublica(categoria))
    .flatMap((categoria) =>
      subtiposPublicables(categoria.id).map((subtipo) => ({ categoriaId: categoria.id, subtipoId: subtipo.id }))
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
}): Promise<Metadata> {
  const { categoriaId, subtipoId } = await params;
  const contenido = contenidoDeSubtipo(subtipoId);
  const publicable = subtiposPublicables(categoriaId).some((s) => s.id === subtipoId);
  return contenido && publicable ? metadataSubtipo(categoriaId, subtipoId, contenido) : {};
}

export default async function LandingSubtipoPage({
  params,
}: {
  params: Promise<{ categoriaId: string; subtipoId: string }>;
}) {
  const { categoriaId, subtipoId } = await params;

  const categoria = getCategoria(categoriaId);
  if (!categoria || !esCategoriaPublica(categoria)) notFound();

  // Validación por taxonomía, nunca por el valor que venga en la URL: un
  // subtipo inventado no debe renderizar una página vacía ni entrar en el
  // motor. Y uno real pero sin alternativas suficientes tampoco se publica.
  const subtipo = subtiposPublicables(categoriaId).find((s) => s.id === subtipoId);
  const contenido = contenidoDeSubtipo(subtipoId);
  if (!subtipo || !contenido) notFound();

  const ruta = `/categoria/${categoriaId}/subtipo/${subtipoId}`;
  const vistas = subtipo.herramientas.map((herramienta, indice) => aVistaDeTarjetaGenerica(herramienta, indice + 1));
  const datosEstructurados = construirDatosEstructuradosSubtipo(
    contenido.titulo,
    contenido.descripcionSeo,
    ruta,
    subtipo.herramientas
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        // Serializado por nosotros a partir de datos ya validados del catálogo, nunca de entrada del usuario.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
      />

      <EnlaceAtras href={`/categoria/${categoriaId}`}>Volver a {categoria.nombre}</EnlaceAtras>

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{categoria.nombre}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {contenido.titulo}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600">{contenido.entradilla}</p>

        <Boton href={`/categoria/${categoriaId}/cuestionario?subtipo=${subtipoId}`} className="mt-6">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Encuentra la tuya en 2 minutos
        </Boton>
      </header>

      <section aria-labelledby="eje-de-decision" className="mt-12 max-w-3xl rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-contorno sm:p-8">
        <h2 id="eje-de-decision" className="font-display text-xl font-bold tracking-tight text-slate-900">
          {contenido.ejeDeDecision.titulo}
        </h2>
        <p className="mt-3 leading-relaxed text-slate-600">{contenido.ejeDeDecision.texto}</p>
      </section>

      <section aria-labelledby="las-alternativas" className="mt-12">
        <h2 id="las-alternativas" className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Las {subtipo.herramientas.length} alternativas
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Ordenadas por Puntuación Molnip, que combina nuestra valoración editorial con las reseñas
          verificadas de G2 y Capterra. Ninguna paga por aparecer aquí.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {vistas.map((vista) => (
            <TarjetaHerramientaRecomendada
              key={vista.id}
              {...vista}
              // `subtipo:` y no `categoria:`, que el vocabulario ya lo contempla: es
              // justo la atribución que faltaba para saber qué ámbito produce clics.
              rutaOrigen={construirRutaOrigen("subtipo", subtipoId)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="como-elegir" className="mt-12 max-w-3xl">
        <h2 id="como-elegir" className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Cómo elegir entre ellas
        </h2>
        <dl className="mt-6 space-y-6">
          {contenido.comoElegir.map((criterio) => (
            <div key={criterio.pregunta} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                <HelpCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <dt className="font-display text-lg font-bold text-slate-900">{criterio.pregunta}</dt>
                <dd className="mt-1 leading-relaxed text-slate-600">{criterio.explicacion}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="error-habitual" className="mt-12 max-w-3xl rounded-2xl bg-atencion-50 p-6 ring-1 ring-atencion-200 sm:p-8">
        <h2 id="error-habitual" className="flex items-center gap-2 font-display text-lg font-bold text-atencion-900">
          <TriangleAlert className="h-5 w-5 text-atencion-700" aria-hidden="true" />
          El error que más caro sale
        </h2>
        <p className="mt-3 leading-relaxed text-atencion-800">{contenido.errorHabitual}</p>
      </section>

      <section aria-labelledby="otros-subtipos" className="mt-12">
        <h2 id="otros-subtipos" className="font-display text-xl font-bold tracking-tight text-slate-900">
          Otros tipos dentro de {categoria.nombre}
        </h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {subtiposPublicables(categoriaId)
            .filter((otro) => otro.id !== subtipoId)
            .map((otro) => (
              <li key={otro.id}>
                <Boton href={`/categoria/${categoriaId}/subtipo/${otro.id}`} variante="secundario">
                  {otro.nombre}
                </Boton>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
