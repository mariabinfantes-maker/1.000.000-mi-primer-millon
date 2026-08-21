import { describe, expect, it } from "vitest";
import { aVistaDeTarjetaGenerica, ordenarPorPuntuacionAtlas } from "./vistaRecomendacion";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";

describe("aVistaDeTarjetaGenerica", () => {
  it("usa idealPara como explicación, en vez de fingir una personalización que no existe", () => {
    const herramienta = construirHerramienta({ id: "crm-facil", nombre: "CRM Fácil", idealPara: "Ideal para pymes pequeñas." });

    const vista = aVistaDeTarjetaGenerica(herramienta, 1);

    expect(vista.explicacionPersonalizada).toBe("Ideal para pymes pequeñas.");
    expect(vista.tieneAdvertencia).toBe(false);
  });

  it("calcula la Puntuación Atlas igual que el resto del producto", () => {
    const herramienta = construirHerramienta({
      id: "crm-facil",
      nombre: "CRM Fácil",
      puntuaciones: { facilidadDeUso: 8, calidad: 8, fiabilidad: 8, atencionAlCliente: 8, escalabilidad: 8, nivelTecnicoRequerido: 3 },
    });

    const vista = aVistaDeTarjetaGenerica(herramienta, 1);

    expect(vista.puntuacionAtlas).not.toBeNull();
    expect(vista.motivosPuntuacion.length).toBeGreaterThan(0);
  });

  it("respeta la posición pasada", () => {
    const herramienta = construirHerramienta({ id: "crm-facil", nombre: "CRM Fácil" });
    expect(aVistaDeTarjetaGenerica(herramienta, 3).posicion).toBe(3);
  });

  it("propaga reputación y badges de encaje reales, sin inventar valores por defecto", () => {
    const herramienta = construirHerramienta({
      id: "crm-facil",
      nombre: "CRM Fácil",
      reputacion: { g2Puntuacion: 4.6, g2NumeroResenas: 170 },
      disponibleEnEspanol: true,
      tieneAppMovil: true,
      tieneApiPublica: false,
    });

    const vista = aVistaDeTarjetaGenerica(herramienta, 1);

    expect(vista.reputacion).toEqual({ g2Puntuacion: 4.6, g2NumeroResenas: 170 });
    expect(vista.disponibleEnEspanol).toBe(true);
    expect(vista.tieneAppMovil).toBe(true);
    expect(vista.tieneApiPublica).toBe(false);
  });

  it("cae a false (nunca a true) cuando los campos opcionales de encaje no están investigados", () => {
    const herramienta = construirHerramienta({ id: "crm-facil", nombre: "CRM Fácil" });
    delete herramienta.disponibleEnEspanol;
    delete herramienta.tieneAppMovil;
    delete herramienta.tieneApiPublica;

    const vista = aVistaDeTarjetaGenerica(herramienta, 1);

    expect(vista.reputacion).toBeUndefined();
    expect(vista.disponibleEnEspanol).toBe(false);
    expect(vista.tieneAppMovil).toBe(false);
    expect(vista.tieneApiPublica).toBe(false);
  });
});

describe("ordenarPorPuntuacionAtlas", () => {
  it("ordena de mayor a menor puntuación", () => {
    const baja = construirHerramienta({
      id: "baja",
      nombre: "Baja",
      puntuaciones: { facilidadDeUso: 3, calidad: 3, fiabilidad: 3, atencionAlCliente: 3, escalabilidad: 3, nivelTecnicoRequerido: 3 },
    });
    const alta = construirHerramienta({
      id: "alta",
      nombre: "Alta",
      puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 3 },
    });

    expect(ordenarPorPuntuacionAtlas([baja, alta]).map((h) => h.id)).toEqual(["alta", "baja"]);
  });

  it("no muta el array original", () => {
    const a = construirHerramienta({ id: "a", nombre: "A" });
    const b = construirHerramienta({ id: "b", nombre: "B" });
    const original = [a, b];

    ordenarPorPuntuacionAtlas(original);

    expect(original).toEqual([a, b]);
  });

  it("devuelve [] para un catálogo vacío", () => {
    expect(ordenarPorPuntuacionAtlas([])).toEqual([]);
  });
});
