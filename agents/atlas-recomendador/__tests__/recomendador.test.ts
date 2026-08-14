import { describe, expect, it } from "vitest";
import { evaluarHerramienta } from "@/agents/atlas-advisor";
import { construirHerramienta } from "@/agents/atlas-advisor/__tests__/fixtures";
import type { ProveedorIA } from "@/agents/compartido/proveedorIA";
import { personalizarExplicacion, personalizarRecomendaciones } from "../recomendador";

function proveedorFalso(comportamiento: () => unknown | Promise<unknown>): ProveedorIA {
  return {
    nombre: "falso",
    async generarJson() {
      return comportamiento();
    },
  };
}

const herramienta = construirHerramienta({ id: "crm-facil", nombre: "CRM Fácil" });

describe("personalizarExplicacion", () => {
  it("devuelve la explicación de la IA cuando la respuesta es válida", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => ({
      explicacion: "Para tu equipo de restauración de 1-10 empleados, CRM Fácil encaja porque es muy sencillo de usar.",
    }));

    const resultado = await personalizarExplicacion(evaluada, { industria: "restauración" }, proveedor);

    expect(resultado).toBe(
      "Para tu equipo de restauración de 1-10 empleados, CRM Fácil encaja porque es muy sencillo de usar."
    );
  });

  it("cae a la explicación determinista si el proveedor lanza un error", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => {
      throw new Error("La API de Gemini no responde.");
    });

    const resultado = await personalizarExplicacion(evaluada, {}, proveedor);

    expect(resultado).toBe(evaluada.explicacion);
  });

  it("cae a la explicación determinista si la respuesta no tiene el campo esperado", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => ({ texto: "esto no es el campo correcto" }));

    const resultado = await personalizarExplicacion(evaluada, {}, proveedor);

    expect(resultado).toBe(evaluada.explicacion);
  });

  it("cae a la explicación determinista si la respuesta no es un objeto JSON", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => "solo texto plano, no JSON");

    const resultado = await personalizarExplicacion(evaluada, {}, proveedor);

    expect(resultado).toBe(evaluada.explicacion);
  });

  it("cae a la explicación determinista si la explicación de la IA es demasiado corta (respuesta degenerada)", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => ({ explicacion: "Sí." }));

    const resultado = await personalizarExplicacion(evaluada, {}, proveedor);

    expect(resultado).toBe(evaluada.explicacion);
  });

  it("cae a la explicación determinista si la explicación de la IA es desmesuradamente larga", async () => {
    const evaluada = evaluarHerramienta(herramienta, {});
    const proveedor = proveedorFalso(() => ({ explicacion: "a".repeat(2000) }));

    const resultado = await personalizarExplicacion(evaluada, {}, proveedor);

    expect(resultado).toBe(evaluada.explicacion);
  });
});

describe("personalizarRecomendaciones", () => {
  it("conserva la herramienta, la puntuación, los detalles y el orden — solo cambia la explicación", async () => {
    const otra = construirHerramienta({ id: "erp-complejo", nombre: "ERP Complejo" });
    const top = [evaluarHerramienta(herramienta, {}), evaluarHerramienta(otra, {})];
    const proveedor = proveedorFalso(() => ({
      explicacion: "Explicación personalizada de prueba, con más de veinte caracteres.",
    }));

    const resultado = await personalizarRecomendaciones(top, {}, proveedor);

    expect(resultado.map((r) => r.herramienta.id)).toEqual(["crm-facil", "erp-complejo"]);
    expect(resultado[0].puntuacionTotal).toBe(top[0].puntuacionTotal);
    expect(resultado[0].detalles).toEqual(top[0].detalles);
    expect(resultado[0].razones).toEqual(top[0].razones);
    expect(resultado[0].explicacion).toBe("Explicación personalizada de prueba, con más de veinte caracteres.");
  });

  it("si el proveedor falla para todos, devuelve las explicaciones deterministas originales sin romper nada", async () => {
    const top = [evaluarHerramienta(herramienta, {})];
    const proveedor = proveedorFalso(() => {
      throw new Error("fallo");
    });

    const resultado = await personalizarRecomendaciones(top, {}, proveedor);

    expect(resultado[0].explicacion).toBe(top[0].explicacion);
  });
});
