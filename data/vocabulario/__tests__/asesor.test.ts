import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import {
  coberturaDelEsqueleto,
  dimensionesDeNecesidad,
  erroresDelEsqueleto,
  getDimensiones,
  getEsqueleto,
  preguntasDePuerta,
} from "../asesor";
import { getPuertas, necesidadesDePuerta } from "../necesidades";

/**
 * EL ESQUELETO TIENE QUE AGUANTAR SIN EL CATÁLOGO.
 *
 * Es la prueba que pidió la propietaria el 2026-09-23, y está escrita como
 * prueba de verdad y no como intención: si quitamos ViDay y cambiamos el
 * catálogo entero, las preguntas y el razonamiento siguen en pie.
 */

const HERRAMIENTAS = getTodasLasHerramientas().map((h) => h.nombre);

/** Las de fuera del catálogo también: son las que contaminaron el prototipo. */
const CANDIDATAS_DE_FUERA = ["ViDay", "Booksy", "SimplyBook", "Fresha", "TIMIFY", "SolverMedia", "Treatwell", "Phorest", "AgendaPro", "Bewe", "flowww"];

describe("la prueba decisiva: quitar el catálogo y que la casa siga en pie", () => {
  it("ninguna pregunta nombra una herramienta del catálogo", () => {
    expect(erroresDelEsqueleto(HERRAMIENTAS)).toEqual([]);
  });

  it("tampoco nombra las candidatas que estuvimos investigando", () => {
    expect(erroresDelEsqueleto(CANDIDATAS_DE_FUERA)).toEqual([]);
  });

  /**
   * La que de verdad atrapa el error de ayer. «¿Cuántas citas al mes?» estaba
   * bien como pregunta y mal como motivo: el prototipo la explicaba diciendo
   * «hay un plan barato con un tope de 100 reservas». Eso es el catálogo
   * explicándole a la clienta por qué le preguntamos.
   */
  it("ningún motivo se apoya en el plan, el precio o el tope de un producto", () => {
    const sospechosas = /\bplan (barato|gratis|b[áa]sico)\b|\btope\b|\bl[íi]mite de \d|\bcuesta \d|\b\d+ ?(€|\$)\b/i;
    for (const d of getDimensiones()) {
      expect(d.porQuePreguntamos, d.id).not.toMatch(sospechosas);
      for (const q of d.queCambia) expect(q, `${d.id}: ${q}`).not.toMatch(sospechosas);
    }
  });

  /**
   * El orden correcto, y lo escribo como prueba porque es donde me torcí:
   * primero se conoce el negocio, y DESPUÉS se comparan los límites de las
   * herramientas contra lo que ya sabemos. Un tope no puede ser el motivo de
   * una pregunta; sí puede ser lo que se hace con la respuesta.
   */
  it("el esqueleto deja escrito el orden: primero el negocio, después los límites", () => {
    const r = getEsqueleto().laReglaQueLoGobierna as { elOrdenCorrecto?: string };
    expect(r.elOrdenCorrecto).toContain("Nunca al revés");
  });
});

describe("se pregunta porque cambia el consejo, no porque el negocio lo tenga", () => {
  it("cada dimensión declara qué cambia su respuesta, y no está vacío", () => {
    for (const d of getDimensiones()) {
      expect(d.queCambia.length, d.id).toBeGreaterThan(0);
      for (const q of d.queCambia) expect(q.length, `${d.id}: ${q}`).toBeGreaterThan(25);
    }
  });

  it("cada dimensión cambia el consejo de alguna necesidad que existe", () => {
    for (const d of getDimensiones()) expect(d.afectaA.length, d.id).toBeGreaterThan(0);
  });

  /**
   * «No lo sé» no puede bloquear. Ni se le pide a la clienta que resuelva una
   * cuestión técnica o legal para poder ayudarla.
   */
  it("la que admite «no lo sé» dice qué se hace entonces", () => {
    for (const d of getDimensiones()) {
      if (d.respuestas.some((r) => r.admiteNoLoSe)) {
        expect(d.siNoSabe, d.id).toBeTruthy();
        expect(d.siNoSabe!.length, d.id).toBeGreaterThan(30);
      }
    }
  });

  it("hay al menos una salida honrada de «no lo sé» en el esqueleto", () => {
    expect(getDimensiones().some((d) => d.respuestas.some((r) => r.admiteNoLoSe))).toBe(true);
  });
});

