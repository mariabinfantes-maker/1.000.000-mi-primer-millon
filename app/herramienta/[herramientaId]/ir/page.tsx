import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { getHerramienta, getHerramientas } from "@/data/repositorio";
import { getEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { elegirEnlaceAfiliado, SEGMENTO_GLOBAL } from "@/agents/atlas-affiliate-manager/seleccionarEnlace";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import BotonIrAlProveedor from "@/components/ui/BotonIrAlProveedor";

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
  if (!herramienta) return {};
  return metadataFlujo(`Ir a ${herramienta.nombre}`, herramienta.descripcion);
}

/**
 * P-07: cierra el recorrido con un clic de confianza, no con una tabla de
 * "planes y precios" de afiliado.
 *
 * Única excepción deliberada y acotada al cortafuegos entre datos internos
 * e interfaz de usuario (ver ATLAS.md, sección Affiliate Manager): esta
 * página resuelve el destino del clic a través de `elegirEnlaceAfiliado()`,
 * que solo expone una URL (o `undefined`) — nunca comisión, plataforma,
 * fechas ni observaciones de `EstrategiaAfiliacion`. Si no hay ningún
 * enlace propio activo todavía, cae a la URL pública oficial. El aviso de
 * abajo sigue siendo válido para todo el catálogo por construcción: Atlas
 * Researcher solo admite una herramienta si tiene un programa de afiliados
 * activo y fiable (agents/atlas-researcher/agente.ts).
 *
 * Segmento fijo a "global" por ahora: Atlas todavía no tiene detección real
 * de país/idioma del visitante. `elegirEnlaceAfiliado()` ya está preparado
 * para recibir un segmento real el día que exista esa detección, sin
 * cambiar nada más de esta página.
 */
export default async function IrAlProveedorPage({
  params,
}: {
  params: Promise<{ herramientaId: string }>;
}) {
  const { herramientaId } = await params;
  const herramienta = getHerramienta(herramientaId);

  if (!herramienta) notFound();

  const estrategia = getEstrategiaAfiliacion(herramienta.id);
  const enlaceAfiliado = elegirEnlaceAfiliado(estrategia?.cuentas ?? [], SEGMENTO_GLOBAL);
  const destino = enlaceAfiliado ?? herramienta.paginaOficial;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <EnlaceAtras href={`/herramienta/${herramienta.id}`}>Volver a la ficha</EnlaceAtras>

      <div className="relative mt-6 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-premium-lg ring-1 ring-black/[0.02] sm:px-10">
        <div className="fondo-puntos pointer-events-none absolute inset-0" aria-hidden="true" />

        <h1 className="relative font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Vas a ir a {herramienta.nombre}
        </h1>
        <p className="relative mt-3 leading-relaxed text-slate-600">{herramienta.idealPara}</p>

        <div className="relative mt-8">
          <BotonIrAlProveedor href={destino} nombre={herramienta.nombre} />
        </div>

        <div className="relative mt-8 flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-xs leading-relaxed text-slate-500">
            Este es un enlace de afiliado: Molnip recibe una comisión del proveedor por tu clic. Nunca afecta al
            precio que pagas ni cambia lo que te recomendamos.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        ¿No era lo que esperabas?{" "}
        <Link href={`/herramienta/${herramienta.id}`} className="font-semibold text-brand-600 hover:text-brand-800">
          Vuelve a la ficha
        </Link>
        .
      </p>
    </div>
  );
}
