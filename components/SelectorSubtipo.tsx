import Link from "next/link";
import { CalendarClock, ChevronRight, LayoutGrid, Mic, PenLine, Presentation, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { contenidoDeSubtipo } from "@/agents/atlas-generador-contenido/contenidoSubtipos";

/**
 * Selector de subtipo de una categoría — el paso que faltaba en el embudo.
 *
 * Hasta ahora los subtipos solo existían para el motor: decidían qué se
 * podía comparar con qué, pero no había forma de elegir uno desde la
 * interfaz. Quien entraba en "IA y productividad" recibía un muestrario (una
 * herramienta de cada tipo) y se quedaba sin siguiente paso: veía que
 * existían las de presentaciones y no tenía dónde pulsar.
 *
 * Visualmente reutiliza el mismo idioma que `SelectorEntrada` en la portada
 * —tarjeta blanca, anillo de contorno, chip de icono con degradado de marca,
 * flecha que aparece al pasar por encima— porque es el mismo gesto: elegir
 * un camino. No se inventa ningún componente ni ningún color: todo sale de
 * los tokens ya aprobados en Molnip Visual v1.
 *
 * El gancho de cada tarjeta es la PREGUNTA que de verdad separa a las
 * herramientas de ese subtipo (`ejeDeDecision.titulo`), no una descripción
 * de relleno: "¿Corriges o creas?" comunica en tres palabras por qué ese
 * grupo existe aparte.
 */

const ICONOS: Record<string, LucideIcon> = {
  escritura: PenLine,
  video: Video,
  "reuniones-transcripcion": Mic,
  "agenda-planificacion": CalendarClock,
  presentaciones: Presentation,
  "espacio-trabajo": LayoutGrid,
};

export type OpcionSubtipo = {
  id: string;
  nombre: string;
  /** Cuántas herramientas compiten dentro de él. Se muestra tal cual: es el dato que hace creíble la comparación. */
  cuantas: number;
};

export default function SelectorSubtipo({
  categoriaId,
  opciones,
}: {
  categoriaId: string;
  opciones: OpcionSubtipo[];
}) {
  if (opciones.length === 0) return null;

  return (
    <nav aria-labelledby="titulo-selector-subtipo" className="mt-12">
      <h2 id="titulo-selector-subtipo" className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        ¿Qué necesitas exactamente?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Aquí conviven herramientas que no compiten entre sí: nadie duda entre un corrector de textos
        y un generador de vídeo. Elige el tipo de trabajo que quieres resolver y compara solo lo
        comparable.
      </p>

      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {opciones.map((opcion) => {
          const Icono = ICONOS[opcion.id] ?? LayoutGrid;
          const contenido = contenidoDeSubtipo(opcion.id);
          return (
            <li key={opcion.id}>
              <Link
                href={`/categoria/${categoriaId}/subtipo/${opcion.id}`}
                className="group relative flex h-full items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 ring-1 ring-contorno transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-premium-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-100">
                  <Icono className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-bold text-slate-900 group-hover:text-brand-700">
                    {opcion.nombre}
                  </span>
                  {contenido && (
                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                      {contenido.ejeDeDecision.titulo}
                    </span>
                  )}
                  <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-600">
                    {opcion.cuantas} alternativas
                    <ChevronRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
