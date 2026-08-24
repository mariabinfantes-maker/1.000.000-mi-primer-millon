import fs from "node:fs";
import path from "node:path";

/**
 * Historial de aprobaciones — auditoría interna aprobada el 2026-08-18,
 * último paso del flujo antes de la promoción oficial al catálogo.
 *
 * A diferencia de `decision.ts` (una decisión por id, se sobrescribe con
 * cada revisión — es el estado ACTUAL, no un historial) esto es
 * deliberadamente append-only: cada intento de promoción, aceptado o
 * rechazado, añade un registro nuevo sin borrar los anteriores. Es la
 * única forma de responder "¿por qué se aceptó/rechazó esta herramienta,
 * y cuándo?" con certeza, incluso después de reintentos.
 *
 * Vive en un único archivo (`data/historial-aprobaciones.json`, un array
 * JSON) en vez de un directorio con un archivo por intento: es la opción
 * más simple que sigue sirviendo el propósito — leer "todo el historial"
 * es abrir un archivo y hacer `JSON.parse`, sin tener que listar ni
 * ordenar un directorio por fecha.
 */

export type ResultadoHistorial = "aceptada" | "rechazada";
export type EstadoAfiliacionHistorial = "confirmada" | "pendiente_de_verificar";

export type RegistroHistorialAprobacion = {
  herramientaId: string;
  nombreHerramienta: string;
  /** ISO 8601 completo, con hora — a diferencia de `decision.ts` (solo fecha), aquí importa el momento exacto del intento de promoción. */
  fechaHora: string;
  resultado: ResultadoHistorial;
  /** Puntuación Molnip recalculada en el momento del intento. `null` si no se pudo calcular (datos insuficientes). */
  puntuacionMolnip: number | null;
  /** `null` cuando no llegó a evaluarse (la promoción se rechazó por otro motivo antes de llegar a comprobar la afiliación). */
  estadoAfiliacion: EstadoAfiliacionHistorial | null;
  /** Notas de quien aprobó/rechazó editorialmente (`decision.ts`) y, si la promoción se rechazó, los motivos técnicos del bloqueo — unidos en un único texto legible, nunca vacío. */
  observaciones: string;
  /** Si en el momento de este intento existía una decisión "aprobado" registrada — la aprobación humana explícita que exige todo el sistema; hoy, con un único operador, es la aprobación del CEO. */
  aprobacionCeo: boolean;
};

const RUTA_POR_DEFECTO = path.join(process.cwd(), "data", "historial-aprobaciones.json");

function leerArchivo(ruta: string): RegistroHistorialAprobacion[] {
  if (!fs.existsSync(ruta)) return [];
  const contenido = fs.readFileSync(ruta, "utf-8").trim();
  if (contenido === "") return [];
  return JSON.parse(contenido) as RegistroHistorialAprobacion[];
}

/** Añade un registro nuevo al historial — nunca modifica ni elimina los anteriores. */
export function registrarEnHistorial(
  registro: Omit<RegistroHistorialAprobacion, "fechaHora"> & { fechaHora?: string },
  opciones: { ruta?: string } = {}
): RegistroHistorialAprobacion {
  const ruta = opciones.ruta ?? RUTA_POR_DEFECTO;
  const historial = leerArchivo(ruta);

  const completo: RegistroHistorialAprobacion = {
    fechaHora: registro.fechaHora ?? new Date().toISOString(),
    herramientaId: registro.herramientaId,
    nombreHerramienta: registro.nombreHerramienta,
    resultado: registro.resultado,
    puntuacionMolnip: registro.puntuacionMolnip,
    estadoAfiliacion: registro.estadoAfiliacion,
    observaciones: registro.observaciones,
    aprobacionCeo: registro.aprobacionCeo,
  };

  historial.push(completo);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, `${JSON.stringify(historial, null, 2)}\n`, "utf-8");
  return completo;
}

/** Todo el historial, en el orden en que se registró (más antiguo primero). */
export function leerHistorialAprobaciones(opciones: { ruta?: string } = {}): RegistroHistorialAprobacion[] {
  return leerArchivo(opciones.ruta ?? RUTA_POR_DEFECTO);
}

/** Historial de una única herramienta — útil para responder "¿por qué se rechazó la primera vez y se aceptó la segunda?". */
export function historialDeHerramienta(herramientaId: string, opciones: { ruta?: string } = {}): RegistroHistorialAprobacion[] {
  return leerHistorialAprobaciones(opciones).filter((registro) => registro.herramientaId === herramientaId);
}
