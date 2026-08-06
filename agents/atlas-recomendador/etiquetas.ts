import type { CurvaDeAprendizaje } from "@/data/esquema";
import type { NivelPrioridad, NivelTecnicoEquipo, PresupuestoMensual } from "@/agents/atlas-advisor";

/**
 * Etiquetas legibles en español para los campos de `RespuestasUsuario` que
 * son un identificador corto (ej. "sin_presupuesto") en vez de texto libre.
 * Solo existen para construir el prompt del Recomendador — el resto del
 * sistema sigue trabajando con los identificadores cortos.
 */

const ETIQUETAS_PRESUPUESTO: Record<PresupuestoMensual, string> = {
  sin_presupuesto: "sin presupuesto para pagar por esto",
  ajustado: "presupuesto ajustado (hasta ~50€/mes)",
  medio: "presupuesto medio (hasta ~150€/mes)",
  alto: "presupuesto alto (hasta ~500€/mes)",
  sin_limite: "sin límite de presupuesto",
};

const ETIQUETAS_NIVEL_TECNICO: Record<NivelTecnicoEquipo, string> = {
  ninguno: "sin conocimientos técnicos",
  basico: "conocimientos técnicos básicos",
  intermedio: "conocimientos técnicos intermedios",
  avanzado: "conocimientos técnicos avanzados",
};

const ETIQUETAS_PRIORIDAD: Record<NivelPrioridad, string> = {
  baja: "baja",
  media: "media",
  alta: "alta",
};

const ETIQUETAS_CURVA: Record<CurvaDeAprendizaje, string> = {
  muy_facil: "muy fácil de aprender",
  facil: "fácil de aprender",
  media: "curva de aprendizaje media",
  dificil: "dispuesto a asumir una curva de aprendizaje exigente",
};

export function etiquetaPresupuesto(valor: PresupuestoMensual): string {
  return ETIQUETAS_PRESUPUESTO[valor];
}

export function etiquetaNivelTecnico(valor: NivelTecnicoEquipo): string {
  return ETIQUETAS_NIVEL_TECNICO[valor];
}

export function etiquetaPrioridad(valor: NivelPrioridad): string {
  return ETIQUETAS_PRIORIDAD[valor];
}

export function etiquetaCurva(valor: CurvaDeAprendizaje): string {
  return ETIQUETAS_CURVA[valor];
}
