import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { CRITERIOS_VACIOS, filtrarCatalogo, type FilaDeCatalogo } from "@/lib/catalogoCompleto";
import { comoSeDiceLaEntrada } from "@/app/asesor/entradaSinCoste";

/**
 * EL LISTADO DICE LA ENTRADA SIN COSTE COMO EL ASESOR. Propietaria, 2026-10-06.
 *
 * «Entrada sin coste» es la categoría que agrupa; «Plan gratuito» y «Prueba
 * gratuita» son lo que ofrece cada herramienta. Hasta este día el listado de
 * `/herramientas` llamaba «Plan gratuito» a todas, también a las pruebas, y su
 * filtro se llamaba «Con plan gratuito». Se corrige la presentación, no quién
 * entra en el filtro.
 */

// Sin comentarios: el código explica qué decía antes, y eso no se pinta.
const sinComentarios = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const CATALOGO = sinComentarios(fs.readFileSync("components/CatalogoCompleto.tsx", "utf8"));
const PAGINA = sinComentarios(fs.readFileSync("app/herramientas/page.tsx", "utf8"));

describe("el listado de /herramientas", () => {
  it("el filtro se llama «Entrada sin coste»", () => {
    expect(CATALOGO).toContain("Entrada sin coste");
    expect(CATALOGO).not.toContain("Con plan gratuito");
  });

  it("la etiqueta de cada tarjeta sale de la misma función que el asesor", () => {
    expect(CATALOGO).toContain("{comoSeDiceLaEntrada(fila)}");
    expect(PAGINA).toContain("tipoPlanGratuito: herramienta.tipoPlanGratuito");
    expect(PAGINA).toContain("pruebaGratuitaDias: herramienta.pruebaGratuitaDias");
  });

  it("la cabecera lo dice en lenguaje natural", () => {
    expect(PAGINA).toContain("por si puedes empezar sin pagar");
    expect(PAGINA).not.toContain("por si tienen plan gratuito");
  });

  it("en el filtro entran exactamente las que tienen entrada sin coste, como antes", () => {
    const hs = getHerramientas();
    const filas = hs.map((h) => ({ ...h, categoriaNombre: h.categoriaId, esTodoEnUno: false, disponibleEnEspanol: false, puntuacionAtlas: null, comprobado: null }) as unknown as FilaDeCatalogo);
    const enElFiltro = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, soloGratis: true }).map((f) => f.id).sort();
    expect(enElFiltro).toEqual(hs.filter((h) => h.tienePlanGratuito).map((h) => h.id).sort());
  });

  it("cada herramienta del filtro se dice como lo que es", () => {
    const porTexto = new Map<string, string>();
    for (const h of getHerramientas()) {
      if (!h.tienePlanGratuito) continue;
      porTexto.set(h.id, comoSeDiceLaEntrada(h)!);
      if (h.tipoPlanGratuito === "prueba") expect(porTexto.get(h.id), h.id).toMatch(/^Prueba gratuita/);
      else expect(porTexto.get(h.id), h.id).toBe("Plan gratuito");
    }
    expect(porTexto.get("archivex")).toBe("Prueba gratuita de 7 días");
    expect(porTexto.get("keap")).toBe("Prueba gratuita");
    expect(porTexto.get("agile-crm")).toBe("Plan gratuito");
  });
});
