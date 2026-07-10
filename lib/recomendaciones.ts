import { getProblema } from "./data";
import type { RespuestasCuestionario } from "./cuestionario";
import {
  getRecomendacionesDeProblema,
  type HerramientaRecomendada,
} from "./recomendacionesData";

export type { RangoEmpleados, RespuestasCuestionario } from "./cuestionario";
export { RANGOS_EMPLEADOS } from "./cuestionario";

/** Clave de sessionStorage usada para pasar la recomendación calculada del cuestionario a la pantalla de resultados. */
export function claveRecomendacionGuardada(problemaId: string): string {
  return `atlas:recomendacion:${problemaId}`;
}

export type Recomendacion = {
  problemaId: string;
  problemaTitulo: string;
  categorias: string[];
  herramientas: HerramientaRecomendada[];
  respuestas: RespuestasCuestionario;
  mensaje: string;
  /** Explicación cercana de por qué la herramienta principal (herramientas[0]) encaja. */
  porQueEncaja: string;
  /** 3 beneficios de negocio de resolver este problema. */
  beneficios: [string, string, string];
  /** Acción concreta para dar el primer paso con la herramienta principal. */
  siguientePaso: string;
};

/**
 * Motor de recomendaciones — V1 (basado en reglas, sin IA).
 *
 * Lee el catálogo curado de `lib/recomendacionesData.ts` y lo prioriza según
 * las respuestas del cuestionario. El día que exista un motor de IA o un
 * backend real, esta es la única función que hay que reemplazar: mismo
 * nombre, mismos parámetros (`problemaId`, `respuestas`) y mismo tipo de
 * retorno (`Recomendacion`), para no tener que tocar nada de lo que la
 * consume (el cuestionario ni la pantalla de resultados).
 */
export async function generarRecomendacion(
  problemaId: string,
  respuestas: RespuestasCuestionario
): Promise<Recomendacion> {
  const problema = getProblema(problemaId);
  const datos = getRecomendacionesDeProblema(problemaId);

  if (!problema || !datos) {
    throw new Error(`Problema desconocido: ${problemaId}`);
  }

  // TODO: sustituir esta simulación por la llamada real al motor de IA o a
  // una base de datos, por ejemplo:
  // await fetch("/api/recomendaciones", { method: "POST", body: JSON.stringify({ problemaId, respuestas }) })
  await new Promise((resolve) => setTimeout(resolve, 1600));

  const herramientas = priorizarHerramientas(datos.herramientas, respuestas);
  const principal = herramientas[0];

  return {
    problemaId: problema.id,
    problemaTitulo: problema.titulo,
    categorias: datos.categorias,
    herramientas,
    respuestas,
    mensaje: construirMensajePersonalizado(problema.titulo, respuestas),
    porQueEncaja: construirPorQueEncaja(problema.titulo, principal, respuestas),
    beneficios: datos.beneficios,
    siguientePaso: construirSiguientePaso(principal, datos.accionSugerida),
  };
}

/**
 * Reglas V1 de personalización: sin IA, solo ordena el catálogo curado
 * poniendo primero las herramientas pensadas para el tamaño de empresa del
 * usuario. No se descarta ninguna herramienta, solo se reordena.
 */
function priorizarHerramientas(
  herramientas: HerramientaRecomendada[],
  respuestas: RespuestasCuestionario
): HerramientaRecomendada[] {
  const encajanPorTamano = herramientas.filter((h) =>
    h.tamanosIdeales.includes(respuestas.empleados)
  );
  const resto = herramientas.filter(
    (h) => !h.tamanosIdeales.includes(respuestas.empleados)
  );
  return [...encajanPorTamano, ...resto];
}

function construirMensajePersonalizado(
  problemaTitulo: string,
  respuestas: RespuestasCuestionario
): string {
  const sector = respuestas.sector || "tu empresa";
  const base = `Para ${sector}, esto es lo que recomendamos para ${problemaTitulo.toLowerCase()}.`;

  if (!respuestas.usaHerramientaActual) {
    return base;
  }

  const nombre = respuestas.herramientaActualNombre;
  return nombre
    ? `${base} Ya usas ${nombre}: aquí tienes alternativas y complementos bien valorados.`
    : `${base} Ya usas alguna herramienta similar: aquí tienes opciones bien valoradas para comparar.`;
}

function construirPorQueEncaja(
  problemaTitulo: string,
  principal: HerramientaRecomendada,
  respuestas: RespuestasCuestionario
): string {
  const situacionActual = respuestas.usaHerramientaActual
    ? `ya utilizas ${respuestas.herramientaActualNombre || "una herramienta parecida"}`
    : `todavía no utilizas ninguna herramienta de ${principal.categoria}`;

  return `Como nos has contado que quieres ${problemaTitulo.toLowerCase()} y ${situacionActual}, te recomendamos ${principal.nombre}: ${principal.descripcionCorta.toLowerCase()}`;
}

function construirSiguientePaso(
  principal: HerramientaRecomendada,
  accionSugerida: string
): string {
  const esGratis = principal.precioInicial.toLowerCase().includes("gratis");
  const punto = esGratis ? "la versión gratuita" : "el plan inicial";
  return `Empieza con ${punto} de ${principal.nombre} y ${accionSugerida}.`;
}
