import { describe, expect, it } from "vitest";
import { criterioNivelTecnicoRecomendado, criterioTipoNegocioIdeal } from "../criteriosAnalisisAtlas";
import { construirHerramienta } from "./fixtures";
import type { RespuestasUsuario } from "../tipos";

const SIN_RESPUESTAS: RespuestasUsuario = {};

describe("criterioNivelTecnicoRecomendado", () => {
  it("es neutro si la herramienta no tiene analisisAtlas", () => {
    const herramienta = construirHerramienta({ id: "sin-analisis", nombre: "Sin Análisis" });
    const resultado = criterioNivelTecnicoRecomendado(herramienta, { nivelTecnicoEquipo: "basico" });
    expect(resultado.puntos).toBe(0);
    expect(resultado.explicacion).toBe("");
  });

  it("es neutro si el usuario no indica su nivel técnico", () => {
    const herramienta = construirHerramienta({
      id: "con-analisis",
      nombre: "Con Análisis",
      analisisAtlas: { nivelTecnicoRecomendado: "avanzado" },
    });
    const resultado = criterioNivelTecnicoRecomendado(herramienta, SIN_RESPUESTAS);
    expect(resultado.puntos).toBe(0);
    expect(resultado.explicacion).toBe("");
  });

  it("suma puntos si el equipo cumple o supera el perfil recomendado", () => {
    const herramienta = construirHerramienta({
      id: "para-principiantes",
      nombre: "Para Principiantes",
      analisisAtlas: { nivelTecnicoRecomendado: "principiante" },
    });
    const resultado = criterioNivelTecnicoRecomendado(herramienta, { nivelTecnicoEquipo: "avanzado" });
    expect(resultado.puntos).toBeGreaterThan(0);
    expect(resultado.explicacion).toContain("principiante");
  });

  it("penaliza si el equipo está por debajo del perfil recomendado", () => {
    const herramienta = construirHerramienta({
      id: "para-avanzados",
      nombre: "Para Avanzados",
      analisisAtlas: { nivelTecnicoRecomendado: "avanzado" },
    });
    const resultado = criterioNivelTecnicoRecomendado(herramienta, { nivelTecnicoEquipo: "ninguno" });
    expect(resultado.puntos).toBeLessThan(0);
  });

  it("no penaliza a un equipo avanzado usando una herramienta pensada para intermedios", () => {
    const herramienta = construirHerramienta({
      id: "para-intermedios",
      nombre: "Para Intermedios",
      analisisAtlas: { nivelTecnicoRecomendado: "intermedio" },
    });
    const resultado = criterioNivelTecnicoRecomendado(herramienta, { nivelTecnicoEquipo: "avanzado" });
    expect(resultado.puntos).toBeGreaterThanOrEqual(0);
  });
});

describe("criterioTipoNegocioIdeal", () => {
  it("es neutro si la herramienta no tiene tipoNegocioIdeal", () => {
    const herramienta = construirHerramienta({ id: "sin-tipo", nombre: "Sin Tipo" });
    const resultado = criterioTipoNegocioIdeal(herramienta, { industria: "Agencias de marketing" });
    expect(resultado.puntos).toBe(0);
    expect(resultado.explicacion).toBe("");
  });

  it("es neutro si el usuario no indica industria", () => {
    const herramienta = construirHerramienta({
      id: "con-tipo",
      nombre: "Con Tipo",
      analisisAtlas: { tipoNegocioIdeal: "Agencias de marketing" },
    });
    const resultado = criterioTipoNegocioIdeal(herramienta, SIN_RESPUESTAS);
    expect(resultado.puntos).toBe(0);
  });

  it("suma puntos si tipoNegocioIdeal coincide con la industria declarada", () => {
    const herramienta = construirHerramienta({
      id: "para-agencias",
      nombre: "Para Agencias",
      analisisAtlas: { tipoNegocioIdeal: "Agencias de marketing" },
    });
    const resultado = criterioTipoNegocioIdeal(herramienta, { industria: "marketing" });
    expect(resultado.puntos).toBeGreaterThan(0);
    expect(resultado.explicacion).toContain("agencias de marketing");
  });

  it("no penaliza si tipoNegocioIdeal no coincide con la industria declarada", () => {
    const herramienta = construirHerramienta({
      id: "para-retail",
      nombre: "Para Retail",
      analisisAtlas: { tipoNegocioIdeal: "Tiendas de retail" },
    });
    const resultado = criterioTipoNegocioIdeal(herramienta, { industria: "construcción" });
    expect(resultado.puntos).toBe(0);
  });
});
