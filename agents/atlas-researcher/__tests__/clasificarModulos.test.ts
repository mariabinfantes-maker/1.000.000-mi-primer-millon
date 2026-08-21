import { describe, expect, it, vi } from "vitest";
import { clasificarModulos, construirPromptModulos, MODULOS_VALIDOS } from "../clasificarModulos";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";

function proveedorFalso(comportamiento: (prompt: string) => unknown): ProveedorIA {
  return {
    nombre: "proveedor-falso",
    generarJson: vi.fn(async (prompt: string) => comportamiento(prompt)),
  };
}

describe("construirPromptModulos", () => {
  it("incluye el nombre de la herramienta y el vocabulario fijo de módulos", () => {
    const prompt = construirPromptModulos("Bitrix24");

    expect(prompt).toContain("Bitrix24");
    expect(prompt).toContain('"crm"');
    expect(prompt).toContain('"facturacion"');
    // No debe pedir el resto del esquema: es una clasificación acotada, no la investigación completa.
    expect(prompt).not.toContain('"descripcion"');
    expect(prompt).not.toContain('"puntuaciones"');
  });

  it("incluye el contexto conocido cuando se pasa", () => {
    const prompt = construirPromptModulos("Bitrix24", "Combina CRM, tareas y chat interno.");
    expect(prompt).toContain("Combina CRM, tareas y chat interno.");
  });
});

describe("clasificarModulos", () => {
  it("acepta los módulos válidos devueltos por el proveedor", async () => {
    const proveedor = proveedorFalso(() => ({ modulos: ["crm", "gestion_proyectos", "atencion_cliente"] }));

    const resultado = await clasificarModulos("Bitrix24", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.modulos).toEqual(["crm", "gestion_proyectos", "atencion_cliente"]);
    }
  });

  it("descarta valores fuera del vocabulario fijo sin fallar", async () => {
    const proveedor = proveedorFalso(() => ({ modulos: ["crm", "inventado", 42, null] }));

    const resultado = await clasificarModulos("Bitrix24", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.modulos).toEqual(["crm"]);
    }
  });

  it("devuelve array vacío si el proveedor no incluye ningún módulo de la lista", async () => {
    const proveedor = proveedorFalso(() => ({ modulos: [] }));

    const resultado = await clasificarModulos("Herramienta de un único propósito", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.modulos).toEqual([]);
    }
  });

  it("trata una respuesta sin la forma esperada como sin módulos, no como un fallo", async () => {
    const proveedor = proveedorFalso(() => "esto no es un objeto JSON");

    const resultado = await clasificarModulos("Bitrix24", proveedor);

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.modulos).toEqual([]);
    }
  });

  it("propaga un error del proveedor como fallo, no como éxito con array vacío", async () => {
    const proveedor: ProveedorIA = {
      nombre: "proveedor-falso",
      generarJson: vi.fn().mockRejectedValue(new Error("Fallo de red")),
    };

    const resultado = await clasificarModulos("Bitrix24", proveedor);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.error).toBe("Fallo de red");
    }
  });

  it("MODULOS_VALIDOS coincide con el vocabulario fijo del esquema", () => {
    expect(MODULOS_VALIDOS).toEqual([
      "crm",
      "gestion_proyectos",
      "asistente_ia",
      "facturacion",
      "email_marketing",
      "atencion_cliente",
      "embudos_de_venta",
      "comercio_electronico",
      "creador_de_sitios_web",
      "recursos_humanos",
    ]);
  });
});
