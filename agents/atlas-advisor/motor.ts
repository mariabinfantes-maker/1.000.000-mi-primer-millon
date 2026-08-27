import type { Herramienta } from "@/data/esquema";
import { cubreCategoria, esSuite, tipoProductoDe } from "@/data/taxonomia";
import { CRITERIOS } from "./criterios";
import { criteriosDeRuta, rangoDeRuta } from "./criteriosRuta";
import { compararTodoEnUnoVsEspecializada } from "./todoEnUnoVsEspecializada";
import type {
  ComparativaDeRutas,
  DetalleCriterio,
  HerramientaEvaluada,
  ResultadoRecomendacion,
  RespuestasUsuario,
} from "./tipos";

const CANTIDAD_POR_DEFECTO = 3;

/**
 * Cuánto puede aportar como máximo la parte específica de ruta, una vez
 * normalizada a 0..1. Es el mismo techo para las dos rutas a propósito:
 * ahí está la equidad. Da igual que la ruta suite tenga 7 criterios y la
 * especializada 8, o que sus rangos internos sean distintos — ninguna
 * puede aportar más que la otra por su forma, solo por lo bien que
 * responde a su propia pregunta.
 */
export const ESCALA_RUTA = 40;
/** Nº máximo de motivos puntuados que entran en el párrafo de explicación (el resto sigue disponible en `razones`). */
const MOTIVOS_EN_EXPLICACION = 2;

function porRelevancia(a: DetalleCriterio, b: DetalleCriterio): number {
  return Math.abs(b.puntos) - Math.abs(a.puntos);
}

/**
 * `idealPara` normalizada para insertarse tras un lead-in propio ("Para
 * quién encaja mejor:") sin duplicar la introducción cuando el dato
 * editorial ya empieza con "Ideal para" (una minoría de fichas la escriben
 * así, el resto empieza directo por el perfil de negocio).
 */
