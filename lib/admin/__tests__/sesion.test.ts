import { describe, expect, it } from "vitest";
import { generarTokenSesion, verificarTokenSesion } from "../sesion";

const AHORA = new Date("2026-08-25T12:00:00Z").getTime();

describe("generarTokenSesion / verificarTokenSesion", () => {
  it("verifica un token recién generado", () => {
    const token = generarTokenSesion("admin", AHORA);
    const payload = verificarTokenSesion(token, AHORA);
    expect(payload?.usuario).toBe("admin");
  });

  it("rechaza un token caducado", () => {
    const token = generarTokenSesion("admin", AHORA);
    const trecehorasDespues = AHORA + 13 * 60 * 60 * 1000;
    expect(verificarTokenSesion(token, trecehorasDespues)).toBeNull();
  });

  it("acepta un token justo antes de caducar", () => {
    const token = generarTokenSesion("admin", AHORA);
    const oncehorasDespues = AHORA + 11 * 60 * 60 * 1000;
    expect(verificarTokenSesion(token, oncehorasDespues)).not.toBeNull();
  });

  it("rechaza un token con la firma manipulada", () => {
    const token = generarTokenSesion("admin", AHORA);
    const [datos] = token.split(".");
    const falsificado = `${datos}.firmaManipulada`;
    expect(verificarTokenSesion(falsificado, AHORA)).toBeNull();
  });

  it("rechaza un payload manipulado (usuario cambiado) aunque la firma original se reutilice", () => {
    const token = generarTokenSesion("admin", AHORA);
    const [, firma] = token.split(".");
    const payloadFalso = Buffer.from(JSON.stringify({ usuario: "atacante", exp: AHORA + 999999999 })).toString("base64url");
    expect(verificarTokenSesion(`${payloadFalso}.${firma}`, AHORA)).toBeNull();
  });

  it("devuelve null ante undefined, vacío o formato inválido, nunca lanza", () => {
    expect(verificarTokenSesion(undefined, AHORA)).toBeNull();
    expect(verificarTokenSesion("", AHORA)).toBeNull();
    expect(verificarTokenSesion("sin-punto", AHORA)).toBeNull();
    expect(verificarTokenSesion("a.b.c", AHORA)).toBeNull();
  });
});
