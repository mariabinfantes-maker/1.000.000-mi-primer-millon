import { describe, expect, it } from "vitest";
import { diasEntre } from "../fechas";

describe("diasEntre", () => {
  it("calcula los días transcurridos entre dos fechas ISO", () => {
    expect(diasEntre("2026-08-06", "2026-08-01")).toBe(5);
  });

  it("devuelve 0 para la misma fecha", () => {
    expect(diasEntre("2026-08-06", "2026-08-06")).toBe(0);
  });

  it("devuelve un número negativo si la fecha es posterior a hoy", () => {
    expect(diasEntre("2026-08-01", "2026-08-06")).toBe(-5);
  });

  it("devuelve null si alguna fecha no es válida, en vez de lanzar", () => {
    expect(diasEntre("no-es-una-fecha", "2026-08-01")).toBeNull();
    expect(diasEntre("2026-08-06", "no-es-una-fecha")).toBeNull();
  });
});
