import type { Categoria, Herramienta, TipoProducto } from "./esquema";

/**
 * Taxonomía del catálogo: los dos ejes que antes estaban mezclados en un
 * único campo.
 *
 *  1. QUÉ HACE una herramienta — su categoría funcional principal, más las
 *     secundarias que cubra de verdad.
 *  2. QUÉ TIPO DE PRODUCTO es — suite todo en uno o especializada.
 *
 * Mezclarlos obligaba a clasificar monday.com como "plataformas-todo-en-uno"
 * para reconocer su amplitud, y al hacerlo desaparecía de "Gestión de
 * proyectos", que es lo que la gente busca cuando la busca. Este módulo es
 * el único sitio donde se responde a cualquiera de las dos preguntas: si
 * mañana cambia la regla, cambia aquí y en ningún otro lado.
 */

/** Categoría histórica que servía a la vez de función y de tipo de producto. Se mantiene como categoría real, pero ya no es la forma de saber si algo es una suite. */
export const CATEGORIA_TODO_EN_UNO = "plataformas-todo-en-uno";

/**
 * Marco mínimo de categorías que Molnip debe cubrir para ser un comparador
 * honesto de software para pymes. No es la lista de lo que hay — es la
 * lista de lo que debería haber, y por eso `cobertura.ts` puede detectar
 * una categoría AUSENTE (que no existe en `categorias.json`), algo que
 * mirando solo el catálogo sería imposible.
 */
export const MARCO_CATEGORIAS_MINIMO: { id: string; nombre: string }[] = [
  { id: "plataformas-todo-en-uno", nombre: "Plataformas todo en uno" },
  { id: "crm", nombre: "CRM y ventas" },
  { id: "gestion-proyectos", nombre: "Gestión de proyectos" },
  { id: "asistentes-ia", nombre: "IA y productividad" },
  { id: "facturacion-contabilidad", nombre: "Facturación y contabilidad" },
  { id: "reservas-citas", nombre: "Reservas y citas" },
  { id: "atencion-cliente", nombre: "Atención al cliente" },
  { id: "comercio-electronico", nombre: "Comercio electrónico" },
  { id: "automatizacion-integraciones", nombre: "Automatización e integraciones" },
  { id: "marketing-email", nombre: "Marketing y email" },
  { id: "recursos-humanos", nombre: "Recursos humanos" },
  { id: "inventario-operaciones", nombre: "Inventario y operaciones" },
  { id: "creacion-web-hosting", nombre: "Creación web y hosting" },
  { id: "firma-gestion-documental", nombre: "Firma electrónica y gestión documental" },
  { id: "software-sectorial", nombre: "Software sectorial" },
];

/**
 * Mínimo de módulos reales para que llamarse "suite" signifique algo. Por
 * debajo de esto una herramienta con dos funciones no es una plataforma
 * todo en uno: es una especializada con un extra. El umbral es bajo a
 * propósito — no se trata de exigir amplitud, sino de impedir que alguien
 * reclame el tipo "suite" sin nada detrás.
 */
export const MINIMO_MODULOS_PARA_SUITE = 3;

/**
 * ¿Es esta herramienta una suite todo en uno?
 *
 * Prioriza el campo explícito. Cuando falta (fichas anteriores a
 * `tipoProducto`), cae a la categoría histórica para no cambiar el
 * comportamiento de nada que ya funcionaba. `coherencia.ts` avisa de las
 * fichas que todavía dependen de esa deducción.
 */
export function esSuite(herramienta: Pick<Herramienta, "categoriaId" | "tipoProducto">): boolean {
  if (herramienta.tipoProducto) return herramienta.tipoProducto === "suite";
  return herramienta.categoriaId === CATEGORIA_TODO_EN_UNO;
}

export function tipoProductoDe(herramienta: Pick<Herramienta, "categoriaId" | "tipoProducto">): TipoProducto {
  return esSuite(herramienta) ? "suite" : "especializada";
}

/**
 * Todas las categorías funcionales que cubre una herramienta: la principal
 * más las secundarias, sin repetidos y conservando el orden (la principal
 * siempre primero).
 */
export function categoriasDe(herramienta: Pick<Herramienta, "categoriaId" | "categoriasSecundarias">): string[] {
  const todas = [herramienta.categoriaId, ...(herramienta.categoriasSecundarias ?? [])];
  return [...new Set(todas.filter((id) => id.length > 0))];
}

/** ¿Cubre esta herramienta esa categoría, sea como principal o como secundaria? */
export function cubreCategoria(
  herramienta: Pick<Herramienta, "categoriaId" | "categoriasSecundarias">,
  categoriaId: string
): boolean {
  return categoriasDe(herramienta).includes(categoriaId);
}

