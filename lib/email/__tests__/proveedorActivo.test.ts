import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { obtenerProveedorEmail } from "../proveedorActivo";

const ENV_ORIGINAL = { ...process.env };

describe("obtenerProveedorEmail", () => {
  beforeEach(() => {
    process.env = { ...ENV_ORIGINAL };
  });

  afterEach(() => {
    process.env = { ...ENV_ORIGINAL };
  });

  it('devuelve el proveedor "simulado" cuando no hay BREVO_API_KEY', () => {
    delete process.env.BREVO_API_KEY;
    expect(obtenerProveedorEmail().nombre).toBe("simulado");
  });

  it('devuelve el proveedor "brevo" cuando BREVO_API_KEY está configurada', () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    expect(obtenerProveedorEmail().nombre).toBe("brevo");
  });
});
