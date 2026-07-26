import type { RangoEmpleados } from "@/lib/cuestionario";

/**
 * Esquema de la base de conocimiento de Atlas.
 *
 * Esto define la FORMA de los datos, no los datos en sí. El contenido real
 * vive en archivos `.json` sueltos dentro de `data/herramientas/`, uno por
 * herramienta — nunca como objetos escritos directamente en código TypeScript.
 *
 * Por qué así: con cientos o miles de herramientas, un único archivo de
 * código se vuelve inmanejable (conflictos de fusión, difícil de validar,
 * imposible de editar sin tocar lógica). Con archivos JSON sueltos:
 *  - añadir una herramienta nueva es crear un archivo, no tocar código;
 *  - cada archivo se puede validar de forma independiente;
 *  - el día de mañana, migrar a una base de datos real (Postgres, Supabase,
 *    un CMS headless...) solo implica reescribir `data/repositorio.ts` — el
 *    resto de la aplicación sigue llamando a las mismas funciones
 *    (`getHerramientas`, `getHerramienta`, `getHerramientasPorCategoria`)
 *    sin enterarse del cambio.
 *
 * Deliberadamente NO incluye ningún dato de afiliación (programa, comisión,
 * plataforma de gestión...): eso vive en `data/esquemaInterno.ts` /
 * `data/afiliados/`, de uso exclusivo de los agentes internos de Atlas, y
 * nunca debe mezclarse con esta ficha pública.
 */

/** Escala 1-10 usada en todas las puntuaciones editoriales. */
export type Puntuacion1a10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ModeloDePrecio =
  | "freemium"
  | "suscripcion_mensual"
  | "suscripcion_anual"
  | "pago_unico"
  | "por_usuario"
  | "a_medida";

export type EstadoHerramienta = "activo" | "descontinuado" | "en_revision";

/**
 * Añadido: curva de aprendizaje inicial, en una escala categórica pensada
 * para mostrarse directamente en UI (una etiqueta, no un número). Es un eje
 * distinto de `puntuaciones.facilidadDeUso` (qué tal se usa en el día a día
 * una vez aprendida) y de `puntuaciones.nivelTecnicoRequerido` (cuánto
 * conocimiento técnico exige implantarla). Una herramienta puede ser fácil
 * de usar día a día y aun así tener una curva de aprendizaje dura al
 * principio (por la cantidad de opciones que hay que configurar primero).
 */
export type CurvaDeAprendizaje = "muy_facil" | "facil" | "media" | "dificil";

export type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
};

/**
 * Nivel de confianza en un dato investigado. Lo reutiliza Atlas Researcher
 * (`agents/atlas-researcher`) para la confianza global de una propuesta —
 * definido aquí porque el esquema de datos es la capa base de la que
 * depende el agente, y no al revés.
 */
export type NivelConfianza = "baja" | "media" | "alta";

export type Puntuaciones = {
  facilidadDeUso: Puntuacion1a10;
  calidad: Puntuacion1a10;
  fiabilidad: Puntuacion1a10;
  atencionAlCliente: Puntuacion1a10;
  escalabilidad: Puntuacion1a10;
  /**
   * Campo añadido sobre lo solicitado: distingue "fácil de usar" (interfaz)
   * de "requiere conocimientos técnicos para sacarle partido" (implantación).
   * Dos herramientas pueden tener una interfaz sencilla y aun así necesitar
   * mucho conocimiento técnico para configurarse bien (p. ej. Odoo). Sin
   * este campo el motor no podría distinguir ambos casos.
   * 1 = apto sin conocimientos técnicos · 10 = requiere equipo técnico dedicado.
   */
  nivelTecnicoRequerido: Puntuacion1a10;
  /**
   * Añadido: qué tan fácil es poner en marcha la herramienta (configuración
   * inicial, migración de datos, puesta a punto), no cómo de fácil es
   * usarla ya en marcha (eso es `facilidadDeUso`) ni cuánto conocimiento
   * técnico exige (eso es `nivelTecnicoRequerido`). Opcional porque las 5
   * fichas ya existentes no lo tienen investigado todavía — no había que
   * romper esos datos para añadir esta pregunta a las futuras.
   */
  facilidadImplementacion?: Puntuacion1a10;
};

