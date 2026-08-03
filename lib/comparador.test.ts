import { describe, expect, it } from "vitest";
import { evaluarHerramienta } from "@/agents/atlas-advisor/motor";
import type { RespuestasUsuario } from "@/agents/atlas-advisor";
import { crmFacil, erpComplejo, generalistaMedio } from "@/agents/atlas-advisor/__tests__/fixtures";
import { construirComparativa } from "./comparador";

describe("construirComparativa", () => {
  it("devuelve una lista vacía con menos de dos herramientas", () => {
    const respuestas: RespuestasUsuario = {};
    const evaluada = evaluarHerramienta(crmFacil, respuestas);
    expect(construirComparativa([evaluada])).toEqual([]);
    expect(construirComparativa([])).toEqual([]);
  });

  it("incluye un criterio donde las herramientas obtienen puntos distintos, y marca un único ganador", () => {
    const respuestas: RespuestasUsuario = {};
    const evaluadas = [
      evaluarHerramienta(crmFacil, respuestas),
      evaluarHerramienta(erpComplejo, respuestas),
    ];

    const filas = construirComparativa(evaluadas);
    const filaFacilidad = filas.find((f) => f.criterio === "facilidadDeUso");

    expect(filaFacilidad).toBeDefined();
    expect(filaFacilidad?.hayGanadorUnico).toBe(true);
    const ganador = filaFacilidad?.celdas.find((c) => c.gana);
    expect(ganador?.herramientaId).toBe("crm-facil");
    // El resto de celdas no debe marcarse como ganadora.
    expect(filaFacilidad?.celdas.filter((c) => c.gana)).toHaveLength(1);
  });

  it("omite un criterio cuando todas las herramientas obtienen los mismos puntos y la misma explicación", () => {
    // erpComplejo y generalistaMedio comparten la frase "pendiente de contrastar" en su
    // metodologiaValoracion: el criterio de metodología puntúa y explica igual para ambas.
    const respuestas: RespuestasUsuario = {};
    const evaluadas = [
      evaluarHerramienta(erpComplejo, respuestas),
      evaluarHerramienta(generalistaMedio, respuestas),
    ];

    const filas = construirComparativa(evaluadas);
    const filaMetodologia = filas.find((f) => f.criterio === "metodologia");
    expect(filaMetodologia).toBeUndefined();
  });

  it("no marca ganador cuando hay empate en el puntaje más alto", () => {
    const respuestas: RespuestasUsuario = { tamanoEmpresa: "1-10" };
    // crmFacil y generalistaMedio comparten "1-10" en segmentosIdeales: empatan en el criterio de tamaño.
    const evaluadas = [
      evaluarHerramienta(crmFacil, respuestas),
      evaluarHerramienta(generalistaMedio, respuestas),
    ];

    const filas = construirComparativa(evaluadas);
    const filaTamano = filas.find((f) => f.criterio === "tamanoEmpresa");

    // Si aparece la fila (porque algún otro criterio también empata pero con explicación distinta),
    // no debe haber ninguna celda marcada como ganadora en tamañoEmpresa.
    if (filaTamano) {
      expect(filaTamano.hayGanadorUnico).toBe(false);
      expect(filaTamano.celdas.every((c) => !c.gana)).toBe(true);
    }
  });

  it("cada fila incluida trae una explicación de criterio para pymes", () => {
    const respuestas: RespuestasUsuario = {};
    const evaluadas = [
      evaluarHerramienta(crmFacil, respuestas),
      evaluarHerramienta(erpComplejo, respuestas),
    ];

    const filas = construirComparativa(evaluadas);
    expect(filas.length).toBeGreaterThan(0);
    for (const fila of filas) {
      expect(fila.explicacionCriterio.length).toBeGreaterThan(0);
    }
  });
});
