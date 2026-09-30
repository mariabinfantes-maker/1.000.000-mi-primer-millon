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

  /** Lo que se cuenta detrás es lo que de verdad queda, no lo ya enseñado. */
  it("la cuenta de «y N más» no incluye las que ya se enseñan", () => {
    const r = aconsejar(caso("nec.que-reserven-solos"));
    for (const cam of r.caminos) {
      expect(cam.hayMas).toBeGreaterThanOrEqual(0);
      expect(cam.hayMasParciales).toBeGreaterThanOrEqual(0);
    }
  });
});
