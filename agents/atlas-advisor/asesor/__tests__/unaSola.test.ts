import { describe, it, expect } from "vitest";
import { aconsejar, getOficios, loQueTraeUnOficio } from "..";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";

const imp = (id: string): NecesidadDelCaso => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" });

/**
 * DESCONECTADA EL 2026-09-24, por orden de la propietaria. No se borra.
 *
 * Lo que vigilaba era esto, y está escrito aquí para que no se pierda:
 *
 *   «El asesor devuelve UNA recomendación, nunca una lista. Si no puede
 *    elegir entre varias, no las enseña: dice que no puede y hace la única
 *    pregunta que le permitiría decidir.»
 *
 * POR QUÉ SE APAGA. Esa frase la redacté yo y nunca fue una regla. La
 * propietaria la matizó el mismo día, con su boceto delante: «recibe una,
 * pero se le enseñan las demás en orden de cercanía». Yo me quedé con la
 * mitad dura —«nunca una lista»— y le monté una guarda, que es el
 * instrumento que esta casa reserva para lo ganado con incidentes: el color
 * congelado, el bloqueo de Teachable. Aquí defendía un matiz de un día.
 *
 * Sus palabras al corregirlo: «nunca hemos dicho que el asesor devuelva una
 * sola (...) si no se podía mostrar sino una sola, se mostraba, pero no era
 * la regla. Siempre podemos mostrar tres como mínimo (...) nos aferramos a
 * algo como si fuera la verdad absoluta».
 *
 * Y de paso pisaba una decisión anterior que seguía vigente:
 * `MINIMO_ALTERNATIVAS_POR_DEFECTO = 3` en `agents/atlas-curator/cobertura.ts`,
 * que existe para que haya comparación honesta. No se consultó.
 *
 * LO QUE ES VERDAD HOY: lo mínimo es una, porque menos no hay; tres se
 * pueden enseñar siempre; y no hay regla fija. Cuántas se enseñan es parte
 * del diseño que está abierto, y mientras esté abierto no lo vigila una
 * prueba.
 *
 * El comportamiento de `aconsejar` NO se ha tocado: sigue eligiendo una y
 * enseñando las demás por cercanía. Lo que se apaga es la guarda, no el
 * código. Si el diseño decide otra cosa, `elegirUna` se cambia sin que nada
 * de aquí lo impida.
 *
 * El bloque de abajo, «y las demás, de más cerca a más lejos», se queda
 * ENCENDIDO: ése comprueba el matiz que sí dijo ella —que las otras se vean,
 * y ordenadas por cercanía, no por el alfabeto—, y ése fue el fallo real
 * («Agiled parece la dueña de todo»).
 */
describe.skip("la regla de la casa: una sola, o ninguna y una pregunta", () => {
  const CASOS: { quien: string; trae: NecesidadDelCaso[] }[] = [
    ...getOficios().map((o) => ({ quien: o.nombre, trae: loQueTraeUnOficio(o.id) })),
    { quien: "peluquería: citas + facturar", trae: [imp("nec.que-reserven-solos"), imp("nec.emitir-una-factura-legal")] },
    { quien: "reformas: presupuesto + facturar", trae: [imp("nec.presupuestar-rapido"), imp("nec.emitir-una-factura-legal")] },
    { quien: "sólo la factura obligatoria", trae: [imp("nec.la-factura-obligatoria")] },
  ];

  it("nunca devuelve dos, y cuando no puede elegir lo dice y pregunta", () => {
    for (const caso of CASOS) {
      const c = aconsejar(caso.trae);
      // O hay UNA, o no hay ninguna. Nunca una lista como respuesta.
      if (c.loQueHaria) {
        expect(c.loQueNecesitoSaber, caso.quien).toBeNull();
        // Y siempre dice por qué ésa y no otra.
        expect(c.loQueHaria.desempate.porQue.length, caso.quien).toBeGreaterThan(20);
      } else {
        // Sin recomendación: o no hay nada, o empatan y se pregunta.
        const hayCandidatas = c.caminos.some((cam) => cam.opciones.length > 0);
        if (hayCandidatas) expect(c.loQueNecesitoSaber, caso.quien).toBeTruthy();
      }
    }
  });

  it("y se ve qué decidió en cada caso", () => {
    const porCriterio: Record<string, number> = {};
    for (const caso of CASOS) {
      const c = aconsejar(caso.trae);
      const k = c.loQueHaria?.desempate.criterio ?? (c.loQueNecesitoSaber ? "no-puedo-elegir" : "nada-que-proponer");
      porCriterio[k] = (porCriterio[k] ?? 0) + 1;
      console.log(
        "  " + caso.quien.padEnd(42) +
        (c.loQueHaria ? c.loQueHaria.piezas.map((p) => p.nombre).join("+") : "—").padEnd(34) +
        k
      );
    }
    console.log("\n  " + JSON.stringify(porCriterio));
    expect(Object.keys(porCriterio).length).toBeGreaterThan(0);
  });
});

describe("y las demás, de más cerca a más lejos", () => {
  it("el orden no es el alfabeto: es el mismo del desempate", () => {
    const c = aconsejar([imp("nec.que-reserven-solos"), imp("nec.emitir-una-factura-legal")]);
    console.log("\n  MANDA:      " + c.loQueHaria!.piezas.map((p) => p.nombre).join("+"));
    console.log("  porque      " + c.loQueHaria!.desempate.porQue);
    console.log("  LAS DEMÁS, de más cerca a más lejos:");
    for (const a of c.alternativas) {
      const p = a.piezas[0];
      console.log(
        "    " + a.piezas.map((x) => x.nombre).join("+").padEnd(20) +
        (p.coste.enEspanol ? "español " : "        ") +
        (p.coste.tienePlanGratuito ? "gratis " : "       ") +
        (p.coste.desde ?? "")
      );
    }
    expect(c.alternativas.length).toBeGreaterThan(0);
    // La que manda no puede repetirse abajo.
    const manda = c.loQueHaria!.piezas.map((p) => p.herramientaId).join("+");
    for (const a of c.alternativas) {
      expect(a.piezas.map((p) => p.herramientaId).join("+")).not.toBe(manda);
    }
  });
});
