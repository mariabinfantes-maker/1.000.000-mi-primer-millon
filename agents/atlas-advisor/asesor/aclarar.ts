import { getDimensiones, type Dimension } from "@/data/vocabulario/asesor";
import { getCapacidad } from "@/data/vocabulario/repositorio";
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
  /**
   * Cuánto tiene que ver con lo que ELLA acaba de contar: capacidades que
   * comparten las necesidades que la pregunta traería con las que ella trajo.
   */
  cercaDeLoQueConto: number;
};

/**
 * EL CONSEJO, RESUMIDO PARA COMPARARLO: las tres primeras soluciones Y cuánto
 * cubren de lo que ella pide.
 *
 * Antes sólo miraba las tres primeras herramientas, y eso dejaba fuera la
 * pregunta que más cambia el consejo. Ejemplo real: a la clínica, añadir
 * «tener la agenda bajo control» no mueve a Agiled, HoneyBook ni Keap de sus
 * puestos —siguen siendo las tres mejores—, pero pasan de cubrirlo todo a
 * cubrir dos de tres cosas, y Molnip tendría que decirle que la agenda por
 * profesional no se la resuelve nadie. Eso no es un matiz: es otra respuesta.
 *
 * Con la cobertura dentro, una pregunta cuenta como útil también cuando lo que
 * cambia es LO QUE NO PODEMOS RESOLVERLE.
 */
function cabeza(b: Busqueda): string {
  const cobertura = b.soluciones[0]
    ? `${b.soluciones[0].cubreImprescindibles}/${b.soluciones[0].deImprescindibles}`
    : "0/0";
  return (
    cobertura +
    "::" +
    b.soluciones
      .slice(0, 3)
      .map((s) => s.partes.map((p) => p.herramientaId).join("+"))
      .join("|")
  );
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
  /**
   * DE QUÉ VA LO QUE ELLA CONTÓ: los dominios de sus capacidades.
   *
   * Primero comparé capacidades sueltas, y eso era demasiado estrecho: «tener
   * la agenda bajo control» y «que puedan reservar sin llamarme» no comparten
   * ni una capacidad, y sin embargo hablan de lo mismo —las dos son del
   * dominio `citas`—. Con capacidades, la pregunta sobre las citas salía con
   * cercanía cero justo en el caso de la clínica.
   */
  const suyos = new Set(
    delCaso
      .flatMap((n) => [...n.necesidad.imprescindibles, ...n.necesidad.ayudan])
      .map((c) => getCapacidad(c)?.dominioId)
      .filter(Boolean) as string[]
  );
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
      /**
       * Se simulan LAS DOS respuestas posibles, no una.
       *
       * Antes sólo se probaba a añadir la necesidad como `deseable`, y las
       * deseables no descalifican a nadie: sólo desempatan. Así que una
       * pregunta cuya respuesta convierte algo en IMPRESCINDIBLE —«¿el cliente
       * elige profesional?»— salía como decorativa y no se hacía nunca, justo
       * la que más cambia el consejo: si pasa a imprescindible y nadie lo
       * demuestra, la respuesta honrada deja de ser una lista y pasa a ser un
       * «esto no te lo resuelvo».
       *
       * Una pregunta es útil si ALGUNA de sus respuestas mueve el consejo.
       */
      let movio = false;
      for (const importancia of ["deseable", "imprescindible"] as const) {
        const conEsta = [...delCaso, { necesidad: getNecesidad(id)!, importancia, salioDeUnaPregunta: true }];
        const otra = cabeza(buscar(conEsta, puerto));
        if (otra === base) continue;
        movio = true;
        for (const t of otra.split(/[|+]/)) mueve.add(t);
      }
      if (!movio) continue;
      afecta.push(id);
    }
    if (afecta.length === 0) continue;
    /**
     * QUÉ PROPORCIÓN DE ESTA PREGUNTA VA DE LO SUYO, de 0 a 100.
     *
     * Contar capacidades sueltas premiaba a la pregunta que toca más
     * necesidades: «¿cuántas personas trabajan en el negocio?» afecta a seis y
     * ganaba por volumen a «¿cómo se asignan las citas?», que va justo de lo
     * que la clínica contó. Lo que ordena bien no es cuánto toca, sino qué
     * parte de lo que toca es de su asunto.
     */
    const dominios = afecta.flatMap((id) => {
      const n = getNecesidad(id)!;
      return [...n.imprescindibles, ...n.ayudan].map((c) => getCapacidad(c)?.dominioId);
    });
    const deLoSuyo = dominios.filter((d) => d && suyos.has(d)).length;
    const cercaDeLoQueConto = dominios.length === 0 ? 0 : Math.round((deLoSuyo / dominios.length) * 100);
    utiles.push({ dimension, afectaA: afecta, candidatasQueSeMueven: mueve.size, cercaDeLoQueConto });
  }

  /**
   * PRIMERO LA QUE SIGUE SU PROBLEMA.
   *
   * Antes mandaba «a cuántas necesidades afecta», así que a una clínica que
   * contaba que pierde pacientes por no coger el teléfono se le preguntaba por
   * las firmas antes que por las citas. La pregunta era útil —cambia el
   * consejo— pero llegaba fuera de sitio: todavía no sabíamos cómo llevan las
   * citas, que es lo que ella había contado.
   *
   * Lo dijo la propietaria el 2026-09-25: «la pregunta debe seguir el problema
   * que contó la clínica; la firma puede explorarse después si viene al caso».
   * Por eso manda ahora la cercanía a lo que trajo, y lo demás desempata.
   */
  return utiles.sort(
    (a, b) =>
      b.cercaDeLoQueConto - a.cercaDeLoQueConto ||
      b.afectaA.length - a.afectaA.length ||
      b.candidatasQueSeMueven - a.candidatasQueSeMueven ||
      a.dimension.id.localeCompare(b.dimension.id, "es")
  );
}
