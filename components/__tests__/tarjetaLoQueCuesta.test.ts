import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica } from "@/lib/vistaRecomendacion";
import { PRECIO_SIN_COMPROBAR, textoDelPlan } from "@/lib/catalogoCompleto";

/**
 * «Esta es la mejor en tu especialidad, y al lado o abajo una tarjeta que
 * explique el plan comercial.» — la propietaria, 2026-09-18.
 *
 * El consejo y las condiciones son dos cosas distintas y por eso van
 * separadas: la recomendación dice cuál le sirve —eso lo decide Molnip— y la
 * tarjeta dice lo que cuesta —eso lo decide ella—.
 *
 * Estas pruebas defienden esa separación, que es fácil de deshacer sin querer:
 * basta con que alguien vuelva a meter el precio «donde se ve mejor».
 */

const RECOMENDACION = fs.readFileSync("components/TarjetaHerramientaRecomendada.tsx", "utf8");

describe("la recomendación no habla de dinero", () => {
  it("no pinta el precio por su cuenta: sólo se lo pasa a la tarjeta de lo que cuesta", () => {
    // Renderizarlo sería `{precioInicial}`; pasarlo es `precioInicial={precioInicial}`.
    expect(
      RECOMENDACION.includes("{precioInicial}</"),
      "la recomendación ha vuelto a pintar el precio dentro"
    ).toBe(false);
    expect(RECOMENDACION).toContain("<TarjetaLoQueCuesta");
  });

  it("tampoco pinta la etiqueta del plan gratuito dentro", () => {
    const dentro = RECOMENDACION.split("<TarjetaLoQueCuesta")[0];
    expect(dentro.includes("textoPlanGratuito ??"), "la etiqueta del plan gratuito sigue dentro").toBe(false);
  });
});

describe("lo que la tarjeta recibe ya viene redactado", () => {
  const vistaDe = (id: string) => aVistaDeTarjetaGenerica(getHerramientas().find((h) => h.id === id)!, 1);

  it("una ficha con el precio comprobado trae la fecha y la dirección que se abrió", () => {
    const comprobada = getHerramientas().find((h) => h.preciosComprobados)!;
    const vista = vistaDe(comprobada.id);

    expect(vista.precioComprobado).toBe(true);
    expect(vista.comprobacionDelPrecio).toMatch(/^Precio comprobado en su web el /);
    // La dirección que se publica es la que se abrió de verdad, no otra.
    expect(vista.urlPrecios).toBe(comprobada.preciosComprobados!.url);
  });

  /**
   * Las cinco que no se pudieron comprobar lo dicen. Callarlo daría a entender
   * que ese precio está tan mirado como el de la tarjeta de al lado.
   */
  it("una ficha sin comprobar lo dice, en vez de callarlo", () => {
    const sinComprobar = getHerramientas().find((h) => !h.preciosComprobados);
    expect(sinComprobar, "ya no queda ninguna sin comprobar: actualiza esta prueba").toBeDefined();

    const vista = vistaDe(sinComprobar!.id);
    expect(vista.precioComprobado).toBe(false);
    expect(vista.comprobacionDelPrecio).toBe(PRECIO_SIN_COMPROBAR);
    expect(vista.comprobacionDelPrecio).not.toBe("");
  });

  it("todas las fichas del catálogo traen algo que decir sobre su precio", () => {
    const mudas = getHerramientas().filter((h) => {
      const vista = aVistaDeTarjetaGenerica(h, 1);
      return !vista.comprobacionDelPrecio || vista.comprobacionDelPrecio.trim() === "";
    });
    expect(mudas.map((h) => h.nombre)).toEqual([]);
  });
});

/**
 * El precio del escalón, que es lo que convierte «Growth» en algo útil.
 *
 * Lo cazó la propietaria preguntando «¿y qué quiere decir plan Growth?». El
 * nombre solo no dice nada; con el precio al lado da igual cómo se llame.
 */
describe("el plan lleva su precio pegado", () => {
  it("dice los dos precios cuando la página publica los dos", () => {
    expect(textoDelPlan("Growth", [{ nombre: "Growth", mensual: "109 $/usuario/mes", anual: "99 $/usuario/mes" }])).toBe(
      "109 $/usuario/mes, o 99 $/usuario/mes pagando un año entero"
    );
  });

  it("con uno solo, dice ese y no inventa el otro", () => {
    expect(textoDelPlan("Team", [{ nombre: "Team", anual: "10 $/usuario/mes" }])).toBe("10 $/usuario/mes");
  });

  it("de un plan que no está comprobado no dice nada: la tarjeta se queda con el nombre", () => {
    expect(textoDelPlan("Enterprise", [{ nombre: "Growth", mensual: "36 $" }])).toBeNull();
    expect(textoDelPlan("Growth", undefined)).toBeNull();
  });

  it("los precios guardados vienen en euros siempre que alguna lectura los consiguió", () => {
    const conPlanes = getHerramientas().filter((h) => h.planesComprobados);
    expect(conPlanes.length).toBeGreaterThan(40);
    // Decisión de la propietaria (2026-09-21): el euro es lo que vería su
    // cliente. Que haya fichas en dólares es un hecho —esas páginas no
    // sirvieron euros—, pero la moneda se guarda siempre, nunca se supone.
    for (const h of conPlanes) {
      expect(h.planesComprobados!.moneda, h.nombre).toMatch(/^(EUR|USD|GBP)$/);
      expect(h.planesComprobados!.url, h.nombre).toMatch(/^https:\/\//);
      for (const p of h.planesComprobados!.planes) {
        // Sin cita no se escribe un precio: la regla de estas tres semanas.
        expect(p.cita, `${h.nombre} / ${p.nombre}`).not.toBe("");
        expect(Boolean(p.mensual || p.anual), `${h.nombre} / ${p.nombre} sin ningún precio`).toBe(true);
      }
    }
  });
});
