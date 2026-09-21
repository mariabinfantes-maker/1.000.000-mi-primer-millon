import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica } from "@/lib/vistaRecomendacion";
import { PRECIO_SIN_COMPROBAR, loQueTeCuesta, quePasaSiPulsas } from "@/lib/catalogoCompleto";

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
describe("una pregunta, una respuesta", () => {
  /**
   * La tarjeta decía cuatro cosas de dinero a la vez y dos se contradecían:
   * leías «Gratis, indefinido» y en la línea siguiente «necesitas 29 $». La
   * propietaria: «es demasiado confusa».
   */
  const agiled = { precioInicial: "Desde $24/mes", tienePlanGratuito: true, tipoPlanGratuito: "prueba" as const, pruebaGratuitaDias: 14 };

  it("con el plan sabido, contesta con su precio y explica cuál es debajo", () => {
    const r = loQueTeCuesta(agiled, "Starter", [{ nombre: "Starter", mensual: "29 $/mes", anual: "24 $/mes" }]);
    expect(r.cuanto).toBe("24 $/mes");
    expect(r.detalle).toBe("Es su plan Starter. Mes a mes son 29 $/mes.");
  });

  it("cuando lo que necesita entra en el plan gratuito, la respuesta es «Nada»", () => {
    const r = loQueTeCuesta(agiled, "Free", [{ nombre: "Free", mensual: "0 $" }]);
    expect(r.cuanto).toBe("Nada");
    expect(r.detalle).toBe("Con su plan Free tienes lo que necesitas.");
  });

  it("sin diagnóstico no finge una respuesta: dice desde cuánto empieza", () => {
    const r = loQueTeCuesta(agiled, undefined, [{ nombre: "Starter", mensual: "29 $/mes" }]);
    expect(r.cuanto).toBe("Desde $24/mes");
    expect(r.detalle).toBe("Gratis 14 días");
  });

  it("si sabemos el plan pero no su precio, tampoco lo inventa", () => {
    const r = loQueTeCuesta(agiled, "Growth", [{ nombre: "Starter", mensual: "29 $/mes" }]);
    expect(r.cuanto).toBe("Desde $24/mes");
  });
});

describe("lo último que lee antes de pulsar", () => {
  /**
   * «Probar gratis» a secas da miedo: ¿gratis cuánto?, ¿me piden la tarjeta?
   * Decirlo es lo que quita el último obstáculo. Lo señaló la propietaria:
   * «si el producto es bueno hay que saber cerrar una venta».
   */
  it("dice cuántos días tiene para probarla", () => {
    expect(quePasaSiPulsas({ tienePlanGratuito: true, tipoPlanGratuito: "prueba", pruebaGratuitaDias: 14 })).toBe(
      "Puedes probarla 14 días antes de pagar."
    );
  });

  it("y si el plan no caduca, lo dice así", () => {
    expect(quePasaSiPulsas({ tienePlanGratuito: true, tipoPlanGratuito: "indefinido" })).toBe(
      "Puedes usar su plan gratuito sin límite de tiempo."
    );
  });

  it("cuando no hay nada que prometer, no se inventa un consuelo", () => {
    expect(quePasaSiPulsas({ tienePlanGratuito: false })).toBeNull();
  });
});

describe("el botón va después del precio, no antes", () => {
  /**
   * Pedirle que pulse antes de decirle lo que cuesta es pedirle un salto a
   * ciegas. El orden es: consejo, lo que cuesta, qué pasa si pulsas, botón.
   */
  it("la tarjeta de coste se pinta antes que el botón", () => {
    const iCoste = RECOMENDACION.indexOf("<TarjetaLoQueCuesta");
    // El botón de verdad, no la palabra suelta en un comentario.
    const iBoton = RECOMENDACION.indexOf('{tienePlanGratuito ? "Probar gratis"');
    expect(iCoste).toBeGreaterThan(0);
    expect(iBoton).toBeGreaterThan(0);
    expect(iBoton, "el botón ha vuelto a colocarse encima del precio").toBeGreaterThan(iCoste);
  });
});
