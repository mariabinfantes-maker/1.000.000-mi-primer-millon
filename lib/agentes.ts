import { Compass, Scale, Sparkles, type LucideIcon } from "lucide-react";

/**
 * Registro de los agentes de Atlas.
 *
 * Pensado como un registro (no como agentes cableados a mano en cada
 * pantalla): añadir un cuarto agente en el futuro es añadir una entrada
 * aquí, no rediseñar P-02/P-03/P-04/P-06 (ver Sheet 10 del documento de
 * arquitectura UX, "Registro de agentes, no agentes cableados").
 *
 * Los iconos son deliberadamente abstractos (brújula, balanza, destello) —
 * nunca cerebros, robots, personas ni manos — siguiendo la misma guía de
 * marca que ya documenta `components/ui/IlustracionHero.tsx`.
 */

export type IdAgente = "researcher" | "evaluador" | "recomendador";

export type DefinicionAgente = {
  id: IdAgente;
  nombre: string;
  /** Descripción corta de una frase, pensada para mostrarse junto al nombre. */
  rol: string;
  Icono: LucideIcon;
};

export const AGENTES: DefinicionAgente[] = [
  {
    id: "researcher",
    nombre: "Researcher",
    rol: "Investiga cada herramienta antes de que exista un catálogo que mostrarte.",
    Icono: Compass,
  },
  {
    id: "evaluador",
    nombre: "Evaluador",
    rol: "Cruza tu situación con criterios reales de encaje, uno a uno.",
    Icono: Scale,
  },
  {
    id: "recomendador",
    nombre: "Recomendador",
    rol: "Elige y argumenta las mejores opciones para tu negocio.",
    Icono: Sparkles,
  },
];

export function getAgente(id: IdAgente): DefinicionAgente {
  const agente = AGENTES.find((a) => a.id === id);
  if (!agente) throw new Error(`Agente desconocido: "${id}".`);
  return agente;
}
