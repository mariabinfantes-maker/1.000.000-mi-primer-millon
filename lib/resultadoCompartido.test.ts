import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { resolverResultadoCompartido } from "./resultadoCompartido";
import { generarTokenResultado } from "./resultadoToken";

describe("resolverResultadoCompartido", () => {
  it("rehidrata una herramienta real del catálogo a partir de su id", () => {
    const [primera] = getHerramientas();
    const token = generarTokenResultado({
      origenTipo: "libre",
      origenId: "libre",
      items: [{ id: primera.id, puntuacion: 12, explicacion: "Explicación de prueba.", advertencia: false }],
      generadoEn: new Date().toISOString(),
    });

    const resultado = resolverResultadoCompartido(token);

    expect(resultado).not.toBeNull();
    expect(resultado?.origen).toEqual({ tipo: "libre", id: "libre", titulo: "Tu diagnóstico", rutaBase: "/libre" });
    expect(resultado?.top).toHaveLength(1);
    expect(resultado?.top[0].herramienta).toEqual(primera);
    expect(resultado?.top[0].explicacion).toBe("Explicación de prueba.");
  });

  it("omite herramientas que ya no existen en el catálogo sin romper el resto", () => {
    const [primera] = getHerramientas();
    const token = generarTokenResultado({
      origenTipo: "libre",
      origenId: "libre",
      items: [
        { id: "herramienta-que-no-existe-xyz", puntuacion: 5, explicacion: "Ya no existe.", advertencia: false },
        { id: primera.id, puntuacion: 12, explicacion: "Sigue existiendo.", advertencia: false },
      ],
      generadoEn: new Date().toISOString(),
    });

    const resultado = resolverResultadoCompartido(token);

    expect(resultado?.top).toHaveLength(1);
    expect(resultado?.top[0].herramienta.id).toBe(primera.id);
  });

  it("devuelve null si todas las herramientas del token han desaparecido del catálogo", () => {
    const token = generarTokenResultado({
      origenTipo: "libre",
      origenId: "libre",
      items: [{ id: "no-existe-1", puntuacion: 1, explicacion: "", advertencia: false }],
      generadoEn: new Date().toISOString(),
    });

    expect(resolverResultadoCompartido(token)).toBeNull();
  });

  it("devuelve null si el origen (categoría u objetivo) ya no existe", () => {
    const [primera] = getHerramientas();
    const token = generarTokenResultado({
      origenTipo: "categoria",
      origenId: "categoria-que-no-existe-xyz",
      items: [{ id: primera.id, puntuacion: 1, explicacion: "", advertencia: false }],
      generadoEn: new Date().toISOString(),
    });

    expect(resolverResultadoCompartido(token)).toBeNull();
  });

  it("devuelve null ante un token inválido, sin lanzar", () => {
    expect(resolverResultadoCompartido("token-que-no-es-valido")).toBeNull();
  });
});

/**
 * La ida y vuelta completa del aviso — F3, bloque 6.
 *
 * El token ya se prueba aparte; aquí se comprueba lo que llega a la pantalla:
 * qué se enseña (la causa que manda) y que la otra sigue ahí.
 */
describe("las necesidades que no se pudieron confirmar", () => {
  const base = {
    origenTipo: "categoria" as const,
    origenId: "crm",
    items: [{ id: "pipedrive", puntuacion: 20, explicacion: "x", advertencia: false }],
    generadoEn: "2026-09-10T10:00:00.000Z",
  };

  it("con una causa, se enseña la suya", () => {
    const token = generarTokenResultado({
      ...base,
      sinConfirmar: { causas: [{ causa: "capacidad_sin_evidencia", necesidad: "llevar tus clientes" }] },
    });
    const r = resolverResultadoCompartido(token);
    expect(r?.sinConfirmar?.necesidad).toBe("llevar tus clientes");
    expect(r?.sinConfirmar?.causas).toHaveLength(1);
  });

  it("con las dos, se enseña la primera y la segunda no se pierde", () => {
    const causas = [
      { causa: "capacidad_sin_evidencia" as const, necesidad: "llevar tus clientes" },
      { causa: "opcion_sin_candidatas" as const, necesidad: "poder llamar desde el propio CRM" },
    ];
    const r = resolverResultadoCompartido(generarTokenResultado({ ...base, sinConfirmar: { causas } }));
    expect(r?.sinConfirmar?.necesidad).toBe("llevar tus clientes");
    expect(r?.sinConfirmar?.causas).toEqual(causas);
  });

  it("un enlace normal no trae aviso ninguno", () => {
    expect(resolverResultadoCompartido(generarTokenResultado(base))?.sinConfirmar).toBeUndefined();
  });

  /** Los enlaces guardados antes de F3 no llevan el campo y siguen abriéndose. */
  it("un enlace anterior a F3 sigue resolviéndose entero", () => {
    const r = resolverResultadoCompartido(generarTokenResultado(base));
    expect(r?.top.map((e) => e.herramienta.id)).toEqual(["pipedrive"]);
    expect(r?.generadoEn).toBe(base.generadoEn);
  });
});
