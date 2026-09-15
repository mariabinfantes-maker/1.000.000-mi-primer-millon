import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TAREAS, TAREA_IDS, esTareaId, tareaDe } from "../tareas";

const raiz = process.cwd();
const scripts: Record<string, string> = JSON.parse(
  fs.readFileSync(path.join(raiz, "package.json"), "utf-8")
).scripts;

/**
 * Los scripts que NO son tareas del Orchestrator, y por qué. Escribirlo
 * aquí obliga a pensar: un script nuevo que no esté clasificado hace
 * fallar la prueba de abajo, y esa es toda la gracia.
 */
const NO_SON_TAREAS: Record<string, string> = {
  orquestar: "es el propio Orchestrator: no puede ser una tarea suya",
};

describe("el catálogo de tareas es el único sitio del que sale un comando", () => {
  it("no hay ids repetidos y la lista y el array coinciden", () => {
    expect(new Set(TAREA_IDS).size).toBe(TAREA_IDS.length);
    expect(TAREAS.map((t) => t.id)).toEqual([...TAREA_IDS]);
  });

  it("cada tarea apunta a un script que existe en package.json", () => {
    for (const tarea of TAREAS) {
      expect(scripts[tarea.script], `falta el script ${tarea.script}`).toBeDefined();
    }
  });

  /**
   * La prueba que impide que las dos cosas se separen: lo que ejecuta el
   * Orchestrator tiene que ser exactamente lo que ejecuta `npm run`. Si
   * alguien cambia el fichero de un script y no toca `tareas.ts`, aquí
   * salta.
   */
  it("el módulo de cada tarea es exactamente lo que hace su npm run", () => {
    for (const tarea of TAREAS) {
      expect(scripts[tarea.script], `${tarea.id} no coincide con package.json`).toBe(`tsx ${tarea.modulo}`);
    }
  });

  it("el fichero de cada tarea existe de verdad", () => {
    for (const tarea of TAREAS) {
      expect(fs.existsSync(path.join(raiz, tarea.modulo)), `no existe ${tarea.modulo}`).toBe(true);
    }
  });

  /**
   * Una lista de permitidos sólo sirve si está completa. Un script nuevo
   * sin clasificar no cae en el carril libre por descuido: rompe esto.
   */
  it("todo script de `tsx` de package.json está clasificado o excluido a mano", () => {
    const declarados = new Set(TAREAS.map((t) => t.script));
    const sinClasificar = Object.entries(scripts)
      .filter(([nombre, cuerpo]) => cuerpo.startsWith("tsx ") && !declarados.has(nombre) && !(nombre in NO_SON_TAREAS))
      .map(([nombre]) => nombre);

    expect(sinClasificar, "clasifícalos en tareas.ts o explícalos en NO_SON_TAREAS").toEqual([]);
  });

  it("ninguna tarea se queda sin motivo ni con un motivo que no corresponde a su carril", () => {
    for (const tarea of TAREAS) {
      if (tarea.carril === "libre") expect(tarea.motivo).toBe("ninguno");
      else expect(["gasta_dinero", "escribe_datos"]).toContain(tarea.motivo);
    }
  });

  it("todo lo que gasta dinero o escribe datos pide permiso", () => {
    const investigan = TAREAS.filter((t) => t.id.startsWith("investigar-") || t.id.startsWith("repesca-"));
    expect(investigan.length).toBeGreaterThan(0);
    for (const tarea of investigan) expect(tarea.carril).toBe("conPermiso");

    for (const tarea of TAREAS.filter((t) => t.id.startsWith("migrar-") || t.id.startsWith("promover-"))) {
      expect(tarea.carril).toBe("conPermiso");
    }
  });

  /** Las dos clasificaciones que se corrigieron al leer el código, no al leer el nombre. */
  it("verificar-enlaces-afiliados es libre y convertir-verificacion pide permiso por escribir", () => {
    expect(tareaDe("verificar-enlaces-afiliados")?.carril).toBe("libre");
    expect(tareaDe("convertir-verificacion")).toMatchObject({ carril: "conPermiso", motivo: "escribe_datos" });
  });

  it("un id que no está en la lista no devuelve nada", () => {
    for (const malo of ["", "rm", "informe-afiliacion ", "../otro", "INFORME-AFILIACION"]) {
      expect(tareaDe(malo)).toBeUndefined();
      expect(esTareaId(malo)).toBe(false);
    }
  });
});
