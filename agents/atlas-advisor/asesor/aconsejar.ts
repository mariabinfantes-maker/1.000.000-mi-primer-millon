import { getTodasLasHerramientas } from "@/data/repositorio";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getEsqueleto } from "@/data/vocabulario/asesor";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";
import { buscar, type Solucion } from "./buscar";

/**
 * El paso 4 del asesor: ACONSEJAR.
 *
 * «Explica qué haría, por qué, qué alternativas tienes y qué sigue sin
 * comprobarse» (propietaria, 2026-09-24).
 *
 * Aquí NO se puntúa y NO se juzga a nadie. Las reglas viejas siguen mandando:
 * no somos jueces, de una herramienta que no encaja se dice que no está
 * pensada para ella, y el límite se cuenta sin pedir perdón. Y la de esta
 * fase: la IA puede conversar, pero **toda afirmación sobre una herramienta
 * sale de aquí**, que sólo lee datos verificados.
 */

export type Pieza = {
  herramientaId: string;
  nombre: string;
  /** Necesidades suyas que esta pieza cubre, con el título que ella entiende. */
  cubre: string[];
  /** En qué casas vive. Sirve para contar dónde se buscó, no para ordenar. */
  casas: string[];
};

export type Consejo = {
  /** Lo que haría. Vacío cuando no hay nada que proponer, que es un resultado. */
  loQueHaria: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean } | null;
  /** Por qué: qué necesidad suya resuelve cada pieza. */
  porQue: string[];
  /** Alternativas reales, no relleno: sólo las que cubren lo mismo. */
  alternativas: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean }[];
  /**
   * Lo que sigue sin comprobarse. Nunca se convierte en «no lo hace».
   * Incluye lo que nadie demuestra y, en las combinaciones, que no sabemos si
   * las piezas se entienden entre ellas.
   */
  sinComprobar: string[];
  /** Cuántas herramientas se miraron y en cuántas casas. Para poder decirlo. */
  dondeSeBusco: { herramientas: number; casas: number };
};

function aPieza(
  s: Solucion,
  nombres: Map<string, string>
): { piezas: Pieza[]; laConexionNoEstaComprobada: boolean } {
  return {
    piezas: s.partes.map((p) => ({
      herramientaId: p.herramientaId,
      nombre: nombres.get(p.herramientaId) ?? p.herramientaId,
      cubre: p.cubre.map((id) => getNecesidad(id)?.titulo ?? id),
      casas: p.casas,
    })),
    laConexionNoEstaComprobada: Boolean(s.laConexionNoEstaComprobada),
  };
}

export function aconsejar(
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia = getPuertoDeEvidencia()
): Consejo {
  const nombres = new Map(getTodasLasHerramientas().map((h) => [h.id, h.nombre]));
  const r = buscar(delCaso, puerto);
  const dondeSeBusco = { herramientas: r.seMiraron, casas: r.casasRecorridas.length };

  const sinComprobar = r.nadieDemuestra.map(
    (id) =>
      `«${getNecesidad(id)?.titulo ?? id}»: ninguna de las ${r.seMiraron} herramientas del catálogo nos lo ha demostrado en su página. No es que no exista: es que no lo hemos podido comprobar.`
  );

  if (r.soluciones.length === 0) {
    // Decir que no es un resultado válido. Es la forma `no-cubierto` del
    // esqueleto, y existe para no rellenar con lo que haya.
    return { loQueHaria: null, porQue: [], alternativas: [], sinComprobar, dondeSeBusco };
  }

  const mejor = r.soluciones[0];
  const loQueHaria = aPieza(mejor, nombres);

  // Alternativa sólo lo que cubre LO MISMO. Una que cubre menos no es una
  // alternativa: es otra cosa, y ofrecerla sería rellenar hasta tres.
  const alternativas = r.soluciones
    .slice(1)
    .filter((s) => s.cubreImprescindibles === mejor.cubreImprescindibles)
    .slice(0, 3)
    .map((s) => aPieza(s, nombres));

  const porQue = loQueHaria.piezas.map(
    (p) => `${p.nombre} se encarga de ${p.cubre.map((c) => `«${c.toLowerCase()}»`).join(" y ")}.`
  );

  if (loQueHaria.laConexionNoEstaComprobada) {
    sinComprobar.unshift(
      `Que ${loQueHaria.piezas.map((p) => p.nombre).join(" y ")} se entiendan entre sí no lo hemos comprobado: sabemos lo que hace cada una por separado.`
    );
  }
  if (mejor.cubreImprescindibles < mejor.deImprescindibles) {
    sinComprobar.push(
      `De lo que nos has contado, esto cubre ${mejor.cubreImprescindibles} de ${mejor.deImprescindibles} cosas.`
    );
  }
  return { loQueHaria, porQue, alternativas, sinComprobar, dondeSeBusco };
}

/** Las reglas de presentación que este módulo tiene que respetar, para poder probarlas. */
export function reglasQueAplican(): string[] {
  return getEsqueleto().reglasDePresentacion.map((r) => r.id);
}
