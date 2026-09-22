import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getCorrecciones, getNombresDeRespuesta, getRespuesta, loQueDemuestra } from "../lectura";

/**
 * Que la corrección no se pueda saltar sin querer, que es justo lo que pasó
 * con el aviso del README: estaba escrito y el dato seguía diciendo `si`.
 */
describe("las correcciones del lote F4", () => {
  it("cada corrección apunta a un campo que existe y que decía lo que dice", () => {
    for (const c of getCorrecciones()) {
      const ruta = path.join(process.cwd(), "data", "investigacion", "f4", c.fichero);
      const crudo = JSON.parse(fs.readFileSync(ruta, "utf8")) as { datos: Record<string, { v: string; cita: string }> };
      const campo = crudo.datos[c.campo];
      expect(campo, `${c.fichero}/${c.campo}`).toBeTruthy();
      expect(campo.v).toBe(c.valorOriginal);
      expect(campo.cita).toBe(c.citaOriginal);
    }
  });

  it("todas llevan motivo y fecha: no hay ninguna corrección muda", () => {
    for (const c of getCorrecciones()) {
      expect(c.motivo.length, `${c.fichero}/${c.campo}`).toBeGreaterThan(40);
      expect(c.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  /** Ninguna afirma una ausencia. Sólo retiran lo que no estaba demostrado. */
  it("ninguna corrección convierte un «sí» en «no lo hace»", () => {
    for (const c of getCorrecciones()) expect(c.valorCorregido).toBe("no_consta");
  });

  it("los ficheros originales siguen intactos, con su «sí» y su cita", () => {
    const crudo = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/investigacion/f4/respuestas/ok-fresha-oficial.json"), "utf8")
    ) as { datos: Record<string, { v: string }> };
    expect(crudo.datos.catalogo_de_servicios.v).toBe("si");
  });

  it("al leerlos por la puerta buena, el dato ya viene corregido y con su motivo", () => {
    const fresha = getRespuesta("ok-fresha-oficial");
    const campo = fresha.datos.catalogo_de_servicios;
    expect(typeof campo === "object" && campo.v).toBe("no_consta");
    expect(typeof campo === "object" && campo.corregido?.motivo).toContain("CLIENTE FINAL");
    expect(typeof campo === "object" && campo.corregido?.citaOriginal).toContain("menú fácil de usar");
  });
});

describe("lo que el lote sostiene de verdad", () => {
  /**
   * Fresha entera salía de la web de la clienta final. Después de corregirlo
   * no sostiene ni un campo funcional. NO significa que no lo haga —es su
   * negocio—: significa que hay que volver a mirar donde habla el fabricante.
   */
  it("Fresha no sostiene ninguna capacidad después de corregir", () => {
    expect(loQueDemuestra("ok-fresha-oficial").filter((c) => c !== "idioma_es" && c !== "espana")).toEqual([]);
  });

  it("SimplyBook.me sigue sosteniendo lo suyo, menos los dos campos corregidos", () => {
    const suyo = loQueDemuestra("ok-simplybook-precios");
    expect(suyo).toContain("catalogo_de_servicios");
    expect(suyo).toContain("agenda_por_profesional");
    expect(suyo).not.toContain("comisiones_o_propinas");
    expect(suyo).not.toContain("bonos_packs_sesiones");
  });

  it("SolverMedia conserva su comisión, que sí era del empleado", () => {
    expect(loQueDemuestra("ok-solvermedia-oficial")).toContain("comisiones_o_propinas");
  });

  it("se leen todas las respuestas sin que ninguna reviente", () => {
    const nombres = getNombresDeRespuesta();
    expect(nombres.length).toBeGreaterThan(50);
    for (const n of nombres) expect(() => getRespuesta(n)).not.toThrow();
  });
});
