import { describe, expect, it } from "vitest";
import { etiquetaDeEvidencia, type EstadoDeUnPar } from "../etiquetaEvidencia";
import type { FilaDeNecesidad } from "../necesidades";

const fila: FilaDeNecesidad = { id: "web-o-captacion", capacidades: ["cap.website_builder", "cap.landing_pages"] };
const estados = (tabla: Record<string, EstadoDeUnPar>) => (h: string, c: string): EstadoDeUnPar =>
  tabla[`${h}|${c}`] ?? { estado: "no_consta" };

describe("los tres niveles de «lo demuestra»", () => {
  it("confirmada: verificada y con una nota que describe qué hace", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", nota: "Construye el sitio sin programar." } }));
    expect(e).toEqual({ tipo: "confirmada", nota: "Construye el sitio sin programar." });
  });

  it("vía tercero: dice cuál, cuando consta", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "integracion", integraCon: "Transpond", nota: "…" } }));
    expect(e).toEqual({ tipo: "via_tercero", tercero: "Transpond" });
  });

  it("vía tercero: y lo dice también cuando no consta cuál", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "integracion" } }));
    expect(e).toEqual({ tipo: "via_tercero" });
  });

  it("sin detalle: verificada pero la nota no dice nada", () => {
    for (const nota of [undefined, "", "   "]) {
      const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "nativa", nota } }));
      expect(e).toEqual({ tipo: "sin_detalle" });
    }
  });

  it("en una fila que agrupa, manda la primera capacidad demostrada", () => {
    const e = etiquetaDeEvidencia("x", fila, estados({
      "x|cap.website_builder": { estado: "no_consta" },
      "x|cap.landing_pages": { estado: "demostrada", profundidad: "nativa", nota: "Páginas sueltas para captar." },
    }));
    expect(e).toEqual({ tipo: "confirmada", nota: "Páginas sueltas para captar." });
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
    const e = etiquetaDeEvidencia("x", fila, estados({ "x|cap.website_builder": { estado: "demostrada", profundidad: "modulo", nota: larga } }));
    expect(e?.tipo).toBe("confirmada");
    if (e?.tipo === "confirmada") {
      expect(e.nota.length).toBeLessThanOrEqual(162);
      expect(e.nota.endsWith("…")).toBe(true);
      expect(e.nota).not.toMatch(/palabr…$/);
    }
  });
});
