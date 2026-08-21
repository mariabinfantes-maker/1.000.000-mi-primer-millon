import { AlertTriangle, ArrowUpRight, Check, ChevronRight, Code2, Globe, Lightbulb, Puzzle, Smartphone, X } from "lucide-react";
import Link from "next/link";
import type { Reputacion } from "@/data/esquema";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import Boton from "@/components/ui/Boton";
import AnilloPuntuacion from "@/components/ui/AnilloPuntuacion";
import InsigniaReputacion from "@/components/ui/InsigniaReputacion";

/**
 * Contrato de la tarjeta, deliberadamente plano y ajeno al motor de
 * recomendación: solo tipos primitivos, sin importar nada de
 * `agents/atlas-advisor` ni `data/esquema`. Si el algoritmo cambia
 * (nuevos criterios, pesos distintos, otra forma de puntuar), solo hay que
 * tocar el adaptador que produce estas props — nunca este componente.
 */
export type TarjetaHerramientaRecomendadaProps = {
  /** Posición en el ranking (1, 2, 3...), para la etiqueta de la tarjeta destacada. */
  posicion: number;
  /** Slug estable de la herramienta, para enlazar a su ficha completa (P-04) y a la salida al proveedor (P-07). */
  id: string;
  nombre: string;
  /** Puntuación Atlas (0-100), calculada por lib/puntuacionAtlas.ts. `null` si no hay ninguna señal con la que calcularla. */
  puntuacionAtlas: number | null;
  /** Motivos legibles de la puntuación (calidad editorial, reputación externa, señales de producto...). */
  motivosPuntuacion: string[];
  precioInicial: string;
  tienePlanGratuito: boolean;
  ventajas: string[];
  inconvenientes: string[];
  /** Párrafo ya redactado en lenguaje natural explicando por qué se recomienda para este usuario. */
  explicacionPersonalizada: string;
  /** Integración más relevante para destacar en la tarjeta, o null si no hay ninguna curada. */
  integracionPrincipal: string | null;
  /** Si hay algún aviso a tener en cuenta (ej. el perfil del usuario coincide con un caso no recomendado). */
  tieneAdvertencia?: boolean;
  /** Un ejemplo real de uso, para anclar la recomendación en algo concreto en vez de quedarse en lo abstracto. */
  casoDeUso: string | null;
  /** Situaciones reales en las que esta misma herramienta podría no ser la mejor opción. */
  casosNoRecomendados: string[];
  /** Reputación externa (G2/Capterra) ya investigada por Atlas — ver InsigniaReputacion. `undefined` si no existe, nunca inventada. */
  reputacion?: Reputacion;
  disponibleEnEspanol: boolean;
  tieneAppMovil: boolean;
  tieneApiPublica: boolean;
};

export default function TarjetaHerramientaRecomendada({
  posicion,
  id,
  nombre,
  puntuacionAtlas,
  motivosPuntuacion,
  precioInicial,
  tienePlanGratuito,
  ventajas,
  inconvenientes,
  explicacionPersonalizada,
  integracionPrincipal,
  tieneAdvertencia = false,
  casoDeUso,
  casosNoRecomendados,
  reputacion,
  disponibleEnEspanol,
  tieneAppMovil,
  tieneApiPublica,
}: TarjetaHerramientaRecomendadaProps) {
  const destacada = posicion === 1;
  const tieneDetalles = motivosPuntuacion.length > 0 || casosNoRecomendados.length > 0;
  const badgesEncaje = [
    disponibleEnEspanol ? { icono: Globe, etiqueta: "Español" } : null,
    tieneAppMovil ? { icono: Smartphone, etiqueta: "App móvil" } : null,
    tieneApiPublica ? { icono: Code2, etiqueta: "API" } : null,
  ].filter((b): b is { icono: typeof Globe; etiqueta: string } => b !== null);

  return (
    <Tarjeta
      ganadora={destacada}
      className="relative flex h-full flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
    >
      {destacada && (
        <div
          className="absolute -top-3 left-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm"
          aria-hidden="true"
        >
          La opción elegida
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <Etiqueta variante={destacada ? "marca" : "neutra"}>
          {destacada ? "Mejor ajuste para ti" : `Opción #${posicion}`}
        </Etiqueta>
        {puntuacionAtlas !== null && <AnilloPuntuacion puntuacion={puntuacionAtlas} />}
      </div>

      <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-slate-900">
        <Link href={`/herramienta/${id}`} className="transition hover:text-brand-700">
          {nombre}
        </Link>
      </h3>

      <InsigniaReputacion reputacion={reputacion} />

      <p className="mt-3 rounded-xl bg-brand-50/70 p-3 text-sm leading-relaxed text-brand-800">
        {explicacionPersonalizada}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-900">{precioInicial}</span>
        <Etiqueta variante={tienePlanGratuito ? "exito" : "neutra"}>
          {tienePlanGratuito ? "Con plan gratuito" : "Sin plan gratuito"}
        </Etiqueta>
      </div>

      {badgesEncaje.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {badgesEncaje.map(({ icono: Icono, etiqueta }) => (
            <span key={etiqueta} className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Icono className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              {etiqueta}
            </span>
          ))}
        </div>
      )}

      {integracionPrincipal && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <Puzzle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          Se integra con <span className="font-medium text-slate-800">{integracionPrincipal}</span>
        </p>
      )}

      {casoDeUso && (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span>{casoDeUso}</span>
        </p>
      )}

      <div className="mt-5 grid flex-1 grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ventajas</h4>
          <ul className="mt-2 space-y-1.5">
            {ventajas.map((ventaja) => (
              <li key={ventaja} className="flex gap-1.5 text-sm text-slate-700">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                <span>{ventaja}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Desventajas</h4>
          <ul className="mt-2 space-y-1.5">
            {inconvenientes.map((inconveniente) => (
              <li key={inconveniente} className="flex gap-1.5 text-sm text-slate-700">
                <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                <span>{inconveniente}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {tieneAdvertencia && (
        <p className="mt-4 flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Puede no encajar del todo con algún aspecto de tu situación. Revisa los detalles antes de decidir.
        </p>
      )}

      {tieneDetalles && (
        <details className="mt-4 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-600 transition hover:text-brand-700">
            Ver más detalles
          </summary>
          <div className="mt-3 space-y-4">
            {motivosPuntuacion.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Por qué esta puntuación
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {motivosPuntuacion.map((motivo) => (
                    <li key={motivo} className="text-sm leading-relaxed text-slate-600">
                      {motivo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {casosNoRecomendados.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Cuándo podría no ser la mejor opción
                </h4>
                <ul className="mt-1.5 space-y-1">
                  {casosNoRecomendados.map((caso) => (
                    <li key={caso} className="text-sm leading-relaxed text-slate-600">
                      {caso}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      <Link
        href={`/herramienta/${id}`}
        className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-800"
      >
        Ver ficha completa
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      <Boton
        href={`/herramienta/${id}/ir?origen=resultado`}
        tamano="grande"
        variante={destacada ? "primario" : "secundario"}
        className="mt-3 w-full"
      >
        {tienePlanGratuito ? "Probar gratis" : `Ir a ${nombre}`}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Boton>
    </Tarjeta>
  );
}
