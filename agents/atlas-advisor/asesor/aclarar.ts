import { getDimensiones, type Dimension } from "@/data/vocabulario/asesor";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { buscar, type Busqueda } from "./buscar";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";

/**
 * El paso 2 del asesor: ACLARAR SÓLO LO QUE CAMBIA EL CONSEJO.
 *
 * La regla es de la propietaria y tiene dos mitades. La primera, del
 * 2026-09-22: «no se pregunta algo simplemente porque el negocio lo tenga,
 * sino porque su respuesta cambia el consejo». La segunda, del 2026-09-24, es
 * el ejemplo: «¿Quieres que el presupuesto aceptado se convierta en factura
 * sin volver a escribirlo?».
 *
 * AQUÍ ESO SE COMPRUEBA, NO SE PROMETE. Antes de enseñar una pregunta se
 * simulan sus respuestas contra el catálogo real: si el resultado sale igual
 * conteste lo que conteste, la pregunta es decorativa y no se hace.
 *
 * Es la corrección del fallo que se midió: un recorrido de 62.208
 * combinaciones donde marcara lo que marcara salía la misma herramienta
 * primero. Las preguntas no separaban nada y aun así se preguntaban.
 */

export type PreguntaUtil = {
  dimension: Dimension;
  /** Las necesidades suyas sobre las que esta pregunta decide. */
  afectaA: string[];
  /**
   * Qué cambia de verdad: cuántas candidatas distintas salen según se
   * responda. Se guarda para poder enseñarlo y para que nadie reintroduzca
   * una pregunta decorativa sin que se note.
   */
  candidatasQueSeMueven: number;
};

/** Las tres primeras soluciones, que es lo que ella llegaría a ver. */
function cabeza(b: Busqueda): string {
  return b.soluciones
    .slice(0, 3)
    .map((s) => s.partes.map((p) => p.herramientaId).join("+"))
    .join("|");
}

/**
 * Qué preguntas merecen hacerse, de más a menos decisiva.
 *
 * Una dimensión puede subir una necesidad de deseable a imprescindible —o
 * traerla por primera vez—. Eso es lo que se simula: el caso con esa
 * necesidad dentro frente al caso sin ella. Si la cabeza del resultado no se
 * mueve, la pregunta no entra.
 */
export function aclarar(
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia = getPuertoDeEvidencia()
): PreguntaUtil[] {
  const yaTiene = new Set(delCaso.map((n) => n.necesidad.id));
  const base = cabeza(buscar(delCaso, puerto));
  const utiles: PreguntaUtil[] = [];

  for (const dimension of getDimensiones()) {
    // Sólo se pregunta por necesidades que ella NO ha traído: las que trajo ya
    // cuentan, y volver a preguntarlas es el formulario que no queremos.
    const candidatas = dimension.afectaA.filter((id) => !yaTiene.has(id) && getNecesidad(id));
    if (candidatas.length === 0) continue;

    const mueve = new Set<string>();
    const afecta: string[] = [];
    for (const id of candidatas) {
      const conEsta = [
        ...delCaso,
        { necesidad: getNecesidad(id)!, importancia: "deseable" as const, salioDeUnaPregunta: true },
      ];
      const otra = cabeza(buscar(conEsta, puerto));
      if (otra === base) continue;
      afecta.push(id);
      for (const t of otra.split(/[|+]/)) mueve.add(t);
    }
    if (afecta.length === 0) continue;
    utiles.push({ dimension, afectaA: afecta, candidatasQueSeMueven: mueve.size });
  }

  return utiles.sort(
    (a, b) =>
      b.afectaA.length - a.afectaA.length ||
      b.candidatasQueSeMueven - a.candidatasQueSeMueven ||
      a.dimension.id.localeCompare(b.dimension.id, "es")
  );
}
