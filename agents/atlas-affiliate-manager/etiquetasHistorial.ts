/**
 * Traduce los nombres técnicos que guarda el historial a algo legible.
 *
 * En la base de datos un campo se guarda como `partnerstack.comision`:
 * primero el identificador de la cuenta de afiliado, luego el campo. Eso
 * es lo correcto para el dato, pero en pantalla no se entiende. Aquí se
 * separa en dos partes y se le pone nombre a la segunda.
 */

const NOMBRES_DE_CAMPO: Record<string, string> = {
  estado: "Estado de la solicitud",
  plataforma: "Plataforma",
  nombrePrograma: "Nombre del programa",
  usuarioRegistro: "Usuario de registro",
  urlSolicitud: "Dirección de solicitud",
  fechaSolicitud: "Fecha de solicitud",
  fechaAprobacion: "Fecha de aprobación",
  comision: "Comisión",
  duracionCookie: "Duración de la cookie",
  metodoPago: "Método de pago",
  frecuenciaPago: "Frecuencia de pago",
  observaciones: "Observaciones",
  verificacionPendiente: "Verificación pendiente",
  requisitosPrograma: "Requisitos del programa",
  borradorSolicitud: "Borrador de solicitud",
  enlaces: "Enlaces de afiliado",
  enlaceUltimaComprobacion: "Última comprobación del enlace",
  enlaceComprobacionOk: "Resultado de la comprobación",
};

export type CampoDescompuesto = { cuentaId: string; campo: string; etiqueta: string };

export function describirCampo(campoCompleto: string): CampoDescompuesto {
  const separador = campoCompleto.indexOf(".");
  if (separador === -1) {
    return { cuentaId: "", campo: campoCompleto, etiqueta: NOMBRES_DE_CAMPO[campoCompleto] ?? campoCompleto };
  }
  const cuentaId = campoCompleto.slice(0, separador);
  const campo = campoCompleto.slice(separador + 1);
  return { cuentaId, campo, etiqueta: NOMBRES_DE_CAMPO[campo] ?? campo };
}

/**
 * Convierte a texto un valor guardado en el historial, para mostrarlo en
 * pantalla. Los valores viajan como JSON, así que un texto llega
 * entrecomillado y un campo sin valor llega como `null`.
 */
export function describirValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "(vacío)";
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  if (typeof valor === "string") return valor === "" ? "(vacío)" : valor;
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "(ninguno)";
    return valor
      .map((elemento) =>
        elemento && typeof elemento === "object" && "url" in elemento
          ? String((elemento as { segmento?: string; url: string }).segmento ?? "global") +
            ": " +
            String((elemento as { url: string }).url)
          : JSON.stringify(elemento)
      )
      .join(" · ");
  }
  return JSON.stringify(valor);
}

/** Fecha y hora en formato español, legible de un vistazo. */
export function describirFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Quién hizo el cambio, en lenguaje normal. Los procesos automáticos
 * guardan identificadores fijos que conviene distinguir a simple vista de
 * una persona.
 */
const USUARIOS_AUTOMATICOS: Record<string, string> = {
  "migracion-inicial": "Migración inicial",
  "verificacion-tecnica": "Comprobación técnica",
  "sistema-promocion": "Alta automática en el catálogo",
};

export function describirUsuario(usuario: string): { nombre: string; esAutomatico: boolean } {
  const automatico = USUARIOS_AUTOMATICOS[usuario];
  return automatico ? { nombre: automatico, esAutomatico: true } : { nombre: usuario, esAutomatico: false };
}
