import { describe, expect, it } from "vitest";
import {
  esEstadoAfiliacionValido,
  fusionarEstrategiaAfiliacion,
  generarIdCuenta,
  type CambiosCuentaAfiliado,
} from "../estrategiaAfiliacion";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

describe("esEstadoAfiliacionValido", () => {
  it("acepta los 5 estados válidos", () => {
    for (const estado of ["no_solicitado", "pendiente", "aprobado", "rechazado", "activo"]) {
      expect(esEstadoAfiliacionValido(estado)).toBe(true);
    }
  });

  it("rechaza cualquier otro valor", () => {
    expect(esEstadoAfiliacionValido("aprovado")).toBe(false);
    expect(esEstadoAfiliacionValido("")).toBe(false);
    expect(esEstadoAfiliacionValido("Pendiente")).toBe(false);
  });
});

describe("generarIdCuenta", () => {
  it("convierte el nombre de la plataforma en un slug", () => {
    expect(generarIdCuenta("PartnerStack")).toBe("partnerstack");
    expect(generarIdCuenta("Impact.com")).toBe("impact-com");
    expect(generarIdCuenta("  Rewardful  ")).toBe("rewardful");
  });

  it("cae a 'principal' si no hay plataforma", () => {
    expect(generarIdCuenta(undefined)).toBe("principal");
    expect(generarIdCuenta("")).toBe("principal");
  });
});

describe("fusionarEstrategiaAfiliacion", () => {
  it("crea una cuenta nueva con estado no_solicitado si no había ninguna ni se indica --estado", () => {
    const resultado = fusionarEstrategiaAfiliacion("hubspot", "partnerstack", undefined, {}, "2026-08-03");

    expect(resultado).toEqual({
      herramientaId: "hubspot",
      cuentas: [
        {
          id: "partnerstack",
          estado: "no_solicitado",
          plataforma: "partnerstack",
          nombrePrograma: undefined,
          usuarioRegistro: undefined,
          urlSolicitud: undefined,
          fechaSolicitud: undefined,
          fechaAprobacion: undefined,
          comision: undefined,
          duracionCookie: undefined,
          metodoPago: undefined,
          frecuenciaPago: undefined,
          enlaces: [],
          ultimaRevision: "2026-08-03",
          observaciones: undefined,
        },
      ],
    });
  });

  it("aplica los cambios indicados sobre una cuenta nueva", () => {
    const cambios: CambiosCuentaAfiliado = { estado: "pendiente", fechaSolicitud: "2026-08-03", plataforma: "PartnerStack" };

    const resultado = fusionarEstrategiaAfiliacion("hubspot", "partnerstack", undefined, cambios, "2026-08-03");

    expect(resultado.cuentas[0].estado).toBe("pendiente");
    expect(resultado.cuentas[0].fechaSolicitud).toBe("2026-08-03");
    expect(resultado.cuentas[0].plataforma).toBe("PartnerStack");
  });

  it("conserva los campos no indicados al actualizar una cuenta existente", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [
        {
          id: "partnerstack",
          estado: "pendiente",
          plataforma: "PartnerStack",
          comision: "20% recurrente",
          fechaSolicitud: "2026-08-03",
          enlaces: [],
          ultimaRevision: "2026-08-03",
        },
      ],
    };

    const resultado = fusionarEstrategiaAfiliacion(
      "hubspot",
      "partnerstack",
      existente,
      { estado: "aprobado", fechaAprobacion: "2026-08-20" },
      "2026-08-20"
    );

    expect(resultado.cuentas[0].estado).toBe("aprobado");
    expect(resultado.cuentas[0].fechaAprobacion).toBe("2026-08-20");
    // Conservados de la cuenta anterior, no pisados por no haberse pasado en esta llamada:
    expect(resultado.cuentas[0].plataforma).toBe("PartnerStack");
    expect(resultado.cuentas[0].comision).toBe("20% recurrente");
    expect(resultado.cuentas[0].fechaSolicitud).toBe("2026-08-03");
  });

  it("siempre estampa ultimaRevision con la fecha pasada, ignorando cualquier valor anterior", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [{ id: "partnerstack", estado: "pendiente", plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-01-01" }],
    };

    const resultado = fusionarEstrategiaAfiliacion("hubspot", "partnerstack", existente, {}, "2026-08-20");

    expect(resultado.cuentas[0].ultimaRevision).toBe("2026-08-20");
  });

  it("no permite cambiar herramientaId ni el id de la cuenta a través de los cambios", () => {
    const resultado = fusionarEstrategiaAfiliacion("hubspot", "partnerstack", undefined, {}, "2026-08-03");
    expect(resultado.herramientaId).toBe("hubspot");
    expect(resultado.cuentas[0].id).toBe("partnerstack");
  });

  it("añade una cuenta nueva sin tocar las cuentas ya existentes de la misma herramienta", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [{ id: "partnerstack", estado: "activo", plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-01-01" }],
    };

    const resultado = fusionarEstrategiaAfiliacion(
      "hubspot",
      "impact",
      existente,
      { plataforma: "Impact", estado: "pendiente" },
      "2026-08-20"
    );

    expect(resultado.cuentas).toHaveLength(2);
    const partnerstack = resultado.cuentas.find((c) => c.id === "partnerstack");
    const impact = resultado.cuentas.find((c) => c.id === "impact");
    expect(partnerstack?.estado).toBe("activo");
    expect(partnerstack?.ultimaRevision).toBe("2026-01-01");
    expect(impact?.estado).toBe("pendiente");
  });

  it("añade un enlace nuevo por segmento sin borrar los enlaces ya existentes de esa cuenta", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [
        {
          id: "partnerstack",
          estado: "activo",
          plataforma: "PartnerStack",
          enlaces: [{ segmento: "global", url: "https://hubspot.com/?a=atlas-global" }],
          ultimaRevision: "2026-01-01",
        },
      ],
    };

    const resultado = fusionarEstrategiaAfiliacion(
      "hubspot",
      "partnerstack",
      existente,
      { enlaceUrl: "https://hubspot.com/es/?a=atlas-es", segmentoEnlace: "ES" },
      "2026-08-20"
    );

    expect(resultado.cuentas[0].enlaces).toEqual([
      { segmento: "global", url: "https://hubspot.com/?a=atlas-global" },
      { segmento: "ES", url: "https://hubspot.com/es/?a=atlas-es" },
    ]);
  });

  it("actualiza (upsert) el enlace de un segmento ya existente en vez de duplicarlo", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      cuentas: [
        {
          id: "partnerstack",
          estado: "activo",
          plataforma: "PartnerStack",
          enlaces: [{ segmento: "ES", url: "https://hubspot.com/es/?a=viejo" }],
          ultimaRevision: "2026-01-01",
        },
      ],
    };

    const resultado = fusionarEstrategiaAfiliacion(
      "hubspot",
      "partnerstack",
      existente,
      { enlaceUrl: "https://hubspot.com/es/?a=nuevo", segmentoEnlace: "ES" },
      "2026-08-20"
    );

    expect(resultado.cuentas[0].enlaces).toEqual([{ segmento: "ES", url: "https://hubspot.com/es/?a=nuevo" }]);
  });

  it("usa el segmento 'global' por defecto si se indica un enlace sin segmento", () => {
    const resultado = fusionarEstrategiaAfiliacion(
      "hubspot",
      "partnerstack",
      undefined,
      { enlaceUrl: "https://hubspot.com/?a=atlas" },
      "2026-08-03"
    );

    expect(resultado.cuentas[0].enlaces).toEqual([{ segmento: "global", url: "https://hubspot.com/?a=atlas" }]);
  });
});
