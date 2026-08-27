import type { PresupuestoMensual, RespuestasUsuario } from "../tipos";
import type { RangoEmpleados } from "@/lib/cuestionario";

/**
 * Generador de perfiles para simulaciones, con tipado estricto.
 *
 * Garantía 7. Existe por un error real y repetido: durante la auditoría del
 * 2026-08-27 se simuló el catálogo pasando `preferenciaSuite: true/false`
 * cuando el campo admite `"todo_en_uno" | "especializada"`. Al construir el
 * objeto con un spread, TypeScript no lo veía, así que la rama "quiero una
 * suite" nunca llegó a probarse y los porcentajes publicados estaban mal.
 *
 * Aquí los valores salen de arrays tipados: un valor inválido no compila.
 */
export const TAMANOS_EMPRESA: readonly RangoEmpleados[] = ["1-10", "11-50", "51-200", "200+"] as const;

export const PRESUPUESTOS: readonly PresupuestoMensual[] = [
  "sin_presupuesto",
  "ajustado",
  "medio",
  "alto",
  "sin_limite",
] as const;

/** `undefined` incluido a propósito: "no tengo preferencia" es una respuesta válida y frecuente. */
export const PREFERENCIAS_SUITE: readonly RespuestasUsuario["preferenciaSuite"][] = [
  undefined,
  "todo_en_uno",
  "especializada",
] as const;

/**
 * Todos los perfiles que salen de combinar las respuestas anteriores con la
 * puerta de entrada indicada. `base` se tipa como `RespuestasUsuario`, así
 * que tampoco ahí cabe un campo inventado.
 */
export function perfilesDePrueba(base: RespuestasUsuario): RespuestasUsuario[] {
  const perfiles: RespuestasUsuario[] = [];
  for (const tamanoEmpresa of TAMANOS_EMPRESA)
    for (const presupuesto of PRESUPUESTOS)
      for (const requierePlanGratuito of [true, false])
        for (const preferenciaSuite of PREFERENCIAS_SUITE)
          perfiles.push({ ...base, tamanoEmpresa, presupuesto, requierePlanGratuito, preferenciaSuite });
  return perfiles;
}
