import { describe, expect, it } from "vitest";
import { validarAsientoIngreso } from "../validarIngreso";

/**
 * Con el dinero no hay tolerancia.
 *
 * En la etiqueta de recorrido, un valor raro se descarta en silencio y el
 * clic se guarda igual: perder una etiqueta es un dato menos. Aquí es al
 * revés — un importe mal guardado es contabilidad falsa, y una contabilidad
 * falsa es peor que no tener contabilidad.
 */

const bueno = {
  herramientaId: "systeme-io",
  periodo: "2026-08",
  conversiones: 2,
  importeCentimos: 4700,
  estado: "confirmado",
  fuente: "Panel de Systeme.io",
};

describe("acepta un apunte correcto", () => {
  it("con todos sus campos", () => {
    const r = validarAsientoIngreso(bueno);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.asiento).toMatchObject({ herramientaId: "systeme-io", importeCentimos: 4700, moneda: "EUR" });
  });

  it("la moneda por defecto es el euro, en mayúsculas", () => {
    const r = validarAsientoIngreso({ ...bueno, moneda: "usd" });
    expect(r.ok && r.asiento.moneda).toBe("USD");
  });
});

describe("rechaza y explica", () => {
  const casos: [string, unknown, RegExp][] = [
    ["sin herramienta", { ...bueno, herramientaId: "" }, /herramienta/i],
    ["periodo con formato libre", { ...bueno, periodo: "agosto 2026" }, /AAAA-MM/],
    ["mes inexistente", { ...bueno, periodo: "2026-13" }, /AAAA-MM/],
    ["estado inventado", { ...bueno, estado: "cobrado" }, /estado/i],
    ["importe con decimales", { ...bueno, importeCentimos: 47.15 }, /c[ée]ntimos enteros/i],
    ["importe negativo", { ...bueno, importeCentimos: -100 }, /c[ée]ntimos enteros/i],
    ["conversiones fraccionarias", { ...bueno, conversiones: 1.5 }, /entero/i],
    ["moneda inventada", { ...bueno, moneda: "euros" }, /tres letras/i],
    ["cuerpo vacío", null, /cuerpo/i],
  ];

  for (const [nombre, entrada, esperado] of casos) {
    it(nombre, () => {
      const r = validarAsientoIngreso(entrada);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(esperado);
    });
  }

  it("un importe en euros con coma NO se convierte solo: se rechaza", () => {
    // Aceptar 47,15 y multiplicar por 100 parece amable hasta que alguien
    // escribe 47.1 y se guardan 4710 en vez de 4715. Mejor exigir céntimos.
    expect(validarAsientoIngreso({ ...bueno, importeCentimos: "47,15" }).ok).toBe(false);
  });
});
