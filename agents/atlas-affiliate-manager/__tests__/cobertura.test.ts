import { describe, expect, it } from "vitest";
import type { Herramienta } from "@/data/esquema";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { detectarHerramientasSinEstrategia } from "../cobertura";

function herramienta(id: string, nombre: string): Herramienta {
  return { id, nombre } as Herramienta;
}

describe("detectarHerramientasSinEstrategia", () => {
  it("señala las herramientas del catálogo sin ninguna EstrategiaAfiliacion registrada", () => {
    const herramientas = [herramienta("hubspot", "HubSpot"), herramienta("asana", "Asana")];
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "hubspot", cuentas: [{ id: "partnerstack", estado: "activo", plataforma: "PartnerStack", enlaces: [], ultimaRevision: "2026-08-01" }] },
    ];

    const resultado = detectarHerramientasSinEstrategia(herramientas, estrategias);

    expect(resultado).toEqual([{ herramientaId: "asana", nombre: "Asana" }]);
  });

  it("trata una EstrategiaAfiliacion con cuentas vacías igual que si no existiera", () => {
    const herramientas = [herramienta("hubspot", "HubSpot")];
    const estrategias: EstrategiaAfiliacion[] = [{ herramientaId: "hubspot", cuentas: [] }];

    const resultado = detectarHerramientasSinEstrategia(herramientas, estrategias);

    expect(resultado).toEqual([{ herramientaId: "hubspot", nombre: "HubSpot" }]);
  });

  it("devuelve un array vacío si todas las herramientas ya tienen estrategia", () => {
    const herramientas = [herramienta("hubspot", "HubSpot")];
    const estrategias: EstrategiaAfiliacion[] = [
      { herramientaId: "hubspot", cuentas: [{ id: "principal", estado: "no_solicitado", plataforma: "principal", enlaces: [], ultimaRevision: "2026-08-01" }] },
    ];

    expect(detectarHerramientasSinEstrategia(herramientas, estrategias)).toEqual([]);
  });
});
