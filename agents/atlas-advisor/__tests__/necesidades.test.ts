import { describe, expect, it } from "vitest";
import {
  NECESIDADES,
  sePreguntaPorFamilias,
  NINGUNA_DE_ESTAS,
  enunciadoDe,
  filaDeNecesidad,
  preguntaParaObjetivo,
  textoDeFila,
  tituloDeFamilia,
  todasLasFilas,
} from "../necesidades";
import { TEXTOS_NECESIDADES } from "../necesidades.textos.es";

/**
 * La tabla de la opción B, como dato. Aquí no se toca ni el vocabulario ni la
 * verificación —las guardas de aislamiento lo impiden, y con razón—: lo que
 * la tabla afirma sobre los datos reales se comprueba en
 * `data/verificacion/__tests__/opcionB.test.ts`, que sí puede leerlos.
 */
describe("la tabla de necesidades", () => {
  it("cubre los cinco objetivos, y ninguno más", () => {
    expect(NECESIDADES.map((p) => p.objetivoId).sort()).toEqual([
      "ahorrar-tiempo",
      "atencion-cliente",
      "automatizar-tareas",
      "conseguir-clientes",
      "organizar-empresa",
    ]);
  });

  it("dentro de un objetivo no hay dos filas con el mismo id", () => {
    for (const pregunta of NECESIDADES) {
      const ids = pregunta.familias.flatMap((f) => f.filas.map((fila) => fila.id));
      expect(new Set(ids).size, pregunta.objetivoId).toBe(ids.length);
    }
  });

  it("una fila con el mismo id es la misma fila esté donde esté", () => {
    const vistas = new Map<string, string>();
    for (const pregunta of NECESIDADES) {
      for (const fila of pregunta.familias.flatMap((f) => f.filas)) {
        const firma = fila.capacidades.join("|");
        const previa = vistas.get(fila.id);
        if (previa) expect(previa, fila.id).toBe(firma);
        vistas.set(fila.id, firma);
      }
    }
  });

  it("toda fila exige al menos una capacidad, y todas empiezan por cap.", () => {
    for (const fila of todasLasFilas()) {
      expect(fila.capacidades.length, fila.id).toBeGreaterThan(0);
      for (const c of fila.capacidades) expect(c, fila.id).toMatch(/^cap\.[a-z_]+$/);
    }
  });

  it("«ninguna de éstas» no es una fila: es una salida, y no puede chocar con un id", () => {
    expect(todasLasFilas().some((f) => f.id === NINGUNA_DE_ESTAS)).toBe(false);
    for (const pregunta of NECESIDADES) expect(filaDeNecesidad(pregunta.objetivoId, NINGUNA_DE_ESTAS)).toBeUndefined();
  });

  it("una fila sólo se encuentra dentro de su objetivo", () => {
    expect(filaDeNecesidad("conseguir-clientes", "captar-datos")?.capacidades).toEqual(["cap.lead_capture"]);
    expect(filaDeNecesidad("organizar-empresa", "captar-datos")).toBeUndefined();
    expect(filaDeNecesidad("no-existe", "captar-datos")).toBeUndefined();
    expect(filaDeNecesidad(undefined, "captar-datos")).toBeUndefined();
    expect(preguntaParaObjetivo(undefined)).toBeUndefined();
  });

  /** Lo que la propietaria acordó fila a fila. Cambiarlo es una decisión, y aquí se nota. */
  it("las decisiones de la propietaria están donde se acordaron", () => {
    const ids = (objetivo: string) => preguntaParaObjetivo(objetivo)!.familias.flatMap((f) => f.filas.map((x) => x.id));

    // Facturar y cobrar: dos filas, en Organizar, y fuera de Conseguir clientes.
    expect(ids("organizar-empresa")).toEqual(expect.arrayContaining(["facturas", "cobrar-online"]));
    expect(ids("conseguir-clientes")).not.toEqual(expect.arrayContaining(["facturas"]));
    // Tickets y chatbot, aunque no haya cobertura.
    expect(ids("atencion-cliente")).toEqual(expect.arrayContaining(["tickets", "chatbot"]));
    expect(filaDeNecesidad("atencion-cliente", "tickets")?.sinCobertura).toBe(true);
    // Conocimiento del equipo en los dos sitios.
    expect(ids("organizar-empresa")).toContain("conocimiento-equipo");
    expect(ids("ahorrar-tiempo")).toContain("conocimiento-equipo");
    // Reservas y recordatorios también en Ahorrar tiempo, en su familia.
    const citas = preguntaParaObjetivo("ahorrar-tiempo")!.familias.find((f) => f.id === "citas")!;
    expect(citas.filas.map((f) => f.id)).toEqual(["citas-reserva", "recordatorios-citas"]);
    // Generar vídeo y editar vídeo son dos filas.
    expect(ids("ahorrar-tiempo")).toEqual(expect.arrayContaining(["video-ia", "editar-video"]));
    // `email_campaigns` no sostiene ninguna fila de Automatizar.
    for (const fila of preguntaParaObjetivo("automatizar-tareas")!.familias.flatMap((f) => f.filas)) {
      expect(fila.capacidades, fila.id).not.toContain("cap.email_campaigns");
    }
  });

  it("se pregunta por familias en cuatro objetivos; «Automatizar» cabe en una pantalla y va de una vez", () => {
    expect(preguntaParaObjetivo("ahorrar-tiempo")!.familias.map((f) => f.id)).toEqual([
      "citas",
      "escribir",
      "reuniones",
      "materiales",
      "dia-y-equipo",
    ]);
    expect(preguntaParaObjetivo("conseguir-clientes")!.familias.map((f) => f.id)).toEqual(["atraer", "convertir"]);
    expect(preguntaParaObjetivo("organizar-empresa")!.familias.map((f) => f.id)).toEqual([
      "tareas-proyectos",
      "equipo-tiempo",
      "dinero",
      "conocimiento",
    ]);
    expect(preguntaParaObjetivo("atencion-cliente")!.familias.map((f) => f.id)).toEqual(["atender", "conocer-cliente", "citas"]);
    expect(preguntaParaObjetivo("automatizar-tareas")!.familias.map((f) => f.id)).toEqual(["general"]);
    for (const pregunta of NECESIDADES) {
      expect(sePreguntaPorFamilias(pregunta), pregunta.objetivoId).toBe(pregunta.objetivoId !== "automatizar-tareas");
    }
  });

  it("ninguna familia enseña más de cuatro necesidades a la vez, y «general» sólo existe cuando es la única", () => {
    for (const pregunta of NECESIDADES) {
      for (const familia of pregunta.familias) {
        expect(familia.filas.length, `${pregunta.objetivoId}/${familia.id}`).toBeLessThanOrEqual(4);
        if (familia.id === "general") expect(pregunta.familias.length, pregunta.objetivoId).toBe(1);
      }
    }
  });
});

