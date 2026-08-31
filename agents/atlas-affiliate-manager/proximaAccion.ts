import type { CuentaAfiliado } from "@/data/esquemaInterno";
import { diasEntre } from "@/agents/compartido/fechas";
import { DIAS_ESTANCAMIENTO_POR_DEFECTO } from "./consistencia";

/**
 * Estado de panel y próxima acción — capa de lectura pensada para el panel
 * interno (Sprint 1B), calculada siempre a partir de `EstadoAfiliacion` y el
 * resto de campos de `CuentaAfiliado`, nunca almacenada aparte.
 *
 * Deliberadamente NO se añade como un campo nuevo del esquema ni se toca
 * `EstadoAfiliacion` (los 5 valores que ya usan `seleccionarEnlace.ts` en
 * el redirect de producción y `priorizador.ts` siguen intactos): el
 * vocabulario del panel es una lectura más amigable sobre el mismo dato,
 * no un segundo estado que pudiera desincronizarse del real.
 *
 * "Activa" es un estado propio desde el 2026-08-31. Antes, "aprobado" y
 * "activo" se mostraban los dos como "aprobada", y eso ocultaba la única
 * diferencia que importa para cobrar: `seleccionarEnlace.ts` solo usa los
 * enlaces de las cuentas en "activo". Una cuenta aprobada, con su enlace
 * guardado y todo en verde, seguía enviando a la URL oficial sin comisión,
 * y el panel no daba ninguna forma de notarlo ni de arreglarlo.
 */

export type EstadoPanel =
  | "pendiente"
  | "preparada"
  | "enviada"
  | "aprobada"
  | "activa"
  | "rechazada"
  | "seguimiento";

export function calcularEstadoPanel(cuenta: CuentaAfiliado, hoy: string): EstadoPanel {
  if (cuenta.estado === "rechazado") return "rechazada";
  if (cuenta.estado === "activo") return "activa";
  if (cuenta.estado === "aprobado") return "aprobada";

  if (cuenta.estado === "pendiente") {
    const dias = diasEntre(hoy, cuenta.ultimaRevision);
    if (dias !== null && dias >= DIAS_ESTANCAMIENTO_POR_DEFECTO) return "seguimiento";
    return "enviada";
  }

  // no_solicitado:
  if (cuenta.borradorSolicitud) return "preparada";
  return "pendiente";
}

export function calcularProximaAccion(cuenta: CuentaAfiliado, hoy: string): string {
  const estadoPanel = calcularEstadoPanel(cuenta, hoy);

  switch (estadoPanel) {
    case "pendiente":
      return cuenta.requisitosPrograma ? "Preparar el borrador de solicitud" : "Investigar los requisitos del programa";
    case "preparada":
      return "Revisar el borrador y enviar la solicitud";
    case "enviada":
      return "Esperar respuesta del programa";
    case "seguimiento": {
      const dias = diasEntre(hoy, cuenta.ultimaRevision);
      return `Hacer seguimiento — sin respuesta hace ${dias ?? "?"} días`;
    }
    case "aprobada":
      if (cuenta.enlaces.length === 0) return "Guardar el enlace de afiliada conseguido";
      if (cuenta.verificacionPendiente) return "Verificar comisión/plataforma antes de darla por lista para monetizar";
      // El paso que faltaba: aprobada y con enlace todavía no cobra.
      return "Activar la cuenta — hasta entonces el enlace no se usa";
    case "activa":
      if (cuenta.enlaces.length === 0) return "Activa SIN enlace: no puede generar comisión";
      if (cuenta.verificacionPendiente) return "Verificar comisión/plataforma antes de darla por lista para monetizar";
      return "Ninguna — cuenta activa y con enlace";
    case "rechazada":
      return "Ninguna — programa rechazado";
  }
}
