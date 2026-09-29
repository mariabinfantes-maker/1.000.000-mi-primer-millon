import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import type { RegistroVerificacion } from "../esquema";
import { capacidadIdsDelVocabulario, erroresDeRegistro, getRegistros } from "../repositorio";

/**
 * El expediente de los registros que la propietaria aprobó el 2026-09-16,
 * después de comprobar con el proveedor del Researcher que sus citas existen
 * en la página.
 *
 * Estuvieron a la espera mientras sus herramientas no estaban en el
 * catálogo. El 2026-09-17 se promovieron las fichas y los tres entraron. Lo
 * que esta prueba vigila ahora es que **sigan dentro y sigan siendo los que
 * se aprobaron**, y que el cuarto —Teachable— siga fuera mientras su
 * profundidad esté pendiente.
 */
const ruta = path.join(process.cwd(), "data", "verificacion", "_registros-aprobados-sin-ficha.json");
const doc = JSON.parse(fs.readFileSync(ruta, "utf8")) as {
  incorporados: string[];
  registroBloqueado: RegistroVerificacion & { _bloqueo: string };
};
const capacidades = capacidadIdsDelVocabulario();
const catalogo = getTodasLasHerramientas().map((h) => h.id);
const registros = getRegistros();
const clave = (r: RegistroVerificacion) => `${r.herramientaId}/${r.capacidadId}`;

describe("los tres registros aprobados, ya incorporados", () => {
  it("son exactamente los tres que se aprobaron", () => {
    expect([...doc.incorporados].sort()).toEqual([
      "hotmart/cap.payment_collection",
      "thinkific/cap.payment_collection",
      "thinkific/cap.website_builder",
    ]);
  });

  it("están en registros.json, una sola vez cada uno y válidos", () => {
    for (const id of doc.incorporados) {
      const suyos = registros.filter((r) => clave(r) === id);
      expect(suyos.length, id).toBe(1);
      expect(erroresDeRegistro(suyos[0], catalogo, capacidades), id).toEqual([]);
    }
  });

  it("conservan la profundidad y la confianza con que se aprobaron", () => {
    for (const id of doc.incorporados) {
      const r = registros.find((x) => clave(x) === id)!;
      expect(r.profundidad, id).toBe("nativa");
      expect(r.confianza, id).toBe("alta");
      expect(r.planEstado, id).toBe("desconocido");
      for (const f of r.fuentes) expect(f.cita?.trim().length, id).toBeGreaterThan(30);
    }
  });

  /**
   * La condición de la propietaria, en una prueba: Teachable no podía
   * presentarse con profundidad nativa ni activar usos que nadie hubiera
   * demostrado, así que no tenía ningún registro mientras su profundidad
   * siguiera pendiente.
   *
   * SE RESOLVIÓ EL 2026-09-29, y era el único camino previsto para
   * levantarlo: apareció la evidencia específica que faltaba. Teachable
   * Payments es la pasarela del propio Teachable —«Teachable Payments is
   * Teachable's native gateway, built on Stripe's infrastructure»—, viene de
   * serie en los países donde está, España incluida, y no exige abrir cuenta
   * en ningún otro sitio. Rastro completo en
   * `data/investigacion/teachable-profundidad-2026-09-29/`.
   *
   * La prueba no se borra ni se relaja: se le da la vuelta. Ahora vigila que
   * el registro esté escrito con la profundidad demostrada, y que la copia
   * del bloqueo se conserve con su `profundidad: null` para que se siga
   * viendo qué era exactamente lo que faltaba.
   */
  it("Teachable ya tiene su registro, con la profundidad que faltaba", () => {
    // La copia del bloqueo se conserva tal cual estaba: era lo que faltaba.
    expect(doc.registroBloqueado.profundidad).toBeNull();

    const suyos = registros.filter((r) => r.herramientaId === "teachable");
    expect(suyos).toHaveLength(1);
    expect(suyos[0].capacidadId).toBe("cap.payment_collection");
    expect(suyos[0].profundidad).toBe("nativa");
    expect(suyos[0].estado).toBe("verificado");
    expect(suyos[0].fuentes.some((f: { cita?: string }) => f.cita?.includes("native gateway"))).toBe(true);
    expect(catalogo).toContain("teachable");
  });

  it("ninguno de los tres activa un uso: no se demostró ninguno", () => {
    for (const id of doc.incorporados) {
      expect(registros.find((x) => clave(x) === id)!.usos, id).toBeUndefined();
    }
  });

  it("la evidencia del uso de Hotmart sigue archivada sin registrarse", () => {
    const evidencia = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data", "verificacion", "_evidencia-pendiente-uso-hotmart.json"), "utf8")
    );
    expect(evidencia.usoId).toBe("uso.acceso_al_curso_tras_el_pago");
    expect(registros.some((r) => r.herramientaId === "hotmart" && r.capacidadId === "cap.training_lms")).toBe(false);
  });
});
