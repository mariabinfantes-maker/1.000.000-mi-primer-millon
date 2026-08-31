import { describe, it, expect } from "vitest";
import type { CuentaAfiliado } from "@/data/esquemaInterno";
import { comprobarProteccion } from "../protegidas";

function cuenta(campos: Partial<CuentaAfiliado> = {}): CuentaAfiliado {
  return {
    id: "principal",
    plataforma: "Programa propio",
    estado: "aprobado",
    enlaces: [],
    ultimaRevision: "2026-08-30",
    ...campos,
  } as CuentaAfiliado;
}

describe("una cuenta ACTIVA no se toca desde una importación", () => {
  const activa = cuenta({ estado: "activo", enlaces: [{ segmento: "global", url: "https://a.test/?ref=x" }] });

  it("no se le cambia el enlace", () => {
    const r = comprobarProteccion("notion", activa, { enlace: "https://otro.test/?ref=y" });
    expect(r?.motivo).toMatch(/ACTIVA y en uso/i);
  });

  it("no se le cambia el estado", () => {
    expect(comprobarProteccion("notion", activa, { estado: "pendiente" })?.motivo).toMatch(/ACTIVA/i);
  });

  it("pero sí se le pueden tocar otros campos: no toda fila queda bloqueada", () => {
    // Actualizar la comisión de una cuenta activa es inofensivo: no cambia
    // a dónde va el tráfico ni si se cobra.
    expect(comprobarProteccion("notion", activa, {})).toBeUndefined();
  });
});

describe("un enlace ya guardado no se pisa", () => {
  const conEnlace = cuenta({ enlaces: [{ segmento: "global", url: "https://a.test/?ref=x" }] });

  it("se rechaza sustituirlo por otro distinto", () => {
    expect(comprobarProteccion("notion", conEnlace, { enlace: "https://otro.test/?ref=y" })?.motivo).toMatch(
      /ya tiene un enlace guardado/i
    );
  });

  it("volver a poner el MISMO enlace no es sustituir: se deja pasar", () => {
    expect(comprobarProteccion("notion", conEnlace, { enlace: "https://a.test/?ref=x" })).toBeUndefined();
  });

  it("añadir uno donde no había es justo lo que esta función viene a hacer", () => {
    expect(comprobarProteccion("notion", cuenta(), { enlace: "https://a.test/?ref=x" })).toBeUndefined();
  });

  it("una herramienta sin estrategia todavía tampoco se bloquea", () => {
    expect(comprobarProteccion("notion", undefined, { enlace: "https://a.test/?ref=x" })).toBeUndefined();
  });
});

describe("protección por nombre", () => {
  it("Systeme.io queda fuera pase lo que pase", () => {
    expect(comprobarProteccion("systeme-io", undefined, {})?.motivo).toMatch(/protegida/i);
  });
});
