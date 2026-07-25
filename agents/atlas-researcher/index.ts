/**
 * Punto de entrada público de Atlas Researcher.
 *
 * Uso típico, una vez exista un proveedor de IA conectado de verdad:
 *
 *   import { investigarHerramienta } from "@/agents/atlas-researcher";
 *   import { crearProveedorGemini } from "@/agents/atlas-researcher/proveedores/gemini";
 *
 *   const resultado = await investigarHerramienta(
 *     { nombreHerramienta: "Nombre del software" },
 *     crearProveedorGemini()
 *   );
 */
export { investigarHerramienta } from "./agente";
export { construirPromptInvestigacion } from "./prompt";
export { validarPropuesta } from "./validador";
export { ErrorProveedorIA } from "./proveedorIA";
export type { ProveedorIA } from "./proveedorIA";
export type {
  HerramientaPropuesta,
  NivelConfianza,
  ResultadoInvestigacion,
  SolicitudInvestigacion,
} from "./tipos";
