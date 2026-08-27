import type { Herramienta } from "@/data/esquema";
import { categoriaTieneSubtipos, cubreCategoria, cubreSubtipo, subtiposDe, esSuite, tipoProductoDe } from "@/data/taxonomia";
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
 * normalizada. Es el mismo techo para las dos rutas a propósito:
 * ahí está la equidad. Da igual que la ruta suite tenga 7 criterios y la
 * especializada 8, o que sus rangos internos sean distintos — ninguna
 * puede aportar más que la otra por su forma, solo por lo bien que
 * responde a su propia pregunta.
 */
export const ESCALA_RUTA = 40;

/**
 * Lleva los puntos de una ruta a −1..+1 CENTRADO EN CERO: se divide por el
 * máximo de la ruta cuando suman y por su mínimo cuando restan.
 *
 * La forma obvia — repartir el rango entero entre 0 y 1 — parecía justa y
 * no lo era. Las dos rutas tienen rangos asimétricos distintos (la suite
 * llega a −50/+62, la especializada a −36/+80), así que una herramienta
 * NEUTRA, que no suma ni resta en ningún criterio, caía en 0,446 siendo
 * suite y en 0,310 siendo especializada: 5 puntos de ventaja regalados por
 * la forma del rango, no por el mérito. Se detectó comparando monday.com y
 * Asana, que tienen exactamente las mismas puntuaciones y aun así
 * terminaban separadas por 3,4 puntos.
 *
 * Centrando en cero, una herramienta neutra vale 0 en las dos rutas, el
 * techo de cada una vale +1 y el suelo −1. Cada ruta mide desviación
 * respecto de lo neutro dentro de su propia escala, y ninguna arranca por
 * delante.
 */
export function normalizarRuta(puntos: number, rango: { min: number; max: number }): number {
  if (puntos === 0) return 0;
  if (puntos > 0) return rango.max === 0 ? 0 : Math.min(puntos / rango.max, 1);
  return rango.min === 0 ? 0 : -Math.min(puntos / rango.min, 1);
}

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
 *  - los criterios de ruta, normalizados a −1..+1 y centrados en cero
 *    dentro del rango teórico de SU ruta (ver `normalizarRuta`) y luego
 *    llevados a la misma escala (`ESCALA_RUTA`).
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

  const puntuacionRutaNormalizada = normalizarRuta(puntosRuta, rangoDeRuta(criteriosRuta));

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
    const deLaCategoria = herramientas.filter((herramienta) => cubreCategoria(herramienta, respuestas.categoriaId!));
    if (!respuestas.subtipoId) return deLaCategoria;
    // Si la persona ha concretado qué tipo de herramienta busca, lo demás
    // no son alternativas suyas: se filtran, no se puntúan peor.
    const delSubtipo = deLaCategoria.filter((herramienta) => cubreSubtipo(herramienta, respuestas.subtipoId!));
    return delSubtipo.length > 0 ? delSubtipo : deLaCategoria;
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
    top: repartirEntreSubtipos(evaluadas, cantidad, respuestas),
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


/**
 * Cuando la persona NO ha dicho qué tipo de herramienta busca y las
 * candidatas pertenecen a subtipos distintos, la primera posición no puede
 * decidirse comparándolas entre sí: un corrector de textos y un generador
 * de vídeo no son alternativas, así que "cuál es mejor" no tiene respuesta.
 *
 * Lo que sí tiene respuesta es "cuál es la mejor de cada clase". Eso es lo
 * que se devuelve: el primero de cada subtipo, por orden de puntuación, y
 * después se completa con el resto del ranking.
 *
 * No es un reparto de visibilidad ni un tope artificial: nadie pierde
 * puntos y el orden sigue siendo el que sale de sus fichas. Es que la
 * pregunta que se estaba respondiendo antes no era una pregunta.
 *
 * Si solo hay un subtipo en juego —el caso normal, porque casi ninguna
 * categoría los distingue— esto no cambia absolutamente nada.
 */
function repartirEntreSubtipos(
  evaluadas: HerramientaEvaluada[],
  cantidad: number,
  respuestas: RespuestasUsuario
): HerramientaEvaluada[] {
  if (respuestas.subtipoId) return evaluadas.slice(0, cantidad);

  const conSubtipo = evaluadas.filter((e) => categoriaTieneSubtipos(e.herramienta.categoriaId));
  if (conSubtipo.length === 0) return evaluadas.slice(0, cantidad);

  const subtiposEnJuego = new Set(conSubtipo.flatMap((e) => subtiposDe(e.herramienta)));
  if (subtiposEnJuego.size <= 1) return evaluadas.slice(0, cantidad);

  const elegidas: HerramientaEvaluada[] = [];
  const yaVistos = new Set<string>();

  for (const evaluada of evaluadas) {
    if (elegidas.length >= cantidad) break;
    const suyos = subtiposDe(evaluada.herramienta);
    // Sin subtipo declarado no se la aparta: es un dato que falta, no un
    // motivo para esconderla. Curator avisa de esas fichas.
    if (suyos.length === 0) { elegidas.push(evaluada); continue; }
    if (suyos.every((id) => yaVistos.has(id))) continue;
    for (const id of suyos) yaVistos.add(id);
    elegidas.push(evaluada);
  }

  // Si aún quedan huecos, se rellenan con el ranking tal cual.
  for (const evaluada of evaluadas) {
    if (elegidas.length >= cantidad) break;
    if (!elegidas.includes(evaluada)) elegidas.push(evaluada);
  }
  return elegidas;
}
