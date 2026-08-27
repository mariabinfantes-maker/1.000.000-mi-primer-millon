import type { CurvaDeAprendizaje, Herramienta } from "@/data/esquema";
import type { RangoEmpleados } from "@/lib/cuestionario";

/**
 * Tipos del motor de recomendación de Atlas.
 *
 * Este módulo no depende de React, de Next.js ni de sessionStorage: recibe
 * datos simples (`RespuestasUsuario`, `Herramienta[]`) y devuelve datos
 * simples (`ResultadoRecomendacion`). Así puede llamarse igual desde un
 * Server Component, desde un test, o el día de mañana desde una ruta de API
 * (`app/api/recomendaciones/route.ts`) sin cambiar ni una línea del motor.
 */

/** Cuánto le importa al usuario cada criterio subjetivo (escala corta, pensada para un selector en el cuestionario). */
export type NivelPrioridad = "baja" | "media" | "alta";

/** Capacidad técnica real del equipo que va a operar la herramienta día a día. */
export type NivelTecnicoEquipo = "ninguno" | "basico" | "intermedio" | "avanzado";

/** Rango de gasto mensual que el usuario está dispuesto a asumir, por empresa (no por usuario). */
export type PresupuestoMensual = "sin_presupuesto" | "ajustado" | "medio" | "alto" | "sin_limite";

/**
 * Respuestas del cuestionario que el motor necesita para personalizar la
 * recomendación. Todos los campos son opcionales a propósito: el motor debe
 * poder puntuar el catálogo incluso con un cuestionario parcial (cada
 * pregunta sin responder simplemente deja neutro su criterio asociado, en
 * vez de fallar o descartar herramientas por falta de datos).
 */
export type RespuestasUsuario = {
  /** Categoría de software que busca (Categoria.id). Si se indica, se filtra el catálogo a esa categoría antes de puntuar — tiene prioridad sobre `problemaIdsCandidatos`. */
  categoriaId?: string;
  /**
   * Objetivo(s) del catálogo (`Problema.id`) a los que se prefiltra el
   * catálogo cuando no hay `categoriaId`: exactamente uno cuando el usuario
   * entró "por objetivo" (lo eligió de forma explícita), o varios cuando lo
   * detectó el motor a partir de texto libre (puerta "Cuéntanoslo") y hay
   * empate entre objetivos igual de probables. Si ninguna herramienta del
   * catálogo tiene alguno de estos `Herramienta.problemasIds`, el motor
   * ignora el filtro y evalúa el catálogo completo en vez de devolver una
   * lista vacía — a diferencia de `categoriaId`, que sí es una elección
   * explícita y determinista del usuario.
   */
  problemaIdsCandidatos?: string[];
  /** Tamaño de la empresa, mismo formato que Herramienta.segmentosIdeales. */
  tamanoEmpresa?: RangoEmpleados;
  /** Sector / industria en texto libre, tal y como lo escribe el usuario. */
  industria?: string;
  /** Cuánto puede/quiere gastar al mes en esta herramienta. */
  presupuesto?: PresupuestoMensual;
  /** Si es imprescindible poder empezar con un plan gratuito. */
  requierePlanGratuito?: boolean;
  /** Cuánto le importa que la herramienta sea fácil de usar en el día a día. */
  prioridadFacilidadDeUso?: NivelPrioridad;
  /** Capacidad técnica del equipo que va a implantar y operar la herramienta. */
  nivelTecnicoEquipo?: NivelTecnicoEquipo;
  /** Curva de aprendizaje inicial máxima que el equipo está dispuesto a asumir. */
  toleranciaCurvaAprendizaje?: CurvaDeAprendizaje;
  /** Integraciones imprescindibles (se comparan por texto contra integraciones/integracionesPrincipales). */
  integracionesNecesarias?: string[];
  /** Idioma que necesita la herramienta, para el equipo o para los clientes. */
  idiomaNecesario?: string;
  /**
   * Respuesta explícita a la pregunta "¿plataforma todo en uno o
   * herramientas especializadas?" (primera pregunta del cuestionario,
   * salvo cuando `categoriaId` ya viene fijado por la puerta de entrada).
   * `undefined` si el usuario respondió "no tengo preferencia clara" o si
   * la pregunta no se llegó a mostrar — en ambos casos el motor decide por
   * señales indirectas (ver `todoEnUnoVsEspecializada.ts`), nunca al azar.
   */
  preferenciaSuite?: "todo_en_uno" | "especializada";
  /** Descripción libre de la situación del usuario, contrastada contra casosNoRecomendados de cada herramienta. */
  notasAdicionales?: string;
};

/** Resultado de un único criterio de puntuación para una herramienta concreta. */
export type DetalleCriterio = {
  /** Identificador estable del criterio, ej. "curvaDeAprendizaje". Pensado para agrupar/depurar, no para mostrar. */
  criterio: string;
  /** Etiqueta legible del criterio, ej. "Curva de aprendizaje". */
  etiqueta: string;
  /** Puntos que aporta este criterio al total. Puede ser negativo (penalización) o cero (criterio neutro/no aplicable). */
  puntos: number;
  /**
   * Explicación en lenguaje natural de por qué se han dado (o restado) estos
   * puntos. Cadena vacía cuando el criterio es neutro (no hay nada
   * relevante que contarle al usuario), para poder filtrarlos fácilmente.
   */
  explicacion: string;
};

/** Una herramienta ya puntuada para un perfil de usuario concreto. */
export type HerramientaEvaluada = {
  herramienta: Herramienta;
  /** Suma de los puntos de todos los criterios. No tiene un rango fijo: solo es útil para ordenar, no para mostrarse como "nota" absoluta. */
  puntuacionTotal: number;
  /** Resultado de cada criterio individual, incluidos los neutros. Pensado para depuración y para una futura API. */
  detalles: DetalleCriterio[];
  /** Motivos no neutros, ordenados por relevancia (mayor impacto en la puntuación primero). Listos para mostrarse como viñetas. */
  razones: string[];
  /** Párrafo legible que resume los 2-3 motivos más relevantes, listo para mostrarse tal cual. */
  explicacion: string;
  /** true si alguno de los casosNoRecomendados de la herramienta coincide con el perfil del usuario. */
  tieneAdvertencia: boolean;
};

export type ResultadoRecomendacion = {
  /** Las 3 mejores herramientas (o menos, si el catálogo filtrado tiene menos de 3). */
  top: HerramientaEvaluada[];
  /** El catálogo evaluado completo, ya ordenado. Pensado para depuración, paneles internos o una futura API que quiera devolver más de 3 resultados. */
  todas: HerramientaEvaluada[];
};

/** Función que puntúa una herramienta para un perfil de usuario. Añadir un criterio nuevo es añadir una función que cumpla esta firma. */
export type Criterio = (herramienta: Herramienta, respuestas: RespuestasUsuario) => DetalleCriterio;
