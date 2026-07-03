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
