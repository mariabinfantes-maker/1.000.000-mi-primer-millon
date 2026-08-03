/**
 * Punto de entrada público del motor de recomendación de Atlas.
 *
 * Uso típico (desde un Server Component, un script, o una futura ruta de API):
 *
 *   import { recomendarHerramientas } from "@/lib/recommendationEngine";
 *   import { getHerramientas } from "@/data/repositorio";
 *
 *   const resultado = recomendarHerramientas(respuestasDelCuestionario, getHerramientas());
 *   resultado.top; // las 3 mejores, cada una con su puntuación, razones y explicación
 */
export { evaluarHerramienta, recomendarHerramientas } from "./motor";
export { CRITERIOS } from "./criterios";
export type {
  Criterio,
  DetalleCriterio,
  HerramientaEvaluada,
  NivelPrioridad,
  NivelTecnicoEquipo,
  PresupuestoMensual,
  ResultadoRecomendacion,
  RespuestasUsuario,
} from "./tipos";
