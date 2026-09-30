import { describe, expect, it } from "vitest";
import type { Herramienta } from "@/data/esquema";
import { examinarParaEntrar } from "../examenDeEntrada";

const completa = {
  id: "ejemplo",
  idiomasDisponibles: ["es"],
  industriasIdeales: ["fisioterapia"],
  segmentosIdeales: ["1-10"],
  casosNoRecomendados: ["Una sola licencia no cubre varias sedes."],
  preciosComprobados: { fecha: "2026-09-28", url: "https://ejemplo.es/precios" },
} as unknown as Herramienta;

describe("examen de entrada al catálogo", () => {
  it("deja entrar a quien sabemos qué hace, cuánto cuesta, en qué idioma, para quién es y qué límite tiene", () => {
    expect(examinarParaEntrar(completa, { capacidadesVerificadas: 3 }).ok).toBe(true);
  });

  /**
   * La razón de ser del cambio: una herramienta pequeña y española no tiene
   * ficha en G2 ni en Capterra, y el umbral de 80 se calculaba con eso. Aquí
   * no se le pregunta por su fama.
   */
  it("no pide reputación externa: una herramienta sin G2 ni Capterra entra igual", () => {
    const sinFama = { ...completa, reputacion: undefined, puntuaciones: {} } as unknown as Herramienta;
    expect(examinarParaEntrar(sinFama, { capacidadesVerificadas: 3 }).ok).toBe(true);
  });

  it("no pide las siete notas: entra con todas vacías", () => {
    const sinNotas = { ...completa, puntuaciones: {} } as unknown as Herramienta;
    expect(examinarParaEntrar(sinNotas, { capacidadesVerificadas: 4 }).ok).toBe(true);
  });

  it("para sin capacidades verificadas: sin eso no sabemos qué hace", () => {
    const r = examinarParaEntrar(completa, { capacidadesVerificadas: 2 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("capacidades verificadas");
  });

  it("para si el precio no tiene su página y su fecha", () => {
    const r = examinarParaEntrar({ ...completa, preciosComprobados: undefined } as Herramienta, { capacidadesVerificadas: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("precio");
  });

  /**
   * `casosNoRecomendados` no es una lista de sectores excluidos —eso sale por
   * descarte de saber para quién está pensada—, sino qué topa aunque seas su
   * cliente. Corrección de la propietaria, 2026-09-28.
   */
  it("para si no consta ningún límite", () => {
    const r = examinarParaEntrar({ ...completa, casosNoRecomendados: [] } as Herramienta, { capacidadesVerificadas: 3 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.join(" ")).toContain("límite");
  });

  it("dice qué sí sabemos, no sólo qué falta", () => {
    const r = examinarParaEntrar(completa, { capacidadesVerificadas: 3 });
    expect(r.comprobado).toHaveLength(5);
  });
});

/**
 * El precio puede venir demostrado por dos caminos, y el examen tiene que
 * aceptar los dos. Su primera versión sólo miraba `preciosComprobados` y
 * suspendió a tres fichas que llevaban el recibo en `planesComprobados`
 * desde el 2026-09-21.
 */
describe("la fuente del precio", () => {
  const base = {
    id: "ejemplo",
    idiomasDisponibles: ["es"],
    industriasIdeales: ["fisioterapia"],
    segmentosIdeales: ["1-10"],
    casosNoRecomendados: ["Una sola licencia no cubre varias sedes."],
  } as unknown as Herramienta;

  it("vale `preciosComprobados`", () => {
    const h = { ...base, preciosComprobados: { fecha: "2026-09-29", url: "https://x.es/precios" } } as Herramienta;
    expect(examinarParaEntrar(h, { capacidadesVerificadas: 3 }).ok).toBe(true);
  });

  it("vale también `planesComprobados`, que trae el mismo recibo y además la cita de cada plan", () => {
    const h = {
      ...base,
      planesComprobados: { fecha: "2026-09-21", url: "https://x.es/pricing", moneda: "EUR", planes: [] },
    } as unknown as Herramienta;
    expect(examinarParaEntrar(h, { capacidadesVerificadas: 3 }).ok).toBe(true);
  });

  it("sin ninguno de los dos, para", () => {
    expect(examinarParaEntrar(base, { capacidadesVerificadas: 3 }).ok).toBe(false);
  });
});
