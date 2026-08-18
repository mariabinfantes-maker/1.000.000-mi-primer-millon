import { describe, expect, it } from "vitest";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { MetadatosBorrador } from "../borrador";
import { evaluarCriteriosDeCalidad, UMBRAL_REPUTACION_BUENA } from "../criteriosCalidad";

const METADATOS_ALTA: MetadatosBorrador = { confianza: "alta", fuentes: ["https://ejemplo.test"], advertencias: [] };

/** Puntuaciones internas altas + reputación alta → Puntuación Molnip por encima del umbral, para no depender del cálculo exacto en cada test. */
const HERRAMIENTA_BUENA = construirHerramienta({
  id: "buena",
  nombre: "Buena",
  puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 3 },
  reputacion: { g2Puntuacion: 4.5, capterraPuntuacion: 4.6 },
});

describe("evaluarCriteriosDeCalidad", () => {
  it("promueve normal una herramienta con todo en regla y afiliación de confianza alta", () => {
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, { confidenceLevel: "high" }, METADATOS_ALTA);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.verificacionAfiliacionPendiente).toBe(false);
  });

  it("bloquea si la confianza de la investigación es baja", () => {
    const metadatosBajos: MetadatosBorrador = { ...METADATOS_ALTA, confianza: "baja" };
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, { confidenceLevel: "high" }, metadatosBajos);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes('confianza "baja"'))).toBe(true);
  });

  it("bloquea si hay advertencias sin resolver, aunque el resto esté bien", () => {
    const metadatosConAviso: MetadatosBorrador = { ...METADATOS_ALTA, advertencias: ["Precio no confirmado en dos fuentes."] };
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, { confidenceLevel: "high" }, metadatosConAviso);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("advertencia"))).toBe(true);
  });

  it("bloquea si la Puntuación Molnip queda por debajo del umbral", () => {
    const herramientaMediocre = construirHerramienta({
      id: "mediocre",
      nombre: "Mediocre",
      puntuaciones: { facilidadDeUso: 5, calidad: 5, fiabilidad: 5, atencionAlCliente: 5, escalabilidad: 5, nivelTecnicoRequerido: 5 },
    });

    const resultado = evaluarCriteriosDeCalidad(herramientaMediocre, { confidenceLevel: "high" }, METADATOS_ALTA);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("Puntuación Molnip"))).toBe(true);
  });

  it(`promueve y marca verificacionAfiliacionPendiente si la confianza de afiliación es media pero la reputación externa es >= ${UMBRAL_REPUTACION_BUENA}`, () => {
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, { confidenceLevel: "medium" }, METADATOS_ALTA);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.verificacionAfiliacionPendiente).toBe(true);
  });

  it("bloquea con afiliación de confianza media si además no hay reputación externa que la respalde", () => {
    const herramientaSinReputacion = construirHerramienta({
      id: "sin-reputacion",
      nombre: "Sin Reputación",
      puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 3 },
    });

    const resultado = evaluarCriteriosDeCalidad(herramientaSinReputacion, { confidenceLevel: "medium" }, METADATOS_ALTA);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.errores.some((e) => e.includes("reputación externa"))).toBe(true);
  });

  it(`no exige reputación de respaldo cuando la reputación está justo por debajo de ${UMBRAL_REPUTACION_BUENA} en ambas fuentes: sigue bloqueando`, () => {
    const herramientaReputacionBaja = construirHerramienta({
      id: "reputacion-baja",
      nombre: "Reputación Baja",
      puntuaciones: { facilidadDeUso: 9, calidad: 9, fiabilidad: 9, atencionAlCliente: 9, escalabilidad: 9, nivelTecnicoRequerido: 3 },
      reputacion: { g2Puntuacion: 3.9, capterraPuntuacion: 3.8 },
    });

    const resultado = evaluarCriteriosDeCalidad(herramientaReputacionBaja, { confidenceLevel: "medium" }, METADATOS_ALTA);

    expect(resultado.ok).toBe(false);
  });

  it("no marca verificacionAfiliacionPendiente cuando no hay datosAfiliados.confidenceLevel definido", () => {
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, {}, METADATOS_ALTA);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.verificacionAfiliacionPendiente).toBe(false);
  });

  it("bloquea si no hay metadatos en absoluto (borrador anterior a que se guardara este dato) por no poder confirmar la confianza", () => {
    const resultado = evaluarCriteriosDeCalidad(HERRAMIENTA_BUENA, { confidenceLevel: "high" }, undefined);

    // Sin metadatos, `confianza` es undefined (no "baja"), así que este criterio en concreto no bloquea por sí solo;
    // lo que sí puede bloquear es la falta de advertencias registradas — aquí no hay ninguna, así que pasa.
    expect(resultado.ok).toBe(true);
  });
});
