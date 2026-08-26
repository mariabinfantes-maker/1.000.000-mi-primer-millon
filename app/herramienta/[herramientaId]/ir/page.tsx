import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { getHerramienta, getHerramientas } from "@/data/repositorio";
import { getEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { elegirEnlaceAfiliado, SEGMENTO_GLOBAL } from "@/agents/atlas-affiliate-manager/seleccionarEnlace";
import { metadataFlujo } from "@/agents/atlas-generador-contenido/metadatos";
import type { OrigenClic } from "@/lib/analitica/proveedorAnalitica";
import EnlaceAtras from "@/components/ui/EnlaceAtras";
import BotonIrAlProveedor from "@/components/ui/BotonIrAlProveedor";

const ORIGENES_VALIDOS: OrigenClic[] = ["resultado", "comparar", "ficha", "desconocido"];

function leerOrigen(valor: string | undefined): OrigenClic {
  return ORIGENES_VALIDOS.includes(valor as OrigenClic) ? (valor as OrigenClic) : "desconocido";
}

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
  searchParams,
}: {
  params: Promise<{ herramientaId: string }>;
  searchParams: Promise<{ origen?: string }>;
}) {
  const { herramientaId } = await params;
  const { origen } = await searchParams;
  const herramienta = getHerramienta(herramientaId);

  if (!herramienta) notFound();

  // Desde que la estrategia vive en Postgres (sub-sprint 1E), esta página
  // pública depende de la base de datos. Una caída de Neon NUNCA debe tirar
  // la página que cierra el recorrido del usuario: si la consulta falla, se
  // cae al enlace oficial del proveedor, exactamente igual que cuando
  // todavía no hay ningún enlace de afiliado guardado. Se pierde la comisión
  // de ese clic, pero el usuario llega igual a donde quería ir.
  const estrategia = await getEstrategiaAfiliacion(herramienta.id).catch(() => undefined);
  const enlaceAfiliado = elegirEnlaceAfiliado(estrategia?.cuentas ?? [], SEGMENTO_GLOBAL);
  const destino = enlaceAfiliado ?? herramienta.paginaOficial;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
      <EnlaceAtras href={`/herramienta/${herramienta.id}`}>Volver a la ficha</EnlaceAtras>

      <div className="relative mt-6 flex flex-col items-center overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-12 text-center shadow-premium-lg ring-1 ring-black/[0.02] sm:px-10">
        <div className="fondo-puntos pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-premium">
          <Image
            src="/imagenes/marca/cta-final-dorado.png"
            alt=""
            width={128}
            height={128}
            className="h-full w-full object-cover"
          />
        </div>

        <h1 className="relative mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Vas a ir a {herramienta.nombre}
        </h1>
        <p className="relative mt-3 leading-relaxed text-slate-600">{herramienta.idealPara}</p>

        <div className="relative mt-8">
          <BotonIrAlProveedor
            href={destino}
            nombre={herramienta.nombre}
            evento={{
              herramientaId: herramienta.id,
              categoriaId: herramienta.categoriaId,
              tipoEnlace: enlaceAfiliado ? "afiliado" : "oficial",
              origen: leerOrigen(origen),
            }}
          />
        </div>

        <div className="relative mt-8 flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <p className="text-xs leading-relaxed text-slate-500">
            {enlaceAfiliado
              ? "Este es un enlace de afiliado: Molnip recibe una comisión del proveedor por tu clic. Nunca afecta al precio que pagas ni cambia lo que te recomendamos."
              : `Te llevamos directamente a la web oficial de ${herramienta.nombre}. Nunca cambia lo que te recomendamos.`}
          </p>
        </div>
      </div>
    </div>
  );
}
