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

  describe("programa de afiliados", () => {
    it("no avisa de nada si no hay programa de afiliados disponible", () => {
      const propuesta = validarPropuesta(
        { datos: { programaAfiliados: { disponible: false, enlaceVerificado: false } }, fuentes: [] },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("programa de afiliados"))).toBe(false);
    });

    it("avisa de qué subcampos faltan cuando sí hay programa de afiliados pero está incompleto", () => {
      const propuesta = validarPropuesta(
        {
          datos: {
            programaAfiliados: { disponible: true, enlace: "https://ejemplo.test/afiliados", enlaceVerificado: false },
          },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      const aviso = propuesta.advertencias.find((a) => a.includes("programa de afiliados está incompleto"));
      expect(aviso).toBeDefined();
      expect(aviso).toContain("plataformaGestion");
      expect(aviso).toContain("tipoInscripcion");
      expect(aviso).toContain("tipoComision");
      expect(aviso).toContain("confianza");
      expect(aviso).toContain("fuente");
      expect(aviso).not.toContain("enlace,");
    });

    it("no avisa de campos incompletos cuando el programa de afiliados está completo", () => {
      const propuesta = validarPropuesta(
        {
          datos: {
            programaAfiliados: {
              disponible: true,
              enlace: "https://ejemplo.test/afiliados",
              enlaceVerificado: false,
              plataformaGestion: "PartnerStack",
              tipoInscripcion: "abierta",
              tipoComision: "comision_recurrente",
              confianza: "media",
              fuente: "https://ejemplo.test/afiliados/condiciones",
            },
          },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("incompleto"))).toBe(false);
    });

    it('avisa por separado cuando la confianza declarada del programa de afiliados es "baja"', () => {
      const propuesta = validarPropuesta(
        {
          datos: {
            programaAfiliados: {
              disponible: true,
              enlace: "https://ejemplo.test/afiliados",
              enlaceVerificado: false,
              plataformaGestion: "Programa propio",
              tipoInscripcion: "requiere_aprobacion",
              tipoComision: "porcentaje",
              confianza: "baja",
              fuente: "https://ejemplo.test/afiliados",
            },
          },
          fuentes: ["https://ejemplo.test"],
        },
        solicitud
      );

      expect(propuesta.advertencias.some((a) => a.includes("confianza declarada"))).toBe(true);
    });
  });
});
