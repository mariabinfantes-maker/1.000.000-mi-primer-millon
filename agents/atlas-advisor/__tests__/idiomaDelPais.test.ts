import { describe, expect, it } from "vitest";
import { conIdiomaDelPais, recomendarHerramientas } from "../motor";
import { construirHerramienta } from "./fixtures";
import { aVistaDeTarjeta } from "@/lib/vistaRecomendacion";
import { idiomaDePais, facturaEnEspana, PAISES } from "@/lib/pais";

/**
 * Paso 1 del camino A (2026-09-17): «que Molnip sepa con quién habla».
 *
 * Lo que se comprueba aquí es una regla de producto que decidió la
 * propietaria, no una preferencia de implementación:
 *
 *  - se pregunta el PAÍS, y el idioma se deduce — preguntar el idioma es
 *    preguntar por la solución;
 *  - quien DECLARA no estar en ese idioma se aparta, porque no le sirve;
 *  - de quien NO CONSTA no se dice que no lo tenga: se enseña y se avisa;
 *  - y si apartar dejara a la persona sin nada, no se aparta a nadie.
 */

const enEspanol = construirHerramienta({
  id: "en-espanol",
  nombre: "En Español",
  categoriaId: "crm",
  disponibleEnEspanol: true,
  idiomasDisponibles: ["español", "inglés"],
});

const soloEnIngles = construirHerramienta({
  id: "solo-ingles",
  nombre: "Solo Inglés",
  categoriaId: "crm",
  disponibleEnEspanol: false,
  idiomasDisponibles: ["inglés"],
});

const noConsta = construirHerramienta({
  id: "no-consta",
  nombre: "No Consta",
  categoriaId: "crm",
  idiomasDisponibles: ["inglés"],
});

const catalogo = [enEspanol, soloEnIngles, noConsta];

describe("el país dice el idioma", () => {
  it("deduce el idioma del país sin que nadie lo escriba", () => {
    expect(conIdiomaDelPais({ pais: "ES" }).idiomaNecesario).toBe("español");
    expect(conIdiomaDelPais({ pais: "MX" }).idiomaNecesario).toBe("español");
  });

  it("no inventa idioma cuando el país no lo dice", () => {
    expect(conIdiomaDelPais({ pais: "OTRO" }).idiomaNecesario).toBeUndefined();
    expect(conIdiomaDelPais({}).idiomaNecesario).toBeUndefined();
    expect(idiomaDePais("XX")).toBeUndefined();
  });

  it("respeta un idioma puesto a mano por encima del país", () => {
    expect(conIdiomaDelPais({ pais: "ES", idiomaNecesario: "inglés" }).idiomaNecesario).toBe("inglés");
  });

  it("sabe quién factura en España", () => {
    expect(facturaEnEspana("ES")).toBe(true);
    expect(facturaEnEspana("MX")).toBe(false);
    expect(facturaEnEspana(undefined)).toBe(false);
  });

  it("todos los países de habla hispana de la lista deducen español", () => {
    const hispanos = PAISES.filter((pais) => pais.codigo !== "OTRO");
    expect(hispanos.every((pais) => pais.idioma === "español")).toBe(true);
    expect(PAISES.find((pais) => pais.codigo === "OTRO")?.idioma).toBeUndefined();
  });
});

describe("la que declara no hablar su idioma no es candidata", () => {
  it("aparta a la que declara no estar en español cuando el negocio está en España", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm", pais: "ES" }, catalogo);
    const ids = resultado.todas.map((evaluada) => evaluada.herramienta.id);
    expect(ids).toContain("en-espanol");
    expect(ids).not.toContain("solo-ingles");
  });

  it("no aparta a la que no consta: la enseña", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm", pais: "ES" }, catalogo);
    expect(resultado.todas.map((evaluada) => evaluada.herramienta.id)).toContain("no-consta");
  });

  it("sin país no aparta a nadie", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm" }, catalogo);
    expect(resultado.todas).toHaveLength(3);
  });

  it("si apartarlas dejara a la persona sin nada, no aparta a ninguna", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm", pais: "ES" }, [soloEnIngles]);
    expect(resultado.todas.map((evaluada) => evaluada.herramienta.id)).toEqual(["solo-ingles"]);
  });
});

describe("lo que no consta se dice", () => {
  it("avisa en la tarjeta cuando el idioma no está confirmado", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm", pais: "ES" }, catalogo);
    const sinConfirmar = resultado.todas.find((evaluada) => evaluada.herramienta.id === "no-consta")!;
    const vista = aVistaDeTarjeta(sinConfirmar, 1);
    expect(vista.idiomaSinConfirmar).toContain("No hemos confirmado");
    expect(vista.idiomaSinConfirmar).toContain("español");
  });

  it("no avisa de nada cuando el idioma sí está confirmado", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm", pais: "ES" }, catalogo);
    const confirmada = resultado.todas.find((evaluada) => evaluada.herramienta.id === "en-espanol")!;
    expect(aVistaDeTarjeta(confirmada, 1).idiomaSinConfirmar).toBeUndefined();
  });

  it("no avisa de nada cuando nadie ha dicho dónde tiene el negocio", () => {
    const resultado = recomendarHerramientas({ categoriaId: "crm" }, catalogo);
    const sinConfirmar = resultado.todas.find((evaluada) => evaluada.herramienta.id === "no-consta")!;
    expect(aVistaDeTarjeta(sinConfirmar, 1).idiomaSinConfirmar).toBeUndefined();
  });
});
