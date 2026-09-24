import { describe, it, expect } from "vitest";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { aclarar } from "../aclarar";
import { aconsejar } from "../aconsejar";
import { buscar } from "../buscar";

const imp = (id: string): NecesidadDelCaso => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" });

const CASOS = [
  { quien: "peluquería: citas + facturar", trae: [imp("nec.que-reserven-solos"), imp("nec.emitir-una-factura-legal")] },
  { quien: "reformas: presupuesto + facturar", trae: [imp("nec.presupuestar-rapido"), imp("nec.emitir-una-factura-legal")] },
  { quien: "diseñadora: horas + facturar", trae: [imp("nec.saber-cuanto-tiempo-echo"), imp("nec.emitir-una-factura-legal")] },
];

describe("el recorrido completo", () => {
  it("cada caso da un consejo distinto, con su por qué y sus límites", () => {
    const cabezas = new Set<string>();
    for (const caso of CASOS) {
      const c = aconsejar(caso.trae);
      console.log("\n■ " + caso.quien);
      if (!c.loQueHaria) { console.log("  no hay nada que proponer, y eso es un resultado"); continue; }
      cabezas.add(c.loQueHaria.piezas.map((p) => p.herramientaId).join("+"));
      console.log("  LO QUE HARÍA: " + c.loQueHaria.piezas.map((p) => p.nombre).join(" + "));
      for (const p of c.porQue) console.log("    porque " + p);
      if (c.alternativas.length) {
        console.log("  ALTERNATIVAS: " + c.alternativas.map((a) => a.piezas.map((p) => p.nombre).join("+")).join(", "));
      }
      for (const s of c.sinComprobar) console.log("  SIN COMPROBAR: " + s);
      console.log(`  (se miraron ${c.dondeSeBusco.herramientas} herramientas en ${c.dondeSeBusco.casas} casas)`);
    }
    // Lo que el recorrido anterior no conseguía: que el caso cambie el consejo.
    expect(cabezas.size).toBeGreaterThan(1);
  });

  it("sólo se pregunta lo que mueve el resultado", () => {
    for (const caso of CASOS) {
      const base = buscar(caso.trae).soluciones.slice(0, 3).map((s) => s.partes.map((p) => p.herramientaId).join("+")).join("|");
      const preguntas = aclarar(caso.trae);
      console.log(`\n${caso.quien}: ${preguntas.length} preguntas útiles`);
      for (const p of preguntas.slice(0, 4)) {
        console.log(`   «${p.dimension.pregunta}»  → decide ${p.afectaA.length}, mueve ${p.candidatasQueSeMueven} candidatas`);
      }
      // Ninguna pregunta decorativa: todas cambian la cabeza del resultado.
      for (const p of preguntas) {
        const con = [...caso.trae, { necesidad: getNecesidad(p.afectaA[0])!, importancia: "deseable" as const }];
        const otra = buscar(con).soluciones.slice(0, 3).map((s) => s.partes.map((x) => x.herramientaId).join("+")).join("|");
        expect(otra, p.dimension.pregunta).not.toBe(base);
      }
    }
  });
});
