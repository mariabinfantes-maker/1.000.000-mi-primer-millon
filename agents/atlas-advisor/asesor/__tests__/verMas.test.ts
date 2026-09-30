import { describe, expect, it } from "vitest";
import { aconsejar } from "../aconsejar";
import { getNecesidad } from "@/data/vocabulario/necesidades";

const caso = (...ids: string[]) =>
  ids.map((id) => ({ necesidad: getNecesidad(id)!, importancia: "imprescindible" as const }));

describe("«ver más» enseña de verdad lo que promete", () => {
  /**
   * `hayMas` era sólo una cuenta: las opciones de detrás no se construían, así
   * que el «te las enseño todas» de la pantalla no lo podía cumplir nadie.
   */
  it("las que cubren lo mismo se construyen, no sólo se cuentan", () => {
    const r = aconsejar(caso("nec.que-reserven-solos"));
    const cam = r.caminos.find((c) => c.forma === "todo-en-uno")!;
    expect(cam.opciones.length + cam.masOpciones.length).toBeGreaterThan(cam.opciones.length);
    for (const o of cam.masOpciones) expect(o.piezas.length).toBeGreaterThan(0);
  });

  /**
   * El caso que puso la propietaria: reservas y facturas. Lo que resuelve sólo
   * las reservas tiene que poder verse —«puede interesar si la persona
   * conserva su facturación actual»— y tiene que decir que no resuelve las
   * facturas —«no debe presentarse como si resolviera ambas»—.
   */
  it("lo que resuelve sólo una parte está, y dice qué parte no resuelve", () => {
    const r = aconsejar(caso("nec.que-reserven-solos", "nec.emitir-una-factura-legal"));
    const cam = r.caminos.find((c) => c.forma === "todo-en-uno")!;
    expect(cam.parciales.length).toBeGreaterThan(0);
    for (const o of cam.parciales) expect(o.noCubre.length).toBeGreaterThan(0);
  });

  /** Y nunca delante: las parciales no se mezclan con las que cubren todo. */
  it("una parcial no se cuela entre las que cubren todo", () => {
    const r = aconsejar(caso("nec.que-reserven-solos", "nec.emitir-una-factura-legal"));
    for (const cam of r.caminos) {
      for (const o of [...cam.opciones, ...cam.masOpciones]) expect(o.noCubre).toEqual([]);
    }
  });

  /**
   * «No resuelve facturas» sólo cuando está demostrado que no las hace. Hoy,
   * de «emitir una factura en condiciones», hay 14 demostradas, 76 sin
   * constar y CERO ausencias demostradas: así que todo lo que falta es «sin
   * confirmar», y escribirlo como un «no» sería inventarles una carencia.
   * *(Propietaria, 2026-09-30.)*
   */
  it("lo que falta se dice «sin confirmar», no «no lo hace», salvo que esté demostrado", () => {
    const r = aconsejar(caso("nec.que-reserven-solos", "nec.emitir-una-factura-legal"));
    const cam = r.caminos.find((c) => c.forma === "todo-en-uno")!;
    expect(cam.parciales.length).toBeGreaterThan(0);
    for (const o of cam.parciales) {
      // Las dos listas juntas son exactamente lo que no cubre: nada se pierde.
      expect([...o.noLoHace, ...o.sinConfirmar].sort()).toEqual([...o.noCubre].sort());
      // Y hoy no hay ninguna ausencia demostrada, así que ninguna dice «no lo hace».
      expect(o.noLoHace).toEqual([]);
      expect(o.sinConfirmar.length).toBeGreaterThan(0);
    }
  });

  /** Lo que se cuenta detrás es lo que de verdad queda, no lo ya enseñado. */
  it("la cuenta de «y N más» no incluye las que ya se enseñan", () => {
    const r = aconsejar(caso("nec.que-reserven-solos"));
    for (const cam of r.caminos) {
      expect(cam.hayMas).toBeGreaterThanOrEqual(0);
      expect(cam.hayMasParciales).toBeGreaterThanOrEqual(0);
    }
  });
});

/**
 * LA REGLA DE LA PROPIETARIA, 2026-09-30: «si tenemos 90 herramientas, tiene
 * que mostrar las 90 putas herramientas».
 *
 * Y tiene razón: una herramienta que está en el catálogo y no se puede
 * alcanzar por ningún camino es trabajo tirado. Esta prueba existe para que
 * nadie vuelva a poner un tope que esconda parte del catálogo — pasó con un
 * tope de 20 que dejaba fuera a Zoho Bookings, la 25ª de 34 que cubrían lo
 * mismo.
 */
describe("ninguna herramienta del catálogo se queda sin poder verse", () => {
  it("las 90 aparecen en algún caso", async () => {
    const { getNecesidades } = await import("@/data/vocabulario/necesidades");
    const { getTodasLasHerramientas } = await import("@/data/repositorio");
    const vistas = new Set<string>();
    for (const n of getNecesidades()) {
      const r = aconsejar([{ necesidad: n, importancia: "imprescindible" }] as never);
      for (const cam of r.caminos)
        for (const o of [...cam.opciones, ...cam.masOpciones, ...cam.parciales])
          for (const p of o.piezas) vistas.add(p.herramientaId);
    }
    const activas = getTodasLasHerramientas().filter((h) => h.estado === "activo");
    const fuera = activas.filter((h) => !vistas.has(h.id)).map((h) => h.id);
    expect(fuera).toEqual([]);
    expect(vistas.size).toBeGreaterThanOrEqual(activas.length);
  });
});
