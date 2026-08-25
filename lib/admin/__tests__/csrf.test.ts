import { describe, expect, it } from "vitest";
import { generarTokenCsrf, tokensCsrfCoinciden } from "../csrf";

describe("generarTokenCsrf / tokensCsrfCoinciden", () => {
  it("dos tokens generados son distintos entre sí", () => {
    expect(generarTokenCsrf()).not.toBe(generarTokenCsrf());
  });

  it("coincide consigo mismo", () => {
    const token = generarTokenCsrf();
    expect(tokensCsrfCoinciden(token, token)).toBe(true);
  });

  it("no coincide con un valor distinto", () => {
    expect(tokensCsrfCoinciden(generarTokenCsrf(), generarTokenCsrf())).toBe(false);
  });

  it("devuelve false, nunca lanza, si falta alguno de los dos valores", () => {
    const token = generarTokenCsrf();
    expect(tokensCsrfCoinciden(undefined, token)).toBe(false);
    expect(tokensCsrfCoinciden(token, undefined)).toBe(false);
    expect(tokensCsrfCoinciden(token, null)).toBe(false);
    expect(tokensCsrfCoinciden(undefined, undefined)).toBe(false);
  });

  it("devuelve false ante longitudes distintas, sin lanzar", () => {
    expect(tokensCsrfCoinciden("abcd", "ab")).toBe(false);
  });
});
