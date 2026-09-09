import { describe, expect, it } from "vitest";
import { afirmaAusencia, describir, esElegible, evidenciaDeRegistro } from "../evidencia";
import { getRegistros } from "../repositorio";
import type { RegistroVerificacion } from "../esquema";

/**
 * Las reglas de lectura de la verificación — F3, bloque 2.
 *
 * Lo que protegen no es una preferencia de estilo: son las tres cosas que F2
 * pagó caro aprender. Que sólo lo verificado se afirme, que el plan no arrastre
 * a la capacidad, y que «no consta» no se convierta nunca en «no lo tiene».
 */

const verificado: RegistroVerificacion = {
  herramientaId: "pipedrive",
  capacidadId: "cap.sales_pipeline",
  estado: "verificado",
  profundidad: "nativa",
  planMinimo: "Lite",
  planEstado: "verificado",
  fuentes: [{ tipo: "tarifa_oficial", url: "https://ejemplo.test/precios", fechaConsulta: "2026-09-03", cita: "Embudo de ventas — Lite" }],
  confianza: "alta",
  proximaRevision: "2027-02-01",
};

const de = (cambios: Partial<RegistroVerificacion> = {}) =>
  evidenciaDeRegistro("pipedrive", "cap.sales_pipeline", { ...verificado, ...cambios });

describe("qué se puede afirmar de un par", () => {
  it("una capacidad verificada se afirma, con su plan y su profundidad", () => {
    expect(de()).toMatchObject({
      estado: "verificado",
      origen: "verificado",
      plan: { certeza: "verificado", nombre: "Lite" },
      profundidad: "nativa",
      confianza: "alta",
    });
  });

  it("una capacidad desconocida es «no consta», y se sabe que se preguntó", () => {
    const e = de({ estado: "desconocido", profundidad: undefined, planMinimo: undefined, planEstado: undefined });
    expect(e.estado).toBe("no_consta");
    expect(e.origen).toBe("desconocido");
  });

  it("un par sin registro también es «no consta», pero nunca se preguntó", () => {
    const e = evidenciaDeRegistro("pipedrive", "cap.que_nadie_investigo", undefined);
    expect(e.estado).toBe("no_consta");
    expect(e.origen).toBe("sin_registro");
  });

  /**
   * Los dos «no consta» pesan igual para decidir, y esa igualdad es la que
   * impide tratar «nunca lo preguntamos» como si fuera peor que «lo
   * preguntamos y no quedó claro». Lo que los distingue es qué haría falta
   * para resolverlos, no cuánto valen.
   */
  it("los dos «no consta» valen lo mismo para decidir", () => {
    const preguntado = de({ estado: "desconocido", profundidad: undefined, planMinimo: undefined, planEstado: undefined });
    const nuncaPreguntado = evidenciaDeRegistro("pipedrive", "cap.otra", undefined);
    expect(esElegible(preguntado)).toBe(esElegible(nuncaPreguntado));
    expect(preguntado.origen).not.toBe(nuncaPreguntado.origen);
  });

  it("un registro descartado tampoco afirma nada", () => {
    expect(de({ estado: "descartado", profundidad: undefined, planMinimo: undefined, planEstado: undefined }).estado).toBe("no_consta");
  });
});

describe("el plan nunca decide", () => {
  it("una capacidad verificada con el plan desconocido SIGUE siendo elegible", () => {
    const e = de({ planEstado: "desconocido", planMinimo: undefined });
    expect(e.estado).toBe("verificado");
    expect(esElegible(e)).toBe(true);
    expect(e.plan.certeza).toBe("desconocido");
  });

  it("y su elegibilidad es idéntica a la del mismo par con el plan demostrado", () => {
    expect(esElegible(de({ planEstado: "desconocido", planMinimo: undefined }))).toBe(esElegible(de()));
  });

  it("un plan desconocido NO se nombra", () => {
    expect(de({ planEstado: "desconocido", planMinimo: undefined }).plan.nombre).toBeUndefined();
  });

  /**
   * El bloqueante que encontró la revisión global el 2026-09-09: doce
   * registros daban el plan por verificado con una cita que no lo nombraba.
   * Aquí se cierra por el otro lado: aunque un registro trajera un nombre sin
   * derecho a llevarlo, la lectura no lo publica salvo con `verificado`.
   */
  it("un nombre de plan colado sin plan verificado no sale de aquí", () => {
    expect(de({ planEstado: "desconocido", planMinimo: "Enterprise" }).plan.nombre).toBeUndefined();
    expect(de({ planEstado: undefined, planMinimo: "Enterprise" }).plan).toEqual({ certeza: "no_procede" });
  });

  it("una capacidad que no consta no opina sobre el plan", () => {
    const e = de({ estado: "desconocido", profundidad: undefined, planMinimo: undefined, planEstado: undefined });
    expect(e.plan).toEqual({ certeza: "no_procede" });
  });

  it("sin capacidad no hay plan que enseñar, aunque el registro lo traiga", () => {
    expect(de({ estado: "desconocido", planEstado: "verificado", planMinimo: "Growth" }).plan.nombre).toBeUndefined();
  });
});

