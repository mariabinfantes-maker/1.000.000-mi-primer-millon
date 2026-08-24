import { describe, expect, it } from "vitest";
import { validarClic } from "../validarClic";

describe("validarClic", () => {
  it("acepta un evento completo y válido", () => {
    const resultado = validarClic({
      herramientaId: "hubspot",
      categoriaId: "plataformas-todo-en-uno",
      tipoEnlace: "afiliado",
      origen: "resultado",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.evento).toEqual({
        herramientaId: "hubspot",
        categoriaId: "plataformas-todo-en-uno",
        tipoEnlace: "afiliado",
        origen: "resultado",
      });
    }
  });

  it("rechaza cuando falta herramientaId", () => {
    const resultado = validarClic({ categoriaId: "crm", tipoEnlace: "oficial" });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza cuando falta categoriaId", () => {
    const resultado = validarClic({ herramientaId: "hubspot", tipoEnlace: "oficial" });
    expect(resultado.ok).toBe(false);
  });

  it("rechaza un tipoEnlace fuera del vocabulario fijo", () => {
    const resultado = validarClic({ herramientaId: "hubspot", categoriaId: "crm", tipoEnlace: "patrocinado" });
    expect(resultado.ok).toBe(false);
  });

  it('cae a origen "desconocido" si llega vacío, en vez de rechazar la petición', () => {
    const resultado = validarClic({ herramientaId: "hubspot", categoriaId: "crm", tipoEnlace: "oficial" });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.evento.origen).toBe("desconocido");
  });

  it('cae a origen "desconocido" si llega con un valor fuera del vocabulario fijo', () => {
    const resultado = validarClic({
      herramientaId: "hubspot",
      categoriaId: "crm",
      tipoEnlace: "oficial",
      origen: "un-sitio-inventado",
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.evento.origen).toBe("desconocido");
  });
});
