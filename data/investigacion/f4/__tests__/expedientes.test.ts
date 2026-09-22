import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * LOS EXPEDIENTES PARA LA REVISIÓN FINAL.
 *
 * Autorizados por la propietaria el 2026-09-22: «preparar las tres para su
 * revisión final, antes de incorporarlas al catálogo». No son fichas, no están
 * en el catálogo y el motor no las lee.
 *
 * Existen para que la revisión se haga sobre pruebas y no sobre un resumen, y
 * para que pasar por F2 signifique **incorporar y validar lo ya guardado,
 * consultando sólo lo que falte** — condición de ella, después de que se
 * gastaran quince llamadas repitiendo trabajo que ya existía.
 */

const EXP = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/investigacion/f4/expedientes/citas-2026-09-22.json"), "utf8")
) as {
  herramientas: {
    id: string;
    nombre: string;
    demostrado: { que: string; cita: string; url: string; fecha: string }[];
    precio: Record<string, unknown>;
    noConsta: string[];
    limitesDelPlan?: { que: string; cita: string; url: string }[];
  }[];
};

describe("cada afirmación viene con lo que la sostiene", () => {
  it("ninguna afirmación se queda sin cita, sin url y sin fecha", () => {
    for (const h of EXP.herramientas) {
      for (const d of h.demostrado) {
        expect(d.cita.length, `${h.nombre}: ${d.que}`).toBeGreaterThan(15);
        expect(d.url, `${h.nombre}: ${d.que}`).toMatch(/^https:\/\//);
        expect(d.fecha, `${h.nombre}: ${d.que}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  /** La URL de la cita tiene que ser del fabricante, no de un tercero. */
  it("las citas salen del dominio oficial de cada herramienta", () => {
    const dominio: Record<string, RegExp> = {
      viday: /^https:\/\/viday\.es\//,
      booksy: /^https:\/\/(biz\.)?booksy\.com\//,
      simplybook: /^https:\/\/simplybook\.me\//,
    };
    for (const h of EXP.herramientas) {
      for (const d of h.demostrado) expect(d.url, `${h.nombre}: ${d.que}`).toMatch(dominio[h.id]);
    }
  });

  it("los límites de plan también vienen con su cita", () => {
    for (const h of EXP.herramientas) {
      for (const l of h.limitesDelPlan ?? []) {
        expect(l.cita.length, `${h.nombre}: ${l.que}`).toBeGreaterThan(15);
        expect(l.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("los precios se pueden comparar sin trampa", () => {
  /**
   * Corrección de la propietaria: «falta indicar si los 64 € de ViDay incluyen
   * IVA». No incluían — y de paso salió que los 64 € estaban mal: el plan de
   * equipo son 75 €, no 59.
   */
  it("cada precio dice su moneda y si lleva impuestos", () => {
    for (const h of EXP.herramientas) {
      expect(h.precio.moneda, h.nombre).toBeTruthy();
      expect(h.precio.llevaIva, h.nombre).toBeDefined();
      expect(String(h.precio.paraTresProfesionales), h.nombre).toBeTruthy();
    }
  });

  /**
   * «SimplyBook.me debe conservar su precio en dólares hasta justificar la
   * conversión.» Así que el suyo NO se pasa a euros: se enseña en dólares con
   * lo que no se sabe.
   */
  it("el precio en dólares no se convierte a euros por nuestra cuenta", () => {
    const sb = EXP.herramientas.find((h) => h.id === "simplybook")!;
    expect(sb.precio.moneda).toBe("USD");
    expect(String(sb.precio.paraTresProfesionales)).toContain("USD");
    expect(String(sb.precio.paraTresProfesionales)).not.toMatch(/€|EUR/);
    expect(sb.precio.llevaIva).toBe("no_consta");
  });

  /** Dos lecturas distintas del mismo dato no se cierran eligiendo una. */
  it("la contradicción del precio de ViDay queda a la vista, sin resolver", () => {
    const v = EXP.herramientas.find((h) => h.id === "viday")!;
    expect(String(v.precio.dudaAbierta)).toContain("DOS LECTURAS DISTINTAS");
    expect(v.precio.llevaIva).toBe(false);
  });
});

describe("las dudas siguen siendo dudas", () => {
  it("las tres declaran qué no consta, y ninguna se queda sin dudas", () => {
    for (const h of EXP.herramientas) expect(h.noConsta.length, h.nombre).toBeGreaterThan(0);
  });

  /**
   * «Verifactu no puede presentarse como una obligación de esa clienta sin
   * comprobar su situación. La declaración del fabricante tampoco basta.»
   */
  it("lo de Verifactu dice lo que hace el programa, no lo que le obliga a ella", () => {
    const v = EXP.herramientas.find((h) => h.id === "viday")!;
    const verifactu = v.demostrado.find((d) => d.que.includes("Verifactu"))!;
    expect((verifactu as { matiz?: string }).matiz).toContain("no lo sabemos");
    expect(v.noConsta.some((n) => n.includes("Verifactu"))).toBe(true);
  });

  it("ninguna duda está escrita como si fuera un defecto de la herramienta", () => {
    for (const h of EXP.herramientas) {
      for (const n of h.noConsta) {
        expect(n.toLowerCase(), `${h.nombre}: ${n}`).not.toMatch(/\bno (lo )?(hace|tiene|permite|sirve)\b/);
      }
    }
  });
});
