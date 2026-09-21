import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { aVistaDeTarjetaGenerica } from "@/lib/vistaRecomendacion";
import { PRECIO_SIN_COMPROBAR, filasDeLoQueCuesta } from "@/lib/catalogoCompleto";

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
describe("toda la información, pero ordenada", () => {
  /**
   * Dos intentos fallaron por lo mismo: una pila de frases sueltas sobre
   * dinero, en la que «Gratis, indefinido» y «necesitas 29 $» parecían
   * discutir. La propietaria lo cortó dos veces —«es demasiado confusa», «no
   * me gusta»— y dio la regla: «que tenga toda la información pero ordenada,
   * que el cliente la pueda entender».
   *
   * No se quita nada. Se estructura: la respuesta arriba y el resto en filas.
   */
  const agiled = { precioInicial: "Desde $24/mes", tienePlanGratuito: true, tipoPlanGratuito: "indefinido" as const };
  const planes = [{ nombre: "Starter", mensual: "29 $/mes", anual: "24 $/mes" }];

  it("contesta con lo que le cuesta a ella y ordena el resto en filas", () => {
    const r = filasDeLoQueCuesta(agiled, "Starter", planes);
    expect(r.respuesta).toBe("24 $/mes");
    expect(r.filas).toEqual([
      { concepto: "Con su plan", dato: "Starter" },
      { concepto: "Pagando mes a mes", dato: "29 $/mes" },
      { concepto: "También tiene", dato: "Un plan gratuito que no caduca" },
    ]);
  });

  /**
   * Lo que ofrece su paquete NO se esconde: es información suya y la persona
   * tiene derecho a verla. La propietaria lo corrigió cuando lo quité:
   * «yo no he dicho de quitar la información que trae el paquete de ellos».
   */
  it("la prueba gratuita también sale, con sus días", () => {
    const conPrueba = { ...agiled, tipoPlanGratuito: "prueba" as const, pruebaGratuitaDias: 14 };
    const r = filasDeLoQueCuesta(conPrueba, "Starter", planes);
    expect(r.filas).toContainEqual({ concepto: "También tiene", dato: "14 días de prueba gratis" });
  });

  it("cuando lo que necesita entra en el plan gratuito, la respuesta es «Nada» y no se repite", () => {
    const r = filasDeLoQueCuesta(agiled, "Free", [{ nombre: "Free", mensual: "0 $" }]);
    expect(r.respuesta).toBe("Nada");
    expect(r.filas).toEqual([{ concepto: "Con su plan", dato: "Free" }]);
  });

  it("sin diagnóstico no finge una respuesta: dice desde cuánto empieza", () => {
    const r = filasDeLoQueCuesta(agiled, undefined, planes);
    expect(r.respuesta).toBe("Desde $24/mes");
    expect(r.filas.some((f) => f.concepto === "Con su plan")).toBe(false);
  });

  it("si sabemos el plan pero no su precio, tampoco lo inventa", () => {
    const r = filasDeLoQueCuesta(agiled, "Growth", planes);
    expect(r.respuesta).toBe("Desde $24/mes");
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
