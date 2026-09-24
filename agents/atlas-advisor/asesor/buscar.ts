import { getTodasLasHerramientas } from "@/data/repositorio";
import { categoriasDe } from "@/data/taxonomia";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";
import type { NecesidadDelCaso } from "@/data/vocabulario/necesidades";

/**
 * El paso 3 del asesor: BUSCAR ATRAVESANDO LAS CASAS.
 *
 * La regla que manda, dicha por la propietaria el 2026-09-24:
 *
 *   «Las casas organizan lo que Molnip conoce; no deben limitar dónde busca
 *    una solución.»
 *
 * Por eso aquí NO se filtra por casa, nunca. La casa sólo aparece al final,
 * para poder contar dónde se miró. Quien entra diciendo «pierdo citas y
 * facturo a mano» tiene que poder acabar en una herramienta de facturación
 * que además reserva, o en dos que se reparten el trabajo, sin que la puerta
 * por la que entró le cierre ninguna de las dos.
 *
 * Y la segunda, del mismo sitio: «facturar es una necesidad compartida». Hay
 * UNA necesidad de facturar —`nec.emitir-una-factura-legal`— y se reutiliza
 * en todos los casos. Lo que cambia entre la peluquera y el reformista no es
 * la necesidad: es con qué otra necesidad tiene que convivir.
 */

/** Una necesidad se cubre cuando TODOS sus imprescindibles están demostrados. */
function cubre(puerto: PuertoDeEvidencia, herramientaId: string, n: NecesidadDelCaso): boolean {
  return (
    n.necesidad.imprescindibles.length > 0 &&
    n.necesidad.imprescindibles.every(
      (c) => puerto.estadoDe(herramientaId, c).estado === "demostrada"
    )
  );
}

export type Cobertura = {
  herramientaId: string;
  /** Ids de necesidad que esta herramienta cubre, de las que ella trajo. */
  cubre: string[];
  /** Las casas de esta herramienta. Para contar dónde se buscó, no para filtrar. */
  casas: string[];
};

export type Solucion = {
  /**
   * `una_sola` cuando una herramienta cubre todos los imprescindibles.
   * `varias` cuando hacen falta dos o más que se reparten el trabajo.
   */
  forma: "una_sola" | "varias";
  partes: Cobertura[];
  /** Imprescindibles que esta solución cubre y cuántos trajo ella. */
  cubreImprescindibles: number;
  deImprescindibles: number;
  /** Deseables que además cubre. Desempata; nunca relega. */
  cubreDeseables: number;
  /**
   * SÓLO en `varias`. Que dos herramientas cubran una necesidad cada una NO
   * demuestra que hablen entre sí: eso son los recorridos de F2, y hoy no hay
   * ninguno verificado (`recorridos.json` está vacío). Quien enseñe esto
   * tiene que decirlo con estas palabras y no con otras.
   */
  laConexionNoEstaComprobada?: true;
};

export type Busqueda = {
  /**
   * Ordenadas por cuántos imprescindibles cubren, y a igualdad, por menos
   * piezas: una herramienta que hace dos cosas va antes que dos que hacen una
   * cada una. NO hay número fijo de resultados: «tres recomendaciones es la
   * consecuencia de que haya tres buenas, nunca un objetivo que rellenar».
   */
  soluciones: Solucion[];
  /**
   * Necesidades que ella trajo y que NADIE del catálogo demuestra cubrir.
   * Vacío no significa que nadie lo haga: significa que nadie lo ha
   * demostrado. Decirlo es un resultado válido, no un fallo.
   */
  nadieDemuestra: string[];
  /** Cuántas herramientas se miraron y en cuántas casas estaban. Para poder contarlo. */
  seMiraron: number;
  casasRecorridas: string[];
};

/**
 * El máximo de piezas de una solución combinada.
 *
 * Dos es lo que una persona sola puede sostener; tres ya es un proyecto. No
 * es un límite de cálculo, es un límite de lo que se puede recomendar sin
 * complicarle la vida a quien pregunta.
 */
const MAXIMO_DE_PIEZAS = 3;

