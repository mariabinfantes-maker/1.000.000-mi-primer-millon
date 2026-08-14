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
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
      <EnlaceAtras href={`/herramienta/${herramienta.id}`}>Volver a la ficha</EnlaceAtras>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Vas a ir a {herramienta.nombre}
      </h1>
      <p className="mt-3 leading-relaxed text-slate-600">{herramienta.idealPara}</p>

      <div className="mt-8">
        <BotonIrAlProveedor href={destino} nombre={herramienta.nombre} />
      </div>

      <div className="mt-8 flex items-start gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-left">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-slate-500">
          Este es un enlace de afiliado: Molnip recibe una comisión del proveedor por tu clic. Nunca afecta al
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
