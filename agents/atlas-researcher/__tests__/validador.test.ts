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

  describe("AffiliateData (información interna de afiliación)", () => {
    it("se guarda por completo separada de datos (la ficha pública)", () => {
      const propuesta = validarPropuesta(
        {
          datos: { nombre: "HubSpot", descripcion: "Un CRM." },
          affiliateData: { hasAffiliateProgram: true, affiliateUrl: "https://ejemplo.test/afiliados" },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      expect(propuesta.datosAfiliados.hasAffiliateProgram).toBe(true);
      expect(propuesta.datos).not.toHaveProperty("hasAffiliateProgram");
      expect(propuesta.datos).not.toHaveProperty("affiliateUrl");
      expect(propuesta.datosAfiliados).not.toHaveProperty("nombre");
      expect(propuesta.datosAfiliados).not.toHaveProperty("descripcion");
    });

    it("estampa lastAffiliateCheck con la fecha de hoy, ignorando lo que devuelva la IA", () => {
      const propuesta = validarPropuesta(
        {
          datos: {},
          affiliateData: { hasAffiliateProgram: false, lastAffiliateCheck: "2020-01-01" },
          fuentes: [],
        },
        solicitud
      );

      const hoy = new Date().toISOString().slice(0, 10);
      expect(propuesta.datosAfiliados.lastAffiliateCheck).toBe(hoy);
    });

    it("no avisa de nada si no hay programa de afiliados disponible", () => {
      const propuesta = validarPropuesta(
        { datos: {}, affiliateData: { hasAffiliateProgram: false, affiliateStatus: "not_available" }, fuentes: [] },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("AffiliateData"))).toBe(false);
    });

    it("avisa de qué subcampos faltan cuando sí hay programa de afiliados pero está incompleto", () => {
      const propuesta = validarPropuesta(
        {
          datos: {},
          affiliateData: { hasAffiliateProgram: true, affiliateUrl: "https://ejemplo.test/afiliados" },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      const aviso = propuesta.advertencias.find((a) => a.includes("AffiliateData está incompleto"));
      expect(aviso).toBeDefined();
      expect(aviso).toContain("affiliatePlatform");
      expect(aviso).toContain("commission");
      expect(aviso).toContain("approvalRequired");
      expect(aviso).toContain("affiliateStatus");
      expect(aviso).toContain("confidenceLevel");
      expect(aviso).toContain("source");
      expect(aviso).not.toContain("affiliateUrl,");
    });

    it("no avisa de campos incompletos cuando el programa de afiliados está completo", () => {
      const propuesta = validarPropuesta(
        {
          datos: {},
          affiliateData: {
            hasAffiliateProgram: true,
            affiliateUrl: "https://ejemplo.test/afiliados",
            affiliatePlatform: "PartnerStack",
            commission: "30% recurrente",
            approvalRequired: false,
            affiliateStatus: "active",
            confidenceLevel: "medium",
            source: "https://ejemplo.test/afiliados/condiciones",
          },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("incompleto"))).toBe(false);
    });

    it('avisa por separado cuando confidenceLevel es "low"', () => {
      const propuesta = validarPropuesta(
        {
          datos: {},
          affiliateData: {
            hasAffiliateProgram: true,
            affiliateUrl: "https://ejemplo.test/afiliados",
            affiliatePlatform: "Programa propio",
            commission: "Hasta 50%",
            approvalRequired: true,
            affiliateStatus: "active",
            confidenceLevel: "low",
            source: "https://ejemplo.test/afiliados",
          },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("confianza declarada"))).toBe(true);
    });
  });

  describe("análisis de Atlas", () => {
    it("no incluye analisisAtlas si no hay ninguna señal con la que calcular una puntuación", () => {
      const propuesta = validarPropuesta({ datos: {}, fuentes: [] }, solicitud);
      expect(propuesta.datos.analisisAtlas).toBeUndefined();
    });

    it("calcula y añade la puntuación de Atlas cuando hay puntuaciones internas", () => {
      const propuesta = validarPropuesta(
        {
          datos: {
            puntuaciones: {
              facilidadDeUso: 8,
              calidad: 8,
              fiabilidad: 8,
              atencionAlCliente: 8,
              escalabilidad: 8,
              nivelTecnicoRequerido: 3,
            },
          },
          fuentes: [],
        },
        solicitud
      );

      expect(propuesta.datos.analisisAtlas?.puntuacion).toBe(80);
      expect(propuesta.datos.analisisAtlas?.motivosPuntuacion?.length).toBeGreaterThan(0);
    });

    it("conserva competidoresDirectos/tipoNegocioIdeal/nivelTecnicoRecomendado investigados por la IA al fusionar la puntuación calculada", () => {
      const propuesta = validarPropuesta(
        {
          datos: {
            tienePlanGratuito: true,
            analisisAtlas: {
              competidoresDirectos: ["Competidor A", "Competidor B"],
              tipoNegocioIdeal: "Agencias de marketing",
              nivelTecnicoRecomendado: "principiante",
              // Si la IA inventa esto, debe ser ignorado y sustituido por el cálculo real.
              puntuacion: 999,
            },
          },
          fuentes: [],
        },
        solicitud
      );

      expect(propuesta.datos.analisisAtlas?.competidoresDirectos).toEqual(["Competidor A", "Competidor B"]);
      expect(propuesta.datos.analisisAtlas?.tipoNegocioIdeal).toBe("Agencias de marketing");
      expect(propuesta.datos.analisisAtlas?.nivelTecnicoRecomendado).toBe("principiante");
      expect(propuesta.datos.analisisAtlas?.puntuacion).not.toBe(999);
    });

    it("avisa de qué subcampos investigables faltan en analisisAtlas", () => {
      const propuesta = validarPropuesta(
        { datos: { analisisAtlas: { tipoNegocioIdeal: "Ecommerce B2C" } }, fuentes: [] },
        solicitud
      );

      const aviso = propuesta.advertencias.find((a) => a.includes("análisis de Atlas está incompleto"));
      expect(aviso).toBeDefined();
      expect(aviso).toContain("competidoresDirectos");
      expect(aviso).toContain("nivelTecnicoRecomendado");
      expect(aviso).not.toContain("tipoNegocioIdeal,");
    });

    it("no avisa de nada si la IA no investigó ningún dato de analisisAtlas", () => {
      const propuesta = validarPropuesta({ datos: {}, fuentes: [] }, solicitud);
      expect(propuesta.advertencias.some((a) => a.includes("análisis de Atlas"))).toBe(false);
    });
  });
});
