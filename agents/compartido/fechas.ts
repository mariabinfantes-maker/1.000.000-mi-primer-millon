/**
 * Utilidades de fechas compartidas por cualquier agente que necesite medir
 * "cuánto tiempo lleva algo sin revisarse" — Affiliate Manager (cuentas
 * estancadas) y Mantenimiento (herramientas y cuentas desactualizadas) la
 * usan igual. Vive en `agents/compartido/` (no dentro de un agente
 * concreto) por el mismo motivo que el adaptador de IA: no es exclusiva de
 * ninguno.
 */

/** Días transcurridos entre `fecha` (ISO 8601) y `hoy` (ISO 8601). `null` si alguna de las dos fechas no es válida — nunca lanza. */
export function diasEntre(hoy: string, fecha: string): number | null {
  const msHoy = Date.parse(hoy);
  const msFecha = Date.parse(fecha);
  if (!Number.isFinite(msHoy) || !Number.isFinite(msFecha)) return null;
  return Math.floor((msHoy - msFecha) / (1000 * 60 * 60 * 24));
}
