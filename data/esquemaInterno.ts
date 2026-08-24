/**
 * Esquema INTERNO de Atlas — datos de afiliación.
 *
 * Deliberadamente separado de `data/esquema.ts` (el esquema PÚBLICO de
 * `Herramienta`): `Herramienta` no tiene ningún campo de afiliación, y
 * nada de lo que hay aquí debe mezclarse con la ficha pública de una
 * herramienta ni mostrarse al usuario final, salvo que en el futuro se
 * indique expresamente lo contrario. Es de uso exclusivo de los agentes
 * internos de Atlas — hoy, Atlas Researcher.
 *
 * También vive en un directorio de datos distinto (`data/afiliados/`,
 * gestionado por `data/repositorioAfiliados.ts`, no por
 * `data/repositorio.ts`): así ningún import del catálogo público, del
 * motor de recomendaciones o de la interfaz puede arrastrar información de
 * afiliación por accidente. La separación es estructural, no solo una
 * cuestión de no mostrarlo en pantalla.
 */

/** Estado del programa de afiliados desde el punto de vista de Atlas. */
export type AffiliateStatus = "active" | "not_available";

export type AffiliateData = {
  /** Referencia a Herramienta.id — así se puede cruzar con la ficha pública sin mezclar ambos objetos. */
  herramientaId: string;

  hasAffiliateProgram: boolean;
  affiliateProgramName?: string;
  affiliatePlatform?: string;
  affiliateUrl?: string;
  commission?: string;
  cookieDuration?: string;
  approvalRequired?: boolean;
  payoutMethod?: string;
  payoutFrequency?: string;
  countriesAvailable?: string[];
  affiliateStatus: AffiliateStatus;
  /** ISO 8601 (YYYY-MM-DD). Lo estampa Atlas automáticamente cada vez que se comprueba — no lo investiga el proveedor de IA. */
  lastAffiliateCheck: string;

  /** Qué tan fiable es esta información en su conjunto (no solo si se visitó affiliateUrl). */
  confidenceLevel?: "low" | "medium" | "high";
  /** URL o referencia concreta de donde se sacaron estos datos. */
  source?: string;
};

/**
 * Estrategia de afiliación de Atlas — deliberadamente separada de
 * `AffiliateData` de arriba, aunque comparten varios campos en apariencia.
 *
 * `AffiliateData` es el resultado de INVESTIGAR (qué programa existe,
 * según lo que se encuentra públicamente) y se reescribe cada vez que se
 * re-investiga una herramienta. `EstrategiaAfiliacion` es la relación real
 * y propia de Atlas con ese programa (¿hemos solicitado entrar? ¿nos han
 * aprobado?) — la gestiona un humano con el tiempo, nunca la IA, y no debe
 * poder perderse por una futura re-investigación. Por eso vive en su
 * propio directorio (`data/estrategia-afiliados/`, ver
 * `repositorioEstrategiaAfiliacion.ts`), nunca dentro de `data/afiliados/`
 * ni de `data/borradores/`.
 *
 * Es también un workflow independiente del de `agents/atlas-researcher/decision.ts`:
 * aquella decisión ("aprobado"/"rechazado") es el veredicto editorial sobre
 * si la ficha es lo bastante buena para el catálogo; el `estado` de aquí es
 * si el programa de afiliados de un tercero acepta a Atlas como afiliado.
 * Una herramienta puede estar editorialmente aprobada con la afiliación
 * todavía "pendiente".
 */
export type EstadoAfiliacion = "no_solicitado" | "pendiente" | "aprobado" | "rechazado" | "activo";

/**
 * Un enlace de afiliado propio de Atlas para una cuenta, válido para un
 * segmento de audiencia concreto (país o idioma) — es el dato que de
 * verdad se usaría algún día en el botón "Ir al proveedor" en vez de la
 * URL oficial genérica. Sin al menos un enlace, llegar a "activo" no
 * sirve de mucho: es lo que convierte el seguimiento en ingresos reales.
 */
export type EnlaceAfiliado = {
  /** "global" por defecto, o un código de país/idioma (ej. "ES", "LatAm", "en-US"). Nunca vacío. */
  segmento: string;
  url: string;
};

