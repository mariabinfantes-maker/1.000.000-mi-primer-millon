import type { Categoria, Herramienta } from "@/data/esquema";
import { CATEGORIA_TODO_EN_UNO, MINIMO_MODULOS_PARA_SUITE, categoriasDe, esSuite } from "@/data/taxonomia";

/**
 * Coherencia de clasificación — Capa 2 de Atlas Curator: determinista, sin
 * IA, sin coste. Solo detecta y explica; nunca reclasifica nada.
 *
 * Existe por un incentivo concreto que la taxonomía nueva abre: como una
 * herramienta con más categorías aparece en más sitios, declararse "suite"
 * o añadirse categorías secundarias es una forma barata de ganar
 * visibilidad. Este módulo es el contrapeso — comprueba que lo declarado
 * se corresponda con lo que la ficha demuestra tener.
 *
 * Ninguna de estas señales es un error de esquema: todas pasan
 * `validarHerramienta()`. Son contradicciones internas que solo se ven
 * comparando campos entre sí, y que una persona debe resolver.
 */

export type AvisoCoherencia = {
  herramientaId: string;
  motivo: string;
};

/** A partir de tantos módulos, llamarse "especializada" contradice lo que la propia ficha declara cubrir. */
export const MODULOS_QUE_YA_NO_SON_ESPECIALIZADA = 4;

export function detectarIncoherenciasDeClasificacion(
  herramienta: Herramienta,
  categorias: Categoria[]
): AvisoCoherencia[] {
  const avisos: AvisoCoherencia[] = [];
  const aviso = (motivo: string) => avisos.push({ herramientaId: herramienta.id, motivo });

  const modulos = herramienta.modulosIncluidos ?? [];
  const idsCategorias = new Set(categorias.map((c) => c.id));

  // — Reclamar amplitud que no se tiene —
  if (herramienta.tipoProducto === "suite" && modulos.length < MINIMO_MODULOS_PARA_SUITE) {
    aviso(
      `Se declara suite con solo ${modulos.length} módulo(s) en "modulosIncluidos". ` +
        `Una plataforma todo en uno necesita al menos ${MINIMO_MODULOS_PARA_SUITE} módulos reales, ` +
        "o deja de ser una plataforma y pasa a ser una especializada con un extra."
    );
  }

  // — Lo contrario: amplitud real declarada como especializada —
  if (herramienta.tipoProducto === "especializada" && modulos.length >= MODULOS_QUE_YA_NO_SON_ESPECIALIZADA) {
    aviso(
      `Se declara especializada pero enumera ${modulos.length} módulos (${modulos.join(", ")}). ` +
        "O la lista de módulos exagera lo que cubre de verdad, o el tipo de producto está mal: " +
        "revísalo contra sus funciones principales."
    );
  }

  // — La categoría histórica ya no debe usarse como forma de decir "suite" —
  if (herramienta.categoriaId === CATEGORIA_TODO_EN_UNO && herramienta.tipoProducto === "especializada") {
    aviso(
      `Está archivada en "${CATEGORIA_TODO_EN_UNO}" pero se declara especializada. ` +
        "Su categoría principal debería ser la función que de verdad resuelve."
    );
  }

  if (herramienta.tipoProducto === undefined) {
    aviso(
      `No declara "tipoProducto": hoy se deduce de la categoría (${esSuite(herramienta) ? "suite" : "especializada"}), ` +
        "que es exactamente la confusión que la taxonomía nueva separa."
    );
  }

  // — Categorías secundarias —
  const secundarias = herramienta.categoriasSecundarias ?? [];
  for (const id of secundarias) {
    if (!idsCategorias.has(id)) {
      aviso(`Declara la categoría secundaria "${id}", que no existe en el catálogo de categorías.`);
    }
  }
  if (secundarias.includes(herramienta.categoriaId)) {
    aviso("Repite su categoría principal dentro de las secundarias.");
  }
  if (new Set(secundarias).size !== secundarias.length) {
    aviso("Tiene categorías secundarias repetidas.");
  }

  // — Amplitud declarada sin ser suite —
  if (secundarias.length > 0 && !esSuite(herramienta)) {
    aviso(
      `Es una herramienta especializada y aun así declara ${secundarias.length} categoría(s) secundaria(s). ` +
        "Una especializada compite a fondo en una función: aparecer en varias necesita justificarse con sus funciones reales."
    );
  }

  // — Más categorías que módulos —
  if (categoriasDe(herramienta).length > Math.max(modulos.length, 1)) {
    aviso(
      `Cubre ${categoriasDe(herramienta).length} categoría(s) pero solo declara ${modulos.length} módulo(s): ` +
        "está apareciendo en más sitios de los que su propia ficha respalda."
    );
  }

  return avisos;
}

export function detectarIncoherenciasEnCatalogo(
  herramientas: Herramienta[],
  categorias: Categoria[]
): AvisoCoherencia[] {
  return herramientas
    .filter((h) => h.estado === "activo")
    .flatMap((h) => detectarIncoherenciasDeClasificacion(h, categorias));
}
