/**
 * Esquema del vocabulario de necesidades y capacidades de Molnip.
 *
 * Define la FORMA del vocabulario, no su contenido: éste vive en
 * `vocabulario.json`, igual que las fichas viven en `data/herramientas/`.
 *
 * QUÉ ES ESTO. Molnip tenía dos conceptos para describir el mundo —categoría
 * y problema— y ninguno decía qué sabe hacer un programa. Por eso el
 * 2026-09-02 respondió «Grammarly» a «soy peluquera y pierdo citas»: había
 * puntuado las 62 herramientas por tamaño, precio, facilidad e idioma, y
 * ninguno de esos criterios pregunta si la herramienta sirve para algo.
 *
 * Una CAPACIDAD es lo que un programa sabe hacer. Es estable: «reservar cita
 * por internet» significará lo mismo dentro de diez años, aunque cambien las
 * herramientas que lo hagan. No es una necesidad («pierdo citas»), ni un
 * proceso («cómo doy hora»), ni una restricción («en español»).
 *
 * ESTE MÓDULO NO LO LEE NADIE TODAVÍA. Es la fase F1: el vocabulario existe
 * como dato y se comprueba solo. El motor, las fichas y la interfaz siguen
 * exactamente como estaban. Hay una prueba que lo verifica —
 * `aislamiento.test.ts`— y fallará el día que alguien lo importe desde fuera
 * sin querer.
 */

/** Área: el nivel más alto. Cinco, para poder recorrer 23 dominios con la vista. */
export type Area = {
  id: string;
  nombre: string;
};

/**
 * Dominio: dónde está archivada hoy una capacidad.
 *
 * Es deliberadamente mutable. Una capacidad puede cambiar de dominio sin que
 * su identificador cambie ni una letra — ya pasó con `cap.training_lms`, que
 * nació pensando en formación de plantilla y hoy vive en «Formación y
 * alumnado».
 */
export type Dominio = {
  id: string;
  nombre: string;
  areaId: string;
};

/**
 * Estado de un identificador. Nunca se borra ninguno: sólo cambian de estado.
 *
 * La diferencia importante está entre `fusionada` y `escindida`:
 *  - fusionada  → hay un único sucesor, así que el alias resuelve solo y
 *                 ninguna ficha necesita tocarse;
 *  - escindida  → hay varios sucesores y NO se resuelve sola. Repartir por
 *                 nuestra cuenta sería hacer que una herramienta declare algo
 *                 que nadie comprobó. Silencio no es permiso, también aquí.
 */
export type EstadoCapacidad =
  | "activa"
  | "fusionada"
  | "escindida"
  | "obsoleta"
  | "reclasificada";

export type Capacidad = {
  /**
   * Identificador PERMANENTE. `cap.` + nombre semántico en inglés.
   *
   * No lleva el dominio dentro a propósito: un prefijo de dominio es una
   * jerarquía metida en un nombre permanente, y antes o después miente. La
   * ubicación vive en `dominioId`, que sí puede cambiar.
   *
   * No se renombra nunca, no se reutiliza nunca, no se borra nunca.
   */
  id: string;
  /** Etiqueta visible en español. SÍ puede cambiar: no es el identificador. */
  etiqueta: string;
  /** Qué sabe hacer un programa que tenga esta capacidad. Una frase. */
  definicion: string;
  /**
   * La frontera: con qué se confunde y por qué no es eso.
   *
   * Es el campo que evita que el vocabulario se degrade. Sin él, cada
   * capacidad nueva se solapa un poco con dos existentes y en un año nadie
   * sabe cuál usar.
   */
  noEs: string;
  /** Dónde está archivada HOY. Puede cambiar sin tocar `id`. */
  dominioId: string;
  estado: EstadoCapacidad;
  /**
   * Capacidades sin las cuales ésta no puede existir. Un widget de reserva
   * sin motor de reservas detrás no reserva nada.
   *
   * Declarar una capacidad sin declarar la que requiere es una contradicción
   * del dato, y `coherencia.test.ts` la detecta.
   */
  requiere?: string[];
  /** Restricciones que suelen acompañar a esta capacidad. Orientativas: quien manda es la persona. */
  restriccionesTipicas?: string[];
  /** A dónde fue, cuando el estado no es `activa`. */
  sustituidaPor?: string[];
  /** Nombre que tuvo en los borradores previos a la emisión. Trazabilidad, no migración. */
  origenBorrador?: string;
};

/**
 * Dura o blanda, y la diferencia importa mucho.
 *
 *  - DURA: excluye. Una herramienta que no la cumple no se recomienda, por
 *    buena que sea. Un fontanero en un sótano sin cobertura no puede usar
 *    algo que necesite conexión, y no hay puntuación que lo arregle.
 *  - BLANDA: puntúa. Importa, pero no descalifica.
 *
 * Hoy el motor sólo sabe sumar y restar puntos. Las restricciones duras
 * necesitan una fase de descarte previo que todavía no existe: va en F3.
 */
export type TipoRestriccion = "dura" | "blanda";

export type Restriccion = {
  /** Identificador permanente. `req.` + nombre semántico. Mismas reglas que las capacidades. */
  id: string;
  etiqueta: string;
  definicion: string;
  tipo: TipoRestriccion;
  /** Quién la impone de verdad. Sirve para no deducirla del sector cuando no toca. */
  quienLaImpone: string;
  /**
   * Palabras que NO pueden aparecer en la definición de ninguna capacidad.
   *
   * Existe por un fallo real: `cap.field_job_capture` llegó a definirse como
   * «fotos, firma y sin cobertura», con lo que el mismo criterio contaba dos
   * veces —como capacidad y como restricción—. `coherencia.test.ts` lo impide
   * ahora de forma automática.
   */
  terminosReservados: string[];
};

export type Vocabulario = {
  /** Semántica: añadir es menor; fusionar, escindir, reclasificar o dar de baja es mayor. */
  version: string;
  fecha: string;
  areas: Area[];
  dominios: Dominio[];
  capacidades: Capacidad[];
  restricciones: Restriccion[];
  /**
   * Pares de identificadores que se parecen lo bastante como para disparar la
   * regla de casi-colisión, con la diferencia escrita a mano.
   *
   * No es documentación decorativa: `identificadores.test.ts` exige que todo
   * par con dos o más palabras en común esté aquí explicado.
   */
  justificacionesDeParecido: { par: [string, string]; diferencia: string }[];
};
