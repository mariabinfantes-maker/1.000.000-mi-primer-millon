import { describe, expect, it } from "vitest";
import { generarHashPassword, verificarPassword } from "../passwordHash";

describe("generarHashPassword / verificarPassword", () => {
  it("verifica correctamente la contraseña original", () => {
    const hash = generarHashPassword("mi-contraseña-segura");
    expect(verificarPassword("mi-contraseña-segura", hash)).toBe(true);
  });

  it("rechaza una contraseña incorrecta", () => {
    const hash = generarHashPassword("mi-contraseña-segura");
    expect(verificarPassword("otra-contraseña", hash)).toBe(false);
  });

  it("nunca guarda la contraseña en texto plano dentro del hash", () => {
    const hash = generarHashPassword("mi-contraseña-segura");
    expect(hash).not.toContain("mi-contraseña-segura");
  });

  it("dos hashes de la misma contraseña son distintos (sal aleatoria) pero ambos verifican", () => {
    const hash1 = generarHashPassword("igual");
    const hash2 = generarHashPassword("igual");
    expect(hash1).not.toBe(hash2);
    expect(verificarPassword("igual", hash1)).toBe(true);
    expect(verificarPassword("igual", hash2)).toBe(true);
  });

  it("devuelve false, nunca lanza, si el hash almacenado está vacío o mal formado", () => {
    expect(verificarPassword("cualquiera", undefined)).toBe(false);
    expect(verificarPassword("cualquiera", "")).toBe(false);
    expect(verificarPassword("cualquiera", "no-tiene-dos-puntos")).toBe(false);
    expect(verificarPassword("cualquiera", "no-es-hex:tampoco-es-hex")).toBe(false);
  });
});
