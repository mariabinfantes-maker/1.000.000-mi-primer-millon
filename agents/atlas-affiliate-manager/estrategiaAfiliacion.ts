import type { CuentaAfiliado, EnlaceAfiliado, EstadoAfiliacion, EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * Lógica pura de actualización de la estrategia de afiliación — separada
 * del CLI (`cli-actualizar-estrategia-afiliacion.ts`) para poder probarla
 * sin tocar el sistema de archivos ni disparar el punto de entrada del
 * script, mismo patrón que `lote.ts`/`cli-lote.ts`.
 *
 * Opera sobre una única cuenta dentro de `EstrategiaAfiliacion.cuentas`,
 * identificada por `cuentaId` — el resto de cuentas de la misma
 * herramienta se conservan intactas. Esto es lo que permite varias cuentas
 * por plataforma y varios enlaces por país/idioma sin que cambiar una
 * cuenta afecte a las demás.
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

const SEGMENTO_POR_DEFECTO = "global";

/** Los campos de una cuenta que se pueden actualizar por CLI — todo salvo `id` (lo fija `cuentaId`) y `ultimaRevision` (la estampa Atlas). `enlaceUrl`/`segmentoEnlace` se gestionan aparte porque no reemplazan `enlaces`, lo actualizan (upsert). */
export type CambiosCuentaAfiliado = Partial<Omit<CuentaAfiliado, "id" | "ultimaRevision" | "enlaces">> & {
  /** Si se indica, añade o actualiza (upsert por `segmento`) un enlace dentro de `enlaces`. */
  enlaceUrl?: string;
  /** Segmento de país/idioma al que aplica `enlaceUrl`. Por defecto "global" si se indica `enlaceUrl` sin segmento. */
  segmentoEnlace?: string;
};

/** Convierte un nombre de plataforma en un id de cuenta estable y legible (ej. "PartnerStack" → "partnerstack"). Sin plataforma, cae a "principal". */
export function generarIdCuenta(plataforma: string | undefined): string {
  const normalizado = plataforma
    ?.normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalizado && normalizado !== "" ? normalizado : "principal";
}

function fusionarEnlaces(enlacesExistentes: EnlaceAfiliado[], cambios: CambiosCuentaAfiliado): EnlaceAfiliado[] {
  if (!cambios.enlaceUrl) return enlacesExistentes;

  const segmento = cambios.segmentoEnlace ?? SEGMENTO_POR_DEFECTO;
  const yaExiste = enlacesExistentes.some((enlace) => enlace.segmento === segmento);

  if (yaExiste) {
    return enlacesExistentes.map((enlace) => (enlace.segmento === segmento ? { segmento, url: cambios.enlaceUrl! } : enlace));
  }
  return [...enlacesExistentes, { segmento, url: cambios.enlaceUrl }];
}

/**
 * Combina la cuenta ya existente (si la hay, identificada por `cuentaId`)
 * con los cambios recibidos por CLI: un campo no indicado en `cambios`
 * conserva su valor anterior, nunca se borra por omisión. El resto de
 * cuentas de `existente.cuentas` se conservan tal cual. `estado` cae a
 * "no_solicitado" solo si no había ni cuenta previa ni `--estado` en esta
 * llamada; `plataforma` cae al propio `cuentaId` si es una cuenta nueva sin
 * `--plataforma` indicada.
 */
export function fusionarEstrategiaAfiliacion(
  herramientaId: string,
  cuentaId: string,
  existente: EstrategiaAfiliacion | undefined,
  cambios: CambiosCuentaAfiliado,
  hoy: string
): EstrategiaAfiliacion {
  const cuentasExistentes = existente?.cuentas ?? [];
  const cuentaExistente = cuentasExistentes.find((cuenta) => cuenta.id === cuentaId);

  const cuentaActualizada: CuentaAfiliado = {
    id: cuentaId,
    estado: cambios.estado ?? cuentaExistente?.estado ?? "no_solicitado",
    plataforma: cambios.plataforma ?? cuentaExistente?.plataforma ?? cuentaId,
    nombrePrograma: cambios.nombrePrograma ?? cuentaExistente?.nombrePrograma,
    usuarioRegistro: cambios.usuarioRegistro ?? cuentaExistente?.usuarioRegistro,
    urlSolicitud: cambios.urlSolicitud ?? cuentaExistente?.urlSolicitud,
    fechaSolicitud: cambios.fechaSolicitud ?? cuentaExistente?.fechaSolicitud,
    fechaAprobacion: cambios.fechaAprobacion ?? cuentaExistente?.fechaAprobacion,
    comision: cambios.comision ?? cuentaExistente?.comision,
    duracionCookie: cambios.duracionCookie ?? cuentaExistente?.duracionCookie,
    metodoPago: cambios.metodoPago ?? cuentaExistente?.metodoPago,
    frecuenciaPago: cambios.frecuenciaPago ?? cuentaExistente?.frecuenciaPago,
    enlaces: fusionarEnlaces(cuentaExistente?.enlaces ?? [], cambios),
    ultimaRevision: hoy,
    observaciones: cambios.observaciones ?? cuentaExistente?.observaciones,
    verificacionPendiente: cuentaExistente?.verificacionPendiente,
    requisitosPrograma: cambios.requisitosPrograma ?? cuentaExistente?.requisitosPrograma,
    borradorSolicitud: cambios.borradorSolicitud ?? cuentaExistente?.borradorSolicitud,
    enlaceUltimaComprobacion: cambios.enlaceUltimaComprobacion ?? cuentaExistente?.enlaceUltimaComprobacion,
    enlaceComprobacionOk: cambios.enlaceComprobacionOk ?? cuentaExistente?.enlaceComprobacionOk,
  };

  const otrasCuentas = cuentasExistentes.filter((cuenta) => cuenta.id !== cuentaId);

  return {
    herramientaId,
    cuentas: [...otrasCuentas, cuentaActualizada],
  };
}
