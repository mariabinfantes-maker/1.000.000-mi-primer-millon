import { beforeAll, describe, expect, it } from "vitest";
import { aconsejar, type Consejo } from "../aconsejar";
import { getNecesidad, getNecesidades } from "@/data/vocabulario/necesidades";
import { idDe, queSeEnsena } from "@/app/asesor/queSeEnsena";

/**
 * LO QUE SE ENSEÑA BAJO UN EMPATE ES EL EMPATE.
 *
 * Propietaria, 2026-09-30: «si Molnip dice que después de aplicar sus
 * criterios quedan 6 herramientas empatadas, las herramientas que enseñe
 * inmediatamente debajo tienen que pertenecer necesariamente a esas 6».
 *
 * Antes el motor devolvía sólo la frase y la pantalla cogía las tres primeras
 * de la búsqueda, que van por orden alfabético. Con «vender por internet» decía
 * «me quedan 2» —Taskade y Thinkific— y enseñaba Bitrix24, ClickFunnels y
 * Odoo. Pasaba en 611 de los 819 empates.
 *
 * Se recorren TODOS los casos de una y dos necesidades (1.891), y se prueba la
 * misma función que usa la pantalla, `queSeEnsena`: si leyeran cosas
 * distintas, esto no demostraría nada.
 */

const caso = (...ids: string[]) =>
  ids.map((id) => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" as const }));

/** El número que la frase del empate dice: «me quedan N» o, si no, el primero. */
function elNumeroQueDice(frase: string): number {
  const quedan = frase.match(/me quedan (\d+)/);
  return Number(quedan ? quedan[1] : frase.match(/^(\d+) /)![1]);
}

describe("bajo un empate sólo salen las empatadas", () => {
  const casos: { c: string[]; r: Consejo }[] = [];

  beforeAll(() => {
    const ids = getNecesidades().map((n) => n.id);
    const listas: string[][] = ids.map((a) => [a]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) listas.push([ids[i], ids[j]]);
    for (const c of listas) casos.push({ c, r: aconsejar(caso(...c)) });
  }, 180_000);

  const empates = () => casos.filter((x) => x.r.loQueNecesitoSaber);

  it("hay empates que probar, y cada uno trae su conjunto", () => {
    expect(empates().length).toBeGreaterThan(0);
    for (const { c, r } of empates()) expect(r.empatadas.length, c.join(" + ")).toBeGreaterThan(1);
  });

  it("el conjunto tiene exactamente el tamaño que dice la frase", () => {
    for (const { c, r } of empates()) {
      expect(r.empatadas.length, c.join(" + ")).toBe(elNumeroQueDice(r.loQueNecesitoSaber!));
    }
  });

  it("todas las filas que enseña la pantalla, a la vista o tras «ver más», son del conjunto", () => {
    for (const { c, r } of empates()) {
      const delEmpate = new Set(r.empatadas.map(idDe));
      for (let ver = 3; ver < r.empatadas.length + 3; ver += 3) {
        const { filas, esEmpate } = queSeEnsena(r, ver);
        expect(esEmpate, c.join(" + ")).toBe(true);
        for (const f of filas) expect(delEmpate.has(idDe(f)), `${c.join(" + ")}: ${idDe(f)}`).toBe(true);
      }
      // Y desplegado entero, es el conjunto entero, en el orden del motor.
      expect(queSeEnsena(r, r.empatadas.length).filas.map(idDe)).toEqual(r.empatadas.map(idDe));
    }
  });

  it("se ven tres al principio y el resto queda dentro del mismo grupo", () => {
    for (const { r } of empates()) {
      const { filas, quedanEnElGrupo } = queSeEnsena(r);
      expect(filas.length).toBe(Math.min(3, r.empatadas.length));
      expect(filas.length + quedanEnElGrupo).toBe(r.empatadas.length);
    }
  });

  it("«Explorar otras opciones» no repite ninguna empatada ni ninguna otra", () => {
    for (const { c, r } of empates()) {
      const { restantes, parciales } = queSeEnsena(r);
      const delEmpate = new Set(r.empatadas.map(idDe));
      const vistas = [...restantes, ...parciales].map(idDe);
      for (const v of vistas) expect(delEmpate.has(v), `${c.join(" + ")}: ${v}`).toBe(false);
      expect(new Set(vistas).size, c.join(" + ")).toBe(vistas.length);
    }
  });

  it("con recomendación no hay conjunto de empate, y la pantalla no lo usa", () => {
    for (const { c, r } of casos.filter((x) => x.r.loQueHaria)) {
      expect(r.empatadas, c.join(" + ")).toEqual([]);
      expect(queSeEnsena(r).esEmpate).toBe(false);
    }
  });
});
