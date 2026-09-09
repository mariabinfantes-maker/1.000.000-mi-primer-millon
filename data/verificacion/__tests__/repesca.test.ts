import { describe, expect, it } from "vitest";
import type { Descarte } from "../convertir";
import { calcularRepesca, paresDeRepesca } from "../repesca";

/**
 * Repescar mal cuesta dinero y tiempo de la propietaria: la primera vuelta
 * fueron dos horas y cuarto de su ordenador. Lo que se prueba aquí es que no se
 * vuelva a preguntar lo que ya está respondido.
 */
describe("qué hay que volver a preguntar", () => {
  const d = (herramientaId: string, capacidadId: string, motivo: string): Descarte => ({
    herramientaId,
    capacidadId,
    motivo,
  });

  it("una respuesta que se cortó se pregunta entera", () => {
    expect(calcularRepesca([d("clickup", "cap.task_management", "sin respuesta")])).toEqual([
      { herramientaId: "clickup", tipo: "capacidad", capacidadIds: ["cap.task_management"] },
    ]);
  });

  it("una capacidad afirmada sin plan se pregunta sólo por el plan", () => {
    const t = calcularRepesca([d("asana", "cap.time_tracking", "sin plan mínimo")]);
    expect(t).toEqual([{ herramientaId: "asana", tipo: "plan", capacidadIds: ["cap.time_tracking"] }]);
  });

  it("un plan apoyado en la portada también se pregunta sólo por el plan", () => {
    const t = calcularRepesca([
      d("agile-crm", "cap.sales_pipeline", "el plan no viene de una fuente que lo demuestre"),
    ]);
    expect(t[0].tipo).toBe("plan");
  });

  it("lo que se descartó por citar una página que no se leyó NO se repesca aquí", () => {
    expect(calcularRepesca([d("insightly", "cap.dashboards", "la dirección citada no consta como leída")])).toEqual(
      []
    );
  });

  it("una cita revisada y rechazada tampoco se repesca: la decisión ya está tomada", () => {
    expect(calcularRepesca([d("ganttpro", "cap.public_api", "cita breve revisada y rechazada")])).toEqual([]);
  });

  it("agrupa por herramienta y por tipo, sin repetir capacidades", () => {
    const t = calcularRepesca([
      d("clickup", "cap.task_management", "sin respuesta"),
      d("clickup", "cap.task_management", "sin respuesta"),
      d("clickup", "cap.dashboards", "sin respuesta"),
      d("clickup", "cap.invoicing", "sin plan mínimo"),
      d("asana", "cap.time_tracking", "sin plan mínimo"),
    ]);
    expect(t).toEqual([
      { herramientaId: "asana", tipo: "plan", capacidadIds: ["cap.time_tracking"] },
      { herramientaId: "clickup", tipo: "capacidad", capacidadIds: ["cap.dashboards", "cap.task_management"] },
      { herramientaId: "clickup", tipo: "plan", capacidadIds: ["cap.invoicing"] },
    ]);
    expect(paresDeRepesca(t)).toBe(4);
  });

  it("sin descartes no hay nada que repescar", () => {
    expect(calcularRepesca([])).toEqual([]);
  });
});