/** Reseña de una plataforma externa de reseñas que no sea G2 ni Capterra (TrustRadius, Product Hunt, App Store, etc.). */
export type ReputacionExterna = {
  fuente: string;
  puntuacion?: number;
  numeroResenas?: number;
  enlace?: string;
};

/**
 * Añadido: reputación en plataformas externas de reseñas. Ninguno de estos
 * campos es obligatorio a nivel de esquema — muchas herramientas
 * (sobre todo las más nuevas o muy verticales) sencillamente no tienen
 * página en G2 o en Capterra, y eso no es un fallo de investigación, es un
 * hecho real que hay que poder representar sin forzar un dato inventado.
 */
export type Reputacion = {
  /** Escala habitual de G2: 1-5. */
  g2Puntuacion?: number;
  g2NumeroResenas?: number;
  /** Escala habitual de Capterra: 1-5. */
  capterraPuntuacion?: number;
  capterraNumeroResenas?: number;
  otrasFuentes?: ReputacionExterna[];
};

/** Añadido: datos de la empresa que hay detrás de la herramienta (no de la herramienta en sí). `paginaOficial` ya vive en `Herramienta`, no se duplica aquí. */
export type InformacionEmpresa = {
  anioFundacion?: number;
  paisOrigen?: string;
  /** Texto libre a propósito: los tramos de tamaño de una empresa fabricante (ej. "501-1000 empleados") no tienen por qué coincidir con `RangoEmpleados`, que describe el tamaño ideal del CLIENTE, no del proveedor. */
  tamanoAproximado?: string;
};

/** A qué nivel de conocimiento técnico le conviene esta herramienta a quien la use — distinto de `puntuaciones.nivelTecnicoRequerido` (una puntuación 1-10 de exigencia) y de `curvaDeAprendizaje`: aquí se trata de una recomendación de perfil de usuario, en 3 escalones simples. */
export type NivelTecnicoRecomendado = "principiante" | "intermedio" | "avanzado";

/**
 * Añadido: el análisis propio de Atlas sobre la herramienta, pensado para
 * alimentar el futuro comparador inteligente.
 *
 * `puntuacion` y `motivosPuntuacion` los calcula Atlas automáticamente
 * (ver `lib/puntuacionAtlas.ts`) a partir del resto de datos investigados
 * — nunca los inventa el proveedor de IA. El resto de campos
 * (`competidoresDirectos`, `tipoNegocioIdeal`, `nivelTecnicoRecomendado`)
 * sí son investigación, igual que cualquier otro campo del esquema.
 */
export type AnalisisAtlas = {
  /** 0-100. Calculado, no investigado — ver el comentario del tipo. */
  puntuacion?: number;
  /** Motivos legibles de por qué se ha llegado a esa puntuación, generados junto con ella. */
  motivosPuntuacion?: string[];
  competidoresDirectos?: string[];
  /** Categoría breve de negocio al que más le conviene, ej. "Agencias de marketing". Complementa a `idealPara` (una frase) con una etiqueta corta pensada para filtrar/agrupar en el comparador. */
  tipoNegocioIdeal?: string;
  nivelTecnicoRecomendado?: NivelTecnicoRecomendado;
};

