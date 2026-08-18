import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { historialDeHerramienta, leerHistorialAprobaciones, registrarEnHistorial } from "../historialAprobaciones";

describe("registrarEnHistorial / leerHistorialAprobaciones", () => {
  let dirTemporal: string;
  let ruta: string;

  beforeEach(() => {
    dirTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-historial-"));
    ruta = path.join(dirTemporal, "historial-aprobaciones.json");
  });

  afterEach(() => {
    fs.rmSync(dirTemporal, { recursive: true, force: true });
  });

  it("crea el archivo si no existe y registra el primer intento", () => {
    const registro = registrarEnHistorial(
      {
        herramientaId: "zoho-crm",
        nombreHerramienta: "Zoho CRM",
        resultado: "aceptada",
        puntuacionMolnip: 90,
        estadoAfiliacion: "confirmada",
        observaciones: "Datos completos, afiliado fiable.",
        aprobacionCeo: true,
      },
      { ruta }
    );

    expect(registro.fechaHora).toBeDefined();
    expect(leerHistorialAprobaciones({ ruta })).toEqual([registro]);
  });

  it("añade registros sin borrar los anteriores (append-only)", () => {
    registrarEnHistorial(
      { herramientaId: "a", nombreHerramienta: "A", resultado: "rechazada", puntuacionMolnip: 60, estadoAfiliacion: null, observaciones: "Puntuación insuficiente.", aprobacionCeo: true },
      { ruta }
    );
    registrarEnHistorial(
      { herramientaId: "b", nombreHerramienta: "B", resultado: "aceptada", puntuacionMolnip: 92, estadoAfiliacion: "confirmada", observaciones: "OK.", aprobacionCeo: true },
      { ruta }
    );

    const historial = leerHistorialAprobaciones({ ruta });
    expect(historial).toHaveLength(2);
    expect(historial[0].herramientaId).toBe("a");
    expect(historial[1].herramientaId).toBe("b");
  });

  it("permite varios intentos para la misma herramienta (rechazada y luego aceptada)", () => {
    registrarEnHistorial(
      { herramientaId: "insightly", nombreHerramienta: "Insightly", resultado: "rechazada", puntuacionMolnip: null, estadoAfiliacion: null, observaciones: "Falta aprobación editorial.", aprobacionCeo: false },
      { ruta }
    );
    registrarEnHistorial(
      { herramientaId: "insightly", nombreHerramienta: "Insightly", resultado: "aceptada", puntuacionMolnip: 84, estadoAfiliacion: "pendiente_de_verificar", observaciones: "Datos completos.", aprobacionCeo: true },
      { ruta }
    );

    const historial = historialDeHerramienta("insightly", { ruta });
    expect(historial).toHaveLength(2);
    expect(historial[0].resultado).toBe("rechazada");
    expect(historial[1].resultado).toBe("aceptada");
  });

  it("devuelve un array vacío para una herramienta sin ningún registro", () => {
    expect(historialDeHerramienta("no-existe", { ruta })).toEqual([]);
  });

  it("devuelve un array vacío si el archivo todavía no existe, sin lanzar", () => {
    expect(leerHistorialAprobaciones({ ruta: path.join(dirTemporal, "no-existe.json") })).toEqual([]);
  });
});