function encajePara(herramienta: Herramienta): string {
  const texto = herramienta.idealPara.replace(/^Ideal para\s+/i, "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Compone un párrafo legible a partir de los motivos más relevantes de una
 * herramienta ya evaluada.
 *
 * Cada motivo llega ya redactado como frase independiente y capitalizada
 * (ver los criterios en ./criterios.ts, p. ej. "Interfaz muy fácil de usar
 * (8/10)."), así que encadenarlos tras "porque:" los convertía en
 * fragmentos sin sujeto ("Recomendamos X porque: Pensada para..."). Un
 * encabezado nominal en vez de una conjunción evita esa fricción
 * gramatical sin tener que reescribir los motivos en sí.
 *
 * Siempre cierra con `idealPara` (dato editorial fijo de la herramienta,
 * nunca puntuado): con el cuestionario de 4 preguntas, es habitual que dos
 * o tres finalistas empaten en todos los criterios activos y por tanto en
 * sus `razones` — sin este cierre, sus tarjetas mostrarían el párrafo
 * "por qué te recomendamos" palabra por palabra idéntico, que lee como una
 * plantilla en vez de una recomendación pensada para cada una.
 */
function generarExplicacion(herramienta: Herramienta, razones: string[]): string {
  const encaje = `Para quién encaja mejor: ${encajePara(herramienta)}`;
  if (razones.length === 0) {
    return `${herramienta.nombre} es una opción sólida y bien valorada dentro de su categoría. ${encaje}`;
  }
  const motivos = razones.slice(0, MOTIVOS_EN_EXPLICACION).join(" ");
  return `Por qué te recomendamos ${herramienta.nombre}: ${motivos} ${encaje}`;
}

/**
 * Aplica a una herramienta los criterios COMUNES más los propios de su
 * ruta, y consolida el resultado.
 *
 * La puntuación final tiene dos partes que nunca se mezclan en crudo:
 *  - los criterios comunes, idénticos para cualquier herramienta y por
 *    tanto directamente comparables;
 *  - los criterios de ruta, normalizados a 0..1 dentro del rango teórico
 *    de SU ruta y luego llevados a la misma escala (`ESCALA_RUTA`).
 *
 * `catalogo` es el conjunto de candidatas contra el que se compara: los
 * criterios comparativos (profundidad frente a sus iguales, superioridad
 * frente al módulo de una suite) no tienen sentido sin él.
 */
export function evaluarHerramienta(
  herramienta: Herramienta,
  respuestas: RespuestasUsuario,
  catalogo: Herramienta[] = [herramienta]
): HerramientaEvaluada {
  const detallesComunes = CRITERIOS.map((criterio) => criterio(herramienta, respuestas));
  const puntuacionComun = detallesComunes.reduce((total, detalle) => total + detalle.puntos, 0);

  const criteriosRuta = criteriosDeRuta(herramienta);
  const contexto = { respuestas, catalogo };
  const detallesRuta = criteriosRuta.map((criterio) => criterio.evaluar(herramienta, contexto));
  const puntosRuta = detallesRuta.reduce((total, detalle) => total + detalle.puntos, 0);

  const rango = rangoDeRuta(criteriosRuta);
  const amplitud = rango.max - rango.min;
  const puntuacionRutaNormalizada = amplitud === 0 ? 0 : (puntosRuta - rango.min) / amplitud;

  const detalles = [...detallesComunes, ...detallesRuta];
  const puntuacionTotal = puntuacionComun + puntuacionRutaNormalizada * ESCALA_RUTA;

  const razones = detalles
    .filter((detalle) => detalle.explicacion !== "")
    .sort(porRelevancia)
    .map((detalle) => detalle.explicacion);

  const tieneAdvertencia = detalles.some((detalle) => detalle.criterio === "casosNoRecomendados" && detalle.puntos < 0);

  return {
    herramienta,
    puntuacionTotal,
    detalles,
    razones,
    explicacion: generarExplicacion(herramienta, razones),
    tieneAdvertencia,
    tipoProducto: tipoProductoDe(herramienta),
    puntuacionComun,
    puntuacionRutaNormalizada,
  };
}

/**
 * Reduce el catálogo a las herramientas relevantes para la intención del
 * usuario, antes de puntuar nada — filtrar, no adivinar puntos.
 *
 * Tres niveles, de más a menos explícito:
 *  1. `categoriaId` — elección explícita y siempre con prioridad: si no hay
 *     ninguna herramienta en esa categoría, se devuelve vacío a propósito
 *     (el usuario pidió justo esa categoría).
 *  2. `preferenciaSuite` — respuesta explícita a la pregunta "¿todo en uno
 *     o especializadas?" del cuestionario (ver `todoEnUnoVsEspecializada.ts`)
 *     cuando no hay `categoriaId`: filtra a "plataformas-todo-en-uno" o la
 *     excluye, según la respuesta. Misma lógica que `categoriaId` — es una
 *     elección real del usuario, no una suposición — pero nunca deja al
 *     usuario sin resultados: si el filtro vacía el catálogo (todavía no
 *     hay herramientas de ese tipo para su situación), se ignora en vez de
 *     devolver una lista vacía por una preferencia que no era la pregunta
 *     principal del usuario.
 *  3. `problemaIdsCandidatos` — más blando: puede venir de una elección
 *     explícita ("por objetivo", un solo id) o de una detección por texto
 *     libre ("Cuéntanoslo", posibles varios ids empatados) — así que si el
 *     catálogo no tiene ninguna herramienta con ese `problemasIds` todavía
 *     (hueco editorial, no elección del usuario), se ignora el filtro en
 *     vez de dejar al usuario sin recomendación.
 *
 * Sin elección explícita de tipo de suite, `criterioTipoSuite` (en
 * `criterios.ts`) usa las mismas señales pero como PUNTUACIÓN, no como
 * filtro — ahí sí hay que "adivinar", así que no se excluye nada.
 */
function seleccionarCandidatas(herramientas: Herramienta[], respuestas: RespuestasUsuario): Herramienta[] {
  if (respuestas.categoriaId) {
    return herramientas.filter((herramienta) => cubreCategoria(herramienta, respuestas.categoriaId!));
  }

  let universo = herramientas;
  if (respuestas.preferenciaSuite) {
    const quiereSuite = respuestas.preferenciaSuite === "todo_en_uno";
    const filtradasPorSuite = herramientas.filter((herramienta) => esSuite(herramienta) === quiereSuite);
    if (filtradasPorSuite.length > 0) universo = filtradasPorSuite;
  }

  if (respuestas.problemaIdsCandidatos && respuestas.problemaIdsCandidatos.length > 0) {
    const idsObjetivo = new Set(respuestas.problemaIdsCandidatos);
    const filtradas = universo.filter((herramienta) => herramienta.problemasIds?.some((id) => idsObjetivo.has(id)));
    if (filtradas.length > 0) return filtradas;
  }

  return universo;
}

/**
 * Motor de recomendación de Atlas.
 *
 * Recibe las respuestas del cuestionario y el catálogo completo de
 * herramientas (normalmente `getHerramientas()` de `data/repositorio.ts`,
 * pero el motor no importa ese módulo: así se puede probar con catálogos de
 * prueba y, el día de mañana, reutilizar desde una ruta de API sin cambios).
 *
 * Puntúa cada herramienta candidata con `CRITERIOS`, las ordena de mayor a
 * menor puntuación (con la calidad editorial como desempate) y devuelve el
 * top N junto con el ranking completo.
 */
export function recomendarHerramientas(
  respuestas: RespuestasUsuario,
  herramientas: Herramienta[],
  opciones: { cantidad?: number } = {}
): ResultadoRecomendacion {
  const cantidad = opciones.cantidad ?? CANTIDAD_POR_DEFECTO;

  const candidatas = seleccionarCandidatas(herramientas, respuestas);

  const evaluadas = candidatas
    .map((herramienta) => evaluarHerramienta(herramienta, respuestas, candidatas))
    .sort(
      (a, b) =>
        b.puntuacionTotal - a.puntuacionTotal ||
        b.herramienta.puntuaciones.calidad - a.herramienta.puntuaciones.calidad ||
        b.herramienta.puntuaciones.fiabilidad - a.herramienta.puntuaciones.fiabilidad
    );

  // La comparativa solo tiene sentido cuando el usuario NO ha elegido
  // ruta: si ya dijo qué quiere, `seleccionarCandidatas` filtró y aquí
  // solo compiten candidatas de ese tipo, así que enfrentarlas sería
  // devolverle una pregunta que ya respondió.
  const eligioRuta = Boolean(respuestas.categoriaId || respuestas.preferenciaSuite);

  return {
    top: evaluadas.slice(0, cantidad),
    todas: evaluadas,
    ...(eligioRuta ? {} : { comparativaDeRutas: compararRutas(evaluadas, respuestas) }),
  };
}

/**
 * Enfrenta la mejor suite con la mejor especializada y redacta qué gana y
 * qué sacrifica quien elija cada camino.
 *
 * Las señales indirectas de `todoEnUnoVsEspecializada.ts` se usan aquí
 * para matizar el texto — no para restar puntos a nadie. Es la diferencia
 * entre orientar y castigar: antes, un perfil que apuntaba a suite hacía
 * perder 8 puntos a toda especializada; ahora hace que el texto diga por
 * qué centralizar le encajaría, dejando la decisión donde debe estar.
 */
function compararRutas(evaluadas: HerramientaEvaluada[], respuestas: RespuestasUsuario): ComparativaDeRutas {
  const mejorSuite = evaluadas.find((e) => e.tipoProducto === "suite");
  const mejorEspecializada = evaluadas.find((e) => e.tipoProducto === "especializada");
  const senal = compararTodoEnUnoVsEspecializada(respuestas);

  const centralizar =
    "Con una plataforma todo en uno tienes una sola suscripción, un solo sitio donde están tus datos y nada que conectar por fuera. " +
    "A cambio, cada área concreta suele quedarse por detrás de una herramienta dedicada, y todo tu negocio pasa a depender de un único proveedor.";

  const especializar =
    "Con una herramienta especializada tienes lo mejor que existe para esa función concreta y puedes cambiarla sin tocar el resto. " +
    "A cambio, pagas varias suscripciones y tienes que mantener las conexiones entre ellas.";

  const matiz =
    senal.recomendacion === "todo_en_uno"
      ? " Por lo que nos has contado, centralizar te encajaría mejor."
      : senal.recomendacion === "especializada"
        ? " Por lo que nos has contado, especializar te encajaría mejor."
        : "";

  return {
    mejorSuite,
    mejorEspecializada,
    beneficioDeCentralizar: centralizar + (senal.recomendacion === "todo_en_uno" ? matiz : ""),
    beneficioDeEspecializar: especializar + (senal.recomendacion === "especializada" ? matiz : ""),
  };
}
