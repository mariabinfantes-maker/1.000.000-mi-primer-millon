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

export type ProgramaAfiliados = {
  disponible: boolean;
  descripcion?: string;
  enlace?: string;
  /**
   * Si el enlace se ha comprobado visitándolo (true) o es la mejor
   * referencia disponible sin verificación en vivo (false). Nunca mostrar
   * como definitivo en una campaña de afiliación sin volver a comprobarlo.
   */
  enlaceVerificado: boolean;
};

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

  idiomasDisponibles: string[];

  puntuaciones: Puntuaciones;
  /**
   * Añadido: de dónde salen las puntuaciones de arriba. Atlas promete
   * "recomendaciones objetivas" en su propia web — sin declarar la
   * metodología, esas puntuaciones serían números inventados sin respaldo.
   */
  metodologiaValoracion: string;

  ventajas: string[];
  inconvenientes: string[];

  programaAfiliados: ProgramaAfiliados;

  /** Añadido: con cientos/miles de herramientas, algunas se descontinuarán o cambiarán de nombre. Sin este campo no hay forma de retirarlas sin borrar el histórico. */
  estado: EstadoHerramienta;
  /** ISO 8601 (YYYY-MM-DD). Añadido: fecha en que se documentó por primera vez, distinta de la última revisión. */
  fechaAltaEnAtlas: string;
  /** ISO 8601 (YYYY-MM-DD). Pedido explícitamente por el usuario. */
  fechaUltimaRevision: string;
};
