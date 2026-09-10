import type { CurvaDeAprendizaje, Herramienta, TipoProducto } from "@/data/esquema";
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
  /**
   * Subtipo dentro de la categoría, cuando el usuario lo haya concretado
   * ("quiero transcribir reuniones", no "quiero algo de IA"). Hoy ninguna
   * pregunta del cuestionario lo recoge todavía: mientras siga vacío, el
   * motor no compara entre subtipos y ofrece lo mejor de cada uno.
   */
  subtipoId?: string;
  /**
   * Respuesta a la pregunta adaptativa de diferenciación del subtipo, cuando
   * ese ámbito la tiene (ver `preguntasDiferenciacion.ts`). Filtra por una
   * capacidad declarada en las fichas; no da ni quita puntos a nadie.
   */
  necesidadDelSubtipo?: string;
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
  /** Por qué ruta se ha evaluado. Dos herramientas de rutas distintas NO comparten criterios: ver `criteriosRuta.ts`. */
  tipoProducto: TipoProducto;
  /** Puntos de los criterios COMUNES a las dos rutas. Directamente comparable entre cualquier par de herramientas. */
  puntuacionComun: number;
  /** Resultado de los criterios propios de su ruta, llevado a −1..+1 y CENTRADO EN CERO dentro del rango teórico de ESA ruta (ver `normalizarRuta` en `motor.ts`). Es lo que permite comparar una suite con una especializada sin sumar peras y manzanas, y sin que ninguna de las dos arranque por delante. */
  puntuacionRutaNormalizada: number;
};

/**
 * Cómo el motor pregunta por la evidencia de F2 — F3, bloque 5.
 *
 * Es una FORMA, no un módulo: el motor no importa nada de `data/verificacion`
 * y sigue sin saber que ese directorio existe. Quien llama le pasa un objeto
 * con estos dos métodos —hoy lo construye la ruta de API— y las pruebas le
 * pasan uno de mentira. Sin él, el motor se comporta exactamente como antes
 * de F3.
 *
 * `filaDe` devuelve `undefined` en los ámbitos sin fila congelada: CRM y las
 * plataformas todo en uno siguen pendientes de decisión, y un ámbito sin fila
 * no filtra nada. Es a propósito — una regla inventada sería peor que ninguna.
 */
export type PuertaDeEvidencia = {
  filaDe(
    categoriaId: string,
    subtipoId?: string
  ): { ambito: string; necesidad: string; exigeAlgunaDe: string[] } | undefined;
  /**
   * `true` SÓLO si F2 lo verificó Y su profundidad no es `no_disponible`. Son
   * tres estados, y este booleano los reparte en dos: uno pasa y los otros no.
   *
   * Un `false` puede significar tres cosas distintas —no consta porque no
   * quedó claro, no consta porque nunca se preguntó, o hay evidencia de que NO
   * lo hace— y desde aquí no se distinguen a propósito: al motor sólo le toca
   * saber quién compite. Quien necesite la diferencia pregunta al puerto.
   *
   * Ninguno de los tres autoriza a decir que la herramienta no lo tiene.
   */
  loDemuestra(herramientaId: string, capacidadId: string): boolean;
};

/**
 * Por qué el motor NO recomienda nada.
 *
 * Existe porque antes no existía: cuando no se entendía la necesidad,
 * `seleccionarCandidatas` devolvía el catálogo entero «para no dejar al
 * usuario sin recomendación». El 2026-09-02 se midió lo que costaba: a
 * «soy peluquera y estoy perdiendo citas» le respondía Grammarly con un
 * círculo que ponía 100. El motor no había entendido nada; simplemente
 * puntuó las 62 herramientas y ganó la que mejor encaja en tamaño, precio,
 * facilidad e idioma —ninguno de los cuales pregunta si sirve para algo.
 *
 * Preferir una respuesta mala a ninguna respuesta es la decisión
 * equivocada: una recomendación falsa destruye la confianza que el resto
 * del producto tarda meses en construir. Así que ahora el motor puede
 * decir que no, y decir por qué.
 */
