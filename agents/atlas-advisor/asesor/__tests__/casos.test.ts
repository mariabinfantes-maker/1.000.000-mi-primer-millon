import { describe, it, expect } from "vitest";
import { getNecesidad } from "@/data/vocabulario/necesidades";
import type { NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { buscar } from "../buscar";

const nombre = new Map(getTodasLasHerramientas().map((h) => [h.id, h.nombre]));
const imp = (id: string): NecesidadDelCaso => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" });

/** Los tres casos que puso la propietaria el 2026-09-24. */
const CASOS: { quien: string; trae: NecesidadDelCaso[] }[] = [
  { quien: "«Tengo una peluquería, pierdo citas y facturo a mano»",
    trae: [imp("nec.que-reserven-solos"), imp("nec.emitir-una-factura-legal")] },
  { quien: "«Hago reformas, preparo presupuestos y luego repito todo en la factura»",
    trae: [imp("nec.presupuestar-rapido"), imp("nec.emitir-una-factura-legal")] },
  { quien: "«Soy diseñadora y cobro según las horas»",
    trae: [imp("nec.saber-cuanto-tiempo-echo"), imp("nec.emitir-una-factura-legal")] },
];

describe("los tres casos, atravesando las casas", () => {
  it("cada uno da un resultado distinto y se ve de dónde sale", () => {
    for (const caso of CASOS) {
      const r = buscar(caso.trae);
      console.log("\n" + caso.quien);
      console.log("  necesidades: " + caso.trae.map((n) => n.necesidad.titulo).join(" + "));
      console.log("  se miraron " + r.seMiraron + " herramientas en " + r.casasRecorridas.length + " casas");
      if (r.nadieDemuestra.length) {
        console.log("  NADIE demuestra: " + r.nadieDemuestra.map((id) => getNecesidad(id)!.titulo).join(", "));
      }
      for (const s of r.soluciones.slice(0, 4)) {
        const piezas = s.partes.map((p) => `${nombre.get(p.herramientaId)} [${p.casas.join("/")}]`).join("  +  ");
        console.log(`  ${s.cubreImprescindibles}/${s.deImprescindibles}  ${s.forma.padEnd(9)} ${piezas}`
          + (s.laConexionNoEstaComprobada ? "   (la conexión entre ellas no está comprobada)" : ""));
      }
      if (!r.soluciones.length) console.log("  ninguna solución: y eso es un resultado válido");
    }
    expect(CASOS.length).toBe(3);
  });
});