describe("«no consta» no es «no lo tiene»", () => {
  it("el detector reconoce las formas de afirmar una ausencia", () => {
    for (const frase of [
      "Pipedrive no tiene agenda online",
      "no dispone de recordatorios",
      "no  incluye facturación",
      "no-permite reservar",
      "carece de API pública",
      "NO OFRECE soporte en español",
    ]) {
      expect(afirmaAusencia(frase), frase).toBe(true);
    }
  });

  /**
   * Con separadores por medio, igual que la guarda del vocabulario: el doble
   * espacio y el salto de línea se producen tecleando, así que una redacción
   * descuidada no puede apagar esta comprobación.
   */
  it("no se apaga metiendo algo entre las palabras", () => {
    for (const frase of ["no\ntiene reservas", "no\ttiene reservas", "no.tiene reservas", "no  tiene reservas"]) {
      expect(afirmaAusencia(frase), JSON.stringify(frase)).toBe(true);
    }
  });

  it("y no se dispara con lo que sí se puede decir", () => {
    for (const frase of [
      "No nos consta. Todavía está sin comprobar.",
      "No hemos podido demostrar en qué plan entra.",
      "Comprobado en su página oficial.",
    ]) {
      expect(afirmaAusencia(frase), frase).toBe(false);
    }
  });

  it("lo que no consta se cuenta como duda, no como defecto", () => {
    const texto = describir(
      de({ estado: "desconocido", profundidad: undefined, planMinimo: undefined, planEstado: undefined }),
      "Reserva de cita por internet"
    );
    expect(texto).toContain("no nos consta");
    expect(texto).toContain("podría hacerlo igualmente");
    expect(afirmaAusencia(texto)).toBe(false);
  });

  it("lo que nunca se preguntó lo dice así, sin fingir que se miró", () => {
    const texto = describir(evidenciaDeRegistro("x", "cap.y", undefined), "Recordatorios de cita");
    expect(texto).toContain("sin comprobar");
    expect(afirmaAusencia(texto)).toBe(false);
  });

  it("un plan sin demostrar no se convierte en un plan que no existe", () => {
    const texto = describir(de({ planEstado: "desconocido", planMinimo: undefined }), "Embudo de ventas");
    expect(texto).toContain("está sin demostrar");
    expect(afirmaAusencia(texto)).toBe(false);
  });

  it("el plan demostrado sí se nombra", () => {
    expect(describir(de(), "Embudo de ventas")).toContain("a partir del plan Lite");
  });

  // ── Sobre los 1.544 registros reales ──────────────────────────────────
  it("ninguno de los 1.544 registros reales produce una afirmación de ausencia", () => {
    const registros = getRegistros();
    expect(registros.length).toBe(1544);
    const malas = registros
      .map((r) => describir(evidenciaDeRegistro(r.herramientaId, r.capacidadId, r), r.capacidadId))
      .filter(afirmaAusencia);
    expect(malas).toEqual([]);
  });

  /**
   * Estas cuatro notas hablan de que no hay una cita literal en la página —lo
   * que es cierto y no dice nada de la herramienta—, así que se quedan como
   * están. La quinta, la de Beautiful.ai, sí afirmaba una ausencia («no incluye
   * funcionalidad de recordatorios automáticos de citas») y la propietaria la
   * corrigió el 2026-09-09 para que hable de la evidencia y no del producto.
   *
   * `describir()` NO publica las notas. Esta prueba existe para que quien las
   * publique algún día tenga que pasar antes por aquí y verlas.
   */
  it("las notas de F2 no salen por aquí, y cuatro de ellas afirman una ausencia", () => {
    const conNota = getRegistros().filter((r) => r.nota && afirmaAusencia(r.nota));
    expect(conNota.map((r) => `${r.herramientaId}/${r.capacidadId}`)).toEqual([
      "clickup/cap.file_storage",
      "salesmate/cap.marketing_automation",
      "wrike/cap.invoicing",
      "grammarly/cap.online_self_service_booking",
    ]);
    for (const r of conNota) {
      expect(describir(evidenciaDeRegistro(r.herramientaId, r.capacidadId, r), r.capacidadId)).not.toContain(r.nota!);
    }
  });

  it("y la de Beautiful.ai ya habla de la evidencia, no del producto", () => {
    const r = getRegistros().find(
      (x) => x.herramientaId === "beautiful-ai" && x.capacidadId === "cap.customer_appointment_reminders"
    );
    expect(r?.nota).toBe(
      "Buscado en las páginas de producto y precios; la evidencia consultada no demuestra recordatorios automáticos de citas."
    );
    expect(afirmaAusencia(r!.nota!)).toBe(false);
  });
});
