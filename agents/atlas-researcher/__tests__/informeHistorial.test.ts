import { describe, expect, it } from "vitest";
import type { RegistroHistorialAprobacion } from "../historialAprobaciones";
import { generarInformeHistorialHtml } from "../informeHistorial";

function construirRegistro(overrides: Partial<RegistroHistorialAprobacion> & Pick<RegistroHistorialAprobacion, "herramientaId">): RegistroHistorialAprobacion {
  return {
    nombreHerramienta: overrides.herramientaId,
    fechaHora: "2026-08-18T19:00:00.000Z",
    resultado: "aceptada",
    puntuacionMolnip: 90,
    estadoAfiliacion: "confirmada",
    observaciones: "Sin observaciones.",
    aprobacionCeo: true,
    ...overrides,
  };
}

describe("generarInformeHistorialHtml", () => {
  it("genera un documento HTML autocontenido y bien formado", () => {
    const html = generarInformeHistorialHtml([construirRegistro({ herramientaId: "zoho-crm" })]);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Atlas Researcher");
    expect(html).toContain("zoho-crm");
  });

  it("muestra el mensaje de historial vacío cuando no hay ningún registro", () => {
    const html = generarInformeHistorialHtml([]);
    expect(html).toContain("Todavía no hay ningún registro");
  });

  it("muestra el resumen de aceptadas/rechazadas", () => {
    const html = generarInformeHistorialHtml([
      construirRegistro({ herramientaId: "a", resultado: "aceptada" }),
      construirRegistro({ herramientaId: "b", resultado: "rechazada", puntuacionMolnip: null, estadoAfiliacion: null, aprobacionCeo: false }),
    ]);

    expect(html).toContain("2 intento(s)");
    expect(html).toContain("1 aceptada(s)");
    expect(html).toContain("1 rechazada(s)");
  });

  it("muestra más reciente primero", () => {
    const html = generarInformeHistorialHtml([
      construirRegistro({ herramientaId: "primero", fechaHora: "2026-08-18T10:00:00.000Z" }),
      construirRegistro({ herramientaId: "segundo", fechaHora: "2026-08-18T11:00:00.000Z" }),
    ]);

    expect(html.indexOf("segundo")).toBeLessThan(html.indexOf("primero"));
  });

  it("escapa el contenido de las observaciones para evitar HTML sin escapar en el informe", () => {
    const html = generarInformeHistorialHtml([
      construirRegistro({ herramientaId: "a", observaciones: '<img src=x onerror=alert(1)>' }),
    ]);

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img");
  });

  it("muestra guión para puntuación y afiliación ausentes (registro de una promoción rechazada muy temprano)", () => {
    const html = generarInformeHistorialHtml([
      construirRegistro({ herramientaId: "a", puntuacionMolnip: null, estadoAfiliacion: null }),
    ]);

    expect(html).toContain(">—<");
  });
});
