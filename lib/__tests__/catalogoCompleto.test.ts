import { describe, expect, it } from "vitest";
import { getHerramientas, getTodasLasCategorias } from "@/data/repositorio";
import { esSuite } from "@/data/taxonomia";
import { CRITERIOS_VACIOS, filtrarCatalogo, hayFiltro, type FilaDeCatalogo } from "@/lib/catalogoCompleto";

/**
 * «Todas las herramientas» tiene una promesa muy corta y muy fácil de romper:
 * que estén TODAS. Un filtro mal puesto, una categoría que no cuadra o un
 * campo ausente y la persona deja de ver algo sin enterarse — que es peor que
 * no tener la página, porque la página promete que lo está viendo todo.
 *
 * Por eso estas comprobaciones corren sobre el catálogo real, no sobre datos
 * inventados.
 */

const nombrePorCategoria = new Map(getTodasLasCategorias().map((c) => [c.id, c.nombre]));

const filas: FilaDeCatalogo[] = getHerramientas().map((h) => ({
  id: h.id,
  nombre: h.nombre,
  descripcion: h.descripcion,
  categoriaId: h.categoriaId,
  categoriaNombre: nombrePorCategoria.get(h.categoriaId) ?? h.categoriaId,
  esTodoEnUno: esSuite(h),
  precioInicial: h.precioInicial,
  tienePlanGratuito: h.tienePlanGratuito,
  disponibleEnEspanol: h.disponibleEnEspanol ?? false,
  puntuacionAtlas: null,
}));

describe("el catálogo completo se ve entero", () => {
  it("sin filtros están todas las herramientas activas, ni una menos", () => {
    expect(filtrarCatalogo(filas, CRITERIOS_VACIOS)).toHaveLength(getHerramientas().length);
  });

  it("cada herramienta cae en todo en uno o en especializada, nunca en ninguna de las dos", () => {
    const suites = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, tipo: "todo_en_uno" });
    const especializadas = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, tipo: "especializada" });
    expect(suites.length + especializadas.length).toBe(filas.length);
    expect(suites.some((s) => especializadas.includes(s))).toBe(false);
    // Las dos tienen contenido: si alguna se quedara vacía, el filtro sería un adorno.
    expect(suites.length).toBeGreaterThan(0);
    expect(especializadas.length).toBeGreaterThan(0);
  });

  it("toda herramienta enseña el nombre de su categoría, no su identificador", () => {
    const sinNombre = filas.filter((f) => f.categoriaNombre === f.categoriaId);
    expect(sinNombre.map((f) => f.nombre)).toEqual([]);
  });
});

describe("los filtros quitan, nunca añaden", () => {
  it("cada filtro devuelve un subconjunto de lo anterior", () => {
    const todas = filtrarCatalogo(filas, CRITERIOS_VACIOS);
    const enEspanol = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, soloEspanol: true });
    const enEspanolYGratis = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, soloEspanol: true, soloGratis: true });
    expect(enEspanol.length).toBeLessThanOrEqual(todas.length);
    expect(enEspanolYGratis.length).toBeLessThanOrEqual(enEspanol.length);
    expect(enEspanolYGratis.every((f) => f.disponibleEnEspanol && f.tienePlanGratuito)).toBe(true);
  });

  it("los filtros no reordenan: el orden que entra es el que sale", () => {
    const filtradas = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, soloEspanol: true });
    const esperado = filas.filter((f) => f.disponibleEnEspanol).map((f) => f.id);
    expect(filtradas.map((f) => f.id)).toEqual(esperado);
  });

  it("la búsqueda no distingue acentos ni mayúsculas", () => {
    const conAcento = filas.find((f) => /[áéíóúñ]/i.test(f.nombre + f.descripcion));
    expect(conAcento, "el catálogo debería tener algún texto con acentos").toBeDefined();
    const sinAcentos = conAcento!.nombre.normalize("NFD").replace(/[̀-ͯ]/g, "");
    const encontradas = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, busqueda: sinAcentos.toUpperCase() });
    expect(encontradas.map((f) => f.id)).toContain(conAcento!.id);
  });

  it("la búsqueda también mira la categoría, porque quien busca no sabe si es un nombre o un tipo", () => {
    const categoria = filas[0].categoriaNombre;
    const encontradas = filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, busqueda: categoria });
    expect(encontradas.length).toBeGreaterThan(0);
  });

  it("una búsqueda sin resultados devuelve vacío, no el catálogo entero", () => {
    expect(filtrarCatalogo(filas, { ...CRITERIOS_VACIOS, busqueda: "zzzzz-no-existe" })).toEqual([]);
  });
});

describe("saber si hay algo puesto", () => {
  it("sin criterios no hay filtro", () => {
    expect(hayFiltro(CRITERIOS_VACIOS)).toBe(false);
  });

  it("un espacio en blanco tampoco cuenta como búsqueda", () => {
    expect(hayFiltro({ ...CRITERIOS_VACIOS, busqueda: "   " })).toBe(false);
  });

  it("cualquier criterio puesto se nota", () => {
    expect(hayFiltro({ ...CRITERIOS_VACIOS, tipo: "todo_en_uno" })).toBe(true);
    expect(hayFiltro({ ...CRITERIOS_VACIOS, soloGratis: true })).toBe(true);
    expect(hayFiltro({ ...CRITERIOS_VACIOS, categoriaId: "crm" })).toBe(true);
  });
});
