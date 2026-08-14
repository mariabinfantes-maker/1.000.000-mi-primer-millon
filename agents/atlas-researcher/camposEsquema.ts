import type { Herramienta } from "@/data/esquema";

/**
 * Puente entre `data/esquema.ts` (el esquema PÚBLICO) y el prompt de
 * investigación. Los campos de afiliación tienen su propio espejo de este
 * archivo — `camposAfiliados.ts`, sobre `data/esquemaInterno.ts` — a
 * propósito: nunca deben mezclarse en el mismo `Record` ni en la misma
 * lista de campos investigables.
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
  "problemasIds",
]);

/**
 * Campos opcionales del esquema: pueden faltar en una propuesta sin que
 * cuenten como "campo faltante" en la comprobación genérica de primer
 * nivel. `reputacion` está aquí porque muchas herramientas sencillamente
 * no tienen página en G2 ni en Capterra — eso es un hecho, no un fallo de
 * investigación. `analisisAtlas` está aquí porque `validarPropuesta`
 * siempre acaba rellenando su `puntuacion` (calculada, no investigada), así
 * que nunca aparecería "vacío" de todas formas: su completitud real
 * (¿investigó competidores, tipo de negocio ideal...?) la comprueba una
 * función dedicada.
 */
const CAMPOS_OPCIONALES = new Set<keyof Herramienta>(["urlPrecios", "logoUrl", "reputacion", "analisisAtlas"]);

export const DESCRIPCION_CAMPOS: Record<keyof Herramienta, string> = {
  id: "Identificador interno (lo asigna Atlas, no lo investigues).",
  nombre: "Nombre comercial de la herramienta.",
  paginaOficial: "URL de la web oficial.",
  urlPrecios: "URL de la página de precios, si es distinta de la web oficial.",
  logoUrl: "URL del logo (lo añade Atlas, no lo investigues).",
  categoriaId: "Categoría a la que pertenece dentro de Atlas.",
  descripcion: "Descripción objetiva de qué es y qué hace, en 2-3 frases.",
  informacionEmpresa:
    "Objeto con: anioFundacion (número, año de fundación de la empresa fabricante); " +
    "paisOrigen (país donde se fundó o tiene su sede principal); " +
    'tamanoAproximado (tamaño de la EMPRESA que fabrica la herramienta, en texto libre, ej. "501-1000 empleados" — no confundir con el tamaño de empresa al que le conviene usarla). ' +
    "Omite los subcampos que no encuentres.",
  problemasQueResuelve: "Lista de problemas de negocio concretos que resuelve.",
  problemasIds:
    "Referencias a los 'problemas iniciales' de Atlas (ver data/problemas.json) — las asigna quien revisa la propuesta, no lo investigues.",
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
  precioRecomendadoPymes:
    'Plan concreto recomendado para una pyme típica (no siempre es el plan más barato), en texto libre, ej. "Plan Professional a 45€/usuario/mes".',
  idiomasDisponibles: "Lista de idiomas en los que está disponible la interfaz.",
  disponibleEnEspanol: "true/false: si la interfaz está disponible en español.",
  tieneAppMovil: "true/false: si existe una app móvil oficial (iOS/Android), no solo una web adaptada a móvil.",
  tieneApiPublica: "true/false: si ofrece una API pública documentada para desarrolladores.",
  puntuaciones:
    "Objeto con facilidadDeUso, calidad, fiabilidad, atencionAlCliente, escalabilidad, nivelTecnicoRequerido y " +
    "facilidadImplementacion (facilidad de poner en marcha la herramienta — configuración inicial, migración de datos — " +
    "no de usarla ya en marcha), cada uno de 1 a 10.",
  metodologiaValoracion: "Breve nota sobre en qué se basan las puntuaciones anteriores.",
  reputacion:
    "Objeto con: g2Puntuacion (número, escala 1-5, si tiene página en G2); g2NumeroResenas; " +
    "capterraPuntuacion (número, escala 1-5, si tiene página en Capterra); capterraNumeroResenas; " +
    "otrasFuentes (array de objetos { fuente, puntuacion, numeroResenas, enlace } para otras plataformas de reseñas " +
    "relevantes si existen, ej. TrustRadius, Product Hunt, App Store). Omite los subcampos que no encuentres: " +
    "no todas las herramientas tienen presencia en estas plataformas, y eso está bien.",
  ventajas: "Lista de puntos fuertes.",
  inconvenientes: "Lista de puntos débiles.",
  analisisAtlas:
    "Objeto con: competidoresDirectos (array con 2-4 nombres de competidores directos); " +
    'tipoNegocioIdeal (categoría breve de negocio al que más le conviene, ej. "Agencias de marketing", "Ecommerce B2C", "Startups SaaS B2B"); ' +
    'nivelTecnicoRecomendado ("principiante", "intermedio" o "avanzado": el nivel técnico de quien debería usar esta herramienta). ' +
    'NO incluyas "puntuacion" ni "motivosPuntuacion": Atlas los calcula automáticamente a partir del resto de la investigación, no los inventes tú.',
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
