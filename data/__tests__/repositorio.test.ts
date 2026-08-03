import { describe, expect, it } from "vitest";
import { getHerramientasPorProblema, getProblema, getProblemas } from "../repositorio";

/**
 * Estas pruebas se ejercitan contra los datos reales del repositorio
 * (`data/problemas.json`, `data/herramientas/*.json`) — igual que
 * `data/verificar.ts` — porque `repositorio.ts` no admite un `dirBase` de
 * pruebas: es la capa de acceso al catálogo público real que sirve la app.
 */

describe("getProblemas / getProblema", () => {
  it("devuelve los 5 problemas iniciales reales", () => {
    const problemas = getProblemas();
    expect(problemas.map((p) => p.id).sort()).toEqual(
      ["ahorrar-tiempo", "atencion-cliente", "automatizar-tareas", "conseguir-clientes", "organizar-empresa"].sort()
    );
  });

  it("getProblema devuelve el problema por id, con su pregunta del cuestionario", () => {
    const problema = getProblema("conseguir-clientes");
    expect(problema?.titulo).toBe("Conseguir más clientes");
    expect(problema?.preguntaHerramienta).toBeTruthy();
  });

  it("getProblema devuelve undefined para un id inexistente", () => {
    expect(getProblema("no-existe")).toBeUndefined();
  });
});

describe("getHerramientasPorProblema", () => {
  it("devuelve solo herramientas reales cuyo problemasIds incluye el id pedido", () => {
    const herramientas = getHerramientasPorProblema("conseguir-clientes");
    expect(herramientas.length).toBeGreaterThan(0);
    for (const h of herramientas) {
      expect(h.problemasIds).toContain("conseguir-clientes");
    }
  });

  it("devuelve un array vacío, no un error, para un problema sin ninguna herramienta asignada todavía", () => {
    // "ahorrar-tiempo" es honesto: el catálogo real no tiene todavía ninguna
    // herramienta de IA/productividad promovida — no se inventa ninguna coincidencia.
    expect(getHerramientasPorProblema("ahorrar-tiempo")).toEqual([]);
  });

  it("devuelve un array vacío para un problemaId inexistente", () => {
    expect(getHerramientasPorProblema("no-existe")).toEqual([]);
  });
});
