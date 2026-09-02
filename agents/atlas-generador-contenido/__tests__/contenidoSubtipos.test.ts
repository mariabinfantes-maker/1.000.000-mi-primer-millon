import { describe, expect, it } from "vitest";
import { SUBTIPOS_POR_CATEGORIA, MINIMO_POR_SUBTIPO, cubreSubtipo, subtipoDeCategoria } from "@/data/taxonomia";
import { getHerramientasPorCategoria } from "@/data/repositorio";
import { contenidoDeSubtipo, subtiposConContenido } from "../contenidoSubtipos";
import { generarEntradasSitemap } from "../sitemap";
import { metadataSubtipo } from "../metadatos";
import { construirDatosEstructuradosSubtipo } from "../datosEstructurados";

const CATEGORIA = "asistentes-ia";

describe("contenido editorial de subtipos", () => {
  it("los seis subtipos de asistentes-ia tienen contenido escrito", () => {
    const declarados = SUBTIPOS_POR_CATEGORIA[CATEGORIA].map((s) => s.id);
    const conContenido = subtiposConContenido(CATEGORIA).map((s) => s.id);
    expect(conContenido).toEqual(declarados);
  });

  /**
   * La razón de ser de este fichero: seis páginas iguales cambiando una
   * palabra son contenido pobre y perjudican al dominio entero. Esta prueba
   * mide que cada texto es realmente distinto, no que "existe".
   */
  it("ningún texto se repite entre subtipos", () => {
    const textos = subtiposConContenido(CATEGORIA).map((s) => contenidoDeSubtipo(s.id)!);
    const campos = ["titulo", "tituloSeo", "descripcionSeo", "entradilla", "errorHabitual"] as const;
    for (const campo of campos) {
      const valores = textos.map((t) => t[campo]);
      expect(new Set(valores).size, `"${campo}" está repetido entre subtipos`).toBe(valores.length);
    }
    const ejes = textos.map((t) => t.ejeDeDecision.texto);
    expect(new Set(ejes).size).toBe(ejes.length);
    const preguntas = textos.flatMap((t) => t.comoElegir.map((c) => c.pregunta));
    expect(new Set(preguntas).size, "hay preguntas de 'cómo elegir' repetidas").toBe(preguntas.length);
  });

  it("cada subtipo aporta sustancia suficiente para justificar una página", () => {
    for (const subtipo of subtiposConContenido(CATEGORIA)) {
      const c = contenidoDeSubtipo(subtipo.id)!;
      expect(c.entradilla.length, `entradilla de ${subtipo.id}`).toBeGreaterThan(180);
      expect(c.ejeDeDecision.texto.length, `eje de ${subtipo.id}`).toBeGreaterThan(250);
      expect(c.comoElegir.length, `criterios de ${subtipo.id}`).toBe(3);
      for (const criterio of c.comoElegir) {
        expect(criterio.explicacion.length, `criterio "${criterio.pregunta}"`).toBeGreaterThan(100);
      }
      expect(c.errorHabitual.length, `error habitual de ${subtipo.id}`).toBeGreaterThan(100);
      expect(c.descripcionSeo.length, `descripción SEO de ${subtipo.id}`).toBeGreaterThan(110);
    }
  });

  it("solo se publican subtipos con alternativas suficientes para comparar", () => {
    const herramientas = getHerramientasPorCategoria(CATEGORIA);
    for (const subtipo of subtiposConContenido(CATEGORIA)) {
      const cuantas = herramientas.filter((h) => cubreSubtipo(h, subtipo.id)).length;
      expect(cuantas, `el subtipo "${subtipo.id}" se publicaría con ${cuantas} herramienta(s)`).toBeGreaterThanOrEqual(
        MINIMO_POR_SUBTIPO
      );
    }
  });
});

describe("validación del subtipo que llega por la dirección", () => {
  it("acepta un subtipo real de esa categoría", () => {
    expect(subtipoDeCategoria(CATEGORIA, "presentaciones")?.nombre).toBe("Presentaciones y documentos");
  });

  it("rechaza un subtipo inventado, uno vacío y uno de otra categoría", () => {
    expect(subtipoDeCategoria(CATEGORIA, "no-existe")).toBeUndefined();
    expect(subtipoDeCategoria(CATEGORIA, undefined)).toBeUndefined();
    expect(subtipoDeCategoria(CATEGORIA, "")).toBeUndefined();
    // "crm" es una categoría, nunca un subtipo: no debe colarse por parecerse a un slug válido.
    expect(subtipoDeCategoria(CATEGORIA, "crm")).toBeUndefined();
    // Una categoría sin subtipos no acepta ninguno, ni siquiera uno real de otra.
    expect(subtipoDeCategoria("crm", "presentaciones")).toBeUndefined();
  });
});

describe("sitemap y metadatos de subtipo", () => {
  it("las seis rutas de subtipo entran en el sitemap, sin duplicados", () => {
    const rutas = generarEntradasSitemap().map((e) => e.ruta);
    for (const subtipo of subtiposConContenido(CATEGORIA)) {
      expect(rutas).toContain(`/categoria/${CATEGORIA}/subtipo/${subtipo.id}`);
    }
    expect(new Set(rutas).size, "el sitemap tiene rutas duplicadas").toBe(rutas.length);
  });

  it("ninguna otra categoría añade rutas de subtipo", () => {
    const deSubtipo = generarEntradasSitemap().filter((e) => e.ruta.includes("/subtipo/"));
    expect(deSubtipo).toHaveLength(6);
    for (const entrada of deSubtipo) {
      expect(entrada.ruta.startsWith(`/categoria/${CATEGORIA}/subtipo/`)).toBe(true);
    }
  });

  it("cada página declara su propio canonical y es indexable", () => {
    for (const subtipo of subtiposConContenido(CATEGORIA)) {
      const meta = metadataSubtipo(CATEGORIA, subtipo.id, contenidoDeSubtipo(subtipo.id)!);
      expect(String(meta.alternates?.canonical)).toContain(`/categoria/${CATEGORIA}/subtipo/${subtipo.id}`);
      // `robots` solo se declara para marcar noindex; su ausencia significa indexable.
      expect(meta.robots).toBeUndefined();
    }
  });

  it("los datos estructurados listan las herramientas en orden y sin valoraciones inventadas", () => {
    const herramientas = getHerramientasPorCategoria(CATEGORIA).filter((h) => cubreSubtipo(h, "presentaciones"));
    const datos = construirDatosEstructuradosSubtipo(
      "IA para presentaciones",
      "descripción",
      `/categoria/${CATEGORIA}/subtipo/presentaciones`,
      herramientas
    );
    expect(datos["@type"]).toBe("ItemList");
    expect(datos.numberOfItems).toBe(herramientas.length);
    const serializado = JSON.stringify(datos);
    expect(serializado).not.toContain("aggregateRating");
    expect(serializado).not.toContain("offers");
    const elementos = datos.itemListElement as { position: number }[];
    expect(elementos.map((e) => e.position)).toEqual(herramientas.map((_, i) => i + 1));
  });
});
