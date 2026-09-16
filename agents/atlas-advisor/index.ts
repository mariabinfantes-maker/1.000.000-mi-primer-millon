/**
 * Punto de entrada público de Atlas Advisor: el motor de recomendación que
 * da vida a los personajes "Evaluador" y "Recomendador" (`lib/agentes.ts`).
 *
 * Es una capa determinista, sin coste ni llamadas a IA: puntúa el catálogo
 * público con criterios de reglas explícitas. Solo lee `Herramienta[]` y
 * `RespuestasUsuario` — nunca `AffiliateData` ni `EstrategiaAfiliacion` — para
 * que una recomendación de Atlas nunca esté sesgada por la afiliación (ver
 * ATLAS.md, sección Atlas Advisor).
 *
 * Uso típico (desde un Server Component, un script, o una ruta de API):
 *
 *   import { recomendarHerramientas } from "@/agents/atlas-advisor";
 *   import { getHerramientas } from "@/data/repositorio";
 *
 *   const resultado = recomendarHerramientas(respuestasDelCuestionario, getHerramientas());
 *   resultado.top; // las 3 mejores, cada una con su puntuación, razones y explicación
 */
export { evaluarHerramienta, recomendarHerramientas } from "./motor";
export { CRITERIOS } from "./criterios";
export { detectarProblemasPorTexto } from "./deteccionProblema";
export { compararTodoEnUnoVsEspecializada } from "./todoEnUnoVsEspecializada";
export {
  NINGUNA_DE_ESTAS,
  enunciadoDe,
  filaDeNecesidad,
  preguntaParaObjetivo,
  textoDeFila,
  tituloDeFamilia,
} from "./necesidades";
export { TEXTOS_NECESIDADES } from "./necesidades.textos.es";
export { etiquetaDeEvidencia } from "./etiquetaEvidencia";
export type { EtiquetaEvidencia } from "./etiquetaEvidencia";
export type { FilaDeNecesidad, FamiliaDeNecesidades, PreguntaDeNecesidad } from "./necesidades";
export type {
  CausaSinConfirmar,
  Criterio,
  DetalleCriterio,
  HerramientaEvaluada,
  MotivoSinRecomendacion,
  NecesidadSinConfirmar,
  NivelPrioridad,
  NivelTecnicoEquipo,
  PresupuestoMensual,
  PuertaDeEvidencia,
  ResultadoRecomendacion,
  RespuestasUsuario,
} from "./tipos";
export type { RecomendacionTipoSuite, ResultadoComparacionSuite } from "./todoEnUnoVsEspecializada";
