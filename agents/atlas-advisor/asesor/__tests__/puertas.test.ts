import { describe, it, expect } from "vitest";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { aconsejar } from "..";
const imp = (id: string): NecesidadDelCaso => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" });
describe("las tres puertas", () => {
  it("se llenan con datos reales", () => {
    const c = aconsejar([imp("nec.que-reserven-solos"), imp("nec.emitir-una-factura-legal")]);
    const p = c.loQueHaria!.piezas[0];
    console.log("\n" + p.nombre);
    console.log("  QUÉ TE RESUELVE:");
    for (const q of p.queResuelve) console.log(`    · ${q.necesidad} — visto en ${q.url} el ${q.fecha}`);
    console.log("  COSTE: " + p.coste.desde + " · gratis: " + p.coste.tienePlanGratuito
      + " · curva: " + p.coste.curva + " · español: " + p.coste.enEspanol);
    console.log("    precio comprobado el " + p.coste.comprobadoEl + " en " + p.coste.urlPrecios);
    console.log("  FALTA POR CONFIRMAR:");
    for (const f of p.faltaPorConfirmar) console.log("    · " + f);
    expect(p.queResuelve.length).toBeGreaterThan(0);
    expect(p.coste.desde).toBeTruthy();
  });
});
