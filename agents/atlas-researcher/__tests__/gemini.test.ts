import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ErrorProveedorIA } from "../proveedorIA";
import { crearProveedorGemini } from "../proveedores/gemini";

/**
 * Estos tests documentan (y protegen) que el proveedor de Gemini es
 * todavía un placeholder: deben seguir fallando hasta que una tarea futura
 * implemente la llamada real a la API. Si algún día empiezan a fallar
 * porque `generarJson` ya no lanza, es la señal de que hay que actualizar
 * este archivo junto con la implementación real.
 */
describe("crearProveedorGemini (placeholder, todavía no conectado)", () => {
  const clavePrevia = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (clavePrevia === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = clavePrevia;
    }
  });

  it("se identifica como el proveedor gemini", () => {
    expect(crearProveedorGemini().nombre).toBe("gemini");
  });

  it("sin GEMINI_API_KEY, lanza un ErrorProveedorIA explicando que falta configurarla", async () => {
    const proveedor = crearProveedorGemini();

    await expect(proveedor.generarJson("cualquier prompt")).rejects.toBeInstanceOf(ErrorProveedorIA);
    await expect(proveedor.generarJson("cualquier prompt")).rejects.toThrow(/GEMINI_API_KEY/);
  });

  it("incluso con GEMINI_API_KEY configurada, sigue sin estar implementado", async () => {
    process.env.GEMINI_API_KEY = "clave-de-prueba";
    const proveedor = crearProveedorGemini();

    await expect(proveedor.generarJson("cualquier prompt")).rejects.toThrow(/todavía no está implementada/);
  });
});
