import type { Capacidad } from "@/data/vocabulario/esquema";

/**
 * Esquema de la verificación de F2: qué sabe hacer de verdad cada herramienta.
 *
 * Hoy Molnip no lo sabe. Lo deduce de un texto comercial de seis líneas, y por
 * eso pudo responder «Grammarly» a «soy peluquera y pierdo citas». F1 puso el
 * vocabulario —qué se puede saber hacer—; F2 pone la evidencia —quién lo hace,
 * con qué profundidad, en qué plan, y quién lo dijo y cuándo—.
 *
 * TRES IDEAS SOSTIENEN ESTE ESQUEMA, y las tres existen para evitar un error
 * concreto que ya se cometió:
 *
 *  1. NO SABER NO ES NO TENER. Que una ficha no mencione algo no significa que
 *     la herramienta no lo haga. Por eso el estado `desconocido` existe y es un
 *     resultado legítimo del trabajo, no un hueco por rellenar.
 *
 *  2. LA SELECCIÓN SE CONGELA ANTES. Las capacidades plausibles de cada
 *     herramienta se deciden y se firman ANTES de verificar. Si no, la lista se
 *     estrecha sola: al ver que algo no aparece, la tentación es decidir que
 *     nunca fue plausible. Ver `SeleccionPlausible`.
 *
 *  3. LA AFILIACIÓN NO ENTRA AQUÍ. Este módulo no importa nada de
 *     `data/esquemaInterno.ts` ni de `data/afiliados/`, y no debe hacerlo
 *     nunca. Que una herramienta pague mejor no cambia lo que sabe hacer.
 *
 * Como F1, esto son datos que todavía no lee nadie. Conectarlo al motor es F3.
 */

/**
 * Cómo cubre la herramienta la capacidad.
 *
 * La distinción no es un matiz: sin ella, una suite con un calendario básico
 * parece equivalente a un software de reservas.
 */
export type Profundidad =
  /** Es el producto, o una parte central de él. */
  | "nativa"
  /** Existe dentro de una suite más amplia, a veces como módulo aparte. */
  | "modulo"
  /** Sólo funciona conectando otra herramienta. Se declara cuál. */
  | "integracion"
  /** Hay evidencia de que NO lo hace. No es lo mismo que no saberlo. */
  | "no_disponible";

/**
 * Qué se hizo con este par herramienta–capacidad.
 *
 * `desconocido` es un resultado, no una tarea pendiente: significa que se
 * buscó y no hay evidencia suficiente. El motor debe tratarlo como «no
 * declarado», nunca como «no lo tiene».
 */
export type EstadoRegistro =
  /** Hay evidencia suficiente y la profundidad está determinada. */
  | "verificado"
  /** Se buscó y no hay evidencia bastante. Obliga a explicar qué se buscó. */
  | "desconocido"
  /** Se comprobó que la capacidad no aplica a este producto. Obliga a motivo. */
  | "descartado";

/**
 * De dónde sale la afirmación.
 *
 * El orden importa: sólo las cuatro primeras pueden sostener confianza alta.
 * Una comparativa o una reseña, por buena que parezca, nunca.
 */
export type TipoFuente =
  | "pagina_oficial"
  | "documentacion"
  | "tarifa_oficial"
  | "prueba_directa"
  | "nota_de_version"
  | "fuente_secundaria";

/** Fuentes que pueden sostener `confianza: "alta"`. Ninguna más. */
export const FUENTES_DE_PRIMERA_MANO: TipoFuente[] = [
  "pagina_oficial",
  "documentacion",
  "tarifa_oficial",
  "prueba_directa",
];

export type NivelConfianza = "alta" | "media" | "baja";

export type Fuente = {
  tipo: TipoFuente;
  /** Dirección exacta consultada. Una portada no sirve como fuente de una función concreta. */
  url: string;
  /** AAAA-MM-DD del día en que alguien la miró. */
  fechaConsulta: string;
  /** Lo que decía, en sus palabras, cuando el matiz importa. */
  cita?: string;
};

export type RegistroVerificacion = {
  herramientaId: string;
  capacidadId: string;
  estado: EstadoRegistro;
  /** Obligatoria si `estado` es `verificado`; ausente en los otros dos. */
  profundidad?: Profundidad;
  /**
   * El plan más barato donde la capacidad existe DE VERDAD, con el nombre que
   * le da el fabricante. Una función que sólo está en el plan de 300 € al mes
   * no le sirve a una peluquera, y hoy Molnip no distingue.
   * `null` cuando no hay plan porque la capacidad no está disponible.
   */
  planMinimo?: string | null;
  /** Al menos una. Sin fuente no hay registro. */
  fuentes: Fuente[];
  confianza: NivelConfianza;
  /** AAAA-MM-DD. 6 meses si depende de plan o precio; 12 en los demás casos. */
  proximaRevision: string;
  /** Obligatoria cuando `profundidad` es `integracion`: con qué se integra. */
  integraCon?: string;
  /** Límites que cambian la decisión: «sólo en escritorio», «máximo 3 usuarios». */
  nota?: string;
};

/**
 * Las capacidades que tiene sentido comprobar en una herramienta, decididas y
 * congeladas ANTES de verificar.
 *
 * Nadie pregunta si Grammarly hace escandallos: rellenar las 62 × 146 = 9.052
 * casillas sería trabajo inútil. Pero elegir sobre la marcha es peor, porque la
 * lista se estrecha justo donde la evidencia incomoda. Por eso la selección se
 * escribe, se razona y se firma antes, y el recuento de registros se compara
 * contra ella.
 */
export type SeleccionPlausible = {
  herramientaId: string;
  /** Por qué estas y no otras. */
  criterio: string;
  capacidadIds: string[];
  /** AAAA-MM-DD en que se congeló. */
  fecha: string;
  /** En qué lote de F2 entra esta herramienta. */
  lote: 1 | 2 | 3;
};

export type Lote = {
  numero: 1 | 2 | 3;
  nombre: string;
  motivo: string;
  herramientaIds: string[];
};

export type PlanDeVerificacion = {
  version: string;
  fecha: string;
  /** Versión del vocabulario contra la que se verifica. Si no coinciden, algo se ha movido. */
  versionVocabulario: string;
  lotes: Lote[];
};

/** Sólo para que el enlace con el vocabulario sea explícito en los tipos. */
export type CapacidadVerificable = Pick<Capacidad, "id" | "etiqueta">;
