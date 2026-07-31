import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getHerramienta, getHerramientas } from "@/data/repositorio";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import BotonIrAlProveedor from "@/components/ui/BotonIrAlProveedor";

export function generateStaticParams() {
  return getHerramientas().map((h) => ({ herramientaId: h.id }));
}

/**
 * P-07: cierra el recorrido con un clic de confianza, no con una tabla de
 * "planes y precios" de afiliado. Ningún campo de AffiliateData se lee
 * aquí (ni se podría: ese tipo vive en data/esquemaInterno.ts, fuera del
 * alcance de cualquier ruta de usuario) — el aviso de abajo es válido
 * para todo el catálogo por construcción: Atlas Researcher solo admite
 * una herramienta si tiene un programa de afiliados activo y fiable
 * (agents/atlas-researcher/agente.ts), así que declarar el modelo aquí no
 * exige mirar el dato interno herramienta a herramienta.
 */
export default async function IrAlProveedorPage({
  params,
}: {
  params: Promise<{ herramientaId: string }>;
}) {
  const { herramientaId } = await params;
  const herramienta = getHerramienta(herramientaId);

  if (!herramienta) notFound();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <EnlaceAtras href={`/herramienta/${herramienta.id}`}>Volver a la ficha</EnlaceAtras>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Vas a ir a {herramienta.nombre}
      </h1>
      <p className="mt-3 leading-relaxed text-slate-600">{herramienta.idealPara}</p>

      <div className="mt-8">
        <BotonIrAlProveedor href={herramienta.paginaOficial} nombre={herramienta.nombre} />
      </div>

      <div className="mt-8 flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-slate-500">
          Este es un enlace de afiliado: Atlas recibe una comisión del proveedor por tu clic. Nunca afecta al
          precio que pagas ni cambia lo que te recomendamos.
        </p>
      </div>

      <p className="mt-8 text-sm text-slate-500">
        ¿No era lo que esperabas?{" "}
        <Link href={`/herramienta/${herramienta.id}`} className="font-semibold text-brand-600 hover:text-brand-800">
          Vuelve a la ficha
        </Link>
        .
      </p>
    </div>
  );
}
