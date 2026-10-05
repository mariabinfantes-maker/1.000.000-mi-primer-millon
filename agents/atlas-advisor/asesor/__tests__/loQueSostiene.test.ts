import { beforeAll, describe, expect, it } from "vitest";
import { aconsejar, type Consejo } from "../aconsejar";
import { getNecesidad, getNecesidades } from "@/data/vocabulario/necesidades";
import { lineasDelPorQue } from "@/app/asesor/porQue";
import type { Opcion } from "@/app/asesor/Variantes";

/**
 * EL CONSEJO DICE SÓLO LO QUE PUEDE SOSTENER. Bloque 2 del plan de cierre,
 * 2026-10-05.
 *
 *  1. Ninguna alternativa nombra a la principal. Decían «Resuelve lo mismo que
 *     Koibox con lo que me has contado», todas, y la propietaria lo leyó como
 *     lo que parecía: *«Le están metiendo al cliente por los ojos Koibox como
 *     si Koibox nos pagara algo.»*
 *  2. El empate no pide nada que el motor no sepa usar. Pedía el presupuesto
 *     y si trabajas sola, y ninguno de los dos cambiaba el resultado. Su
 *     decisión: «dejar de pedirlo».
 *  3. La curva de aprendizaje no se presenta como una medición (ver abajo).
 *
 * Se recorren todos los casos de una y dos necesidades, como en
 * `empatadas.test.ts`, con la misma función que usa la pantalla.
 */

const caso = (...ids: string[]) =>
  ids.map((id) => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" as const }));

describe("el consejo dice sólo lo que puede sostener", () => {
  const casos: { c: string; r: Consejo }[] = [];

  beforeAll(() => {
    const ids = getNecesidades().map((n) => n.id);
    const listas: string[][] = ids.map((a) => [a]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) listas.push([ids[i], ids[j]]);
    for (const c of listas) casos.push({ c: c.join(" + "), r: aconsejar(caso(...c)) });
  }, 180_000);

  it("ninguna alternativa nombra a la principal ni dice «lo mismo que»", () => {
    let alternativas = 0;
    for (const { c, r } of casos) {
      if (!r.loQueHaria) continue;
      const principal = r.loQueHaria as unknown as Opcion;
      const enPantalla = [principal, ...(r.alternativas as unknown as Opcion[])];
      for (const alt of r.alternativas as unknown as Opcion[]) {
        alternativas++;
        const texto = lineasDelPorQue(alt, false, enPantalla, 0).join(" ");
        const suyas = new Set(alt.piezas.map((p) => p.nombre));
        for (const p of principal.piezas) {
          if (!suyas.has(p.nombre)) expect(texto, c).not.toContain(p.nombre);
        }
        expect(texto, c).not.toMatch(/lo mismo que/i);
      }
    }
    expect(alternativas).toBeGreaterThan(1000);
  });

  it("una alternativa sin nada comprobado que la distinga no lleva «por qué»: no se rellena", () => {
    let sinNada = 0;
    for (const { r } of casos) {
      if (!r.loQueHaria) continue;
      const enPantalla = [r.loQueHaria, ...r.alternativas] as unknown as Opcion[];
      for (const alt of r.alternativas as unknown as Opcion[]) {
        const lineas = lineasDelPorQue(alt, false, enPantalla, 0);
        const tieneAlgoPropio = alt.piezas.length > 1 || alt.piezas.some((p) => p.ademas.length > 0);
        if (!tieneAlgoPropio) {
          expect(lineas).toEqual([]);
          sinNada++;
        }
      }
    }
    expect(sinNada).toBeGreaterThan(0);
  });

  it("la principal conserva su porqué: el que decidió el motor", () => {
    for (const { c, r } of casos) {
      if (!r.loQueHaria?.desempate?.porQue) continue;
      const enPantalla = [r.loQueHaria, ...r.alternativas] as unknown as Opcion[];
      expect(lineasDelPorQue(r.loQueHaria as never, true, enPantalla, 2), c).toContain(r.loQueHaria.desempate.porQue);
    }
  });

  /**
   * 3. La curva de aprendizaje se dice como lo que es: una valoración de
   *    Molnip, entre las que quedan. Redacción de la propietaria, 2026-10-05:
   *    «Me inclino por X: de las que quedan, es la que tenemos valorada como
   *    más sencilla para empezar.» El dato y el criterio no cambian.
   */
  it("todo lo que decide la curva usa su redacción, y nada dice «se aprende antes»", () => {
    let porCurva = 0;
    for (const { c, r } of casos) {
      const d = r.loQueHaria?.desempate;
      if (d?.criterio === "curva") {
        porCurva++;
        const nombre = r.loQueHaria!.piezas.map((p) => p.nombre).join(" + ");
        expect(d.porQue, c).toBe(`Me inclino por ${nombre}: de las que quedan, es la que tenemos valorada como más sencilla para empezar.`);
      }
      const todo = JSON.stringify(r);
      expect(todo, c).not.toMatch(/se aprende antes|vale más que cualquier función/);
    }
    expect(porCurva).toBeGreaterThan(0);
  });

  it("el empate no pide nada: ni presupuesto, ni si trabajas sola, ni ninguna pregunta", () => {
    const empates = casos.filter((x) => x.r.loQueNecesitoSaber);
    expect(empates.length).toBeGreaterThan(0);
    for (const { c, r } of empates) {
      expect(r.loQueNecesitoSaber!, c).not.toMatch(/presupuesto|trabajas sola|dime|\?/i);
      expect(r.loQueNecesitoSaber!, c).toMatch(/no tengo con qué decidir/);
    }
  });
});
