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

/**
 * El tipo de argumentos de cada tarea se escribió leyendo su `process.argv`,
 * no su nombre. Estas pruebas fijan lo que se encontró, incluidas las cinco
 * clasificaciones que estaban mal en la primera versión.
 */
describe("cada tarea declara qué argumentos admite", () => {
  it("las 26 tienen tipo declarado", () => {
    for (const tarea of TAREAS) {
      expect(tarea.argumentos, tarea.id).toBeDefined();
      expect(Array.isArray(tarea.argumentos.posicionales), tarea.id).toBe(true);
      expect(Array.isArray(tarea.argumentos.banderas), tarea.id).toBe(true);
      expect(typeof tarea.argumentos.exigeAlguno, tarea.id).toBe("boolean");
    }
  });

  it("no hay banderas repetidas dentro de una tarea", () => {
    for (const tarea of TAREAS) {
      const nombres = tarea.argumentos.banderas.map((b) => b.nombre);
      expect(new Set(nombres).size, tarea.id).toBe(nombres.length);
    }
  });

  it("ninguna bandera se declara con los dos guiones delante", () => {
    for (const tarea of TAREAS) {
      for (const bandera of tarea.argumentos.banderas) expect(bandera.nombre.startsWith("-"), tarea.id).toBe(false);
    }
  });

  it("una bandera de lista cerrada no declara además una clase", () => {
    for (const tarea of TAREAS) {
      for (const bandera of tarea.argumentos.banderas.filter((b) => b.valores)) {
        expect(bandera.clase, `${tarea.id} --${bandera.nombre}`).toBeUndefined();
      }
    }
  });

  it("si exige alguno, tiene dónde ponerlo", () => {
    for (const tarea of TAREAS.filter((x) => x.argumentos.exigeAlguno)) {
      expect(tarea.argumentos.posicionales.length + tarea.argumentos.banderas.length, tarea.id).toBeGreaterThan(0);
    }
  });

  it("un posicional obligatorio no va detrás de uno opcional", () => {
    for (const tarea of TAREAS) {
      const obligatorios = tarea.argumentos.posicionales.map((p) => p.obligatorio);
      expect(obligatorios.slice().sort((a, b) => Number(b) - Number(a)), tarea.id).toEqual(obligatorios);
    }
  });

  /** Las cinco que estaban mal y se corrigieron leyendo el `argv`. */
  it("repesca-verificacion no admite ningún argumento: lee descartes.json tal cual", () => {
    expect(tareaDe("repesca-verificacion")!.argumentos).toEqual({ posicionales: [], banderas: [], exigeAlguno: false });
  });

  it("verificar-despliegue exige --url y admite --comparar-con y --probar-bloqueo", () => {
    const tipo = tareaDe("verificar-despliegue")!.argumentos;
    expect(tipo.exigeAlguno).toBe(true);
    expect(tipo.banderas.map((b) => b.nombre).sort()).toEqual(["comparar-con", "probar-bloqueo", "url"]);
  });

  it("los tres scripts de Neon admiten --env", () => {
    for (const id of ["verificar-neon", "copia-seguridad-afiliacion", "migrar-a-neon"]) {
      expect(tareaDe(id)!.argumentos.banderas.map((b) => b.nombre), id).toContain("env");
    }
    expect(tareaDe("migrar-a-neon")!.argumentos.banderas.map((b) => b.nombre)).toContain("forzar");
  });
});
