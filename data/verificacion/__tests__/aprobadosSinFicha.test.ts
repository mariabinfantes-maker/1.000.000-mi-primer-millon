import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import type { RegistroVerificacion } from "../esquema";
import { capacidadIdsDelVocabulario, erroresDeRegistro } from "../repositorio";

/**
 * Los registros aprobados que todavía no pueden entrar en `registros.json`.
 *
 * La propietaria los aprobó el 2026-09-16, después de comprobar con el
 * proveedor del Researcher que sus citas existen en la página. No están en
 * `registros.json` por una razón y sólo una: **sus herramientas aún no están
 * en el catálogo**, y F2 valida cada registro contra él.
 *
 * Esta prueba comprueba que están bien hechos MENOS por eso, para que el día
 * que se promuevan las fichas entren sin volver a revisar nada. Si alguno se
 * estropea por el camino, se sabe aquí y no al escribir.
 */
const ruta = path.join(process.cwd(), "data", "verificacion", "_registros-aprobados-sin-ficha.json");
const doc = JSON.parse(fs.readFileSync(ruta, "utf8")) as {
  registrosListos: RegistroVerificacion[];
  registroBloqueado: RegistroVerificacion & { _bloqueo: string };
};
const capacidades = capacidadIdsDelVocabulario();
const catalogo = getTodasLasHerramientas().map((h) => h.id);
/** El catálogo con las tres candidatas dentro, para ejercitar todo lo demás. */
const conCandidatas = [...catalogo, "hotmart", "thinkific", "teachable"];

describe("los registros aprobados a la espera de su ficha", () => {
  it("son exactamente los tres que la propietaria aprobó como escribibles", () => {
    expect(doc.registrosListos.map((r) => `${r.herramientaId}/${r.capacidadId}`).sort()).toEqual([
      "hotmart/cap.payment_collection",
      "thinkific/cap.payment_collection",
      "thinkific/cap.website_builder",
    ]);
  });

  it("pasan el validador entero en cuanto sus herramientas existan", () => {
    expect(doc.registrosListos.flatMap((r) => erroresDeRegistro(r, conCandidatas, capacidades))).toEqual([]);
  });

  /**
   * La otra cara: hoy NO se pueden escribir, y es a propósito. Si esta prueba
   * empieza a fallar es que las fichas ya están en el catálogo y toca
   * incorporarlos a `registros.json`.
   */
  it("hoy no se pueden escribir, porque sus herramientas no están en el catálogo", () => {
    const errores = doc.registrosListos.flatMap((r) => erroresDeRegistro(r, catalogo, capacidades));
    expect(errores).toEqual(doc.registrosListos.map((r) => `${r.herramientaId}/${r.capacidadId}: la herramienta no existe`));
  });

  it("cada cita es literal, de primera mano y con fecha", () => {
    for (const r of doc.registrosListos) {
      expect(r.confianza, `${r.herramientaId}/${r.capacidadId}`).toBe("alta");
      for (const f of r.fuentes) {
        expect(f.cita?.trim().length, `${r.herramientaId}/${r.capacidadId}`).toBeGreaterThan(30);
        expect(f.fechaConsulta).toBe("2026-09-16");
      }
    }
  });

  /**
   * Teachable queda fuera por decisión de la propietaria: su profundidad no
   * está demostrada, y el esquema exige una en todo registro verificado. Se
   * comprueba que sigue bloqueado por ese motivo exacto y no por otro.
   */
  it("el de Teachable sigue bloqueado por su profundidad, y el esquema lo confirma", () => {
    expect(doc.registroBloqueado.profundidad).toBeNull();
    const errores = erroresDeRegistro(doc.registroBloqueado, conCandidatas, capacidades);
    expect(errores).toContain("teachable/cap.payment_collection: verificado sin profundidad");
  });

  it("la evidencia del uso de Hotmart está archivada sin registrar el uso", () => {
    const evidencia = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "verificacion", "_evidencia-pendiente-uso-hotmart.json"), "utf8"));
    expect(evidencia.usoId).toBe("uso.acceso_al_curso_tras_el_pago");
    expect(evidencia.cita.length).toBeGreaterThan(30);
    // No hay ni un registro de Hotmart en la verificación: el uso no está puesto en ninguna parte.
    expect(doc.registrosListos.some((r) => r.usos?.length)).toBe(false);
  });
});
