import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estaAprobado, registrarDecision } from "../decision";
import { eliminarPendiente, leerPendiente, listarPendientes, registrarPendiente } from "../pendientes";

describe("el registro de pendientes", () => {
  let dirBase: string;

  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-pendientes-"));
  });

  afterEach(() => {
    fs.rmSync(dirBase, { recursive: true, force: true });
  });

  it("un pendiente escrito se puede volver a leer entero", () => {
    registrarPendiente(
      {
        id: "viday",
        nombreHerramienta: "ViDay",
        estado: "no_consta",
        motivo: '"ViDay": no consta programa de afiliados.',
        datosAfiliados: { affiliateStatus: "not_available" },
      },
      { dirBase }
    );

    const leido = leerPendiente("viday", { dirBase });

    expect(leido).toMatchObject({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta" });
    expect(leido?.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("la cita de ausencia se conserva, que es lo que distingue los dos motivos", () => {
    registrarPendiente(
      {
        id: "sin-programa",
        nombreHerramienta: "SinPrograma",
        estado: "ausencia_demostrada",
        motivo: "…",
        datosAfiliados: {},
        pruebaDeAusencia: { cita: "We do not offer an affiliate program.", fuente: "https://ejemplo.test/faq" },
      },
      { dirBase }
    );

    expect(leerPendiente("sin-programa", { dirBase })?.pruebaDeAusencia?.fuente).toBe("https://ejemplo.test/faq");
  });

  it("sin pendientes no falla: devuelve una lista vacía", () => {
    expect(listarPendientes({ dirBase })).toEqual([]);
    expect(leerPendiente("lo-que-sea", { dirBase })).toBeUndefined();
  });

  it("el listado es estable entre ejecuciones", () => {
    for (const id of ["zeta", "alfa", "media"]) {
      registrarPendiente({ id, nombreHerramienta: id, estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    }

    expect(listarPendientes({ dirBase }).map((p) => p.id)).toEqual(["alfa", "media", "zeta"]);
  });

  /**
   * La puerta que da sentido a haber parado: un pendiente NO está
   * autorizado por existir. Hasta que hay una decisión "aprobado"
   * registrada, la investigación completa no se gasta.
   */
  it("un pendiente recién creado no está autorizado", () => {
    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });

    expect(estaAprobado("viday", { dirBase })).toBe(false);

    registrarDecision("viday", "aprobado", "Cubre un hueco: reserva online en español.", { dirBase });
    expect(estaAprobado("viday", { dirBase })).toBe(true);
  });

  it("una decisión 'rechazado' tampoco autoriza", () => {
    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    registrarDecision("viday", "rechazado", "No aporta nada que el catálogo no tenga.", { dirBase });

    expect(estaAprobado("viday", { dirBase })).toBe(false);
  });

  it("eliminar un pendiente que no existe no falla", () => {
    expect(() => eliminarPendiente("no-existe", { dirBase })).not.toThrow();

    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    eliminarPendiente("viday", { dirBase });
    expect(leerPendiente("viday", { dirBase })).toBeUndefined();
  });
});