export type Herramienta = {
  /** Slug único y estable, ej. "hubspot". Nunca cambia aunque cambie el nombre mostrado. */
  id: string;
  nombre: string;
  paginaOficial: string;
  /** Añadido: la página de precios casi nunca coincide con la home; el motor la necesitará para enlazar directo. */
  urlPrecios?: string;
  /** Añadido: para cuando exista comparador visual; vacío por ahora, no bloquea nada. */
  logoUrl?: string;

  /** Referencia a Categoria.id. Un único valor por ahora — la primera categoría es "plataformas-todo-en-uno". */
  categoriaId: string;

  descripcion: string;
  problemasQueResuelve: string[];
  /** Añadido: ejemplos concretos de uso real, más fáciles de reconocer para el usuario que "problemas" en abstracto. */
  casosDeUso: string[];

  /** Texto libre, para mostrar tal cual al usuario. */
  idealPara: string;
  /**
   * Añadido: la misma idea que `idealPara` pero en formato estructurado
   * (mismos valores que la pregunta "¿Cuántos empleados tiene?" del
   * cuestionario). Sin esto, el motor no puede filtrar ni puntuar por
   * tamaño de empresa de forma fiable — tendría que interpretar texto libre.
   */
  segmentosIdeales: RangoEmpleados[];
  /** Añadido: sectores/industrias en formato de etiquetas, para cruzar con el sector que el usuario escribe en el cuestionario. */
  industriasIdeales: string[];

  noRecomendadaPara: string;
  /**
   * Añadido: la misma idea que `noRecomendadaPara` pero en formato de lista.
   * El motor puede necesitar recorrer casos concretos de descarte uno a uno
   * (por ejemplo, para mostrarlos como viñetas) en vez de interpretar una
   * frase libre.
   */
  casosNoRecomendados: string[];

  funcionesPrincipales: string[];
  integraciones: string[];
  /**
   * Añadido: subconjunto curado (3-4) de `integraciones`, con las que de
   * verdad definen a la herramienta. Pensado para tarjetas o vistas
   * resumidas donde listar todas las integraciones sería demasiado ruido.
   */
  integracionesPrincipales: string[];
  /**
   * Añadido: curva de aprendizaje inicial. Ver el comentario en el tipo
   * `CurvaDeAprendizaje` para la diferencia con las puntuaciones numéricas.
   */
  curvaDeAprendizaje: CurvaDeAprendizaje;

  /** Texto libre para mostrar, ej. "Desde 15€/usuario/mes". */
  precioInicial: string;
  /** Añadido: versión estructurada del precio, para poder filtrar/ordenar (ej. "solo freemium") sin parsear texto. */
  modeloDePrecio: ModeloDePrecio[];
  /** Añadido: bandera rápida — es la primera pregunta que se hace un usuario con presupuesto ajustado. */
  tienePlanGratuito: boolean;
  /** Añadido: no siempre el precio de entrada (`precioInicial`) es el plan que de verdad le conviene a una pyme — a veces hace falta un plan intermedio para desbloquear lo esencial. Texto libre, ej. "Plan Professional a 45€/usuario/mes". */
  precioRecomendadoPymes?: string;

  idiomasDisponibles: string[];
  /** Añadido: derivado de `idiomasDisponibles`, pero como booleano explícito — ese array a veces es texto ambiguo (ej. "más de 40 idiomas"), y comprobar "¿hay español?" a mano no es fiable. */
  disponibleEnEspanol?: boolean;
  /** Añadido: si existe una app móvil oficial (iOS/Android), no solo una web adaptada a móvil. */
  tieneAppMovil?: boolean;
  /** Añadido: si ofrece una API pública documentada para desarrolladores. */
  tieneApiPublica?: boolean;

  puntuaciones: Puntuaciones;
  /**
   * Añadido: de dónde salen las puntuaciones de arriba. Atlas promete
   * "recomendaciones objetivas" en su propia web — sin declarar la
   * metodología, esas puntuaciones serían números inventados sin respaldo.
   */
  metodologiaValoracion: string;

  ventajas: string[];
  inconvenientes: string[];

  /** Añadido: reputación en plataformas externas de reseñas (G2, Capterra...). Opcional: no todas las herramientas tienen presencia en estas plataformas. */
  reputacion?: Reputacion;
  /** Añadido: datos de la empresa fabricante (fundación, país, tamaño). */
  informacionEmpresa?: InformacionEmpresa;
  /** Añadido: el análisis propio de Atlas — ver el comentario del tipo `AnalisisAtlas`. */
  analisisAtlas?: AnalisisAtlas;

  /** Añadido: con cientos/miles de herramientas, algunas se descontinuarán o cambiarán de nombre. Sin este campo no hay forma de retirarlas sin borrar el histórico. */
  estado: EstadoHerramienta;
  /** ISO 8601 (YYYY-MM-DD). Añadido: fecha en que se documentó por primera vez, distinta de la última revisión. */
  fechaAltaEnAtlas: string;
  /** ISO 8601 (YYYY-MM-DD). Pedido explícitamente por el usuario. */
  fechaUltimaRevision: string;
};
