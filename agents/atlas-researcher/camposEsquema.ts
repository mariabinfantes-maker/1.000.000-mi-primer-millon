import type { Herramienta } from "@/data/esquema";

/**
 * Puente entre `data/esquema.ts` y el prompt de investigación.
 *
 * Usar `Record<keyof Herramienta, string>` en `DESCRIPCION_CAMPOS` obliga a
 * que este archivo se actualice si `Herramienta` gana o pierde un campo —
 * si no, TypeScript deja de compilar aquí. Es la forma de mantener el
 * agente en sincronía con el esquema sin depender de acordarse de hacerlo.
 */

/** Campos que gestiona Atlas al dar de alta una ficha (identificador interno, ciclo de vida, fechas de auditoría). Atlas Researcher nunca los investiga: los asigna quien revisa y aprueba la propuesta. */
const CAMPOS_GESTIONADOS_POR_ATLAS = new Set<keyof Herramienta>([
  "id",
  "estado",
  "fechaAltaEnAtlas",
  "fechaUltimaRevision",
]);

/** Campos opcionales del esquema: pueden faltar en una propuesta sin que cuenten como "campo faltante". */
const CAMPOS_OPCIONALES = new Set<keyof Herramienta>(["urlPrecios", "logoUrl"]);

export const DESCRIPCION_CAMPOS: Record<keyof Herramienta, string> = {
  id: "Identificador interno (lo asigna Atlas, no lo investigues).",
  nombre: "Nombre comercial de la herramienta.",
  paginaOficial: "URL de la web oficial.",
  urlPrecios: "URL de la página de precios, si es distinta de la web oficial.",
  logoUrl: "URL del logo (lo añade Atlas, no lo investigues).",
  categoriaId: "Categoría a la que pertenece dentro de Atlas.",
  descripcion: "Descripción objetiva de qué es y qué hace, en 2-3 frases.",
  problemasQueResuelve: "Lista de problemas de negocio concretos que resuelve.",
  casosDeUso: "Lista de ejemplos concretos de uso real.",
  idealPara: "A quién le conviene esta herramienta, en una frase.",
  segmentosIdeales: 'Tamaños de empresa ideales: array con valores entre "1-10", "11-50", "51-200", "200+".',
  industriasIdeales: "Sectores o industrias donde mejor encaja.",
  noRecomendadaPara: "A quién NO le conviene, en una frase.",
  casosNoRecomendados: "Lista de casos concretos en los que no es la mejor opción.",
  funcionesPrincipales: "Lista de las funciones más importantes.",
  integraciones: "Lista de integraciones con otras herramientas.",
  integracionesPrincipales: "Subconjunto de 3-4 integraciones más destacadas de la lista anterior.",
  curvaDeAprendizaje: 'Una de: "muy_facil", "facil", "media", "dificil".',
  precioInicial: 'Precio de entrada en texto libre, ej. "Desde 15€/usuario/mes".',
  modeloDePrecio:
    'Array con valores entre "freemium", "suscripcion_mensual", "suscripcion_anual", "pago_unico", "por_usuario", "a_medida".',
  tienePlanGratuito: "true/false: si existe un plan gratuito real, no solo una prueba de tiempo limitado.",
  idiomasDisponibles: "Lista de idiomas en los que está disponible la interfaz.",
  puntuaciones:
    "Objeto con facilidadDeUso, calidad, fiabilidad, atencionAlCliente, escalabilidad y nivelTecnicoRequerido, cada uno de 1 a 10.",
  metodologiaValoracion: "Breve nota sobre en qué se basan las puntuaciones anteriores.",
  ventajas: "Lista de puntos fuertes.",
  inconvenientes: "Lista de puntos débiles.",
  programaAfiliados:
    "Objeto con: disponible (true/false); descripcion; enlace (URL oficial del programa de afiliados); " +
    "enlaceVerificado (poner siempre false: Atlas Researcher no visita enlaces todavía); " +
    'plataformaGestion (dónde se gestiona: "PartnerStack", "Impact", "CJ Affiliate", "Programa propio", etc.); ' +
    'tipoInscripcion ("abierta" si cualquiera puede apuntarse, "requiere_aprobacion" si la empresa aprueba cada solicitud); ' +
    'tipoComision ("porcentaje", "pago_fijo" o "comision_recurrente"); ' +
    "confianza (\"baja\", \"media\" o \"alta\": qué tan fiable es TODO este bloque, no solo el enlace); " +
    "fuente (URL o referencia concreta de donde sacaste estos datos de afiliados en particular, distinta de `enlace`). " +
    "Si no encuentras programa de afiliados, pon disponible: false y omite el resto de subcampos.",
  estado: "Ciclo de vida interno de Atlas (lo asigna Atlas, no lo investigues).",
  fechaAltaEnAtlas: "Fecha de alta en Atlas (la asigna Atlas, no la investigues).",
  fechaUltimaRevision: "Fecha de la última revisión (la asigna Atlas, no la investigues).",
};

/** Campos que sí tiene sentido pedirle al proveedor de IA (todos menos los que gestiona Atlas). */
export const CAMPOS_INVESTIGABLES = (Object.keys(DESCRIPCION_CAMPOS) as (keyof Herramienta)[]).filter(
  (campo) => !CAMPOS_GESTIONADOS_POR_ATLAS.has(campo)
);

/** De los investigables, los que cuentan como "campo faltante" en una propuesta incompleta. */
export const CAMPOS_INVESTIGABLES_OBLIGATORIOS = CAMPOS_INVESTIGABLES.filter(
  (campo) => !CAMPOS_OPCIONALES.has(campo)
);
