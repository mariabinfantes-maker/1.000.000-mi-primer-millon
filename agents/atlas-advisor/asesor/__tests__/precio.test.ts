import { describe, expect, it } from "vitest";
import { comoSeDice, importeDelPlanQueCubre, sonComparables, sumar } from "../precio";

const ficha = (moneda: string, planes: { nombre: string; mensual?: string; anual?: string; cita: string }[]) =>
  ({ planesComprobados: { moneda, planes } }) as any;

describe("un importe sólo se construye cuando de verdad se puede comparar", () => {
  it("hace falta el plan que cubre la necesidad, no el de entrada", () => {
    const h = ficha("EUR", [{ nombre: "Pro", mensual: "29", cita: "Pro 29 €/mes" }]);
    expect(importeDelPlanQueCubre(h, undefined)).toBeNull();
    expect(importeDelPlanQueCubre(h, "Pro")?.cantidad).toBe(29);
  });

  it("si F2 nombra un plan que la tarifa no tiene, no hay importe", () => {
    const h = ficha("USD", [{ nombre: "Business", mensual: "39", cita: "Business $39/mo" }]);
    expect(importeDelPlanQueCubre(h, "Enterprise")).toBeNull();
  });

  /**
   * «Desde 9 €» no es un precio, es una condición: quiere decir que hay algo
   * que cuesta más. Cogerle el 9 es justo lo que hacía el desempate viejo.
   */
  it("un texto que contiene un número no es un precio", () => {
    const h = ficha("EUR", [
      { nombre: "A", mensual: "desde 9 €", cita: "x" },
      { nombre: "B", mensual: "Consultar", cita: "x" },
      { nombre: "C", mensual: "15,90 €", cita: "x" },
    ]);
    expect(importeDelPlanQueCubre(h, "A")).toBeNull();
    expect(importeDelPlanQueCubre(h, "B")).toBeNull();
    expect(importeDelPlanQueCubre(h, "C")?.cantidad).toBe(15.9);
  });

  it("distingue lo que se cobra por persona de lo que se cobra por negocio", () => {
    const porPersona = ficha("EUR", [{ nombre: "Pro", mensual: "12", cita: "12 € por usuario y mes" }]);
    const porNegocio = ficha("EUR", [{ nombre: "Pro", mensual: "12", cita: "12 € al mes, usuarios ilimitados" }]);
    expect(importeDelPlanQueCubre(porPersona, "Pro")?.porUsuario).toBe(true);
    expect(importeDelPlanQueCubre(porNegocio, "Pro")?.porUsuario).toBe(false);
  });
});

describe("dólares y euros no se comparan, y aquí no se convierten", () => {
  const eur = { cantidad: 15.9, moneda: "EUR", periodo: "mensual" as const, porUsuario: false, plan: "A" };
  const usd = { cantidad: 9, moneda: "USD", periodo: "mensual" as const, porUsuario: false, plan: "B" };
  const anual = { cantidad: 99, moneda: "EUR", periodo: "anual" as const, porUsuario: false, plan: "C" };
  const persona = { cantidad: 12, moneda: "EUR", periodo: "mensual" as const, porUsuario: true, plan: "D" };

  /** El caso exacto que decidía mal: «$9 USD/mes» le ganaba a «15,90 €». */
  it("distinta moneda: no comparables", () => {
    expect(sonComparables([eur, usd])).toBe(false);
  });
  it("distinta periodicidad: no comparables", () => {
    expect(sonComparables([eur, anual])).toBe(false);
  });
  it("uno por persona y otro por negocio: no comparables", () => {
    expect(sonComparables([eur, persona])).toBe(false);
  });
  it("todo igual: comparables", () => {
    expect(sonComparables([eur, { ...eur, cantidad: 20, plan: "E" }])).toBe(true);
  });
  it("uno solo no es una comparación", () => {
    expect(sonComparables([eur])).toBe(false);
  });

  it("sumar dos piezas sólo vale si se pueden sumar", () => {
    expect(sumar([eur, usd])).toBeNull();
    expect(sumar([eur, null])).toBeNull();
    expect(sumar([eur, { ...eur, cantidad: 10, plan: "E" }])?.cantidad).toBeCloseTo(25.9);
  });

  it("lo dice sin traducir la moneda ni redondear", () => {
    expect(comoSeDice(eur)).toBe("15,9 € al mes");
    expect(comoSeDice(persona)).toBe("12 € por persona al mes");
    expect(comoSeDice(usd)).toBe("9 $ al mes");
  });
});
