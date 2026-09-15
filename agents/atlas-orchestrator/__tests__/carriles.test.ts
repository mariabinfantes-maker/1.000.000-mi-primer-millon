import { describe, expect, it } from "vitest";
import { exigeAutorizacion, exigirArgumentosValidos, explicarMotivo, revisarArgumentos, tareasDelCarril } from "../carriles";
import { TAREAS, tareaDe } from "../tareas";

describe("los dos carriles", () => {
  it("los dos carriles suman todas las tareas y ninguna está en los dos", () => {
    const libre = tareasDelCarril("libre");
    const conPermiso = tareasDelCarril("conPermiso");
    expect(libre.length + conPermiso.length).toBe(TAREAS.length);
    expect(libre.some((t) => conPermiso.includes(t))).toBe(false);
  });

  it("pedir permiso es exactamente estar en el carril conPermiso", () => {
    for (const tarea of TAREAS) expect(exigeAutorizacion(tarea)).toBe(tarea.carril === "conPermiso");
  });

  it("el motivo se explica sin jerga: dice qué hace, no cómo se llama el carril", () => {
    expect(explicarMotivo("gasta_dinero")).toContain("dinero");
    expect(explicarMotivo("escribe_datos")).toContain("escribe");
    for (const motivo of ["gasta_dinero", "escribe_datos", "ninguno"] as const) {
      expect(explicarMotivo(motivo)).not.toContain("conPermiso");
      expect(explicarMotivo(motivo)).not.toContain("carril");
    }
  });

  it("una tarea del carril libre nunca gasta ni escribe", () => {
    for (const tarea of tareasDelCarril("libre")) expect(tarea.motivo).toBe("ninguno");
  });

  it("investigar-lote pide permiso por dinero; convertir-verificacion, por escritura", () => {
    expect(exigeAutorizacion(tareaDe("investigar-lote")!)).toBe(true);
    expect(tareaDe("investigar-lote")!.motivo).toBe("gasta_dinero");
    expect(tareaDe("convertir-verificacion")!.motivo).toBe("escribe_datos");
  });
});

describe("los argumentos que llegan de la base de datos", () => {
  it("acepta lo que de verdad se usa: rutas, ids y fechas", () => {
    for (const bueno of ["data/lotes/lote-1.json", "simplybook-me", "2026-09-15", "agents/atlas-researcher/salida.json"]) {
      expect(revisarArgumentos([bueno]).validos, bueno).toBe(true);
    }
  });

  /**
   * No hay intérprete de comandos en el camino (`execFile` sin `shell`),
   * así que esto no evita una inyección: la inyección ya es imposible. Lo
   * que evita es que un dato acabe pareciendo una opción del programa, y
   * que entre por aquí cualquier cosa sin que nadie lo haya pensado.
   */
  it("rechaza lo que dejaría de ser un dato", () => {
    const malos: [unknown[], string][] = [
      [["--force"], "empieza por «-»"],
      [["-rf"], "empieza por «-»"],
      [["rm -rf /"], "caracteres que no se aceptan"],
      [["a; rm b"], "caracteres que no se aceptan"],
      [["$(whoami)"], "caracteres que no se aceptan"],
      [["a\nb"], "caracteres que no se aceptan"],
      [[""], "vacío"],
      [["x".repeat(201)], "vacío o pasa"],
      [[42], "no es texto"],
      [[null], "no es texto"],
      [[{ ruta: "x" }], "no es texto"],
      [new Array(9).fill("a"), "demasiados argumentos"],
    ];
    for (const [entrada, esperado] of malos) {
      const revision = revisarArgumentos(entrada);
      expect(revision.validos, JSON.stringify(entrada)).toBe(false);
      if (!revision.validos) expect(revision.explicacion).toContain(esperado);
    }
  });

  it("sin argumentos es válido: la mayoría de las tareas no llevan", () => {
    expect(revisarArgumentos([]).validos).toBe(true);
    expect(exigirArgumentosValidos([])).toEqual([]);
  });

  it("exigir lanza y nombra el problema", () => {
    expect(() => exigirArgumentosValidos(["--force"])).toThrow(/empieza por/);
  });
});
