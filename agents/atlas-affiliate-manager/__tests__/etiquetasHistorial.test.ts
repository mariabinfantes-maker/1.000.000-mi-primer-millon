import { describe, expect, it } from "vitest";
import { describirCampo, describirFecha, describirUsuario, describirValor } from "../etiquetasHistorial";

/**
 * El historial guarda nombres técnicos (`partnerstack.comision`) y valores
 * en JSON. Esta traducción es lo único que separa un registro de auditoría
 * legible de una pantalla llena de jerga.
 */

describe("describirCampo", () => {
  it("separa la cuenta del campo y traduce el campo", () => {
    expect(describirCampo("partnerstack.comision")).toEqual({
      cuentaId: "partnerstack",
      campo: "comision",
      etiqueta: "Comisión",
    });
  });

  it("traduce todos los campos de una cuenta a algo legible, sin dejar jerga", () => {
    const campos = [
      "estado",
      "plataforma",
      "nombrePrograma",
      "usuarioRegistro",
      "urlSolicitud",
      "fechaSolicitud",
      "fechaAprobacion",
      "comision",
      "duracionCookie",
      "metodoPago",
      "frecuenciaPago",
      "observaciones",
      "verificacionPendiente",
      "requisitosPrograma",
      "borradorSolicitud",
      "enlaces",
      "enlaceUltimaComprobacion",
      "enlaceComprobacionOk",
    ];

    for (const campo of campos) {
      const { etiqueta } = describirCampo(`cuenta.${campo}`);
      // Si no hubiera traducción, la etiqueta sería el nombre técnico tal cual.
      expect(etiqueta, `falta traducir "${campo}"`).not.toBe(campo);
      expect(etiqueta.length).toBeGreaterThan(0);
    }
  });

  it("no se rompe con un campo sin cuenta delante", () => {
    expect(describirCampo("comision")).toEqual({ cuentaId: "", campo: "comision", etiqueta: "Comisión" });
  });

  it("devuelve el nombre tal cual si es un campo que no conoce, en vez de fallar", () => {
    expect(describirCampo("cuenta.campoInventado").etiqueta).toBe("campoInventado");
  });
});

describe("describirValor", () => {
  it("marca como vacío lo que no tiene valor", () => {
    expect(describirValor(null)).toBe("(vacío)");
    expect(describirValor(undefined)).toBe("(vacío)");
    expect(describirValor("")).toBe("(vacío)");
  });

  it("traduce los booleanos a Sí/No en vez de true/false", () => {
    expect(describirValor(true)).toBe("Sí");
    expect(describirValor(false)).toBe("No");
  });

  it("devuelve el texto sin comillas añadidas", () => {
    expect(describirValor("20% recurrente")).toBe("20% recurrente");
  });

  it("describe una lista de enlaces por segmento, no como JSON crudo", () => {
    const enlaces = [
      { segmento: "global", url: "https://ejemplo.com/a" },
      { segmento: "ES", url: "https://ejemplo.com/b" },
    ];
    expect(describirValor(enlaces)).toBe("global: https://ejemplo.com/a · ES: https://ejemplo.com/b");
  });

  it("indica cuándo una lista está vacía", () => {
    expect(describirValor([])).toBe("(ninguno)");
  });
});

describe("describirUsuario", () => {
  it("distingue los procesos automáticos de una persona", () => {
    expect(describirUsuario("migracion-inicial")).toEqual({ nombre: "Migración inicial", esAutomatico: true });
    expect(describirUsuario("verificacion-tecnica").esAutomatico).toBe(true);
    expect(describirUsuario("sistema-promocion").esAutomatico).toBe(true);
  });

  it("deja el nombre tal cual si es una persona", () => {
    expect(describirUsuario("maria")).toEqual({ nombre: "maria", esAutomatico: false });
  });
});

describe("describirFecha", () => {
  it("convierte una fecha ISO en algo legible", () => {
    const texto = describirFecha("2026-08-26T14:30:00.000Z");
    expect(texto).not.toContain("T");
    expect(texto).not.toContain("Z");
    expect(texto).toContain("2026");
  });

  it("devuelve el texto original si no es una fecha válida, en vez de mostrar 'Invalid Date'", () => {
    expect(describirFecha("no-es-una-fecha")).toBe("no-es-una-fecha");
  });
});
