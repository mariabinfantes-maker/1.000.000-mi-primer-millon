import { describe, expect, it, vi } from "vitest";
import { crearProveedorConsola } from "../proveedores/consola";

describe("crearProveedorConsola", () => {
  it("registra el evento como una línea de log estructurada (JSON)", async () => {
    const espia = vi.spyOn(console, "log").mockImplementation(() => {});
    const proveedor = crearProveedorConsola();

    await proveedor.registrarClic({
      herramientaId: "hubspot",
      categoriaId: "plataformas-todo-en-uno",
      tipoEnlace: "afiliado",
      origen: "resultado",
    });

    expect(espia).toHaveBeenCalledTimes(1);
    const registrado = JSON.parse(espia.mock.calls[0][0] as string);
    expect(registrado.herramientaId).toBe("hubspot");
    expect(registrado.tipo).toBe("clic_afiliado");
    expect(typeof registrado.fecha).toBe("string");

    espia.mockRestore();
  });

  it("nunca lanza, aunque falle console.log", async () => {
    const proveedor = crearProveedorConsola();
    await expect(
      proveedor.registrarClic({ herramientaId: "x", categoriaId: "y", tipoEnlace: "oficial", origen: "ficha" })
    ).resolves.toBeUndefined();
  });
});
