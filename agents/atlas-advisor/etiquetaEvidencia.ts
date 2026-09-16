import type { FilaDeNecesidad } from "./necesidades";

/**
 * Qué se le puede decir a la persona sobre CÓMO una herramienta demuestra la
 * necesidad que eligió. Tres niveles, decididos por la propietaria el
 * 2026-09-16, porque «lo demuestra» no es una sola cosa:
 *
 *  - `confirmada`  — hay evidencia y describe lo que hace. Se enseña la nota.
 *  - `via_tercero` — lo hace a través de otra herramienta. Se dice cuál, si
 *                    consta, y que no sabemos ni precio ni condiciones de
 *                    esa conexión.
 *  - `sin_detalle` — está verificado, pero la nota guardada no describe qué
 *                    hace. Positivo, y sin detalle: se dice así.
 *
 * Este módulo no lee la verificación: recibe una función `estadoDe` con la
 * forma del puerto y la aplica. Así `data/verificacion` conserva un único
 * lector (la ruta de API), que es lo que la guarda de aislamiento exige.
 */

export type EtiquetaEvidencia =
  | { tipo: "confirmada"; nota: string }
  | { tipo: "via_tercero"; tercero?: string }
  | { tipo: "sin_detalle" };

/** Lo mínimo que hace falta saber de un par para etiquetarlo. Es la forma de `EvidenciaDeCapacidad`, sin importarla. */
export type EstadoDeUnPar = {
  estado: "demostrada" | "ausencia_demostrada" | "no_consta";
  profundidad?: string;
  integraCon?: string;
  nota?: string;
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
  estadoDe: (herramientaId: string, capacidadId: string) => EstadoDeUnPar
): EtiquetaEvidencia | undefined {
  for (const capacidadId of fila.capacidades) {
    const par = estadoDe(herramientaId, capacidadId);
    if (par.estado !== "demostrada") continue;

    if (par.profundidad === "integracion") {
      const tercero = par.integraCon?.trim();
      return tercero ? { tipo: "via_tercero", tercero } : { tipo: "via_tercero" };
    }
    const nota = par.nota?.trim();
    if (nota) return { tipo: "confirmada", nota: recortar(nota) };
    return { tipo: "sin_detalle" };
  }
  return undefined;
}

/** Las notas de F2 son de una o dos frases; si alguna es más larga, se corta en un límite de palabra para que quepa en el enlace. */
function recortar(texto: string): string {
  if (texto.length <= LARGO_MAXIMO_NOTA) return texto;
  const corte = texto.lastIndexOf(" ", LARGO_MAXIMO_NOTA);
  return `${texto.slice(0, corte > 60 ? corte : LARGO_MAXIMO_NOTA).trimEnd()}…`;
}
