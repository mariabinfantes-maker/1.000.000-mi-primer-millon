import { describe, it, expect } from "vitest";
import { getOficios, erroresDeOficios, loQueTraeUnOficio, aconsejar } from "..";

describe("las casas son oficios", () => {
  it("el archivo está bien escrito", () => {
    expect(erroresDeOficios()).toEqual([]);
    expect(getOficios().length).toBeGreaterThan(0);
  });

  /**
   * La prueba que importa: entrar diciendo QUIÉN ERES tiene que dar un consejo
   * distinto por oficio. Si dieran el mismo, la puerta sería decorativa —el
   * mismo fallo que se midió con las preguntas, donde marcara lo que marcara
   * salía la misma herramienta.
   */
  it("cada oficio recibe un consejo distinto, sin escribir una palabra", () => {
    const cabezas = new Map<string, string>();
    for (const o of getOficios()) {
      const c = aconsejar(loQueTraeUnOficio(o.id));
      const cabeza = c.loQueHaria?.piezas.map((p) => p.nombre).join("+") ?? "(nada)";
      cabezas.set(o.nombre, cabeza);
      console.log(
        "  " + o.nombre.padEnd(42) +
        `${o.cubiertasHoy}/${o.deCuantas}`.padStart(6) + "   " + cabeza
      );
    }
    // No se exige que TODOS difieran: dos oficios parecidos pueden compartir
    // herramienta, y eso es cierto. Se exige que la puerta sirva de algo.
    expect(new Set(cabezas.values()).size).toBeGreaterThan(1);
  });
});
