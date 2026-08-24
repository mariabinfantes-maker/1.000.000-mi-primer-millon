import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCategoria, getHerramientasPorCategoria, getPost, getPosts } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica, ordenarPorPuntuacionAtlas } from "@/lib/vistaRecomendacion";
import { metadataPost } from "@/agents/atlas-generador-contenido/metadatos";
import { construirDatosEstructuradosPost } from "@/agents/atlas-generador-contenido/datosEstructurados";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import Boton from "@/components/ui/Boton";
import TarjetaHerramientaRecomendada from "@/components/TarjetaHerramientaRecomendada";
import type { BloqueContenido } from "@/data/esquema";

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  return post ? metadataPost(post) : {};
}

function formatearFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Bloque({ bloque }: { bloque: BloqueContenido }) {
  if (bloque.tipo === "subtitulo") {
    return <h2 className="mt-8 font-display text-xl font-semibold text-slate-900">{bloque.texto}</h2>;
  }
  if (bloque.tipo === "lista") {
    return (
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed text-slate-600">
        {bloque.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p className="mt-4 leading-relaxed text-slate-600">{bloque.texto}</p>;
}

/**
 * Artículo del blog (Fase 4 de lanzamiento — ver ATLAS.md, Blog SEO).
 * `cuerpo` se renderiza como bloques estructurados, nunca HTML libre — igual
 * disciplina que el resto del esquema de contenido. Las herramientas
 * relacionadas solo aparecen si el post declara `categoriaId`: un enlace
 * interno real hacia el catálogo, no un intento de "vender" dentro del
 * artículo.
 */
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) notFound();

  const categoria = post.categoriaId ? getCategoria(post.categoriaId) : undefined;
  const relacionadas = categoria
    ? ordenarPorPuntuacionAtlas(getHerramientasPorCategoria(categoria.id)).slice(0, 3)
    : [];
  const datosEstructurados = construirDatosEstructuradosPost(post);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados).replace(/</g, "\\u003c") }}
      />

      <EnlaceAtras href="/blog">Volver al blog</EnlaceAtras>

      <p className="mt-6 text-xs font-medium text-slate-400">{formatearFecha(post.fechaPublicacion)}</p>
      <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {post.titulo}
      </h1>
      <p className="mt-3 max-w-xl leading-relaxed text-slate-600">{post.resumen}</p>

      <article className="mt-8">
        {post.cuerpo.map((bloque, indice) => (
          <Bloque key={indice} bloque={bloque} />
        ))}
      </article>

      {categoria && relacionadas.length > 0 && (
        <div className="mt-14 border-t border-slate-200 pt-10">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Herramientas relacionadas en {categoria.nombre}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relacionadas.map((herramienta, indice) => (
              <TarjetaHerramientaRecomendada
                key={herramienta.id}
                {...aVistaDeTarjetaGenerica(herramienta, indice + 1)}
              />
            ))}
          </div>
          <Boton href={`/categoria/${categoria.id}`} variante="secundario" className="mt-6">
            Ver toda la categoría
          </Boton>
        </div>
      )}
    </div>
  );
}
