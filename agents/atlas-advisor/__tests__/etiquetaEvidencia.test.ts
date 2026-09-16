import { describe, expect, it } from "vitest";
import { etiquetaDeEvidencia, separarPorRespaldo, type EstadoDeUnPar } from "../etiquetaEvidencia";
import type { FilaDeNecesidad } from "../necesidades";

const fila: FilaDeNecesidad = { id: "web-o-captacion", capacidades: ["cap.website_builder", "cap.landing_pages"] };
const estados = (tabla: Record<string, EstadoDeUnPar>) => (h: string, c: string): EstadoDeUnPar =>
  tabla[`${h}|${c}`] ?? { estado: "no_consta" };
const fuente = { url: "https://ejemplo.test/precios", fechaConsulta: "2026-09-07" };

/**
 * Decisión de la propietaria del 2026-09-16 (segunda ronda): una sola
 * etiqueta, «confirmada», que dice por separado lo que se sabe. No saber el
 * plan no deja la función sin demostrar, y la nota no decide nada.
 */
describe("la etiqueta de una capacidad demostrada", () => {
  it("confirmada, con plan, cuando F2 demostró el plan", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({
      "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", plan: { certeza: "verificado", nombre: "Starter" }, fuente },
    }));
    expect(e).toEqual({ tipo: "confirmada", plan: "Starter", fuente: { url: fuente.url, fecha: "2026-09-07" } });
  });

  it("confirmada igualmente cuando el plan no se conoce: sólo falta el plan", () => {
    for (const plan of [undefined, { certeza: "desconocido" }, { certeza: "verificado" }]) {
      const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", plan, fuente } }));
      expect(e).toEqual({ tipo: "confirmada", fuente: { url: fuente.url, fecha: "2026-09-07" } });
    }
  });

  it("la nota se enseña como anotado, y no cambia el nivel", () => {
    const con = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", nota: "Sólo en escritorio.", fuente } }));
    const sin = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", nota: "   ", fuente } }));
    expect(con?.tipo).toBe("confirmada");
    expect(sin?.tipo).toBe("confirmada");
    expect(con).toMatchObject({ anotado: "Sólo en escritorio." });
    expect(sin).not.toHaveProperty("anotado");
  });

  it("una integración con tercero nombrado es confirmada y lo dice", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({
      "x|cap.website_builder": { estado: "demostrada", profundidad: "integracion", integraCon: "Transpond", fuente },
    }));
    expect(e).toEqual({ tipo: "confirmada", integraCon: "Transpond", fuente: { url: fuente.url, fecha: "2026-09-07" } });
  });

  it("una integración sin tercero es el único caso pendiente", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "integracion", fuente } }));
    expect(e).toEqual({ tipo: "pendiente", motivo: "tercero_desconocido" });
  });

  it("en una fila que agrupa, manda la primera capacidad demostrada", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({
      "x|cap.website_builder": { estado: "no_consta" },
      "x|cap.landing_pages": { estado: "demostrada", profundidad: "nativa", plan: { certeza: "verificado", nombre: "Free" }, fuente },
    }));
    expect(e).toMatchObject({ tipo: "confirmada", plan: "Free" });
  });

  /** F2 no obtuvo ninguna, pero el esquema la contempla: una ausencia demostrada NO es una demostración. */
  it("una ausencia demostrada no se etiqueta como nada", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "ausencia_demostrada", profundidad: "no_disponible" } }));
    expect(e).toBeUndefined();
  });

  it("quien no demuestra ninguna no lleva etiqueta", () => {
    expect(etiquetaDeEvidencia("x", fila, estados({}))).toBeUndefined();
  });

  it("una nota larga se corta en una palabra y se marca", () => {
    const larga = "palabra ".repeat(60).trim();
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "modulo", nota: larga, fuente } }));
    expect(e?.tipo).toBe("confirmada");
    if (e?.tipo === "confirmada") {
      expect(e.anotado!.length).toBeLessThanOrEqual(162);
      expect(e.anotado!.endsWith("…")).toBe(true);
      expect(e.anotado).not.toMatch(/palabr…$/);
    }
  });
});

describe("los dos grupos del resultado", () => {
  const item = (id: string) => ({ herramienta: { id } });
  const items = [item("a"), item("b"), item("c")];

  it("sin etiquetas, todo es respaldado: enlaces antiguos y entradas sin pregunta", () => {
    expect(separarPorRespaldo(items)).toEqual({ respaldadas: items, pendientes: [] });
    expect(separarPorRespaldo(items, {})).toEqual({ respaldadas: items, pendientes: [] });
  });

  it("los pendientes salen del grupo principal conservando el orden de los demás", () => {
    const r = separarPorRespaldo(items, {
      a: { tipo: "confirmada" },
      b: { tipo: "pendiente", motivo: "tercero_desconocido" },
      c: { tipo: "confirmada", plan: "Free" },
    });
    expect(r.respaldadas.map((i) => i.herramienta.id)).toEqual(["a", "c"]);
    expect(r.pendientes.map((i) => i.herramienta.id)).toEqual(["b"]);
  });
});
