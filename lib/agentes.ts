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
 * nunca cerebros, robots, chips, circuitos, engranajes, bombillas, personas
 * ni manos — siguiendo la misma guía de marca del hero (ver la Dirección
 * de Arte de Molnip).
 */

export type IdAgente = "researcher" | "evaluador" | "recomendador";

export type DefinicionAgente = {
  id: IdAgente;
  nombre: string;
  /** Descripción corta de una frase, pensada para mostrarse junto al nombre. */
  rol: string;
  Icono: LucideIcon;
  /** Explicación algo más larga de qué hace, para P-06 ("Cómo trabaja Atlas"). */
  queHace: string;
  /** Con qué datos públicos trabaja — lo mismo que puede ver el usuario. */
  datosPublicos: string;
  /** Con qué datos internos trabaja, si los hay — nunca visibles para el usuario final. */
  datosInternos: string;
};

export const AGENTES: DefinicionAgente[] = [
  {
    id: "researcher",
    nombre: "Researcher",
    rol: "Investiga cada herramienta antes de que exista un catálogo que mostrarte.",
    Icono: Compass,
    queHace:
      "Investiga cada herramienta antes de que exista una ficha que enseñarte. No corre durante tu sesión: trabaja fuera de línea, con tiempo, antes de que el catálogo esté disponible.",
    datosPublicos: "Descripción, precios, ventajas, casos de uso — todo lo que ves en la ficha de cada herramienta.",
    datosInternos: "Si tiene programa de afiliados, con qué plataforma y en qué condiciones. Nunca se mezcla con la ficha pública.",
  },
  {
    id: "evaluador",
    nombre: "Evaluador",
    rol: "Cruza tu situación con criterios reales de encaje, uno a uno.",
    Icono: Scale,
    queHace:
      "Cruza tu situación con 10 criterios reales de encaje cada vez que pides una recomendación — en vivo, mientras esperas.",
    datosPublicos: "El catálogo público de herramientas y las respuestas de tu cuestionario.",
    datosInternos: "Ninguno. No toca información de afiliación en ningún momento.",
  },
  {
    id: "recomendador",
    nombre: "Recomendador",
    rol: "Elige y argumenta las mejores opciones para tu negocio.",
    Icono: Sparkles,
    queHace: "Elige el top 3 ya puntuado por el Evaluador y redacta, en lenguaje llano, por qué encaja contigo.",
    datosPublicos: "El ranking ya calculado por el Evaluador.",
    datosInternos: "Ninguno. Tampoco toca información de afiliación.",
  },
];

export function getAgente(id: IdAgente): DefinicionAgente {
  const agente = AGENTES.find((a) => a.id === id);
  if (!agente) throw new Error(`Agente desconocido: "${id}".`);
  return agente;
}
