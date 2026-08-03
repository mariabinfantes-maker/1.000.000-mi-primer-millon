import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estaAprobado, leerDecision, registrarDecision } from "../decision";

describe("decision", () => {
  let dirTemporal: string;

  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-decisiones-"));
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("registra una decisión y la escribe en decisiones/{id}.json", () => {
    const registro = registrarDecision("hubspot", "aprobado", "Datos completos y afiliados fiables.", {
      dirBase: dirTemporal,
    });

    const ruta = path.join(dirTemporal, "decisiones", "hubspot.json");
    expect(fs.existsSync(ruta)).toBe(true);
    expect(registro.decision).toBe("aprobado");
    expect(registro.notas).toBe("Datos completos y afiliados fiables.");
    expect(registro.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("leerDecision devuelve undefined si no se ha decidido nada todavía", () => {
    expect(leerDecision("hubspot", { dirBase: dirTemporal })).toBeUndefined();
  });

  it("leerDecision devuelve la decisión ya registrada", () => {
    registrarDecision("hubspot", "rechazado", "Comisión de afiliados sin confirmar.", { dirBase: dirTemporal });

    const leida = leerDecision("hubspot", { dirBase: dirTemporal });

    expect(leida?.decision).toBe("rechazado");
    expect(leida?.notas).toBe("Comisión de afiliados sin confirmar.");
  });

  it("una nueva decisión sobrescribe la anterior para el mismo id", () => {
    registrarDecision("hubspot", "rechazado", "Primera revisión: dudas.", { dirBase: dirTemporal });
    registrarDecision("hubspot", "aprobado", "Segunda revisión: confirmado con el equipo.", { dirBase: dirTemporal });

    const leida = leerDecision("hubspot", { dirBase: dirTemporal });

    expect(leida?.decision).toBe("aprobado");
    expect(leida?.notas).toBe("Segunda revisión: confirmado con el equipo.");
  });

  it("estaAprobado es true solo si la decisión registrada es aprobado", () => {
    expect(estaAprobado("hubspot", { dirBase: dirTemporal })).toBe(false);

    registrarDecision("hubspot", "rechazado", "No cumple.", { dirBase: dirTemporal });
    expect(estaAprobado("hubspot", { dirBase: dirTemporal })).toBe(false);

    registrarDecision("hubspot", "aprobado", "Sí cumple.", { dirBase: dirTemporal });
    expect(estaAprobado("hubspot", { dirBase: dirTemporal })).toBe(true);
  });

  it("las decisiones de dos ids distintos no se pisan entre sí", () => {
    registrarDecision("hubspot", "aprobado", "Ok.", { dirBase: dirTemporal });
    registrarDecision("odoo", "rechazado", "No.", { dirBase: dirTemporal });

    expect(estaAprobado("hubspot", { dirBase: dirTemporal })).toBe(true);
    expect(estaAprobado("odoo", { dirBase: dirTemporal })).toBe(false);
  });
});
