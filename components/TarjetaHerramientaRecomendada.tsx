import { AlertTriangle, ArrowUpRight, Check, Puzzle, Star, X } from "lucide-react";
import Tarjeta from "@/components/ui/Tarjeta";
import Etiqueta from "@/components/ui/Etiqueta";
import Boton from "@/components/ui/Boton";

/**
 * Contrato de la tarjeta, deliberadamente plano y ajeno al motor de
 * recomendación: solo tipos primitivos, sin importar nada de
 * `lib/recommendationEngine` ni `data/esquema`. Si el algoritmo cambia
 * (nuevos criterios, pesos distintos, otra forma de puntuar), solo hay que
 * tocar el adaptador que produce estas props — nunca este componente.
 */
export type TarjetaHerramientaRecomendadaProps = {
  /** Posición en el ranking (1, 2, 3...), para la etiqueta de la tarjeta destacada. */
  posicion: number;
  nombre: string;
  paginaOficial: string;
  /** Puntuación editorial de Atlas, en una escala 1-10 con un decimal. */
  puntuacionAtlas: number;
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
};

export default function TarjetaHerramientaRecomendada({
  posicion,
  nombre,
  paginaOficial,
  puntuacionAtlas,
  precioInicial,
  tienePlanGratuito,
  ventajas,
  inconvenientes,
  explicacionPersonalizada,
  integracionPrincipal,
  tieneAdvertencia = false,
}: TarjetaHerramientaRecomendadaProps) {
  const destacada = posicion === 1;

  return (
    <Tarjeta
      destacada={destacada}
      className="flex h-full flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <Etiqueta variante={destacada ? "marca" : "neutra"}>
          {destacada ? "Mejor opción para ti" : `Opción #${posicion}`}
        </Etiqueta>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
          {puntuacionAtlas.toFixed(1)}/10
        </span>
      </div>

      <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{nombre}</h3>

      <p className="mt-3 rounded-xl bg-brand-50/70 p-3 text-sm leading-relaxed text-brand-800">
        {explicacionPersonalizada}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-900">{precioInicial}</span>
        <Etiqueta variante={tienePlanGratuito ? "exito" : "neutra"}>
          {tienePlanGratuito ? "Con plan gratuito" : "Sin plan gratuito"}
        </Etiqueta>
      </div>

      {integracionPrincipal && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <Puzzle className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          Se integra con <span className="font-medium text-slate-800">{integracionPrincipal}</span>
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

      <Boton href={paginaOficial} externo tamano="grande" className="mt-6 w-full">
        Ir al proveedor
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Boton>
    </Tarjeta>
  );
}
