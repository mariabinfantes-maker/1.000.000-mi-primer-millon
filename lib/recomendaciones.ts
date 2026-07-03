import { Categoria, Problema, getProblema } from "./data";

export type RangoEmpleados = "1-10" | "11-50" | "51-200" | "200+";

export const RANGOS_EMPLEADOS: { valor: RangoEmpleados; etiqueta: string }[] = [
  { valor: "1-10", etiqueta: "1-10" },
  { valor: "11-50", etiqueta: "11-50" },
  { valor: "51-200", etiqueta: "51-200" },
  { valor: "200+", etiqueta: "Más de 200" },
];

/** Respuestas que el usuario da en el cuestionario de diagnóstico. */
export type RespuestasCuestionario = {
  sector: string;
  empleados: RangoEmpleados;
  mayorProblema: string;
  usaHerramientaActual: boolean;
  herramientaActualNombre: string;
};

export type Recomendacion = {
  problema: Problema;
  respuestas: RespuestasCuestionario;
  categorias: Categoria[];
};

/**
 * Punto de conexión con el futuro motor de recomendaciones.
 *
 * Hoy simula el análisis con una espera y devuelve las categorías del
 * problema sin priorizar. Cuando exista el motor de IA, esta función debe
 * enviarle `problemaId` + `respuestas` y devolver la selección de
 * categorías/herramientas ya priorizada para esa empresa, manteniendo la
 * misma forma de `Recomendacion` para no romper a quien la consume.
 */
export async function generarRecomendacion(
  problemaId: string,
  respuestas: RespuestasCuestionario
): Promise<Recomendacion> {
  const problema = getProblema(problemaId);
  if (!problema) {
    throw new Error(`Problema desconocido: ${problemaId}`);
  }

  // TODO: sustituir esta simulación por la llamada real al motor de IA,
  // por ejemplo: await fetch("/api/recomendaciones", { method: "POST", body: JSON.stringify({ problemaId, respuestas }) })
  await new Promise((resolve) => setTimeout(resolve, 1600));

  return {
    problema,
    respuestas,
    categorias: problema.categorias,
  };
}
