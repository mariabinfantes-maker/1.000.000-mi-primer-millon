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
      /**
       * Ninguna pregunta decorativa: todas tienen que mover el CONSEJO.
       *
       * Esta comprobación medía sólo las tres primeras herramientas, y eso
       * dejaba pasar por decorativa la pregunta que más cambia la respuesta.
       * Caso real (2026-09-25): a la clínica, «¿cómo se asignan las citas?»
       * no mueve a Agiled, HoneyBook ni Keap de sus puestos —siguen siendo las
       * tres mejores— pero pasan de cubrirlo todo a cubrir dos de tres, y
       * Molnip tendría que decirle que la agenda por profesional no se la
       * resuelve nadie. Eso no es un matiz: es otra respuesta.
       *
       * Así que se mide lo mismo que mide `aclarar`: quiénes encabezan Y
       * cuánto cubren. Y se prueban las dos respuestas posibles, porque una
       * pregunta es útil si ALGUNA de ellas mueve el consejo.
       */
      const resumen = (c: NecesidadDelCaso[]) => {
        const b = buscar(c);
        const cobertura = b.soluciones[0]
          ? `${b.soluciones[0].cubreImprescindibles}/${b.soluciones[0].deImprescindibles}`
          : "0/0";
        return cobertura + "::" + b.soluciones.slice(0, 3).map((s) => s.partes.map((x) => x.herramientaId).join("+")).join("|");
      };
      const antes = resumen(caso.trae);
      for (const p of preguntas) {
        const mueve = (["deseable", "imprescindible"] as const).some(
          (importancia) => resumen([...caso.trae, { necesidad: getNecesidad(p.afectaA[0])!, importancia }]) !== antes
        );
        expect(mueve, p.dimension.pregunta).toBe(true);
      }
    }
  });
});
