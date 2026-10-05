import { describe, expect, it } from "vitest";
import { herramientasDelCatalogo, indiceDeInvestigacion, queSabemosDe } from "../queSabemos";
import { informe } from "../cli-que-sabemos";

/**
 * «¿QUÉ SABEMOS DE X?» encuentra lo que está guardado aunque no esté en la
 * ficha. Nace del caso DriCloud (2026-10-05): se dijo «no tenemos guardado si
 * ofrece una prueba gratuita» mirando sólo la ficha, y la entrega del 30 de
 * septiembre lo decía.
 */
describe("qué sabemos de una herramienta", () => {
  it("DriCloud: encuentra el porqué del plan gratuito, que la ficha no guarda", () => {
    const s = queSabemosDe("dricloud")!;
    expect(s.ficha?.tienePlanGratuito).toBe(false);
    expect(s.ficha?.fundamentoPlanGratuito).toBeUndefined();
    const texto = informe(s);
    expect(texto).toContain("La demostración gratuita no es un plan.");
    expect(texto).toContain("data/investigacion/las-siete-2026-09-30/crudo/dricloud-flowww-crudo.json");
  });

  it("todas las herramientas del catálogo tienen alguna entrega de investigación enlazada", () => {
    const hs = herramientasDelCatalogo();
    const idx = indiceDeInvestigacion(hs);
    const sinNada = hs.filter((h) => !(idx.entregas.get(h.id) ?? []).some((e) => !e.soloPorNombre));
    expect(sinNada.map((h) => h.id)).toEqual([]);
  });

  it("un id que no existe no inventa nada", () => {
    expect(queSabemosDe("no-existe-esta-herramienta")).toBeNull();
  });
});
