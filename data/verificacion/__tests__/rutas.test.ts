import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { RUTAS_CONGELADAS, RUTAS_PENDIENTES, cumpleLaRuta, estaPendiente, filaDeRuta } from "../rutas";
import { getPuertoDeEvidencia } from "../consulta";
import { capacidadIdsDelVocabulario } from "../repositorio";

/**
 * La tabla ruta→capacidad — F3, bloque 3.
 *
 * Lo que estas pruebas protegen no es el código: es la decisión. Una fila que
 * cambie de capacidad, o un pendiente que se cuele como resuelto, cambia a
 * quién deja de recomendarse Molnip. Que falle una prueba obliga a que eso
 * pase por la revisión de un diff.
 */
describe("la tabla ruta→capacidad", () => {
  const capacidades = capacidadIdsDelVocabulario();
  const herramientas = getTodasLasHerramientas();

  it("son las seis filas aprobadas, ni una más", () => {
    expect(RUTAS_CONGELADAS.map((f) => f.ambito)).toEqual([
      "gestion-proyectos",
      "asistentes-ia/espacio-trabajo",
      "asistentes-ia/escritura",
      "asistentes-ia/reuniones-transcripcion",
      "asistentes-ia/agenda-planificacion",
      "asistentes-ia/presentaciones",
      "asistentes-ia/video",
    ]);
  });

  it("cada capacidad exigida existe en el vocabulario", () => {
    const inventadas = RUTAS_CONGELADAS.flatMap((f) => f.exigeAlgunaDe).filter((id) => !capacidades.includes(id));
    expect(inventadas).toEqual([]);
  });

  it("el ámbito concuerda con la categoría y el subtipo", () => {
    for (const f of RUTAS_CONGELADAS) {
      expect(f.ambito).toBe(f.subtipoId ? `${f.categoriaId}/${f.subtipoId}` : f.categoriaId);
    }
  });

  it("ninguna fila exige una capacidad repetida ni una lista vacía", () => {
    for (const f of RUTAS_CONGELADAS) {
      expect(f.exigeAlgunaDe.length, f.ambito).toBeGreaterThan(0);
      expect(new Set(f.exigeAlgunaDe).size, f.ambito).toBe(f.exigeAlgunaDe.length);
    }
  });

  it("cada fila explica por qué esa capacidad y no otra", () => {
    for (const f of RUTAS_CONGELADAS) expect(f.motivo.trim().length, f.ambito).toBeGreaterThan(40);
  });

  /**
   * Una fila para un ámbito sin herramientas sería una regla sobre un conjunto
   * vacío: nunca fallaría y nunca serviría. El catálogo cubre hoy 4 de las 15
   * categorías.
   */
  it("ninguna fila gobierna un ámbito sin herramientas", () => {
    for (const f of RUTAS_CONGELADAS) {
      const suyas = herramientas.filter(
        (h) => h.categoriaId === f.categoriaId && (f.subtipoId === undefined || h.subtipoId === f.subtipoId)
      );
      expect(suyas.length, f.ambito).toBeGreaterThan(0);
    }
  });
});

describe("lo que queda pendiente sigue pendiente", () => {
  it("CRM y las suites no tienen fila", () => {
    expect(filaDeRuta("crm")).toBeUndefined();
    expect(filaDeRuta("plataformas-todo-en-uno")).toBeUndefined();
  });

  /**
   * Sin esto, «pendiente» y «olvidado» son indistinguibles. Un ámbito
   * pendiente que apareciera en la tabla habría dejado de estarlo sin que
   * nadie lo decidiera.
   */
  it("y están escritos como pendientes, con su motivo", () => {
    expect(RUTAS_PENDIENTES.map((p) => p.ambito)).toEqual(["crm", "plataformas-todo-en-uno"]);
    for (const p of RUTAS_PENDIENTES) expect(p.porque.trim().length, p.ambito).toBeGreaterThan(80);
    expect(estaPendiente("crm")).toBe(true);
    expect(estaPendiente("asistentes-ia/escritura")).toBe(false);
  });

  it("ningún pendiente aparece a la vez como fila congelada", () => {
    const congelados = new Set(RUTAS_CONGELADAS.map((f) => f.ambito));
    expect(RUTAS_PENDIENTES.filter((p) => congelados.has(p.ambito))).toEqual([]);
  });
});

describe("cómo se aplica una fila", () => {
  const fila = filaDeRuta("gestion-proyectos")!;

  it("basta con demostrar una de las capacidades", () => {
    expect(cumpleLaRuta(fila, "x", (_h, c) => c === "cap.task_management")).toBe(true);
    expect(cumpleLaRuta(fila, "x", (_h, c) => c === "cap.project_planning")).toBe(true);
  });

  it("no demostrar ninguna no la cumple", () => {
    expect(cumpleLaRuta(fila, "x", () => false)).toBe(false);
  });

  it("una fila de una sola capacidad se aplica igual", () => {
    const escritura = filaDeRuta("asistentes-ia", "escritura")!;
    expect(cumpleLaRuta(escritura, "x", (_h, c) => c === "cap.text_generation")).toBe(true);
    expect(cumpleLaRuta(escritura, "x", (_h, c) => c === "cap.ai_task_agents")).toBe(false);
  });

  it("el subtipo no se confunde con la categoría entera", () => {
    expect(filaDeRuta("asistentes-ia")).toBeUndefined();
    expect(filaDeRuta("asistentes-ia", "escritura")?.ambito).toBe("asistentes-ia/escritura");
  });
});

/**
 * Cuántas candidatas deja hoy cada fila, con la evidencia real. No es un
 * detalle: es el coste de la decisión, y si cambia sin que nadie lo mire, la
 * tabla habrá cambiado de significado sin cambiar de texto.
 */
describe("qué deja fuera cada fila hoy", () => {
  const puerto = getPuertoDeEvidencia();
  const herramientas = getTodasLasHerramientas();
  const SUITES = "plataformas-todo-en-uno";
  const loDemuestra = (h: string, c: string) => puerto.estadoDe(h, c).estado === "verificado";

  /** Las suites compiten en las categorías especializadas, así que entran en el universo. */
  function universo(f: { categoriaId: string; subtipoId?: string }) {
    return herramientas.filter((h) =>
      f.subtipoId
        ? h.categoriaId === f.categoriaId && h.subtipoId === f.subtipoId
        : h.categoriaId === f.categoriaId || h.categoriaId === SUITES
    );
  }

  it.each([
    ["gestion-proyectos", 29, 18],
    ["asistentes-ia/espacio-trabajo", 3, 3],
    ["asistentes-ia/escritura", 3, 3],
    ["asistentes-ia/reuniones-transcripcion", 3, 3],
    ["asistentes-ia/agenda-planificacion", 3, 3],
    ["asistentes-ia/presentaciones", 3, 3],
    ["asistentes-ia/video", 3, 3],
  ])("%s: de %i candidatas pasan %i", (ambito, esperadoUniverso, esperadoPasan) => {
    const fila = RUTAS_CONGELADAS.find((f) => f.ambito === ambito)!;
    const u = universo(fila);
    expect(u.length).toBe(esperadoUniverso);
    expect(u.filter((h) => cumpleLaRuta(fila, h.id, loDemuestra)).length).toBe(esperadoPasan);
  });

  it("ninguna fila deja su ámbito sin ninguna candidata", () => {
    for (const fila of RUTAS_CONGELADAS) {
      const pasan = universo(fila).filter((h) => cumpleLaRuta(fila, h.id, loDemuestra));
      expect(pasan.length, fila.ambito).toBeGreaterThan(0);
    }
  });
});
