import { getCategorias, getHerramientas, getPosts, getProblemas } from "@/data/repositorio";
import { generarParesComparacion } from "./comparaciones";

/**
 * Entradas del sitemap dinámico — solo rutas públicas indexables (ver
 * `metadatos.ts`): nunca las páginas de flujo, que ya llevan `noindex` y
 * no deben aparecer en un sitemap (le pediría a Google que indexe algo
 * que la propia página le dice que no indexe).
 *
 * Deriva de datos ya reales, igual que el resto de este agente: una
 * herramienta nueva promovida por Researcher, o un nuevo par de
 * comparación, aparece aquí sin ningún paso manual. `app/sitemap.ts`
 * (la convención de Next.js) solo le añade el dominio — la lista en sí
 * vive aquí para poder probarla sin tocar la App Router.
 */

export type EntradaSitemap = {
  ruta: string;
  prioridad: number;
  /** ISO 8601. Solo cuando hay una fecha real que reutilizar — nunca inventada. */
  ultimaModificacion?: string;
};

export function generarEntradasSitemap(): EntradaSitemap[] {
  const herramientas = getHerramientas();
  const porId = new Map(herramientas.map((h) => [h.id, h]));

  const entradas: EntradaSitemap[] = [
    { ruta: "/", prioridad: 1 },
    { ruta: "/sobre", prioridad: 0.6 },
    { ruta: "/agentes", prioridad: 0.5 },
    { ruta: "/blog", prioridad: 0.6 },
    { ruta: "/aviso-legal", prioridad: 0.2 },
    { ruta: "/privacidad", prioridad: 0.2 },
    { ruta: "/cookies", prioridad: 0.2 },
    { ruta: "/terminos", prioridad: 0.2 },
  ];

  for (const categoria of getCategorias()) {
    entradas.push({ ruta: `/categoria/${categoria.id}`, prioridad: 0.8 });
  }

  for (const problema of getProblemas()) {
    entradas.push({ ruta: `/problema/${problema.id}`, prioridad: 0.8 });
  }

  for (const herramienta of herramientas) {
    entradas.push({ ruta: `/herramienta/${herramienta.id}`, prioridad: 0.9, ultimaModificacion: herramienta.fechaUltimaRevision });
    entradas.push({
      ruta: `/herramienta/${herramienta.id}/alternativas`,
      prioridad: 0.6,
      ultimaModificacion: herramienta.fechaUltimaRevision,
    });
  }

  for (const post of getPosts()) {
    entradas.push({
      ruta: `/blog/${post.id}`,
      prioridad: 0.7,
      ultimaModificacion: post.fechaUltimaRevision ?? post.fechaPublicacion,
    });
  }

  for (const par of generarParesComparacion()) {
    const a = porId.get(par.idA);
    const b = porId.get(par.idB);
    // La comparación cambia en cuanto cambia cualquiera de las dos fichas que compara.
    const ultimaModificacion = a && b ? [a.fechaUltimaRevision, b.fechaUltimaRevision].sort().at(-1) : undefined;
    entradas.push({ ruta: `/comparar/${par.slug}`, prioridad: 0.6, ultimaModificacion });
  }

  return entradas;
}
