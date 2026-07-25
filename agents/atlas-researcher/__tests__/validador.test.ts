import { describe, expect, it } from "vitest";
import { CAMPOS_INVESTIGABLES_OBLIGATORIOS } from "../camposEsquema";
import type { SolicitudInvestigacion } from "../tipos";
import { validarPropuesta } from "../validador";

const solicitud: SolicitudInvestigacion = { nombreHerramienta: "HubSpot" };

/** Un juego de datos que rellena todos los campos investigables obligatorios, para probar el camino "completo". */
function datosCompletos(): Record<string, unknown> {
  const datos: Record<string, unknown> = {};
  for (const campo of CAMPOS_INVESTIGABLES_OBLIGATORIOS) {
    datos[campo] = campo === "tienePlanGratuito" ? true : `valor de prueba para ${campo}`;
  }
  return datos;
}

describe("validarPropuesta", () => {
  it("nunca lanza, incluso con entradas que no son un objeto", () => {
    for (const entrada of [null, undefined, "texto plano", 42, ["a", "b"]]) {
      expect(() => validarPropuesta(entrada, solicitud)).not.toThrow();
    }
  });

  it("marca todos los campos obligatorios como faltantes (salvo nombre, que se rellena con la solicitud) cuando la respuesta no es un objeto", () => {
    const propuesta = validarPropuesta("no soy JSON", solicitud);

    expect(propuesta.datos.nombre).toBe("HubSpot");
    expect(propuesta.camposFaltantes).toEqual(
      CAMPOS_INVESTIGABLES_OBLIGATORIOS.filter((campo) => campo !== "nombre")
    );
    expect(propuesta.confianza).toBe("baja");
    expect(propuesta.advertencias.length).toBeGreaterThan(0);
  });

  it('usa el nombre de la solicitud si la respuesta no incluye "datos"', () => {
    const propuesta = validarPropuesta({ fuentes: [] }, solicitud);

    expect(propuesta.datos.nombre).toBe("HubSpot");
    expect(propuesta.advertencias.some((a) => a.includes('"datos"'))).toBe(true);
  });

  it("sin ninguna fuente citada, la confianza es baja aunque los datos estén completos", () => {
    const propuesta = validarPropuesta({ datos: datosCompletos(), fuentes: [] }, solicitud);

    expect(propuesta.camposFaltantes).toEqual([]);
    expect(propuesta.confianza).toBe("baja");
    expect(propuesta.advertencias.some((a) => a.includes("fuente"))).toBe(true);
  });

  it("con datos completos y al menos una fuente, la confianza es alta", () => {
    const propuesta = validarPropuesta(
      { datos: datosCompletos(), fuentes: ["https://ejemplo.test/hubspot"] },
      solicitud
    );

    expect(propuesta.camposFaltantes).toEqual([]);
    expect(propuesta.confianza).toBe("alta");
    expect(propuesta.fuentes).toEqual(["https://ejemplo.test/hubspot"]);
  });

  it("con pocos campos faltantes y alguna fuente, la confianza es media", () => {
    const datos = datosCompletos();
    delete datos.descripcion;
    delete datos.ventajas;

    const propuesta = validarPropuesta({ datos, fuentes: ["https://ejemplo.test"] }, solicitud);

    expect(propuesta.camposFaltantes).toEqual(expect.arrayContaining(["descripcion", "ventajas"]));
    expect(propuesta.confianza).toBe("media");
  });

  it("con muchos campos faltantes, la confianza es baja aunque haya fuentes", () => {
    const propuesta = validarPropuesta(
      { datos: { descripcion: "Algo" }, fuentes: ["https://ejemplo.test"] },
      solicitud
    );

    expect(propuesta.camposFaltantes.length).toBeGreaterThan(3);
    expect(propuesta.confianza).toBe("baja");
  });

  it("ignora fuentes que no sean texto", () => {
    const propuesta = validarPropuesta({ datos: {}, fuentes: ["https://ok.test", 123, null] }, solicitud);
    expect(propuesta.fuentes).toEqual(["https://ok.test"]);
  });

  it("trata los campos de texto vacío como campos faltantes", () => {
    const datos = datosCompletos();
    datos.descripcion = "   ";

    const propuesta = validarPropuesta({ datos, fuentes: ["https://ejemplo.test"] }, solicitud);
    expect(propuesta.camposFaltantes).toContain("descripcion");
  });
});
