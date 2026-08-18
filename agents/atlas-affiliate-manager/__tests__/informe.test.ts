import { describe, expect, it } from "vitest";
import { construirDatosInforme, generarInformeAfiliacionHtml } from "../informe";
import type { CuentaAfiliado, EstrategiaAfiliacion } from "@/data/esquemaInterno";

function construirCuenta(overrides: Partial<CuentaAfiliado> & Pick<CuentaAfiliado, "id" | "estado">): CuentaAfiliado {
  return { plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-08-03", ...overrides };
}

describe("construirDatosInforme", () => {
  it("cuenta correctamente el total y el desglose por estado", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          construirCuenta({ id: "a", estado: "no_solicitado" }),
          construirCuenta({ id: "b", estado: "activo", enlaces: [{ segmento: "global", url: "https://x.com" }] }),
        ],
      },
      { herramientaId: "odoo", cuentas: [construirCuenta({ id: "c", estado: "pendiente" })] },
    ];

    const datos = construirDatosInforme(estrategias, [], "2026-08-03");

    expect(datos.totalCuentas).toBe(3);
    expect(datos.porEstado).toEqual({ no_solicitado: 1, pendiente: 1, aprobado: 0, rechazado: 0, activo: 1 });
  });

  it("incluye los avisos de consistencia y la priorización, reutilizando los módulos correspondientes", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          construirCuenta({ id: "sin-enlace", estado: "activo", enlaces: [] }),
          construirCuenta({ id: "estancada", estado: "pendiente", ultimaRevision: "2026-01-01" }),
          construirCuenta({ id: "por-solicitar", estado: "no_solicitado" }),
        ],
      },
    ];

    const datos = construirDatosInforme(estrategias, [], "2026-08-03");

    expect(datos.cuentasSinEnlace).toHaveLength(1);
    expect(datos.cuentasSinEnlace[0].cuentaId).toBe("sin-enlace");
    expect(datos.cuentasEstancadas).toHaveLength(1);
    expect(datos.cuentasEstancadas[0].cuentaId).toBe("estancada");
    expect(datos.priorizadas).toHaveLength(1);
    expect(datos.priorizadas[0].cuentaId).toBe("por-solicitar");
  });

  it("no genera ningún aviso con una lista vacía de estrategias", () => {
    const datos = construirDatosInforme([], [], "2026-08-03");

    expect(datos.totalCuentas).toBe(0);
    expect(datos.cuentasSinEnlace).toEqual([]);
    expect(datos.cuentasEstancadas).toEqual([]);
    expect(datos.cuentasConVerificacionPendiente).toEqual([]);
    expect(datos.priorizadas).toEqual([]);
  });

  it("incluye las cuentas con verificacionPendiente (regla de calidad aprobada el 2026-08-18)", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "zoho-crm",
        cuentas: [construirCuenta({ id: "a", estado: "no_solicitado", verificacionPendiente: true })],
      },
    ];

    const datos = construirDatosInforme(estrategias, [], "2026-08-03");

    expect(datos.cuentasConVerificacionPendiente).toHaveLength(1);
    expect(datos.cuentasConVerificacionPendiente[0].herramientaId).toBe("zoho-crm");
  });
});

describe("generarInformeAfiliacionHtml", () => {
  it("genera un documento HTML autocontenido y bien formado", () => {
    const datos = construirDatosInforme([], [], "2026-08-03");
    const html = generarInformeAfiliacionHtml(datos);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Atlas Affiliate Manager");
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("http://fonts.");
  });

  it("escapa el contenido de los avisos para evitar HTML sin escapar en el informe", () => {
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: '<img src=x onerror=alert(1)>', cuentas: [construirCuenta({ id: "a", estado: "activo", enlaces: [] })] },
    ];
    const datos = construirDatosInforme(estrategias, [], "2026-08-03");

    const html = generarInformeAfiliacionHtml(datos);

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img");
  });

  it("muestra el mensaje de lista vacía cuando no hay ninguna cuenta que priorizar", () => {
    const datos = construirDatosInforme([], [], "2026-08-03");
    const html = generarInformeAfiliacionHtml(datos);

    expect(html).toContain('No hay ninguna cuenta en estado "no solicitado"');
  });
});
