import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/data/repositorio";
import { metadataBlog } from "@/agents/atlas-generador-contenido/metadatos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import EstadoVacio from "@/components/ui/EstadoVacio";

export const metadata: Metadata = metadataBlog();

function formatearFecha(fechaISO: string): string {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Índice del blog (Fase 4 de lanzamiento — ver ATLAS.md, Blog SEO): la
 * estructura sale ya completa (esquema, rutas, metadata, JSON-LD, sitemap),
 * pero deliberadamente con muy pocos posts — la biblioteca de contenido en
 * sí queda para después, no forma parte de esta fase. `getPosts()` puede
 * devolver `[]` de forma honesta y esta página sigue siendo útil (estado
 * vacío explícito, nunca contenido inventado para rellenar).
 */
export default function BlogIndexPage() {
  const posts = getPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <EnlaceAtras href="/">Volver al inicio</EnlaceAtras>

      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        El blog de Molnip
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
        Guías y análisis para decidir con criterio entre herramientas y plataformas todo en uno — escritos por el
        mismo equipo que investiga cada ficha del catálogo, nunca patrocinados.
      </p>

      {posts.length > 0 ? (
        <div className="mt-10 flex flex-col gap-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-contorno transition hover:-translate-y-0.5 hover:shadow-premium"
            >
              <p className="text-xs font-medium text-slate-400">{formatearFecha(post.fechaPublicacion)}</p>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-slate-900 group-hover:text-brand-700">
                {post.titulo}
              </h2>
              <p className="mt-2 leading-relaxed text-slate-600">{post.resumen}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EstadoVacio mensaje="Todavía no hemos publicado ningún artículo — vuelve pronto." />
      )}
    </div>
  );
}
