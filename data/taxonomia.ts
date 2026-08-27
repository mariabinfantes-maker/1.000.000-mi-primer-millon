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
