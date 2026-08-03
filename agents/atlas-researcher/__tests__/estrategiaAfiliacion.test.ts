import { describe, expect, it } from "vitest";
import {
  esEstadoAfiliacionValido,
  fusionarEstrategiaAfiliacion,
  type CambiosEstrategiaAfiliacion,
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

describe("fusionarEstrategiaAfiliacion", () => {
  it("crea una estrategia nueva con estado no_solicitado si no había ninguna ni se indica --estado", () => {
    const resultado = fusionarEstrategiaAfiliacion("hubspot", undefined, {}, "2026-08-03");

    expect(resultado).toEqual({
      herramientaId: "hubspot",
      estado: "no_solicitado",
      nombrePrograma: undefined,
      plataforma: undefined,
      urlSolicitud: undefined,
      usuarioRegistro: undefined,
      fechaSolicitud: undefined,
      fechaAprobacion: undefined,
      comision: undefined,
      duracionCookie: undefined,
      metodoPago: undefined,
      frecuenciaPago: undefined,
      enlaceAfiliadoPropio: undefined,
      ultimaRevision: "2026-08-03",
      observaciones: undefined,
    });
  });

  it("aplica los cambios indicados sobre una estrategia nueva", () => {
    const cambios: CambiosEstrategiaAfiliacion = { estado: "pendiente", fechaSolicitud: "2026-08-03", plataforma: "PartnerStack" };

    const resultado = fusionarEstrategiaAfiliacion("hubspot", undefined, cambios, "2026-08-03");

    expect(resultado.estado).toBe("pendiente");
    expect(resultado.fechaSolicitud).toBe("2026-08-03");
    expect(resultado.plataforma).toBe("PartnerStack");
  });

  it("conserva los campos no indicados al actualizar una estrategia existente", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      estado: "pendiente",
      plataforma: "PartnerStack",
      comision: "20% recurrente",
      fechaSolicitud: "2026-08-03",
      ultimaRevision: "2026-08-03",
    };

    const resultado = fusionarEstrategiaAfiliacion("hubspot", existente, { estado: "aprobado", fechaAprobacion: "2026-08-20" }, "2026-08-20");

    expect(resultado.estado).toBe("aprobado");
    expect(resultado.fechaAprobacion).toBe("2026-08-20");
    // Conservados de la estrategia anterior, no pisados por no haberse pasado en esta llamada:
    expect(resultado.plataforma).toBe("PartnerStack");
    expect(resultado.comision).toBe("20% recurrente");
    expect(resultado.fechaSolicitud).toBe("2026-08-03");
  });

  it("siempre estampa ultimaRevision con la fecha pasada, ignorando cualquier valor anterior", () => {
    const existente: EstrategiaAfiliacion = {
      herramientaId: "hubspot",
      estado: "pendiente",
      ultimaRevision: "2026-01-01",
    };

    const resultado = fusionarEstrategiaAfiliacion("hubspot", existente, {}, "2026-08-20");

    expect(resultado.ultimaRevision).toBe("2026-08-20");
  });

  it("no permite cambiar herramientaId a través de los cambios (el id lo fija el primer argumento)", () => {
    const resultado = fusionarEstrategiaAfiliacion("hubspot", undefined, {}, "2026-08-03");
    expect(resultado.herramientaId).toBe("hubspot");
  });
});