describe("los textos que ve la persona", () => {
  it("toda fila, familia y objetivo tiene texto", () => {
    for (const fila of todasLasFilas()) expect(() => textoDeFila(fila.id), fila.id).not.toThrow();
    for (const pregunta of NECESIDADES) {
      expect(enunciadoDe(pregunta.objetivoId).length, pregunta.objetivoId).toBeGreaterThan(10);
      for (const familia of pregunta.familias) {
        if (familia.id !== "general") expect(tituloDeFamilia(familia.id).length, familia.id).toBeGreaterThan(0);
      }
    }
    expect(TEXTOS_NECESIDADES.ninguna.etiqueta.length).toBeGreaterThan(0);
  });

  it("no hay textos huérfanos: cada texto de fila corresponde a una fila", () => {
    const ids = new Set(todasLasFilas().map((f) => f.id));
    for (const clave of Object.keys(TEXTOS_NECESIDADES.filas)) expect(ids.has(clave), clave).toBe(true);
  });

  /** Sin lenguaje técnico: si la frase sólo la entiende quien ya sabía, no ha servido. */
  it("ningún texto lleva un identificador de capacidad ni jerga del motor", () => {
    const todos = [
      ...Object.values(TEXTOS_NECESIDADES.filas).flatMap((t) => [t.etiqueta, t.descripcion]),
      ...Object.values(TEXTOS_NECESIDADES.enunciados),
      ...Object.values(TEXTOS_NECESIDADES.familias),
      TEXTOS_NECESIDADES.ninguna.etiqueta,
      TEXTOS_NECESIDADES.ninguna.descripcion,
    ];
    for (const texto of todos) {
      expect(texto).not.toMatch(/cap\./);
      expect(texto).not.toMatch(/\b(pipeline|CRM|workflow|lead|API|SaaS)\b/);
      expect(texto).not.toMatch(/_/);
    }
  });

  /** La regla de la propietaria: agrupar sólo si cualquiera resuelve, y el texto lo dice con «o». */
  it("una fila que agrupa capacidades lo dice con «o» en su etiqueta", () => {
    for (const fila of todasLasFilas().filter((f) => f.capacidades.length > 1)) {
      expect(textoDeFila(fila.id).etiqueta, fila.id).toMatch(/\bo\b/);
    }
  });

  it("toda descripción dice qué no basta, o qué es exactamente", () => {
    for (const fila of todasLasFilas()) {
      const { descripcion } = textoDeFila(fila.id);
      expect(descripcion.length, fila.id).toBeGreaterThan(20);
    }
  });
});
