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

/** Una mención autorizada de un término reservado dentro de `noEs`. */
export type MencionDeclarada = {
  /** El término tal y como aparece en el texto. */
  termino: string;
  /** A quién se le atribuye: la restricción donde vive, o la capacidad que sí lo tiene. Debe aparecer en el propio `noEs`. */
  remiteA: string;
};

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
  /**
   * Permiso explícito para nombrar un término que pertenece a una restricción.
   *
   * Trazar una frontera exige a veces nombrar lo que hay al otro lado: «no es
   * una historia clínica, que guarda datos de salud». Pero decidir si una
   * mención es una frontera legítima o una apropiación NO se puede deducir de
   * cómo esté redactada la frase — se intentó, y dos construcciones con la
   * negación desplazada seguían colándose:
   *
   *   «No es cap.point_of_sale y funciona offline»   ← se lo estaba quedando
   *
   * Así que el permiso deja de deducirse y pasa a declararse. Cada mención
   * dice qué término usa y a quién se lo atribuye, y eso lo revisa una persona
   * una vez, en el diff. Ninguna redacción puede concederse permiso a sí misma.
   */
  mencionesDeclaradas?: MencionDeclarada[];
  /** A dónde fue, cuando el estado no es `activa`. */
  sustituidaPor?: string[];
  /** Nombre que tuvo en los borradores previos a la emisión. Trazabilidad, no migración. */
  origenBorrador?: string;
};

/**
 * Cómo actúa una restricción. Son TRES valores, no dos, y el tercero existe
 * para impedir un error concreto.
 *
 *  - DURA: excluye siempre que la necesidad la traiga. Una herramienta que no
 *    la cumple no se recomienda, por buena que sea. Un fontanero en un sótano
 *    sin cobertura no puede usar algo que necesite conexión, y no hay
 *    puntuación que lo arregle.
 *  - DURA_CONDICIONAL: excluye igual de fuerte, pero SÓLO cuando se dispara la
 *    condición escrita en `condicionDeActivacion`. Mientras no se dispare, no
 *    filtra nada en absoluto.
 *  - BLANDA: puntúa. Importa, pero no descalifica.
 *
 * Por qué el tercer valor y no un booleano al lado: un booleano se puede
 * ignorar. Un valor nuevo del tipo no, porque TypeScript obliga a tratarlo al
 * hacer el `switch`. Y esto ya se equivocó una vez en el diseño —presentar
 * «clínica» como causa automática de datos en la UE— y habría descartado
 * herramientas perfectamente válidas para una consulta dental. Con `dura` a
 * secas, un consumidor futuro repetiría el error leyendo sólo este campo.
 *
 * Hoy el motor sólo sabe sumar y restar puntos. El descarte previo llega en F3.
 */
export type TipoRestriccion = "dura" | "dura_condicional" | "blanda";

type RestriccionBase = {
  /** Identificador permanente. `req.` + nombre semántico. Mismas reglas que las capacidades. */
  id: string;
  etiqueta: string;
  definicion: string;
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

/**
 * La unión es discriminada a propósito: `condicionDeActivacion` es OBLIGATORIO
 * cuando el tipo es `dura_condicional` y no se admite en los otros dos. Así el
 * esquema impide construir una restricción condicional sin decir cuándo se
 * activa, y impide tratar una condicional como si fuera universal.
 */
export type Restriccion = RestriccionBase &
  (
    | { tipo: "dura" | "blanda"; condicionDeActivacion?: never }
    | {
        tipo: "dura_condicional";
        /** Qué tiene que ser cierto para que llegue a filtrar. Sin esto, no se activa nunca. */
        condicionDeActivacion: string;
      }
  );

/** Un cambio de identificador ya emitido. Sólo estos cuatro tipos existen. */
export type TipoMigracion = "fusion" | "escision" | "reclasificacion" | "baja";

export type Migracion = {
  /** Identificador de origen. Tiene que estar entre los ya emitidos. */
  de: string;
  /** A dónde va. Vacío sólo en una baja sin sucesora. */
  a: string[];
  tipo: TipoMigracion;
  /** ISO 8601, AAAA-MM-DD. */
  fecha: string;
  motivo: string;
};

export type RegistroDeMigraciones = {
  /** Tiene que coincidir con la versión del vocabulario. */
  version: string;
  nota: string;
  migraciones: Migracion[];
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
