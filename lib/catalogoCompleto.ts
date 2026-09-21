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

/**
 * Lo que se dice cuando ese precio no lo ha comprobado nadie.
 *
 * `textoDeComprobacion` devuelve `null` en ese caso, y `null` está bien para
 * una lista de sesenta y cinco donde la ausencia ya se nota. Pero en la
 * tarjeta de «lo que te va a costar» callarlo sería dar a entender que el
 * precio está tan comprobado como el de al lado, y no lo está.
 *
 * Son cinco fichas de sesenta y cinco, y cada una por un motivo escrito en
 * `agents/atlas-curator/investigaciones/`.
 */
export const PRECIO_SIN_COMPROBAR = "Este precio no lo hemos comprobado en su web.";

/**
 * «Growth, 36 $ al mes o 18 $ pagando un año» en vez de «Growth» a secas.
 *
 * El nombre de un plan, solo, no le dice nada a nadie: lo cazó la propietaria
 * preguntando «¿y qué quiere decir plan Growth?». Con el precio pegado da
 * igual cómo se llame.
 *
 * Los dos precios siempre que la página publique los dos, por decisión de la
 * propietaria (2026-09-21): la diferencia entre pagar mes a mes y pagar el año
 * entero es enorme —Close Solo son 19 $ o 9 $— y enseñar sólo uno es enseñar
 * un precio que no puede pagar como quiere.
 *
 * `null` cuando ese plan no está comprobado: entonces la tarjeta se queda con
 * el nombre y manda a mirar la tarifa, que es lo único honesto que puede hacer.
 */
export function textoDelPlan(
  nombre: string,
  planes: { nombre: string; mensual?: string; anual?: string }[] | undefined
): string | null {
  const plan = planes?.find((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
  if (!plan) return null;
  if (plan.mensual && plan.anual && plan.mensual !== plan.anual) {
    return `${plan.mensual}, o ${plan.anual} pagando un año entero`;
  }
  return plan.mensual ?? plan.anual ?? null;
}

/**
 * La respuesta a «¿esto, a mí, cuánto me cuesta?» — en una cifra.
 *
 * La tarjeta decía cuatro cosas de dinero a la vez —precio de entrada,
 * etiqueta de gratis, plan que necesita, comprobación— y dos se
 * contradecían: leías «Gratis, indefinido» y en la línea siguiente
 * «necesitas 29 $». La propietaria lo cortó en seco: «es demasiado confusa».
 *
 * Una pregunta, una respuesta. El detalle va debajo, para quien lo quiera.
 *
 * `cuanto` es lo que se enseña grande. `detalle` es la letra pequeña, y puede
 * faltar. Cuando no ha habido diagnóstico no sabemos qué plan le toca, así
 * que no se puede contestar de verdad: se dice desde cuánto empieza y ya.
 */
export function loQueTeCuesta(
  h: { precioInicial: string; tienePlanGratuito: boolean; tipoPlanGratuito?: "indefinido" | "prueba"; pruebaGratuitaDias?: number },
  planQueNecesita: string | undefined,
  planes: { nombre: string; mensual?: string; anual?: string }[] | undefined
): { cuanto: string; detalle?: string } {
  const plan = planQueNecesita ? planes?.find((p) => p.nombre.toLowerCase() === planQueNecesita.toLowerCase()) : undefined;

  // Sabemos qué plan le toca Y cuánto vale: la respuesta de verdad.
  if (plan) {
    const gratis = (v?: string) => v !== undefined && /^0\s*(€|\$|US\$)?$/.test(v.trim());
    if (gratis(plan.mensual) || gratis(plan.anual)) {
      return { cuanto: "Nada", detalle: `Con su plan ${plan.nombre} tienes lo que necesitas.` };
    }
    const principal = plan.anual ?? plan.mensual!;
    const otro = plan.anual && plan.mensual && plan.anual !== plan.mensual ? plan.mensual : undefined;
    return {
      cuanto: principal,
      detalle: otro ? `Es su plan ${plan.nombre}. Mes a mes son ${otro}.` : `Es su plan ${plan.nombre}.`,
    };
  }

  // Sin diagnóstico no se puede contestar: se dice desde dónde empieza.
  return { cuanto: h.precioInicial, detalle: textoDePlanGratuito(h) === "Sin plan gratuito" ? undefined : textoDePlanGratuito(h) };
}

/**
 * Lo último que lee antes de decidir: qué pasa si pulsa.
 *
 * Es la pieza que faltaba para cerrar. «Probar gratis» a secas da miedo —
 * ¿gratis cuánto?, ¿me piden la tarjeta?—. Decirlo quita el último obstáculo
 * entre «ésta es» y «ya la estoy usando».
 *
 * `null` cuando no hay nada que prometer: entonces no se inventa un consuelo.
 */
export function quePasaSiPulsas(h: {
  tienePlanGratuito: boolean;
  tipoPlanGratuito?: "indefinido" | "prueba";
  pruebaGratuitaDias?: number;
}): string | null {
  if (!h.tienePlanGratuito) return null;
  if (h.tipoPlanGratuito === "indefinido") return "Puedes usar su plan gratuito sin límite de tiempo.";
  if (h.tipoPlanGratuito === "prueba") {
    return h.pruebaGratuitaDias
      ? `Puedes probarla ${h.pruebaGratuitaDias} días antes de pagar.`
      : "Puedes probarla antes de pagar.";
  }
  return "Puedes empezar sin pagar.";
}
