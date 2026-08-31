import { ESTADOS_INGRESO, type AsientoIngreso, type EstadoIngreso } from "./tipos";

/**
 * Validación del apunte de ingresos.
 *
 * Estricta con el dinero a propósito: aquí no hay tolerancia como en la
 * etiqueta de recorrido. Un clic mal etiquetado es un dato menos; un importe
 * mal guardado es contabilidad falsa. Si algo no encaja, se rechaza y se
 * explica, en vez de guardar una aproximación.
 *
 * El importe entra en **céntimos enteros**. Aceptar decimales invitaría a
 * pasar 47.15 y perder medio céntimo por el camino en cada operación.
 */

export type ResultadoValidacionIngreso =
  | { ok: true; asiento: AsientoIngreso }
  | { ok: false; error: string };

const PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONEDA = /^[A-Z]{3}$/;

export function validarAsientoIngreso(cuerpo: unknown): ResultadoValidacionIngreso {
  if (typeof cuerpo !== "object" || cuerpo === null) return { ok: false, error: "Falta el cuerpo del apunte." };
  const c = cuerpo as Record<string, unknown>;

  if (typeof c.herramientaId !== "string" || c.herramientaId.trim() === "")
    return { ok: false, error: "Falta la herramienta." };

  if (typeof c.periodo !== "string" || !PERIODO.test(c.periodo))
    return { ok: false, error: 'El periodo debe tener el formato "AAAA-MM", por ejemplo "2026-08".' };

  if (typeof c.estado !== "string" || !ESTADOS_INGRESO.includes(c.estado as EstadoIngreso))
    return { ok: false, error: `El estado debe ser uno de: ${ESTADOS_INGRESO.join(", ")}.` };

  if (!Number.isInteger(c.conversiones) || (c.conversiones as number) < 0)
    return { ok: false, error: "Las conversiones deben ser un número entero de cero en adelante." };

  if (!Number.isInteger(c.importeCentimos) || (c.importeCentimos as number) < 0)
    return { ok: false, error: "El importe debe ir en céntimos enteros, sin decimales ni signo." };

  const moneda = typeof c.moneda === "string" && c.moneda.trim() !== "" ? c.moneda.trim().toUpperCase() : "EUR";
  if (!MONEDA.test(moneda)) return { ok: false, error: 'La moneda debe ser un código de tres letras, por ejemplo "EUR".' };

  return {
    ok: true,
    asiento: {
      herramientaId: c.herramientaId.trim(),
      periodo: c.periodo,
      conversiones: c.conversiones as number,
      importeCentimos: c.importeCentimos as number,
      moneda,
      estado: c.estado as EstadoIngreso,
      fuente: typeof c.fuente === "string" && c.fuente.trim() !== "" ? c.fuente.trim() : undefined,
      nota: typeof c.nota === "string" && c.nota.trim() !== "" ? c.nota.trim() : undefined,
    },
  };
}
