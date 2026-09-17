/**
 * El filtrado de la página «Todas las herramientas», aparte de la interfaz.
 *
 * Vive aquí y no dentro del componente por una razón concreta: es la única
 * parte con lógica de verdad —qué se ve y qué no— y desde dentro de un
 * componente de cliente no se puede probar sin montar un navegador. Aquí sí.
 *
 * No sabe nada del motor de recomendación ni de la evidencia, y no debe
 * saberlo: esta página enseña el catálogo, no recomienda.
 */

/** Una herramienta aplanada para la lista. Sólo datos, ningún tipo del motor. */
export type FilaDeCatalogo = {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  categoriaNombre: string;
  esTodoEnUno: boolean;
  precioInicial: string;
  tienePlanGratuito: boolean;
  disponibleEnEspanol: boolean;
  puntuacionAtlas: number | null;
  /** Ya redactado por `textoDeComprobacion`, o `null` si nadie ha mirado ese precio. */
  comprobado: string | null;
};

export type TipoDeHerramienta = "todas" | "todo_en_uno" | "especializada";

export type CriteriosDeCatalogo = {
  busqueda: string;
  tipo: TipoDeHerramienta;
  categoriaId: string;
  soloEspanol: boolean;
  soloGratis: boolean;
};

export const CRITERIOS_VACIOS: CriteriosDeCatalogo = {
  busqueda: "",
  tipo: "todas",
  categoriaId: "",
  soloEspanol: false,
  soloGratis: false,
};

/** Sin acentos ni mayúsculas, para que «diseno» encuentre «diseño». */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Si hay algo puesto. Sirve para decidir si se enseña «quitar los filtros». */
export function hayFiltro(criterios: CriteriosDeCatalogo): boolean {
  return (
    criterios.busqueda.trim() !== "" ||
    criterios.tipo !== "todas" ||
    criterios.categoriaId !== "" ||
    criterios.soloEspanol ||
    criterios.soloGratis
  );
}

/**
 * Los filtros se suman: cada uno quita, ninguno añade. Y ninguno reordena —
 * el orden lo decide quien construye la lista, y es el mismo de siempre.
 *
 * La búsqueda mira el nombre, la descripción y la categoría, porque quien
 * busca «facturas» no sabe si eso es el nombre de un producto o una categoría,
 * y no tiene por qué saberlo.
 */
export function filtrarCatalogo(filas: FilaDeCatalogo[], criterios: CriteriosDeCatalogo): FilaDeCatalogo[] {
  const texto = normalizar(criterios.busqueda.trim());
  return filas.filter((fila) => {
    if (texto && !normalizar(`${fila.nombre} ${fila.descripcion} ${fila.categoriaNombre}`).includes(texto)) return false;
    if (criterios.tipo === "todo_en_uno" && !fila.esTodoEnUno) return false;
    if (criterios.tipo === "especializada" && fila.esTodoEnUno) return false;
    if (criterios.categoriaId && fila.categoriaId !== criterios.categoriaId) return false;
    if (criterios.soloEspanol && !fila.disponibleEnEspanol) return false;
    if (criterios.soloGratis && !fila.tienePlanGratuito) return false;
    return true;
  });
}

/**
 * Cómo se dice el plan gratuito, en una sola función para que la tarjeta, la
 * ficha y el catálogo no digan tres cosas distintas de lo mismo.
 *
 * Decisión de la propietaria (2026-09-17): **una prueba de una semana también
 * es un plan gratuito.** Lo que no vale es callar cuál de las dos cosas es,
 * porque «gratis para siempre con 250 contactos» y «gratis 14 días» le sirven
 * a personas distintas.
 *
 * Cuando no se ha comprobado contra la página oficial, se dice «Con plan
 * gratuito» a secas, como siempre. Inventarse cuál es sería peor que no
 * decirlo.
 */
export function textoDePlanGratuito(h: {
  tienePlanGratuito: boolean;
  tipoPlanGratuito?: "indefinido" | "prueba";
  pruebaGratuitaDias?: number;
}): string {
  if (!h.tienePlanGratuito) return "Sin plan gratuito";
  if (h.tipoPlanGratuito === "indefinido") return "Gratis, indefinido";
  if (h.tipoPlanGratuito === "prueba") {
    return h.pruebaGratuitaDias ? `Gratis ${h.pruebaGratuitaDias} días` : "Prueba gratuita";
  }
  return "Con plan gratuito";
}

/**
 * «Comprobado el 17 de septiembre de 2026» o, cuando no se ha comprobado
 * nunca, nada.
 *
 * Que una página esté viva es que tenga fecha y que la fecha se mueva. Y que
 * no la tenga también dice algo: dice que ese precio lo escribimos nosotros y
 * nadie fue a mirarlo.
 */
export function textoDeComprobacion(h: { preciosComprobados?: { fecha: string; url: string } }): string | null {
  if (!h.preciosComprobados) return null;
  const fecha = new Date(`${h.preciosComprobados.fecha}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime())) return null;
  const legible = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fecha);
  return `Precio comprobado en su web el ${legible}`;
}
