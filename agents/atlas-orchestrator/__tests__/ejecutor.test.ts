import path from "node:path";
import { describe, expect, it } from "vitest";
import { comandoDe, ejecutarTarea } from "../ejecutor";
import { tareaDe, type Tarea } from "../tareas";

const RAIZ = process.cwd();

/** No es una tarea del catálogo: es el fixture, y sólo lo usa esta prueba. */
const ECO: Tarea = {
  id: "informe-afiliacion",
  script: "informe-afiliacion",
  modulo: "agents/atlas-orchestrator/__tests__/fixtures/eco.ts",
  descripcion: "fixture",
  carril: "libre",
  motivo: "ninguno",
  cadencia: "manual",
  argumentos: {
    posicionales: [{ clase: "texto", descripcion: "lo que sea", obligatorio: false, repetible: true }],
    banderas: [],
    exigeAlguno: false,
  },
};

describe("lo que se lanza, y cómo", () => {
  it("lanza el mismo Node que ya corre, con tsx y el fichero de la tarea", () => {
    const tarea = tareaDe("informe-afiliacion")!;
    const { ejecutable, argumentos } = comandoDe(tarea, [], RAIZ);

    expect(ejecutable).toBe(process.execPath);
    expect(argumentos[0]).toBe(path.join(RAIZ, "node_modules", "tsx", "dist", "cli.mjs"));
    expect(argumentos[1]).toBe(path.join(RAIZ, "agents/atlas-affiliate-manager/cli-informe-afiliacion.ts"));
    expect(argumentos).toHaveLength(2);
  });

  /**
   * Ni «npm», ni un `.cmd`, ni una cadena entera que alguien tenga que
   * trocear. Si algún día aparece aquí un comando compuesto, es que se ha
   * metido un intérprete por medio.
   */
  it("no construye ninguna cadena de comando ni pasa por npm", () => {
    const casos: [string, string[]][] = [
      ["verificar-datos", []],
      ["investigar-lote", ["data/lotes/lote-1.json"]],
      ["aprobar-borrador", ["viday", "--decision", "aprobado", "--notas", "Cubre un hueco real"]],
    ];
    for (const [id, args] of casos) {
      const { ejecutable, argumentos } = comandoDe(tareaDe(id)!, args, RAIZ);
      expect(ejecutable).not.toMatch(/npm/);
      for (const argumento of [ejecutable, ...argumentos]) {
        expect(argumento).not.toMatch(/[;&|><`$]/);
      }
    }
  });

  it("los argumentos van detrás del fichero, en orden y sin tocar", () => {
    const { argumentos } = comandoDe(
      tareaDe("actualizar-estrategia-afiliacion")!,
      ["viday", "--fecha-solicitud", "2026-09-15", "--notas", "Solicitado por correo"],
      RAIZ
    );
    expect(argumentos.slice(2)).toEqual(["viday", "--fecha-solicitud", "2026-09-15", "--notas", "Solicitado por correo"]);
  });

  /**
   * El agujero que cerró esta corrección: antes esto construía un `argv`
   * que apuntaba a `/etc/passwd`, en una tarea del carril libre que se
   * ejecuta sin firma ninguna.
   */
  it("una travesía de directorios no llega ni a construir el comando", () => {
    expect(() => comandoDe(tareaDe("investigar-lote")!, ["../../../etc/passwd"], RAIZ)).toThrow(/fuera del repositorio/);
    expect(() => comandoDe(tareaDe("convertir-verificacion")!, ["/etc/shadow"], RAIZ)).toThrow(/Argumentos rechazados/);
  });

  it("un argumento que no pasa la revisión no llega ni a construir el comando", () => {
    expect(() => comandoDe(tareaDe("investigar-lote")!, ["--force"], RAIZ)).toThrow(/Argumentos rechazados/);
  });

  it("se puede ver qué se lanzaría sin lanzarlo", async () => {
    const vistos: { ejecutable: string; argumentos: string[] }[] = [];
    await ejecutarTarea(tareaDe("informe-curador")!, [], {
      raiz: RAIZ,
      lanzar: async (ejecutable, argumentos) => {
        vistos.push({ ejecutable, argumentos });
        return { ok: true, codigoSalida: 0, salida: "" };
      },
    });
    expect(vistos).toHaveLength(1);
    expect(vistos[0].argumentos[1]).toContain("cli-informe-curador.ts");
  });
});

describe("un proceso de verdad, por el mismo camino que las tareas reales", () => {
  it("el argumento llega literal al programa, sin que nadie lo interprete", async () => {
    const resultado = await ejecutarTarea(ECO, ["data/lotes/lote-1.json"], { raiz: RAIZ });

    expect(resultado.ok).toBe(true);
    expect(JSON.parse(resultado.salida)).toEqual(["data/lotes/lote-1.json"]);
  }, 60_000);

  it("si el proceso sale con error, el resultado lo dice y no lo disimula", async () => {
    const resultado = await ejecutarTarea(ECO, ["fallo"], { raiz: RAIZ });

    expect(resultado.ok).toBe(false);
    expect(resultado.codigoSalida).toBe(1);
    expect(resultado.salida).toContain("fallo");
  }, 60_000);
});
