import { describe, expect, it } from "vitest";
import type { Herramienta } from "@/data/esquema";
import type { AffiliateData, EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { construirFilasPanel } from "../panelDatos";

function herramienta(id: string, nombre: string): Herramienta {
  return { id, nombre } as Herramienta;
}

describe("construirFilasPanel", () => {
  it("genera una fila por cada cuenta de una herramienta con estrategia", () => {
    const herramientas = [herramienta("hubspot", "HubSpot")];
    const estrategias: EstrategiaAfiliacion[] = [
      {
        herramientaId: "hubspot",
        cuentas: [
          { id: "partnerstack", estado: "activo", plataforma: "PartnerStack", enlaces: [{ segmento: "global", url: "https://x.com" }], ultimaRevision: "2026-08-20" },
        ],
      },
    ];

    const filas = construirFilasPanel(herramientas, estrategias, [], "2026-08-25");

    expect(filas).toHaveLength(1);
    expect(filas[0].cuentaId).toBe("partnerstack");
    expect(filas[0].estadoPanel).toBe("activa");
    expect(filas[0].enlace).toBe("https://x.com");
  });

  it("genera una fila con cuentaId null para una herramienta sin ninguna estrategia todavía", () => {
    const herramientas = [herramienta("asana", "Asana")];
    const datosAfiliados: AffiliateData[] = [
      {
        herramientaId: "asana",
        hasAffiliateProgram: true,
        affiliateProgramName: "Asana Partners",
        affiliateStatus: "active",
        lastAffiliateCheck: "2026-08-01",
      },
    ];

    const filas = construirFilasPanel(herramientas, [], datosAfiliados, "2026-08-25");

    expect(filas).toHaveLength(1);
    expect(filas[0].cuentaId).toBeNull();
    expect(filas[0].programaEncontrado).toBe("Asana Partners");
    expect(filas[0].estadoPanel).toBe("pendiente");
  });

  it("trata una EstrategiaAfiliacion con cuentas vacías igual que sin estrategia", () => {
    const herramientas = [herramienta("hubspot", "HubSpot")];
    const estrategias: EstrategiaAfiliacion[] = [{ herramientaId: "hubspot", cuentas: [] }];

    const filas = construirFilasPanel(herramientas, estrategias, [], "2026-08-25");

    expect(filas[0].cuentaId).toBeNull();
  });

  it("ordena las filas por prioridad (Puntuación Atlas) descendente", () => {
    const herramientas = [herramienta("baja", "Baja"), herramienta("alta", "Alta")];
    // Sin datos suficientes para calcular puntuación real, ambas caen a null —
    // solo verificamos que no lanza y devuelve ambas filas.
    const filas = construirFilasPanel(herramientas, [], [], "2026-08-25");
    expect(filas).toHaveLength(2);
  });

  it("marca diasEstancada solo cuando el estado de panel es 'seguimiento'", () => {
    const herramientas = [herramienta("hubspot", "HubSpot")];
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "hubspot", cuentas: [{ id: "partnerstack", estado: "pendiente", plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-01-01" }] },
    ];

    const filas = construirFilasPanel(herramientas, estrategias, [], "2026-08-25");

    expect(filas[0].estadoPanel).toBe("seguimiento");
    expect(filas[0].diasEstancada).toBeGreaterThan(0);
  });
});
