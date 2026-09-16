import type { FilaDeNecesidad } from "./necesidades";

/**
 * Qué se le puede decir a la persona sobre CÓMO una herramienta demuestra la
 * necesidad que eligió. Decisión de la propietaria del 2026-09-16 (segunda
 * ronda), después de comprobar los registros de F2:
 *
 *  - Toda capacidad demostrada lo está igual: confianza alta, fuente de
 *    primera mano y cita del fabricante. No saber en qué plan está NO la
 *    deja sin demostrar, y separar por plan daría prioridad a quien tiene la
 *    tarifa mejor documentada, no a quien sirve mejor.
 *  - Por eso la etiqueta es UNA, `confirmada`, y lleva por separado lo que
 *    se sabe y lo que no: el plan si se conoce, el tercero si lo hace a
 *    través de otra herramienta, lo anotado al comprobarlo, y la fuente con
 *    su fecha para enlazarla.
 *  - `pendiente` sólo cuando lo hace a través de un tercero que no consta.
 *    Hoy no hay ningún caso: las 13 integraciones lo nombran.
 *
 * Una nota más descriptiva no demuestra mejor encaje: la nota no decide
 * nada, sólo se enseña. Y ninguna etiqueta dice que una herramienta NO haga
 * algo: F2 no obtuvo ni una ausencia demostrada.
 *
 * Este módulo no lee la verificación: recibe una función `estadoDe` con la
 * forma del puerto y la aplica. Así `data/verificacion` conserva un único
 * lector (la ruta de API), que es lo que la guarda de aislamiento exige.
 */

export type EtiquetaEvidencia =
  | {
      tipo: "confirmada";
      /** Nombre del plan más barato donde está la función, sólo si F2 lo demostró. */
      plan?: string;
      /** Con qué otra herramienta lo hace, cuando la profundidad es integración. */
      integraCon?: string;
      /** Lo anotado al comprobarlo: límites o detalle. Se enseña, no decide. */
      anotado?: string;
      /** Dónde y cuándo se comprobó. */
      fuente?: { url: string; fecha: string };
      /**
       * El uso concreto que la fila pide, cuando ESTA herramienta lo ha
       * demostrado (2026-09-16, tercera ronda). Sólo viaja demostrado: si no
       * consta, la tarjeta enseña el aviso fijo de la fila, que ya dice que
       * no se ha comprobado. La etiqueta va dentro porque la pantalla no
       * puede leer la lista de usos.
       */
      uso?: { id: string; etiqueta: string; anotado?: string; fuente?: { url: string; fecha: string } };
    }
  | { tipo: "pendiente"; motivo: "tercero_desconocido" };

/** Lo que hace falta saber de un uso para etiquetarlo. Es la forma de `EvidenciaDeUso` más la etiqueta, sin importarlas. */
export type EstadoDeUnUso = {
  estado: "demostrada" | "ausencia_demostrada" | "no_consta";
  etiqueta?: string;
  nota?: string;
  fuente?: { url: string; fechaConsulta: string };
};

/** Lo mínimo que hace falta saber de un par para etiquetarlo. Es la forma de `EvidenciaDeCapacidad`, sin importarla. */
export type EstadoDeUnPar = {
  estado: "demostrada" | "ausencia_demostrada" | "no_consta";
  profundidad?: string;
  integraCon?: string;
  nota?: string;
  plan?: { certeza: string; nombre?: string };
  fuente?: { url: string; fechaConsulta: string };
};

const LARGO_MAXIMO_NOTA = 160;

/**
 * La etiqueta de una herramienta para una fila. Mira las capacidades de la
 * fila en orden y se queda con la primera demostrada: si una fila agrupa
 * «web o páginas de captación», basta con que demuestre una.
 *
 * `undefined` si no demuestra ninguna: esa herramienta no debería estar en
 * el resultado, y quien llame sabrá qué hacer con la contradicción.
 */
export function etiquetaDeEvidencia(
  herramientaId: string,
  fila: FilaDeNecesidad,
  estadoDe: (herramientaId: string, capacidadId: string) => EstadoDeUnPar,
  usoDe?: (herramientaId: string, usoId: string) => EstadoDeUnUso
): EtiquetaEvidencia | undefined {
  for (const capacidadId of fila.capacidades) {
    const par = estadoDe(herramientaId, capacidadId);
    if (par.estado !== "demostrada") continue;

    const integraCon = par.integraCon?.trim();
    if (par.profundidad === "integracion" && !integraCon) return { tipo: "pendiente", motivo: "tercero_desconocido" };

    const plan = par.plan?.certeza === "verificado" ? par.plan.nombre?.trim() : undefined;
    const anotado = par.nota?.trim();
    const uso = fila.uso && usoDe ? usoDemostrado(fila.uso.id, usoDe(herramientaId, fila.uso.id)) : undefined;
    return {
      tipo: "confirmada",
      ...(plan ? { plan } : {}),
      ...(integraCon ? { integraCon } : {}),
      ...(anotado ? { anotado: recortar(anotado) } : {}),
      ...(par.fuente ? { fuente: { url: par.fuente.url, fecha: par.fuente.fechaConsulta } } : {}),
      ...(uso ? { uso } : {}),
    };
  }
  return undefined;
}

/** Sólo un uso demostrado se etiqueta; y sin etiqueta en palabras no se enseña nada, para no filtrar el id. */
function usoDemostrado(
  usoId: string,
  estado: EstadoDeUnUso
): NonNullable<Extract<EtiquetaEvidencia, { tipo: "confirmada" }>["uso"]> | undefined {
  if (estado.estado !== "demostrada") return undefined;
  const etiqueta = estado.etiqueta?.trim();
  if (!etiqueta) return undefined;
  const anotado = estado.nota?.trim();
  return {
    id: usoId,
    etiqueta,
    ...(anotado ? { anotado: recortar(anotado) } : {}),
    ...(estado.fuente ? { fuente: { url: estado.fuente.url, fecha: estado.fuente.fechaConsulta } } : {}),
  };
}

/** Las notas de F2 son de una o dos frases; si alguna es más larga, se corta en un límite de palabra para que quepa en el enlace. */
function recortar(texto: string): string {
  if (texto.length <= LARGO_MAXIMO_NOTA) return texto;
  const corte = texto.lastIndexOf(" ", LARGO_MAXIMO_NOTA);
  return `${texto.slice(0, corte > 60 ? corte : LARGO_MAXIMO_NOTA).trimEnd()}…`;
}

/**
 * Reparte un resultado en las opciones con respaldo suficiente y los
 * candidatos pendientes. Sin etiquetas (enlaces de antes de la opción B, o
 * entradas sin pregunta) todo cuenta como respaldado: no hay nada que
 * separar. El comparador sólo compara el primer grupo.
 */
export function separarPorRespaldo<T extends { herramienta: { id: string } }>(
  items: T[],
  evidencia?: Record<string, EtiquetaEvidencia>
): { respaldadas: T[]; pendientes: T[] } {
  const pendientes = items.filter((i) => evidencia?.[i.herramienta.id]?.tipo === "pendiente");
  const respaldadas = items.filter((i) => !pendientes.includes(i));
  return { respaldadas, pendientes };
}
