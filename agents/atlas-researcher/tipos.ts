import type { Herramienta } from "@/data/esquema";

/**
 * Tipos de Atlas Researcher — el primer agente de Atlas.
 *
 * Su trabajo (cuando esté conectado a un proveedor de IA real) será
 * investigar una herramienta de software y proponer una ficha con la misma
 * forma que usa `data/esquema.ts`, para que un humano la revise antes de
 * darla de alta en `data/herramientas/`. Por eso la salida no es una
 * `Herramienta` completa: es una `HerramientaPropuesta`, un borrador con
 * metadatos sobre qué tan fiable es y qué le falta.
 */

/** Lo que se le pide investigar al agente. */
export type SolicitudInvestigacion = {
  /** Nombre del software a investigar, tal y como lo escribiría un usuario. */
  nombreHerramienta: string;
  /** Categoría a la que pertenece, si ya se conoce (Categoria.id). */
  categoriaId?: string;
  /** Contexto libre adicional para orientar la investigación (ej. "centrarse en el plan gratuito"). */
  contextoAdicional?: string;
};

export type NivelConfianza = "baja" | "media" | "alta";

/**
 * Resultado de investigar una herramienta: un borrador, nunca una
 * `Herramienta` lista para publicar. `datos` es parcial a propósito — el
 * agente puede no encontrar todos los campos, y es mejor que falten a que
 * se inventen.
 */
export type HerramientaPropuesta = {
  datos: Partial<Herramienta>;
  /** Campos obligatorios del esquema que la investigación no logró rellenar. */
  camposFaltantes: (keyof Herramienta)[];
  /** URLs citadas por el proveedor de IA como fuente de los datos. */
  fuentes: string[];
  /** Confianza global de la propuesta. Nunca "alta" si no hay ninguna fuente citada. */
  confianza: NivelConfianza;
  /** Avisos para quien revise la propuesta antes de darla de alta en data/herramientas/. */
  advertencias: string[];
};

export type ResultadoInvestigacion =
  | { ok: true; propuesta: HerramientaPropuesta }
  | { ok: false; error: string };
