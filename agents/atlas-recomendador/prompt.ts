import type { HerramientaEvaluada, RespuestasUsuario } from "@/agents/atlas-advisor";
import { etiquetaCurva, etiquetaNivelTecnico, etiquetaPresupuesto, etiquetaPrioridad } from "./etiquetas";

/**
 * Construye el prompt que le pide a la IA una explicación personalizada
 * sobre una herramienta ya evaluada por Atlas Advisor (Capa 1).
 *
 * Función pura de texto, igual que `construirPromptInvestigacion` de Atlas
 * Researcher: no llama a ningún proveedor, así que se puede probar sin
 * conexión. Dos reglas no negociables que el prompt deja explícitas:
 *
 * 1. La IA nunca decide el ranking — se le da `puntuacionTotal` y `razones`
 *    ya calculados, nunca se le pide que puntúe ni reordene nada.
 * 2. La IA nunca debe ser genérica — el prompt exige usar el contexto
 *    concreto del usuario, y solo ese contexto: nada que no esté en
 *    `respuestas` o en los motivos que ya calculó la Capa 1.
 */
export function construirPromptRecomendacion(evaluada: HerramientaEvaluada, respuestas: RespuestasUsuario): string {
  const { herramienta, razones } = evaluada;

  const lineasContexto = [
    respuestas.industria ? `Sector/industria: ${respuestas.industria}.` : null,
    respuestas.tamanoEmpresa ? `Tamaño de la empresa: ${respuestas.tamanoEmpresa} empleados.` : null,
    respuestas.presupuesto ? `Presupuesto: ${etiquetaPresupuesto(respuestas.presupuesto)}.` : null,
    respuestas.requierePlanGratuito ? "Necesita imprescindiblemente poder empezar con un plan gratuito." : null,
    respuestas.nivelTecnicoEquipo
      ? `Nivel técnico del equipo que la usará: ${etiquetaNivelTecnico(respuestas.nivelTecnicoEquipo)}.`
      : null,
    respuestas.toleranciaCurvaAprendizaje
      ? `Curva de aprendizaje que está dispuesto a asumir: ${etiquetaCurva(respuestas.toleranciaCurvaAprendizaje)}.`
      : null,
    respuestas.prioridadFacilidadDeUso
      ? `Cuánto le importa la facilidad de uso: ${etiquetaPrioridad(respuestas.prioridadFacilidadDeUso)}.`
      : null,
    respuestas.integracionesNecesarias?.length
      ? `Integraciones imprescindibles: ${respuestas.integracionesNecesarias.join(", ")}.`
      : null,
    respuestas.idiomaNecesario ? `Idioma necesario: ${respuestas.idiomaNecesario}.` : null,
    respuestas.notasAdicionales ? `En sus propias palabras: "${respuestas.notasAdicionales}"` : null,
  ].filter((linea): linea is string => Boolean(linea));

  const lineasMotivos = razones.length > 0 ? razones.map((razon) => `- ${razon}`).join("\n") : "(ninguno destacable)";

  return [
    "Eres Atlas Recomendador, el agente de Atlas que redacta la explicación que ve el usuario tras el cuestionario.",
    "IMPORTANTE — reglas que no puedes romper:",
    "1. No decides el ranking ni la puntuación: ya están calculados. Tu única tarea es redactar una explicación en prosa.",
    "2. No inventes ningún dato sobre la herramienta ni sobre el usuario. Usa solo lo que se te da a continuación.",
    "3. La explicación debe ser específica para ESTE usuario, no una descripción genérica que serviría para cualquiera.",
    "",
    `Herramienta: "${herramienta.nombre}".`,
    `Descripción: ${herramienta.descripcion}`,
    "",
    "Motivos que el motor determinista de Atlas ya calculó para recomendar esta herramienta a este usuario:",
    lineasMotivos,
    "",
    "Contexto real de este usuario (usa el que esté disponible; si un dato no aparece aquí, no lo menciones):",
    lineasContexto.length > 0 ? lineasContexto.join("\n") : "(sin contexto adicional disponible)",
    "",
    "Devuelve ÚNICAMENTE un JSON con esta forma: { \"explicacion\": \"...\" }",
    "La explicación: 2 a 4 frases, en español, dirigida directamente al usuario ('tú'), " +
      "conectando los motivos anteriores con su contexto concreto. Sin emojis, sin markdown, sin listas.",
    "No incluyas texto antes ni después del JSON.",
  ].join("\n");
}
