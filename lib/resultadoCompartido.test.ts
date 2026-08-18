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
