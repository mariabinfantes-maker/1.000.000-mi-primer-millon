import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * LOS EXPEDIENTES PARA LA REVISIÓN FINAL.
 *
 * Autorizados por la propietaria el 2026-09-22: «preparar las tres para su
 * revisión final, antes de incorporarlas al catálogo». No son fichas, no están
 * en el catálogo y el motor no las lee.
 *
 * Existen para que la revisión se haga sobre pruebas y no sobre un resumen, y
 * para que pasar por F2 signifique **incorporar y validar lo ya guardado,
 * consultando sólo lo que falte** — condición de ella, después de que se
 * gastaran quince llamadas repitiendo trabajo que ya existía.
 */

const EXP = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/investigacion/f4/expedientes/citas-2026-09-22.json"), "utf8")
) as {
  herramientas: {
    id: string;
    nombre: string;
    demostrado: { que: string; cita: string; url: string; fecha: string }[];
    precio: Record<string, unknown>;
    noConsta: string[];
    limitesDelPlan?: { que: string; cita: string; url: string }[];
    pendientes?: { que: string; porQue: string; intento: string }[];
  }[];
  preguntasParaLaClienta: { pregunta: string; porQue: string; afectaA: string[] }[];
};

describe("cada afirmación viene con lo que la sostiene", () => {
  it("ninguna afirmación se queda sin cita, sin url y sin fecha", () => {
    for (const h of EXP.herramientas) {
      for (const d of h.demostrado) {
        expect(d.cita.length, `${h.nombre}: ${d.que}`).toBeGreaterThan(15);
        expect(d.url, `${h.nombre}: ${d.que}`).toMatch(/^https:\/\//);
        expect(d.fecha, `${h.nombre}: ${d.que}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  /** La URL de la cita tiene que ser del fabricante, no de un tercero. */
  it("las citas salen del dominio oficial de cada herramienta", () => {
    const dominio: Record<string, RegExp> = {
      viday: /^https:\/\/viday\.es\//,
      booksy: /^https:\/\/(biz\.)?booksy\.com\//,
      simplybook: /^https:\/\/simplybook\.me\//,
    };
    for (const h of EXP.herramientas) {
      for (const d of h.demostrado) expect(d.url, `${h.nombre}: ${d.que}`).toMatch(dominio[h.id]);
    }
  });

  it("los límites de plan también vienen con su cita", () => {
    for (const h of EXP.herramientas) {
      for (const l of h.limitesDelPlan ?? []) {
        expect(l.cita.length, `${h.nombre}: ${l.que}`).toBeGreaterThan(15);
        expect(l.url).toMatch(/^https:\/\//);
      }
    }
  });
});

describe("los precios se pueden comparar sin trampa", () => {
  /**
   * Corrección de la propietaria: «falta indicar si los 64 € de ViDay incluyen
   * IVA». No incluían — y de paso salió que los 64 € estaban mal: el plan de
   * equipo son 75 €, no 59.
   */
  it("cada precio dice su moneda y si lleva impuestos", () => {
    for (const h of EXP.herramientas) {
      expect(h.precio.moneda, h.nombre).toBeTruthy();
      expect(h.precio.llevaIva, h.nombre).toBeDefined();
      expect(String(h.precio.paraTresProfesionales), h.nombre).toBeTruthy();
    }
  });

  /**
   * «SimplyBook.me debe conservar su precio en dólares hasta justificar la
   * conversión.» Así que el suyo NO se pasa a euros: se enseña en dólares con
   * lo que no se sabe.
   */
  it("el precio en dólares no se convierte a euros por nuestra cuenta", () => {
    const sb = EXP.herramientas.find((h) => h.id === "simplybook")!;
    expect(sb.precio.moneda).toBe("USD");
    expect(String(sb.precio.paraTresProfesionales)).toContain("USD");
    expect(String(sb.precio.paraTresProfesionales)).not.toMatch(/€|EUR/);
    expect(sb.precio.llevaIva).toBe("no_consta");
  });

  /**
   * La «contradicción» del suplemento de ViDay no lo era: cada plan tiene el
   * suyo, y las dos lecturas hablaban de planes distintos. Se resolvió leyendo
   * la página plan por plan, que es lo que había que hacer desde el principio.
   */
  it("el precio de ViDay está resuelto plan a plan, no elegido a dedo", () => {
    const v = EXP.herramientas.find((h) => h.id === "viday")!;
    expect(v.precio.estado).toBe("resuelto");
    expect(v.precio.llevaIva).toBe(false);
    const planes = v.precio.planes as { nombre: string; suplemento?: string }[];
    expect(planes.length).toBeGreaterThanOrEqual(5);
    // Los dos que importan, cada uno con su suplemento propio.
    expect(planes.find((p) => p.nombre.includes("Equipo - Estandar"))?.suplemento).toContain("5");
    expect(planes.find((p) => p.nombre.includes("Equipo - Pro"))?.suplemento).toContain("10");
  });

  /**
   * ESTA PRUEBA DECÍA OTRA COSA, Y ESTABA MAL. Fijaba que el precio dependía
   * de si a la clienta le obligaba Verifactu: 49 € el plan Estándar, 85 € el
   * Pro. Era un salto, y lo señaló la propietaria: **ella pidió hacer
   * facturas, le obligue Verifactu o no**.
   *
   * Al mirar qué incluye cada plan, en la lista del Equipo Estándar no aparece
   * ninguna función de facturación. Así que el plan es Pro en los dos casos, y
   * lo que Verifactu cambia es lo urgente que sea, no qué plan necesita.
   *
   * Que en la lista no aparezca NO demuestra que el plan no facture. Demuestra
   * que no podemos confirmar que cubra lo que ella pidió, que es distinto y es
   * suficiente para no ofrecérselo como si lo cubriera.
   */
  it("el plan para quien quiere facturar es Pro, y no lo decide Verifactu", () => {
    const v = EXP.herramientas.find((h) => h.id === "viday")!;
    const porPlan = v.precio.facturacionPorPlan as {
      equipoEstandar: { facturacion: string; lectura: string };
      equipoPro: { facturacion: string; cita: string };
    };
    expect(porPlan.equipoEstandar.facturacion).toBe("no_consta");
    expect(porPlan.equipoPro.facturacion).toBe("demostrado");
    // Y la lectura del Estándar no puede afirmar una ausencia.
    expect(porPlan.equipoEstandar.lectura).toContain("no demuestra que el plan no facture");
    expect(String(v.precio.loQueDecideElPrecio)).toContain("Ya NO lo decide Verifactu");
  });

});

describe("las dudas siguen siendo dudas", () => {
  it("las tres declaran qué no consta, y ninguna se queda sin dudas", () => {
    for (const h of EXP.herramientas) expect(h.noConsta.length, h.nombre).toBeGreaterThan(0);
  });

  /**
   * «Verifactu no puede presentarse como una obligación de esa clienta sin
   * comprobar su situación. La declaración del fabricante tampoco basta.»
   */
  it("lo de Verifactu dice lo que hace el programa, no lo que le obliga a ella", () => {
    const v = EXP.herramientas.find((h) => h.id === "viday")!;
    const verifactu = v.demostrado.find((d) => d.que.includes("Verifactu"))!;
    expect((verifactu as { matiz?: string }).matiz).toContain("no lo sabemos");
    expect(v.noConsta.some((n) => n.includes("Verifactu"))).toBe(true);
  });

  it("ninguna duda está escrita como si fuera un defecto de la herramienta", () => {
    for (const h of EXP.herramientas) {
      for (const n of h.noConsta) {
        expect(n.toLowerCase(), `${h.nombre}: ${n}`).not.toMatch(/\bno (lo )?(hace|tiene|permite|sirve)\b/);
      }
    }
  });
});

describe("lo que falta preguntarle a ELLA, no a una página", () => {
  /**
   * La corrección de la propietaria que convierte esto en asesorar: «tener
   * tres profesionales no demuestra que superen las 100 reservas». El límite
   * de un plan sólo significa algo contra el uso real, y el uso real no está
   * en ninguna web: se pregunta.
   */
  it("hay preguntas para la clienta, y cada una dice a qué afecta", () => {
    expect(EXP.preguntasParaLaClienta.length).toBeGreaterThanOrEqual(3);
    for (const p of EXP.preguntasParaLaClienta) {
      expect(p.pregunta).toMatch(/\?/);
      expect(p.porQue.length).toBeGreaterThan(40);
      expect(p.afectaA.length).toBeGreaterThan(0);
    }
  });

  it("el volumen de citas se pregunta, no se supone por ser tres personas", () => {
    const q = EXP.preguntasParaLaClienta.find((p) => p.pregunta.includes("citas atendéis"))!;
    expect(q.porQue).toContain("NO demuestra");
    expect(q.afectaA).toContain("simplybook");
  });

  /** Lo que no se pudo comprobar se declara, no se rellena. */
  it("lo que se intentó y no salió queda escrito como intento, no como dato", () => {
    const sb = EXP.herramientas.find((h) => h.id === "simplybook")!;
    expect(sb.pendientes?.length).toBeGreaterThan(0);
    expect(sb.pendientes![0].intento).toContain("tiempo de espera agotado");
  });
});

describe("la propuesta por escenarios", () => {
  const ESC = (EXP as unknown as { escenarios: { si: string; entonces: string; cuesta: string; porQue: string; pendiente: string[] }[] }).escenarios;
  const FISCAL = (EXP as unknown as { sobreLaPreguntaFiscal: { regla: string; porQue: string; queNoSeHace: string } }).sobreLaPreguntaFiscal;

  it("cada escenario dice qué cuesta y qué queda pendiente", () => {
    expect(ESC.length).toBeGreaterThanOrEqual(3);
    for (const e of ESC) {
      expect(e.cuesta.length, e.si).toBeGreaterThan(10);
      expect(e.pendiente.length, e.si).toBeGreaterThan(0);
    }
  });

  /**
   * «No tiene que resolverlo todo una sola herramienta.» Separar las citas de
   * la facturación es una salida legítima y tiene que estar sobre la mesa.
   */
  it("separar citas y facturación es uno de los escenarios", () => {
    expect(ESC.some((e) => e.si.toLowerCase().includes("separar"))).toBe(true);
  });

  /**
   * El salto que había que quitar: «si no le obliga Verifactu, Estándar».
   * Ella pidió facturas, y en la lista del plan Estándar no aparece ninguna
   * función de facturación. No se puede ofrecer el plan barato como si
   * cubriera lo que pidió.
   */
  it("ningún escenario ofrece el plan Estándar para quien quiere facturar", () => {
    const conFactura = ESC.filter((e) => e.si.toLowerCase().includes("factura") && !e.si.toLowerCase().includes("separar"));
    expect(conFactura.length).toBeGreaterThan(0);
    for (const e of conFactura) expect(e.entonces).not.toMatch(/Est[áa]ndar/);
  });

  /**
   * La pregunta fiscal admite «no lo sé» y no bloquea nada. Y no se le pide a
   * la clienta que resuelva una cuestión técnica para poder ayudarla.
   */
  it("la pregunta de Verifactu no bloquea el asesoramiento", () => {
    expect(FISCAL.regla).toContain("no lo se");
    expect(FISCAL.regla).toContain("NO bloquea");
    expect(FISCAL.queNoSeHace).toContain("cuestion tecnica");
  });

  /** Nada aquí se presenta como «la mejor»: eso depende de ella. */
  it("ningún escenario corona a una herramienta", () => {
    const todo = JSON.stringify(ESC).toLowerCase();
    for (const frase of ["la mejor", "la más completa es la", "sin duda", "la opción ideal"]) {
      expect(todo).not.toContain(frase);
    }
  });
});