/** Una categoría sin `estado` declarado es pública — así eran las cuatro históricas. */
export function esCategoriaPublica(categoria: Categoria): boolean {
  return (categoria.estado ?? "publica") === "publica";
}

/**
 * ─────────────────────────────────────────────────────────────────────
 * Eje fino: subtipos dentro de una categoría
 * ─────────────────────────────────────────────────────────────────────
 *
 * Una categoría agrupa herramientas por FUNCIÓN. Normalmente eso basta:
 * quince CRM son quince alternativas reales entre sí, y compararlos tiene
 * sentido.
 *
 * "Asistentes de IA y productividad" no funciona así. Ahí conviven un
 * corrector de textos, un generador de vídeo con avatares, un transcriptor
 * de reuniones y un planificador de agenda. No son alternativas: nadie duda
 * entre Grammarly y Synthesia. Compararlos no es difícil, es que no
 * significa nada — y el 2026-08-27 se midió lo que costaba: Grammarly ganaba
 * el 100% de los 120 perfiles de esa categoría, de modo que quien buscaba
 * generar vídeo recibía un corrector ortográfico.
 *
 * Los subtipos son el eje que faltaba. No cambian la navegación ni añaden
 * páginas: solo le dicen al motor qué se puede comparar con qué.
 */
export const SUBTIPOS_POR_CATEGORIA: Record<string, { id: string; nombre: string }[]> = {
  "asistentes-ia": [
    { id: "escritura", nombre: "Escritura y contenido" },
    { id: "video", nombre: "Vídeo y audio" },
    { id: "reuniones-transcripcion", nombre: "Reuniones y transcripción" },
    { id: "agenda-planificacion", nombre: "Agenda y planificación" },
    { id: "presentaciones", nombre: "Presentaciones y documentos" },
    { id: "espacio-trabajo", nombre: "Espacio de trabajo" },
  ],
};

/** Mínimo de alternativas reales para que un subtipo permita una comparación con sentido. */
export const MINIMO_POR_SUBTIPO = 3;

/** ¿Esta categoría distingue subtipos? La mayoría no lo necesita. */
export function categoriaTieneSubtipos(categoriaId: string): boolean {
  return (SUBTIPOS_POR_CATEGORIA[categoriaId]?.length ?? 0) > 0;
}

/** Todos los subtipos que cubre una herramienta: el principal primero. */
export function subtiposDe(
  herramienta: Pick<Herramienta, "subtipoId" | "subtiposSecundarios">
): string[] {
  const todos = [herramienta.subtipoId, ...(herramienta.subtiposSecundarios ?? [])];
  return todos.filter((id): id is string => Boolean(id));
}

/** ¿Compite esta herramienta dentro de ese subtipo, como principal o como secundario? */
export function cubreSubtipo(
  herramienta: Pick<Herramienta, "subtipoId" | "subtiposSecundarios">,
  subtipoId: string
): boolean {
  return subtiposDe(herramienta).includes(subtipoId);
}

/**
 * ¿Son dos herramientas comparables entre sí?
 *
 * Lo son si comparten alguna categoría Y —cuando esa categoría distingue
 * subtipos— algún subtipo. Dos herramientas de categorías distintas no se
 * comparan nunca: el motor ya las evalúa por rutas separadas.
 *
 * Una herramienta SIN subtipo declarado dentro de una categoría que sí los
 * distingue se considera comparable con todas las de esa categoría: es un
 * dato que falta, y negarle la comparación la dejaría invisible. Curator
 * avisa de esas fichas para que se completen.
 */
export function sonComparables(
  a: Pick<Herramienta, "categoriaId" | "categoriasSecundarias" | "subtipoId" | "subtiposSecundarios">,
  b: Pick<Herramienta, "categoriaId" | "categoriasSecundarias" | "subtipoId" | "subtiposSecundarios">
): boolean {
  const categoriasCompartidas = categoriasDe(a).filter((id) => categoriasDe(b).includes(id));
  if (categoriasCompartidas.length === 0) return false;

  const conSubtipos = categoriasCompartidas.filter((id) => categoriaTieneSubtipos(id));
  if (conSubtipos.length === 0) return true;
  if (conSubtipos.length < categoriasCompartidas.length) return true;

  const subA = subtiposDe(a);
  const subB = subtiposDe(b);
  if (subA.length === 0 || subB.length === 0) return true;
  return subA.some((id) => subB.includes(id));
}
