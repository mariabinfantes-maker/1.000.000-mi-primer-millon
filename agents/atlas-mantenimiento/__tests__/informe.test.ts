import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { construirDatosInforme, generarInformeMantenimientoHtml } from "../informe";

const HOY = "2026-08-06";
const HACE_200_DIAS = "2026-01-18";

describe("construirDatosInforme", () => {
  it("agrupa herramientas y cuentas desactualizadas, priorizadas por Puntuación Atlas", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot", fechaUltimaRevision: HACE_200_DIAS });
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "hubspot", cuentas: [{ id: "ps", plataforma: "PartnerStack", estado: "activo", enlaces: [], ultimaRevision: HACE_200_DIAS }] },
    ];

    const datos = construirDatosInforme([herramienta], estrategias, HOY);

    expect(datos.herramientasDesactualizadas).toHaveLength(1);
    expect(datos.herramientasDesactualizadas[0].herramientaId).toBe("hubspot");
    expect(datos.cuentasDesactualizadas).toHaveLength(1);
    expect(datos.cuentasDesactualizadas[0].cuentaId).toBe("ps");
  });

  it("no reporta nada cuando todo está dentro del umbral", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot", fechaUltimaRevision: HOY });
    const datos = construirDatosInforme([herramienta], [], HOY);

    expect(datos.herramientasDesactualizadas).toEqual([]);
    expect(datos.cuentasDesactualizadas).toEqual([]);
  });
});

describe("generarInformeMantenimientoHtml", () => {
  it("genera HTML autocontenido que incluye los avisos y deja claro que es solo informativo", () => {
    const herramienta = construirHerramienta({ id: "hubspot", nombre: "HubSpot", fechaUltimaRevision: HACE_200_DIAS });
    const datos = construirDatosInforme([herramienta], [], HOY);

    const html = generarInformeMantenimientoHtml(datos);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("HubSpot");
    expect(html).toContain("Solo informativo");
  });

  it("muestra un mensaje explícito de 'nada que revisar' cuando no hay avisos, en vez de una tabla vacía", () => {
    const html = generarInformeMantenimientoHtml({ herramientasDesactualizadas: [], cuentasDesactualizadas: [] });

    expect(html).toContain("Nada que revisar");
  });
});
