import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica } from "@/lib/vistaRecomendacion";
import { PRECIO_SIN_COMPROBAR } from "@/lib/catalogoCompleto";

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
