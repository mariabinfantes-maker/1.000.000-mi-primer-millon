import type { Herramienta, NivelConfianza } from "@/data/esquema";
import type { AffiliateData } from "@/data/esquemaInterno";

/** Re-exportado para que quien importe desde el agente no necesite saber que este tipo vive en data/esquema.ts. */
export type { NivelConfianza };

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

/**
 * Resultado de investigar una herramienta: un borrador, nunca una
 * `Herramienta` lista para publicar. `datos` es parcial a propósito — el
 * agente puede no encontrar todos los campos, y es mejor que falten a que
 * se inventen.
 *
 * `datos` (público) y `datosAfiliados` (interno) se mantienen como dos
 * campos separados a propósito, reflejando la misma separación que ya
 * existe en la capa de datos entre `data/esquema.ts`/`data/herramientas/`
 * (público) y `data/esquemaInterno.ts`/`data/afiliados/` (interno,
 * exclusivo de los agentes de Atlas). Nunca deben fusionarse en un único
 * objeto ni exponerse juntos al usuario final.
 */
export type HerramientaPropuesta = {
  datos: Partial<Herramienta>;
  /** Datos de afiliación investigados — de uso exclusivo de los agentes internos de Atlas, nunca para mostrar al usuario final. */
  datosAfiliados: Partial<AffiliateData>;
  /** Campos obligatorios del esquema PÚBLICO que la investigación no logró rellenar. No incluye datos de afiliación: esos se avisan aparte. */
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