export type MotivoSinRecomendacion =
  /** No se pudo determinar qué necesita la persona. No es un fallo suyo: es que no lo hemos entendido. */
  | { tipo: "necesidad_no_entendida" }
  /** Sí se entendió el objetivo, pero el catálogo no tiene ninguna herramienta que lo cubra. */
  | { tipo: "sin_cobertura"; objetivoIds: string[] };

/**
 * Por qué no se pudo comprobar lo que la persona pidió.
 *
 * Las dos causas se enseñan igual —la persona no tiene por qué saber de dónde
 * viene— pero se guardan distintas a propósito: después hace falta saber si lo
 * que faltó fue evidencia de una capacidad o cobertura del catálogo, y son dos
 * problemas con dos arreglos distintos. Fundirlas en un motivo único ahorraría
 * diez líneas y perdería justo el dato que sirve.
 */
export type CausaSinConfirmar = "capacidad_sin_evidencia" | "opcion_sin_candidatas";

export type NecesidadSinConfirmar = {
  /** «<categoriaId>» o «<categoriaId>/<subtipoId>». */
  ambito: string;
  /** La necesidad en palabras de una persona. Es lo que se enseña. */
  necesidad: string;
} & (
  | {
      /** Ninguna candidata ha DEMOSTRADO la capacidad que su ruta exige. Falta evidencia, no producto. */
      causa: "capacidad_sin_evidencia";
      exigeAlgunaDe: string[];
    }
  | {
      /** Ninguna ficha del ámbito encaja con la opción que eligió. Falta catálogo para esa necesidad. */
      causa: "opcion_sin_candidatas";
      opcionId: string;
    }
);

export type ResultadoRecomendacion = {
  /** Las 3 mejores herramientas (o menos, si el catálogo filtrado tiene menos de 3). Vacío cuando hay `sinRecomendacion`. */
  top: HerramientaEvaluada[];
  /** El catálogo evaluado completo, ya ordenado. Pensado para depuración, paneles internos o una futura API que quiera devolver más de 3 resultados. */
  todas: HerramientaEvaluada[];
  /**
   * Solo cuando el usuario NO eligió ruta: la mejor de cada tipo y qué gana
   * y qué sacrifica con cada enfoque. Es la comparación honesta que
   * sustituye a la penalización de 8 puntos que antes recibía cualquier
   * especializada por no ser una suite.
   */
  comparativaDeRutas?: ComparativaDeRutas;
  /**
   * Presente solo cuando el motor decide NO recomendar. Cuando aparece,
   * `top` y `todas` vienen vacíos: no hay un resultado peor, hay ausencia
   * deliberada de resultado. Quien llama debe contarlo, nunca rellenarlo.
   */
  sinRecomendacion?: MotivoSinRecomendacion;
  /**
   * Algo que la persona pidió no se pudo comprobar, así que el filtro NO se
   * aplicó y las candidatas que se devuelven no responden a esa necesidad.
   *
   * Quien lo reciba está obligado a contarlo: enseñar estas herramientas como
   * si respondieran a lo que preguntó es exactamente lo que la propietaria
   * prohibió. Nunca autoriza a decir que no la tienen — sólo que no lo hemos
   * podido confirmar.
   *
   * Pueden coincidir las dos causas, y entonces vienen las dos. La primera es
   * la que manda para el mensaje —sin evidencia de lo que la ruta entera
   * exige, la opción concreta es lo de menos— pero la segunda NO se tira:
   * saber que además faltaba catálogo para esa opción es un dato distinto, con
   * un arreglo distinto, y se pierde para siempre si no se guarda aquí.
   *
   * Hoy no ocurre en ninguna ruta, y hay pruebas que lo comprueban.
   */
  necesidadesSinConfirmar?: NecesidadSinConfirmar[];
};

export type ComparativaDeRutas = {
  mejorSuite?: HerramientaEvaluada;
  mejorEspecializada?: HerramientaEvaluada;
  /** Frase que explica el beneficio y el sacrificio de centralizar, lista para mostrarse. */
  beneficioDeCentralizar: string;
  /** Lo mismo para la ruta contraria. */
  beneficioDeEspecializar: string;
};

/** Función que puntúa una herramienta para un perfil de usuario. Añadir un criterio nuevo es añadir una función que cumpla esta firma. */
export type Criterio = (herramienta: Herramienta, respuestas: RespuestasUsuario) => DetalleCriterio;
