import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearProveedorBrevo } from "../proveedores/brevo";

const ENV_ORIGINAL = { ...process.env };

describe("crearProveedorBrevo", () => {
  beforeEach(() => {
    process.env = { ...ENV_ORIGINAL };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...ENV_ORIGINAL };
  });

  it("suscribir() devuelve error legible si falta BREVO_API_KEY", async () => {
    delete process.env.BREVO_API_KEY;
    const proveedor = crearProveedorBrevo();

    const resultado = await proveedor.suscribir({ email: "ana@ejemplo.com", origen: "pie-de-pagina" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("BREVO_API_KEY");
  });

  it("suscribir() devuelve error legible si falta BREVO_LIST_ID", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    delete process.env.BREVO_LIST_ID;
    const proveedor = crearProveedorBrevo();

    const resultado = await proveedor.suscribir({ email: "ana@ejemplo.com", origen: "pie-de-pagina" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("BREVO_LIST_ID");
  });

  it("enviarBienvenida() devuelve error legible si falta BREVO_SENDER_EMAIL", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    delete process.env.BREVO_SENDER_EMAIL;
    const proveedor = crearProveedorBrevo();

    const resultado = await proveedor.enviarBienvenida("ana@ejemplo.com");

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("BREVO_SENDER_EMAIL");
  });

  it("suscribir() llama a la API de contactos de Brevo con la clave y la lista correctas", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.BREVO_LIST_ID = "7";
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchFalso);

    const proveedor = crearProveedorBrevo();
    const resultado = await proveedor.suscribir({ email: "ana@ejemplo.com", origen: "resultados", categoriaId: "crm" });

    expect(resultado.ok).toBe(true);
    expect(fetchFalso).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/contacts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "api-key": "clave-de-prueba" }),
      })
    );
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.listIds).toEqual([7]);
    expect(cuerpo.attributes.CATEGORIA_ID).toBe("crm");
  });

  it("suscribir() devuelve error legible si Brevo responde con un fallo HTTP", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.BREVO_LIST_ID = "7";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: "email inválido" }),
      })
    );

    const proveedor = crearProveedorBrevo();
    const resultado = await proveedor.suscribir({ email: "ana@ejemplo.com", origen: "pie-de-pagina" });

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.error).toContain("email inválido");
  });

  it("enviarBienvenida() llama a la API transaccional con el remitente configurado", async () => {
    process.env.BREVO_API_KEY = "clave-de-prueba";
    process.env.BREVO_SENDER_EMAIL = "hola@molnip.com";
    const fetchFalso = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal("fetch", fetchFalso);

    const proveedor = crearProveedorBrevo();
    const resultado = await proveedor.enviarBienvenida("ana@ejemplo.com");

    expect(resultado.ok).toBe(true);
    const cuerpo = JSON.parse(fetchFalso.mock.calls[0][1].body);
    expect(cuerpo.sender.email).toBe("hola@molnip.com");
    expect(cuerpo.to).toEqual([{ email: "ana@ejemplo.com" }]);
  });
});
