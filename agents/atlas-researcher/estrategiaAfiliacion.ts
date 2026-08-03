import type { EstadoAfiliacion, EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * Lógica pura de actualización de la estrategia de afiliación — separada
 * del CLI (`cli-actualizar-estrategia-afiliacion.ts`) para poder probarla
 * sin tocar el sistema de archivos ni disparar el punto de entrada del
 * script, mismo patrón que `lote.ts`/`cli-lote.ts`.
 */

export const ESTADOS_AFILIACION_VALIDOS: EstadoAfiliacion[] = [
  "no_solicitado",
  "pendiente",
  "aprobado",
  "rechazado",
  "activo",
];

export function esEstadoAfiliacionValido(valor: string): valor is EstadoAfiliacion {
  return (ESTADOS_AFILIACION_VALIDOS as string[]).includes(valor);
}

/** Los campos que se pueden actualizar por CLI — todo salvo `herramientaId` (fija el id) y `ultimaRevision` (la estampa Atlas). */
export type CambiosEstrategiaAfiliacion = Partial<Omit<EstrategiaAfiliacion, "herramientaId" | "ultimaRevision">>;

/**
 * Combina la estrategia ya existente (si la hay) con los cambios recibidos
 * por CLI: un campo no indicado en `cambios` conserva su valor anterior,
 * nunca se borra por omisión. `estado` cae a "no_solicitado" solo si no
 * había ni estrategia previa ni `--estado` en esta llamada.
 */
export function fusionarEstrategiaAfiliacion(
  herramientaId: string,
  existente: EstrategiaAfiliacion | undefined,
  cambios: CambiosEstrategiaAfiliacion,
  hoy: string
): EstrategiaAfiliacion {
  return {
    herramientaId,
    estado: cambios.estado ?? existente?.estado ?? "no_solicitado",
    nombrePrograma: cambios.nombrePrograma ?? existente?.nombrePrograma,
    plataforma: cambios.plataforma ?? existente?.plataforma,
    urlSolicitud: cambios.urlSolicitud ?? existente?.urlSolicitud,
    usuarioRegistro: cambios.usuarioRegistro ?? existente?.usuarioRegistro,
    fechaSolicitud: cambios.fechaSolicitud ?? existente?.fechaSolicitud,
    fechaAprobacion: cambios.fechaAprobacion ?? existente?.fechaAprobacion,
    comision: cambios.comision ?? existente?.comision,
    duracionCookie: cambios.duracionCookie ?? existente?.duracionCookie,
    metodoPago: cambios.metodoPago ?? existente?.metodoPago,
    frecuenciaPago: cambios.frecuenciaPago ?? existente?.frecuenciaPago,
    enlaceAfiliadoPropio: cambios.enlaceAfiliadoPropio ?? existente?.enlaceAfiliadoPropio,
    ultimaRevision: hoy,
    observaciones: cambios.observaciones ?? existente?.observaciones,
  };
}
