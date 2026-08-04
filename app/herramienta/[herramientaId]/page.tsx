import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  X,
  Lightbulb,
  AlertTriangle,
  Globe,
  Smartphone,
  Code2,
  Puzzle,
} from "lucide-react";
import { getCategoria, getHerramienta, getHerramientas } from "@/data/repositorio";
import { calcularPuntuacionAtlas } from "@/lib/puntuacionAtlas";
import { metadataHerramienta } from "@/agents/atlas-generador-contenido/metadatos";
import Etiqueta from "@/components/ui/Etiqueta";
import Boton from "@/components/ui/Boton";
import AnilloPuntuacion from "@/components/ui/AnilloPuntuacion";
import InsigniaConfianza from "@/components/ui/InsigniaConfianza";

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
  return herramienta ? metadataHerramienta(herramienta) : {};
}

const ETIQUETA_CURVA: Record<string, string> = {
  muy_facil: "Curva de aprendizaje muy fácil",
  facil: "Curva de aprendizaje fácil",
  media: "Curva de aprendizaje media",
  dificil: "Curva de aprendizaje exigente",
};

export default async function FichaHerramientaPage({
  params,
}: {
  params: Promise<{ herramientaId: string }>;
}) {
  const { herramientaId } = await params;
  const herramienta = getHerramienta(herramientaId);

  if (!herramienta) notFound();

  const categoria = getCategoria(herramienta.categoriaId);
  const puntuacion = calcularPuntuacionAtlas(herramienta);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Cabecera: nombre, descripción y Puntuación Atlas. Espacio reservado
          para logoUrl (hoy vacío en las 5 fichas) — el fondo abstracto de
          marca ocupa su lugar en vez de dejar un hueco vacío. */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-brand-50 via-white to-white shadow-premium">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            {categoria && <Etiqueta variante="neutra">{categoria.nombre}</Etiqueta>}
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {herramienta.nombre}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">{herramienta.descripcion}</p>
          </div>

          {puntuacion && (
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <AnilloPuntuacion puntuacion={puntuacion.puntuacion} tamano="grande" />
              <span className="text-xs font-medium text-slate-400">Puntuación Atlas</span>
            </div>
          )}
        </div>
      </div>

      {/* Confianza + conversión */}
      <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <InsigniaConfianza fechaUltimaRevision={herramienta.fechaUltimaRevision} />
        <Boton href={`/herramienta/${herramienta.id}/ir`} tamano="grande" className="w-full sm:w-auto">
          Ir al proveedor
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Boton>
      </div>

      {/* Por qué encaja / no encaja — la versión en lenguaje llano de idealPara y noRecomendadaPara */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Seccion titulo="Ideal para negocios como el tuyo si..." tono="exito">
          <p className="text-sm leading-relaxed text-slate-700">{herramienta.idealPara}</p>
        </Seccion>
        <Seccion titulo="Probablemente no encaja si..." tono="neutro">
          <p className="text-sm leading-relaxed text-slate-700">{herramienta.noRecomendadaPara}</p>
        </Seccion>
      </div>

      {/* Casos de uso reales */}
      {herramienta.casosDeUso.length > 0 && (
        <Seccion titulo="Así se usa en la práctica" className="mt-6">
          <ul className="space-y-2.5">
            {herramienta.casosDeUso.map((caso) => (
              <li key={caso} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span>{caso}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Cuándo podría no ser la mejor opción */}
      {herramienta.casosNoRecomendados.length > 0 && (
        <Seccion titulo="Cuándo podría no ser la mejor opción" className="mt-6">
          <ul className="space-y-2.5">
            {herramienta.casosNoRecomendados.map((caso) => (
              <li key={caso} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>{caso}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Precio */}
      <Seccion titulo="Precio" className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-slate-900">{herramienta.precioInicial}</span>
          <Etiqueta variante={herramienta.tienePlanGratuito ? "exito" : "neutra"}>
            {herramienta.tienePlanGratuito ? "Con plan gratuito" : "Sin plan gratuito"}
          </Etiqueta>
          {herramienta.modeloDePrecio.map((modelo) => (
            <Etiqueta key={modelo}>{modelo.replaceAll("_", " ")}</Etiqueta>
          ))}
        </div>
        {herramienta.urlPrecios && (
          <a
            href={herramienta.urlPrecios}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-800"
          >
            Ver precios oficiales
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </Seccion>

      {/* Ventajas / Inconvenientes */}
      <Seccion titulo="Ventajas y desventajas" className="mt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ventajas</h3>
            <ul className="mt-2 space-y-1.5">
              {herramienta.ventajas.map((ventaja) => (
                <li key={ventaja} className="flex gap-1.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  <span>{ventaja}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desventajas</h3>
            <ul className="mt-2 space-y-1.5">
              {herramienta.inconvenientes.map((inconveniente) => (
                <li key={inconveniente} className="flex gap-1.5 text-sm text-slate-700">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{inconveniente}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Seccion>

      {/* Funciones principales */}
      {herramienta.funcionesPrincipales.length > 0 && (
        <Seccion titulo="Funciones principales" className="mt-6">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {herramienta.funcionesPrincipales.map((funcion) => (
              <li key={funcion} className="flex items-start gap-1.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                <span>{funcion}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Integraciones y capacidades de producto */}
      <Seccion titulo="Integraciones y disponibilidad" className="mt-6">
        {herramienta.integraciones.length > 0 && (
          <div className="flex items-start gap-2">
            <Puzzle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-slate-700">{herramienta.integraciones.join(", ")}</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {herramienta.disponibleEnEspanol && (
            <Etiqueta>
              <Globe className="h-3 w-3" aria-hidden="true" /> Disponible en español
            </Etiqueta>
          )}
          {herramienta.tieneAppMovil && (
            <Etiqueta>
              <Smartphone className="h-3 w-3" aria-hidden="true" /> App móvil
            </Etiqueta>
          )}
          {herramienta.tieneApiPublica && (
            <Etiqueta>
              <Code2 className="h-3 w-3" aria-hidden="true" /> API pública
            </Etiqueta>
          )}
          <Etiqueta>{ETIQUETA_CURVA[herramienta.curvaDeAprendizaje]}</Etiqueta>
        </div>
      </Seccion>

      {/* Para quién está pensada */}
      <Seccion titulo="Para quién está pensada" className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          {herramienta.segmentosIdeales.map((segmento) => (
            <Etiqueta key={segmento}>{segmento} empleados</Etiqueta>
          ))}
          {herramienta.industriasIdeales.map((industria) => (
            <Etiqueta key={industria}>{industria}</Etiqueta>
          ))}
        </div>
      </Seccion>

      {/* Metodología y motivos de la Puntuación Atlas — transparencia sobre de dónde salen los números */}
      <Seccion titulo="Cómo llegamos a esta valoración" className="mt-6">
        <p className="text-sm leading-relaxed text-slate-600">{herramienta.metodologiaValoracion}</p>
        {puntuacion && puntuacion.motivos.length > 0 && (
          <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            {puntuacion.motivos.map((motivo) => (
              <li key={motivo} className="text-sm leading-relaxed text-slate-600">
                {motivo}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {/* CTA de cierre: quien lee hasta el final no debería tener que volver a subir para convertir. */}
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-brand-50 via-white to-white p-8 text-center shadow-premium">
        <p className="text-sm text-slate-600">¿Ya tienes claro que {herramienta.nombre} encaja contigo?</p>
        <Boton href={`/herramienta/${herramienta.id}/ir`} tamano="grande">
          Ir al proveedor
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Boton>
        <Link
          href={`/herramienta/${herramienta.id}/alternativas`}
          className="text-xs font-medium text-slate-500 hover:text-brand-600"
        >
          ¿Prefieres comparar antes con otras opciones?
        </Link>
      </div>
    </div>
  );
}

/**
 * Sección de la ficha, con el mismo tratamiento visual en toda la página.
 * Solo local a esta pantalla: no hay todavía una segunda pantalla que la
 * reutilice, así que no se ha extraído a components/ui/.
 */
function Seccion({
  titulo,
  children,
  tono = "neutro",
  className = "",
}: {
  titulo: string;
  children: ReactNode;
  tono?: "neutro" | "exito";
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border p-6 ${
        tono === "exito" ? "border-emerald-200/80 bg-emerald-50/40" : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
