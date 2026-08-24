import { describe, expect, it, vi } from "vitest";
import { procesarSuscripcion } from "../procesarSuscripcion";
import type { ProveedorEmail, ResultadoOperacionEmail } from "../proveedorEmail";

function proveedorFalso(opciones: {
  suscribir?: ResultadoOperacionEmail;
  enviarBienvenida?: ResultadoOperacionEmail;
} = {}): ProveedorEmail & { suscribir: ReturnType<typeof vi.fn>; enviarBienvenida: ReturnType<typeof vi.fn> } {
  return {
    nombre: "proveedor-falso",
    suscribir: vi.fn(async (): Promise<ResultadoOperacionEmail> => opciones.suscribir ?? { ok: true }),
    enviarBienvenida: vi.fn(async (): Promise<ResultadoOperacionEmail> => opciones.enviarBienvenida ?? { ok: true }),
    enviarTransaccional: vi.fn(async (): Promise<ResultadoOperacionEmail> => ({ ok: true })),
  };
}

describe("procesarSuscripcion", () => {
  it("da de alta y envía la bienvenida cuando todo va bien", async () => {
    const proveedor = proveedorFalso();

    const resultado = await procesarSuscripcion({ email: "ana@ejemplo.com", origen: "pie-de-pagina" }, proveedor);

    expect(resultado.ok).toBe(true);
    expect(proveedor.suscribir).toHaveBeenCalledWith({
      email: "ana@ejemplo.com",
      origen: "pie-de-pagina",
      categoriaId: undefined,
      problemaId: undefined,
    });
    expect(proveedor.enviarBienvenida).toHaveBeenCalledWith("ana@ejemplo.com");
  });

  it("no llega a llamar al proveedor si la validación falla", async () => {
    const proveedor = proveedorFalso();

    const resultado = await procesarSuscripcion({ email: "no-es-un-email", origen: "pie-de-pagina" }, proveedor);

    expect(resultado.ok).toBe(false);
    expect(proveedor.suscribir).not.toHaveBeenCalled();
    expect(proveedor.enviarBienvenida).not.toHaveBeenCalled();
  });

  it("devuelve error al usuario si falla el alta del contacto", async () => {
    const proveedor = proveedorFalso({ suscribir: { ok: false, error: "fallo de red" } });

    const resultado = await procesarSuscripcion({ email: "ana@ejemplo.com", origen: "pie-de-pagina" }, proveedor);

    expect(resultado.ok).toBe(false);
    expect(proveedor.enviarBienvenida).not.toHaveBeenCalled();
  });

  it("sigue devolviendo éxito si el alta funciona pero falla el email de bienvenida", async () => {
    const proveedor = proveedorFalso({ enviarBienvenida: { ok: false, error: "fallo al enviar" } });

    const resultado = await procesarSuscripcion({ email: "ana@ejemplo.com", origen: "pie-de-pagina" }, proveedor);

    // El usuario ya está suscrito, que es lo que importa; el email de bienvenida es un extra.
    expect(resultado.ok).toBe(true);
  });

  it("pasa categoriaId y problemaId al proveedor cuando llegan en el cuerpo", async () => {
    const proveedor = proveedorFalso();

    await procesarSuscripcion(
      { email: "ana@ejemplo.com", origen: "resultados", categoriaId: "crm", problemaId: "conseguir-clientes" },
      proveedor
    );

    expect(proveedor.suscribir).toHaveBeenCalledWith({
      email: "ana@ejemplo.com",
      origen: "resultados",
      categoriaId: "crm",
      problemaId: "conseguir-clientes",
    });
  });
});
