import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { aconsejar, type Consejo } from "../aconsejar";
import { getNecesidad, getNecesidades } from "@/data/vocabulario/necesidades";
import { comoSeDiceLaEntrada, comoSeDiceLaEntradaEnFrase } from "@/app/asesor/entradaSinCoste";
import { precioCorto } from "@/app/asesor/ConsejoDelAsesor";
import type { Opcion } from "@/app/asesor/Variantes";

/**
 * LA ENTRADA SIN COSTE SE DICE COMO LO QUE ES. Propietaria, 2026-10-06.
 *
 * Que una prueba gratuita cuente como «plan gratuito» en el desempate es una
 * decisión deliberada (2026-09-17): las dos quitan el riesgo de empezar. Lo
 * que no vale es decirlas igual. Hasta este día la tarjeta ponía «Plan
 * gratuito» también de una prueba de 7 días, en 1.231 de los 1.891 casos.
 *
 * Aquí se vigila lo que se dice, no lo que se decide: el desempate no cambia.
 */

describe("cómo se dice la entrada sin coste", () => {
  it("plan gratuito, prueba con días y prueba sin días, y nada si no tiene", () => {
    expect(comoSeDiceLaEntrada({ tienePlanGratuito: true, tipoPlanGratuito: "indefinido" })).toBe("Plan gratuito");
    expect(comoSeDiceLaEntrada({ tienePlanGratuito: true, tipoPlanGratuito: "prueba", pruebaGratuitaDias: 7 })).toBe("Prueba gratuita de 7 días");
    expect(comoSeDiceLaEntrada({ tienePlanGratuito: true, tipoPlanGratuito: "prueba" })).toBe("Prueba gratuita");
    expect(comoSeDiceLaEntrada({ tienePlanGratuito: false, tipoPlanGratuito: "prueba", pruebaGratuitaDias: 7 })).toBeNull();
    expect(comoSeDiceLaEntradaEnFrase({ tienePlanGratuito: true, tipoPlanGratuito: "prueba", pruebaGratuitaDias: 15 })).toBe("prueba gratuita de 15 días");
  });

  // Koibox publica «Plan Free: 0 €/mes» y su ficha no dice de qué clase es.
  // No se deduce que sea indefinido: se dice «Plan gratuito», como hasta ahora.
  it("sin clase anotada no se inventa ninguna: «Plan gratuito», como antes", () => {
    expect(comoSeDiceLaEntrada({ tienePlanGratuito: true })).toBe("Plan gratuito");
  });
});

/**
 * Las cinco pruebas con cita, fecha y días que se aplicaron el 2026-10-06
 * (`data/consulta/PASO-1-2026-10-06.md`). Y las cuatro que se quedaron como
 * estaban: tres con evidencia media o débil, y ViDay, sin prueba documentada.
 */
describe("las fichas del paso 1", () => {
  const ficha = (id: string) => JSON.parse(fs.readFileSync(path.join("data", "herramientas", `${id}.json`), "utf-8"));

  it("Acuity, Archivex, Bookitit, flowww y Teachworks: prueba, con sus días", () => {
    const dias: Record<string, number> = { "acuity-scheduling": 7, archivex: 7, bookitit: 15, flowww: 10, teachworks: 21 };
    for (const [id, d] of Object.entries(dias)) {
      expect(ficha(id), id).toMatchObject({ tienePlanGratuito: true, tipoPlanGratuito: "prueba", pruebaGratuitaDias: d });
    }
  });

  it("Booksy, Bookeo, Schedulista y ViDay se quedan como estaban", () => {
    for (const id of ["booksy", "bookeo", "schedulista", "viday"]) {
      expect(ficha(id).tienePlanGratuito, id).toBe(false);
      expect(ficha(id).tipoPlanGratuito, id).toBeUndefined();
    }
  });

  // Gratis sólo para entidades benéficas y centros educativos: una tercera
  // clase que el esquema todavía no tiene. No se fuerza a ninguna de las dos.
  it("Cliniko no se fuerza a indefinido ni a prueba", () => {
    expect(ficha("cliniko").tipoPlanGratuito).toBeUndefined();
  });
});

describe("en pantalla, en los 1.891 casos", () => {
  const casos: { c: string; r: Consejo }[] = [];
  beforeAll(() => {
    const ids = getNecesidades().map((n) => n.id);
    const listas: string[][] = ids.map((a) => [a]);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) listas.push([ids[i], ids[j]]);
    for (const c of listas) {
      casos.push({ c: c.join(" + "), r: aconsejar(c.map((id) => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" as const }))) });
    }
  }, 180_000);

  it("ninguna prueba gratuita se presenta como «Plan gratuito» en la fila", () => {
    let conPrueba = 0;
    for (const { c, r } of casos) {
      const enPantalla = [r.loQueHaria, ...r.alternativas, ...r.empatadas].filter(Boolean) as unknown as Opcion[];
      for (const o of enPantalla) {
        if (o.piezas.length !== 1) continue;
        const p = o.piezas[0];
        if (!p.coste.tienePlanGratuito || p.coste.tipoPlanGratuito !== "prueba") continue;
        conPrueba++;
        const { cifra, nota } = precioCorto(o);
        const fila = `${cifra} ${nota ?? ""}`;
        expect(fila, `${c} · ${p.herramientaId}`).not.toMatch(/plan gratuito/i);
        expect(fila, `${c} · ${p.herramientaId}`).toMatch(/prueba gratuita/i);
      }
    }
    expect(conPrueba).toBeGreaterThan(1000);
  });

  it("el motivo de la recomendación nunca llama «plan gratuito» a una prueba", () => {
    for (const { c, r } of casos) {
      if (r.loQueHaria?.desempate.criterio !== "plan-gratuito") continue;
      for (const p of r.loQueHaria.piezas) expect(p.coste.tipoPlanGratuito, c).not.toBe("prueba");
    }
  });
});