describe("la estructura sirve a las seis puertas", () => {
  it("las cuatro plantas están: necesidad, pregunta, consejo y presentación", () => {
    const e = getEsqueleto();
    expect(getPuertas().length).toBe(6);
    expect(e.dimensiones.length).toBeGreaterThan(0);
    expect(e.formasDeConsejo.length).toBeGreaterThan(0);
    expect(e.reglasDePresentacion.length).toBeGreaterThan(0);
  });

  /** Decir que no es un resultado, y el esqueleto tiene que saber decirlo. */
  it("hay una forma de consejo para cuando no lo cubrimos", () => {
    const e = getEsqueleto();
    expect(e.formasDeConsejo.some((c) => c.id === "consejo.no-cubierto")).toBe(true);
    expect(e.formasDeConsejo.some((c) => c.id === "consejo.solo-una")).toBe(true);
    expect(e.formasDeConsejo.some((c) => c.id === "consejo.no-aplica")).toBe(true);
  });

  it("ninguna forma de consejo deja de obligar a algo", () => {
    for (const c of getEsqueleto().formasDeConsejo) expect(c.obligatorio.length, c.id).toBeGreaterThan(0);
  });

  it("cada regla de presentación lleva su motivo, para que no se borre en cuanto estorbe", () => {
    for (const r of getEsqueleto().reglasDePresentacion) expect(r.porQue.length, r.id).toBeGreaterThan(20);
  });

  /**
   * Las preguntas de una puerta se calculan desde sus necesidades, no desde
   * una lista escrita a mano: añadir una necesidad trae sus preguntas sola.
   */
  it("las preguntas de una puerta salen de sus necesidades", () => {
    const orden = preguntasDePuerta("puerta.orden");
    expect(orden.length).toBeGreaterThan(0);
    const suyas = new Set(necesidadesDePuerta("puerta.orden").map((n) => n.id));
    for (const d of orden) expect(d.afectaA.some((n) => suyas.has(n)), d.id).toBe(true);
  });

  it("una dimensión que sirve a varias necesidades se pregunta una sola vez", () => {
    const ids = preguntasDePuerta("puerta.orden").map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("la puerta que se ha desarrollado, y lo que falta a la vista", () => {
  /** «Que no se me pierda nada» es la que se rellena primero: es donde cae la peluquera. */
  it("«Que no se me pierda nada» ya tiene preguntas", () => {
    const c = coberturaDelEsqueleto().find((x) => x.puertaId === "puerta.orden")!;
    expect(c.con).toBeGreaterThan(0);
  });

  /**
   * Y lo que falta se ve. No es un fallo: el acuerdo fue cerrar el esqueleto y
   * desarrollar UNA puerta antes de extenderlo a las 61 necesidades. Esta
   * prueba existe para que ese estado sea visible y no se dé por terminado.
   */
  it("las demás puertas están declaradas como pendientes, no disimuladas", () => {
    const cobertura = coberturaDelEsqueleto();
    expect(cobertura.length).toBe(6);
    const sinPreguntas = cobertura.filter((c) => c.con === 0);
    expect(sinPreguntas.length).toBeGreaterThan(0);
  });

  it("la necesidad de la peluquera tiene las preguntas que cambian su consejo", () => {
    const suyas = dimensionesDeNecesidad("nec.mi-agenda").map((d) => d.id);
    expect(suyas).toContain("dim.cuantas-personas");
    expect(suyas).toContain("dim.volumen-de-citas");
  });
});
