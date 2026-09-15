import { describe, expect, it } from "vitest";
import { planificar, proximaVez, type UltimaEjecucion } from "../planificador";
import { SIN_ARGUMENTOS, TAREAS, type Tarea } from "../tareas";

const AHORA = new Date("2026-09-15T10:00:00Z");
const haceDias = (dias: number) => new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000);

function tarea(parcial: Partial<Tarea>): Tarea {
  return {
    id: "informe-afiliacion",
    script: "informe-afiliacion",
    modulo: "agents/atlas-affiliate-manager/cli-informe-afiliacion.ts",
    descripcion: "…",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
    argumentos: SIN_ARGUMENTOS,
    ...parcial,
  } as Tarea;
}

describe("qué toca hoy", () => {
  it("lo que no se ha ejecutado nunca toca, y lo dice así", () => {
    const [propuesta] = planificar([], AHORA, [tarea({ cadencia: "semanal" })]);
    expect(propuesta.porQue).toBe("no se ha ejecutado nunca");
    expect(propuesta.ultimaVez).toBeUndefined();
  });

  it("lo semanal no se repite a los tres días y sí a los siete", () => {
    const t = tarea({ cadencia: "semanal" });
    const ultimas = (dias: number): UltimaEjecucion[] => [{ tareaId: t.id, fecha: haceDias(dias) }];

    expect(planificar(ultimas(3), AHORA, [t])).toEqual([]);
    expect(planificar(ultimas(6.9), AHORA, [t])).toEqual([]);
    expect(planificar(ultimas(7), AHORA, [t])).toHaveLength(1);
    expect(planificar(ultimas(30), AHORA, [t])[0].porQue).toContain("30 días");
  });

  it("lo mensual espera treinta días", () => {
    const t = tarea({ cadencia: "mensual" });
    expect(planificar([{ tareaId: t.id, fecha: haceDias(29) }], AHORA, [t])).toEqual([]);
    expect(planificar([{ tareaId: t.id, fecha: haceDias(31) }], AHORA, [t])).toHaveLength(1);
  });

  it("lo de cada pasada toca siempre, aunque acabe de ejecutarse", () => {
    const t = tarea({ cadencia: "cada_ejecucion" });
    expect(planificar([{ tareaId: t.id, fecha: AHORA }], AHORA, [t])).toHaveLength(1);
  });

  /**
   * `manual` no es «cada mucho tiempo»: es que el Orchestrator no sabe
   * cuándo. Qué lote investigar o qué borrador promover lo decide una
   * persona, y proponerlo solo sería inventarse esa decisión.
   */
  it("lo manual no se propone nunca, por muy viejo que sea", () => {
    const t = tarea({ cadencia: "manual" });
    expect(planificar([], AHORA, [t])).toEqual([]);
    expect(planificar([{ tareaId: t.id, fecha: haceDias(3650) }], AHORA, [t])).toEqual([]);
  });

  it("de varias ejecuciones anotadas manda la más reciente", () => {
    const t = tarea({ cadencia: "semanal" });
    const ultimas = [
      { tareaId: t.id, fecha: haceDias(40) },
      { tareaId: t.id, fecha: haceDias(2) },
    ];
    expect(planificar(ultimas, AHORA, [t])).toEqual([]);
  });

  /** Un reloj mal puesto no debe disparar tareas: se prefiere no proponer de más. */
  it("una fecha en el futuro no adelanta nada", () => {
    const t = tarea({ cadencia: "semanal" });
    expect(planificar([{ tareaId: t.id, fecha: haceDias(-5) }], AHORA, [t])).toEqual([]);
  });

  it("planificar no ejecuta nada ni distingue carriles: propone igual lo que luego esperará firma", () => {
    const conPermiso = TAREAS.filter((t) => t.carril === "conPermiso" && t.cadencia !== "manual");
    const propuestas = planificar([], AHORA, conPermiso);
    expect(propuestas.map((p) => p.tarea.carril)).toEqual(conPermiso.map(() => "conPermiso"));
  });

  it("sobre el catálogo real, una base vacía propone todo lo que no es manual", () => {
    const esperadas = TAREAS.filter((t) => t.cadencia !== "manual").map((t) => t.id);
    expect(planificar([], AHORA).map((p) => p.tarea.id)).toEqual(esperadas);
  });

  it("proximaVez sólo tiene sentido para lo periódico", () => {
    expect(proximaVez(AHORA, "manual")).toBeUndefined();
    expect(proximaVez(AHORA, "cada_ejecucion")).toBeUndefined();
    expect(proximaVez(AHORA, "semanal")?.toISOString()).toBe("2026-09-22T10:00:00.000Z");
  });
});
