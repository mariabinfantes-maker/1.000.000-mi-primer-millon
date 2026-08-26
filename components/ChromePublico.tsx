"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import FormularioSuscripcion from "@/components/ui/FormularioSuscripcion";

/**
 * Decide si se muestra el encabezado y el pie públicos, o nada — usado por
 * `app/layout.tsx` para que `/admin/*` tenga su propio layout interno
 * (`app/admin/layout.tsx`) sin heredar navegación, newsletter ni pie
 * público.
 *
 * Deliberadamente NO se implementó moviendo todas las rutas públicas a un
 * grupo de rutas con su propio root layout (la alternativa "oficial" de
 * Next.js para varios root layouts): esa opción exige reubicar ~25
 * archivos, incluidos convenios especiales (`error.tsx`, `not-found.tsx`,
 * `global-error.tsx`, `sitemap.ts`, `robots.ts`, iconos, `opengraph-image`)
 * cuyo comportamiento exacto con varios root layouts no estaba verificado
 * con la confianza suficiente para una petición explícita de "no
 * modifiques visualmente las páginas públicas". Este componente logra el
 * mismo resultado sin mover ni un solo archivo público: `usePathname()` se
 * resuelve correctamente también en el primer render del servidor (no es
 * un parpadeo tras hidratar), así que no hay riesgo de mostrar el
 * encabezado público un instante en `/admin`.
 */
export default function ChromePublico({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const esAdmin = pathname?.startsWith("/admin");

  if (esAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FormularioSuscripcion variante="pie-de-pagina" />

          <div className="mt-10 flex flex-col items-center gap-4 border-t border-slate-100 pt-8 text-center">
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
              <Link href="/" className="transition hover:text-brand-700">
                Inicio
              </Link>
              <Link href="/sobre" className="transition hover:text-brand-700">
                Sobre Molnip
              </Link>
              <Link href="/#como-funciona" className="transition hover:text-brand-700">
                Cómo funciona
              </Link>
              <Link href="/blog" className="transition hover:text-brand-700">
                Blog
              </Link>
              <Link href="/aviso-legal" className="transition hover:text-brand-700">
                Aviso legal
              </Link>
              <Link href="/privacidad" className="transition hover:text-brand-700">
                Privacidad
              </Link>
              <Link href="/cookies" className="transition hover:text-brand-700">
                Cookies
              </Link>
              <Link href="/terminos" className="transition hover:text-brand-700">
                Términos
              </Link>
            </nav>
            <p className="text-xs text-slate-400">
              Molnip — recomendaciones independientes de tecnología para empresas
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
