import { describe, expect, it } from "vitest";
import { generarTokenResultado, leerTokenResultado } from "./resultadoToken";

const PAYLOAD_BASE = {
  origenTipo: "objetivo" as const,
  origenId: "gestionar-clientes",
  items: [
    { id: "crm-facil", puntuacion: 42, explicacion: "Encaja por tamaño de empresa.", advertencia: false },
    { id: "crm-avanzado", puntuacion: 30, explicacion: "Buena opción si creces rápido.", advertencia: true },
  ],
  generadoEn: "2026-08-18T10:00:00.000Z",
};

describe("generarTokenResultado / leerTokenResultado", () => {
  it("recupera exactamente el mismo payload que se firmó", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const leido = leerTokenResultado(token);

    expect(leido).toEqual({ v: 1, ...PAYLOAD_BASE });
  });

  it("produce un token distinto para un resultado distinto (no es un id fijo por origen)", () => {
    const tokenA = generarTokenResultado(PAYLOAD_BASE);
    const tokenB = generarTokenResultado({ ...PAYLOAD_BASE, items: [PAYLOAD_BASE.items[0]] });

    expect(tokenA).not.toBe(tokenB);
  });

  it("rechaza un token con la firma alterada (evita recomendaciones falsificadas)", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const [datos, firma] = token.split(".");
    const firmaAlterada = firma.slice(0, -1) + (firma.at(-1) === "A" ? "B" : "A");

    expect(leerTokenResultado(`${datos}.${firmaAlterada}`)).toBeNull();
  });

  it("rechaza un token con el payload alterado tras la firma", () => {
    const token = generarTokenResultado(PAYLOAD_BASE);
    const [datos, firma] = token.split(".");
    const datosAlterados = datos.slice(0, -1) + (datos.at(-1) === "A" ? "B" : "A");

    expect(leerTokenResultado(`${datosAlterados}.${firma}`)).toBeNull();
  });

  it("rechaza entradas que no tienen la forma de un token", () => {
    expect(leerTokenResultado("")).toBeNull();
    expect(leerTokenResultado("sin-punto")).toBeNull();
    expect(leerTokenResultado("demasiadas.partes.aqui")).toBeNull();
    expect(leerTokenResultado("!!!.###")).toBeNull();
  });
});
