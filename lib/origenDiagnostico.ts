/**
 * Las tres puertas de entrada de Atlas (Sheet 04 del documento de
 * arquitectura UX): por objetivo, por categoría o explicando el problema
 * con tus palabras. Las tres convergen en el mismo cuestionario y el mismo
 * motor de recomendación — solo cambia cómo se llega hasta ahí.
 *
 * `OrigenDiagnostico` es ese formato único de "necesidad estructurada"
 * (Sheet 02/10): Cuestionario.tsx y PantallaRecomendacion.tsx no necesitan
 * saber por qué puerta entró el usuario, así que una cuarta puerta futura
 * (p. ej. "audita tu stack actual") solo implica una ruta nueva que
 * construya un OrigenDiagnostico, no tocar el resto del recorrido.
 */

export type TipoOrigenDiagnostico = "objetivo" | "categoria" | "libre";

export type OrigenDiagnostico = {
  tipo: TipoOrigenDiagnostico;
  /** Identificador único dentro de su tipo (problemaId, categoriaId, o "libre"). */
  id: string;
  titulo: string;
  descripcion?: string;
  /** Personaliza la última pregunta del cuestionario. Si no se indica, se usa PREGUNTA_HERRAMIENTA_GENERICA. */
  preguntaHerramienta?: string;
  /** Prefiltra el catálogo por categoría en el motor de recomendación. */
  categoriaIdPrefill?: string;
  /** Precarga la respuesta de "¿cuál es tu mayor problema?" con lo que el usuario ya escribió en la puerta de texto libre. */
  notasPrefill?: string;
  /** Base de rutas: `${rutaBase}/cuestionario` y `${rutaBase}/recomendacion`. */
  rutaBase: string;
};

export const PREGUNTA_HERRAMIENTA_GENERICA = "¿Ya usas alguna herramienta para esto?";

/** Clave compuesta para namespacing de resultados en sessionStorage — evita colisiones entre orígenes de distinto tipo que compartan id (p. ej. un objetivo y una categoría con el mismo id). */
export function claveOrigen(origen: Pick<OrigenDiagnostico, "tipo" | "id">): string {
  return `${origen.tipo}:${origen.id}`;
}