/**
 * Una cuenta de afiliado de Atlas en una plataforma concreta. Una misma
 * herramienta puede tener varias — por ejemplo, si Atlas se registra por
 * separado en distintas regiones o bajo distintas marcas — así que `id`
 * identifica la cuenta de forma estable, independiente de `plataforma`
 * (que puede repetirse entre cuentas).
 */
export type CuentaAfiliado = {
  /** Slug estable dentro de esta herramienta, ej. "partnerstack-es". No cambia aunque cambien plataforma o enlaces. */
  id: string;
  plataforma: string;
  nombrePrograma?: string;
  /** Usuario o email con el que Atlas se registró en el programa — para no perder esa referencia con el tiempo. */
  usuarioRegistro?: string;
  estado: EstadoAfiliacion;
  /** URL oficial donde se solicita entrar al programa. */
  urlSolicitud?: string;
  /** ISO 8601 (YYYY-MM-DD). */
  fechaSolicitud?: string;
  /** ISO 8601 (YYYY-MM-DD). */
  fechaAprobacion?: string;
  comision?: string;
  duracionCookie?: string;
  metodoPago?: string;
  frecuenciaPago?: string;
  /** Uno o más enlaces propios, uno por segmento de país/idioma. Vacío mientras no haya ninguno todavío. */
  enlaces: EnlaceAfiliado[];
  /** ISO 8601 (YYYY-MM-DD). Lo estampa Atlas automáticamente cada vez que se actualiza esta cuenta. */
  ultimaRevision: string;
  observaciones?: string;
  /**
   * Añadido: la herramienta se promovió con la información del programa
   * de afiliados en confianza "media" (ver `agents/atlas-researcher/criteriosCalidad.ts`)
   * — el resto de la investigación (reputación, puntuación, confianza
   * general) era lo bastante sólido para no bloquear el catálogo por esto,
   * pero Atlas Affiliate Manager debe verificar la comisión/plataforma
   * reales antes de solicitar el programa o considerar la cuenta lista
   * para monetizar. Nunca lo pone una persona a mano: solo lo siembra
   * `promoverBorrador()`, y solo una persona lo quita una vez verificado.
   */
  verificacionPendiente?: boolean;
};

/**
 * Estrategia de afiliación de Atlas para una herramienta — deliberadamente
 * separada de `AffiliateData` de arriba, aunque comparten varios campos en
 * apariencia.
 *
 * `AffiliateData` es el resultado de INVESTIGAR (qué programa existe,
 * según lo que se encuentra públicamente) y se reescribe cada vez que se
 * re-investiga una herramienta. `EstrategiaAfiliacion` es la relación real
 * y propia de Atlas con esos programas (¿hemos solicitado entrar? ¿nos han
 * aprobado?) — la gestiona un humano con el tiempo, nunca la IA, y no debe
 * poder perderse por una futura re-investigación. Por eso vive en su
 * propio directorio (`data/estrategia-afiliados/`, ver
 * `repositorioEstrategiaAfiliacion.ts`), nunca dentro de `data/afiliados/`
 * ni de `data/borradores/`.
 *
 * Es también un workflow independiente del de `agents/atlas-researcher/decision.ts`:
 * aquella decisión ("aprobado"/"rechazado") es el veredicto editorial sobre
 * si la ficha es lo bastante buena para el catálogo; el `estado` de cada
 * cuenta de aquí es si el programa de afiliados de un tercero acepta a
 * Atlas como afiliado. Una herramienta puede estar editorialmente aprobada
 * con toda su afiliación todavía "pendiente".
 *
 * `cuentas` es un array, no un único registro plano, para poder crecer sin
 * rediseño: varias cuentas por plataforma, varios enlaces por país/idioma
 * dentro de cada cuenta, y añadir o rotar un enlace sin tocar el resto del
 * sistema (ver `agents/atlas-researcher/estrategiaAfiliacion.ts`).
 */
export type EstrategiaAfiliacion = {
  /** Referencia a Herramienta.id, igual que en AffiliateData. */
  herramientaId: string;
  cuentas: CuentaAfiliado[];
};
