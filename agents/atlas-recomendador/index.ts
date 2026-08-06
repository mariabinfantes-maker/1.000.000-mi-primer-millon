/**
 * Punto de entrada público de Atlas Recomendador — la "Capa 2" de Atlas
 * Advisor: reescribe en prosa personalizada la explicación que ya calculó
 * la Capa 1 determinista (`agents/atlas-advisor`), sin tocar el ranking.
 *
 * Apagada por defecto (ver `ATLAS_RECOMENDADOR_IA_ACTIVA` en
 * `app/api/recomendaciones/route.ts`) y con respaldo determinista
 * obligatorio: si la IA falla o no está activada, el usuario sigue viendo
 * la explicación de la Capa 1, nunca queda sin ninguna.
 *
 * Uso típico:
 *
 *   import { personalizarRecomendaciones } from "@/agents/atlas-recomendador";
 *   import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";
 *
 *   const top = await personalizarRecomendaciones(resultado.top, respuestas, crearProveedorGemini());
 */
export { construirPromptRecomendacion } from "./prompt";
export { personalizarExplicacion, personalizarRecomendaciones } from "./recomendador";