export function buscar(
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia = getPuertoDeEvidencia()
): Busqueda {
  const catalogo = getTodasLasHerramientas().filter((h) => h.estado === "activo");
  const imprescindibles = delCaso.filter((n) => n.importancia === "imprescindible");
  const deseables = delCaso.filter((n) => n.importancia === "deseable");

  // El universo es el catálogo ENTERO. Aquí no entra la casa.
  const coberturas: Cobertura[] = catalogo
    .map((h) => ({
      herramientaId: h.id,
      cubre: delCaso.filter((n) => cubre(puerto, h.id, n)).map((n) => n.necesidad.id),
      casas: categoriasDe(h),
    }))
    .filter((c) => c.cubre.length > 0);

  const pedidos = new Set(imprescindibles.map((n) => n.necesidad.id));
  const nadieDemuestra = delCaso
    .filter((n) => !coberturas.some((c) => c.cubre.includes(n.necesidad.id)))
    .map((n) => n.necesidad.id);

  const cuenta = (ids: Set<string>) => ({
    cubreImprescindibles: imprescindibles.filter((n) => ids.has(n.necesidad.id)).length,
    deImprescindibles: imprescindibles.length,
    cubreDeseables: deseables.filter((n) => ids.has(n.necesidad.id)).length,
  });

  const soluciones: Solucion[] = [];

  // Primero, la que lo hace todo sola. Es siempre preferible a repartirlo.
  for (const c of coberturas) {
    const suyas = new Set(c.cubre);
    const n = cuenta(suyas);
    if (n.cubreImprescindibles === 0) continue;
    soluciones.push({ forma: "una_sola", partes: [c], ...n });
  }

  /**
   * Después, las combinaciones.
   *
   * Se calculan aunque ya haya una herramienta que lo haga todo, porque
   * repartir el trabajo es una ELECCIÓN legítima, no un plan B: dos
   * especialistas suelen ser más finas en lo suyo, a cambio de dos programas,
   * dos cuotas y de que no sabemos si se entienden entre ellas. Eso lo decide
   * quien pregunta, no nosotros. *(Idea de la propietaria, 2026-09-24.)*
   *
   * Lo que NO entra es una combinación que resuelve menos que la mejor sola:
   * eso no es otra manera de resolverlo, es resolverlo a medias.
   */
  const mejorSola = Math.max(0, ...soluciones.map((s) => s.cubreImprescindibles));
  if (pedidos.size > 1) {
    for (const combo of combinaciones(coberturas, MAXIMO_DE_PIEZAS)) {
      const suyas = new Set(combo.flatMap((c) => c.cubre));
      const n = cuenta(suyas);
      if (n.cubreImprescindibles < mejorSola) continue;
      // Ninguna pieza puede sobrar: si quitándola se cubre lo mismo, sobra.
      const sobra = combo.some((pieza) => {
        const resto = new Set(combo.filter((o) => o !== pieza).flatMap((c) => c.cubre));
        return cuenta(resto).cubreImprescindibles === n.cubreImprescindibles;
      });
      if (sobra) continue;
      soluciones.push({ forma: "varias", partes: combo, ...n, laConexionNoEstaComprobada: true });
    }
  }

  soluciones.sort(
    (a, b) =>
      b.cubreImprescindibles - a.cubreImprescindibles ||
      a.partes.length - b.partes.length ||
      b.cubreDeseables - a.cubreDeseables ||
      a.partes[0].herramientaId.localeCompare(b.partes[0].herramientaId, "es")
  );

  return {
    soluciones,
    nadieDemuestra,
    seMiraron: catalogo.length,
    casasRecorridas: [...new Set(catalogo.flatMap((h) => categoriasDe(h)))].sort(),
  };
}

/** Combinaciones de 2 a `maximo` piezas, sin repetir y sin importar el orden. */
function* combinaciones(lista: Cobertura[], maximo: number): Generator<Cobertura[]> {
  const paso = function* (desde: number, actual: Cobertura[]): Generator<Cobertura[]> {
    if (actual.length >= 2) yield [...actual];
    if (actual.length === maximo) return;
    for (let i = desde; i < lista.length; i++) yield* paso(i + 1, [...actual, lista[i]]);
  };
  yield* paso(0, []);
}
