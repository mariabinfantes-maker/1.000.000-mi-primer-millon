import { describe, expect, it } from "vitest";
import { decidirEstadoAfiliacion, describirEstadoAfiliacion, esPruebaDeAusenciaValida } from "../estadoAfiliacion";

const PRUEBA = { cita: "We don't run an affiliate programme.", fuente: "https://ejemplo.test/faq" };

describe("decidirEstadoAfiliacion", () => {
  it('un programa activo y fiable es "confirmada"', () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: true, confidenceLevel: "high" })).toBe("confirmada");
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: true })).toBe("confirmada");
  });

  /**
   * La prueba central de todo el cambio.
   *
   * La regla anterior era `hasAffiliateProgram !== true`, y con ella un
   * campo que la investigación no llegó a rellenar se descartaba igual que
   * una ausencia demostrada. Es el mismo error que en F2: convertir "no lo
   * he encontrado" en "no lo tiene".
   */
  it('un campo sin rellenar es "no_consta", jamás una ausencia', () => {
    expect(decidirEstadoAfiliacion({})).toBe("no_consta");
    expect(decidirEstadoAfiliacion({ confidenceLevel: "high" })).toBe("no_consta");
  });

  it('"hasAffiliateProgram: false" por sí solo tampoco demuestra la ausencia', () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false })).toBe("no_consta");
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false, affiliateStatus: "not_available" })).toBe("no_consta");
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false, confidenceLevel: "high" })).toBe("no_consta");
  });

  it('solo una cita literal con fuente produce "ausencia_demostrada"', () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false }, PRUEBA)).toBe("ausencia_demostrada");
  });

  it("una prueba incompleta no vale", () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false }, { cita: "", fuente: PRUEBA.fuente })).toBe("no_consta");
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: false }, { cita: PRUEBA.cita, fuente: "  " })).toBe("no_consta");
  });

  it('un programa hallado con confianza "low" no se da por confirmado, pero tampoco por ausente', () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: true, confidenceLevel: "low" })).toBe("no_consta");
  });

  it("una investigación que se contradice no afirma ninguna de las dos cosas", () => {
    expect(decidirEstadoAfiliacion({ hasAffiliateProgram: true, confidenceLevel: "high" }, PRUEBA)).toBe("no_consta");
  });
});

describe("esPruebaDeAusenciaValida", () => {
  it("exige las dos mitades", () => {
    expect(esPruebaDeAusenciaValida(undefined)).toBe(false);
    expect(esPruebaDeAusenciaValida({ cita: "", fuente: "" })).toBe(false);
    expect(esPruebaDeAusenciaValida(PRUEBA)).toBe(true);
  });
});

describe("describirEstadoAfiliacion", () => {
  it('nunca dice "no tiene" cuando lo único que pasa es que no consta', () => {
    const texto = describirEstadoAfiliacion("no_consta", "ViDay");

    expect(texto).toContain("no consta");
    expect(texto).toContain("no es lo mismo que no exista");
    expect(texto).not.toContain("no tiene");
  });

  it("al describir una ausencia demostrada deja abierta la puerta del acuerdo directo", () => {
    expect(describirEstadoAfiliacion("ausencia_demostrada", "ViDay")).toContain("acuerdo directo");
  });
});
