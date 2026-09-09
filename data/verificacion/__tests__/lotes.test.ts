import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SalidaHerramienta } from "../convertir";
import type { PlanDeVerificacion, SeleccionPlausible } from "../esquema";
import { getPlan, getSelecciones } from "../repositorio";
import {
  capacidadesPendientes,
  claveDeLote,
  planesPendientes,
  rutaCheckpointDeLote,
  rutaSalidaDeLote,
  trabajoDelLote,
} from "../lotes";

/**
 * Abrir un lote nuevo sin tocar el anterior.
 *
 * El arnés remoto sólo sabía repescar el lote 1, con la fecha, el lote y el
 * checkpoint escritos a fuego. Estas pruebas cubren lo que se añadió para que
 * pudiera abrir el lote 2: de dónde sale el trabajo, dónde se guarda, y qué se
 * vuelve a preguntar al reanudar. Ninguna gasta una llamada.
 */
describe("abrir un lote desde su selección congelada", () => {
  describe("cada lote guarda en su sitio", () => {
    const DIR = "/tmp/verificacion";

    it("el lote 1 conserva su archivo histórico", () => {
      // Renombrarlo habría hecho que una repesca del lote 1 empezara de cero.
      expect(rutaCheckpointDeLote(DIR, 1)).toBe(path.join(DIR, "_checkpoint-repesca-remota.json"));
      expect(rutaSalidaDeLote(DIR, 1)).toBe(path.join(DIR, "_salida-repesca-remota.json"));
    });

    it("cada lote nuevo va a un archivo propio", () => {
      expect(rutaCheckpointDeLote(DIR, 2)).toBe(path.join(DIR, "_checkpoint-lote-2.json"));
      expect(rutaCheckpointDeLote(DIR, 3)).toBe(path.join(DIR, "_checkpoint-lote-3.json"));
      expect(rutaSalidaDeLote(DIR, 2)).toBe(path.join(DIR, "_salida-lote-2.json"));
    });

    it("abrir el lote 2 no puede escribir donde escribe el lote 1", () => {
      const rutas = [1, 2, 3].map((l) => rutaCheckpointDeLote(DIR, l));
      expect(new Set(rutas).size).toBe(3);
    });

    it("la clave lleva el lote dentro, así que dos lotes no se pisan", () => {
      expect(claveDeLote(2, "capacidad", "canva")).toBe("lote2:capacidad:canva");
      expect(claveDeLote(1, "capacidad", "canva")).not.toBe(claveDeLote(2, "capacidad", "canva"));
      expect(claveDeLote(2, "capacidad", "canva")).not.toBe(claveDeLote(2, "plan", "canva"));
    });
  });

  describe("de dónde sale el trabajo", () => {
    it("el lote 2 arranca con las 18 herramientas y los 384 pares congelados", () => {
      const trabajo = trabajoDelLote(getPlan(), getSelecciones(), 2);
      expect(trabajo).toHaveLength(18);
      expect(trabajo.reduce((n, t) => n + t.capacidadIds.length, 0)).toBe(384);
    });

    it("lo que se pregunta es exactamente la selección congelada, ni una capacidad más", () => {
      const selecciones = getSelecciones();
      for (const t of trabajoDelLote(getPlan(), selecciones, 2)) {
        const congelada = selecciones.find((s) => s.herramientaId === t.herramientaId && s.lote === 2)!;
        expect([...t.capacidadIds].sort(), t.herramientaId).toEqual([...congelada.capacidadIds].sort());
      }
    });

    it("el lote 1 sigue saliendo igual: 30 herramientas y 765 pares", () => {
      const trabajo = trabajoDelLote(getPlan(), getSelecciones(), 1);
      expect(trabajo).toHaveLength(30);
      expect(trabajo.reduce((n, t) => n + t.capacidadIds.length, 0)).toBe(765);
    });

    it("ninguna herramienta del lote 2 aparece en el trabajo del lote 1", () => {
      const uno = new Set(trabajoDelLote(getPlan(), getSelecciones(), 1).map((t) => t.herramientaId));
      const dos = trabajoDelLote(getPlan(), getSelecciones(), 2).map((t) => t.herramientaId);
      expect(dos.filter((id) => uno.has(id))).toEqual([]);
    });

    const plan = { lotes: [{ numero: 2, nombre: "x", motivo: "y", herramientaIds: ["canva"] }] } as PlanDeVerificacion;
    const seleccion = (cambios: Partial<SeleccionPlausible> = {}): SeleccionPlausible => ({
      herramientaId: "canva",
      criterio: "por qué",
      capacidadIds: ["cap.graphic_design"],
      fecha: "2026-09-09",
      lote: 2,
      ...cambios,
    });

    it("sin selección congelada no se verifica: para en vez de inventarse qué preguntar", () => {
      expect(() => trabajoDelLote(plan, [], 2)).toThrow(/no tiene selección congelada del lote 2/);
    });

    it("una selección de OTRO lote no sirve para éste", () => {
      expect(() => trabajoDelLote(plan, [seleccion({ lote: 1 })], 2)).toThrow(/no tiene selección congelada/);
    });

    it("una herramienta con dos selecciones para el mismo lote es un error, no una elección", () => {
      expect(() => trabajoDelLote(plan, [seleccion(), seleccion()], 2)).toThrow(/aparece más de una vez/);
    });

    it("un lote que no existe en el plan para el arranque", () => {
      expect(() => trabajoDelLote(plan, [seleccion()], 9)).toThrow(/no tiene ningún lote 9/);
    });
  });

  describe("reanudar sin volver a pagar lo hecho ni perder lo que falta", () => {
    const pedidas = ["cap.a", "cap.b", "cap.c"];
    const entrada = (respuestas: SalidaHerramienta["respuestas"], sinRespuesta: string[] = []): SalidaHerramienta => ({
      herramientaId: "canva",
      fechaConsulta: "2026-09-09",
      capacidadesPedidas: pedidas,
      respuestas,
      sinRespuesta,
    });

    it("sin checkpoint se pregunta todo", () => {
      expect(capacidadesPendientes(pedidas, undefined)).toEqual(pedidas);
    });

    it("lo ya contestado no se vuelve a preguntar", () => {
      const previa = entrada([{ capacidadId: "cap.a", veredicto: "si" }, { capacidadId: "cap.b", veredicto: "no" }]);
      expect(capacidadesPendientes(pedidas, previa)).toEqual(["cap.c"]);
    });

    it("todo contestado deja la herramienta sin trabajo", () => {
      const previa = entrada(pedidas.map((c) => ({ capacidadId: c, veredicto: "no" })));
      expect(capacidadesPendientes(pedidas, previa)).toEqual([]);
    });

    /**
     * Lo que se llevó un fallo del gateway tiene que volver a preguntarse. Si
     * `sinRespuesta` contara como contestado, ese par quedaría perdido sin que
     * nadie se enterara — que es exactamente el fallo de la primera repesca.
     */
    it("lo que se quedó sin respuesta vuelve a preguntarse", () => {
      const previa = entrada([{ capacidadId: "cap.a", veredicto: "si" }], ["cap.b", "cap.c"]);
      expect(capacidadesPendientes(pedidas, previa)).toEqual(["cap.b", "cap.c"]);
    });
  });

  describe("el plan sólo se pregunta de lo afirmado", () => {
    const entrada = (respuestas: SalidaHerramienta["respuestas"]): SalidaHerramienta => ({
      herramientaId: "canva",
      fechaConsulta: "2026-09-09",
      respuestas,
    });

    it("se pregunta el plan de lo afirmado, arrastrando su cita", () => {
      const { capacidadIds, citaPrevia } = planesPendientes(
        entrada([{ capacidadId: "cap.a", veredicto: "si", cita: "Brand Kit" }])
      );
      expect(capacidadIds).toEqual(["cap.a"]);
      expect(citaPrevia.get("cap.a")).toBe("Brand Kit");
    });

    it("de lo no afirmado no se pregunta el plan: no hay plan de lo que no hace", () => {
      expect(planesPendientes(entrada([{ capacidadId: "cap.a", veredicto: "no" }])).capacidadIds).toEqual([]);
    });

    it("un plan ya preguntado no se repite, aunque no se demostrara", () => {
      // `null` es un resultado —se miró y no lo demuestra—, no un hueco.
      const respuestas = [
        { capacidadId: "cap.a", veredicto: "si", planCita: null },
        { capacidadId: "cap.b", veredicto: "si", planCita: "Pro — Standard" },
      ];
      expect(planesPendientes(entrada(respuestas)).capacidadIds).toEqual([]);
    });

    it("sin checkpoint no hay nada que preguntar todavía", () => {
      expect(planesPendientes(undefined).capacidadIds).toEqual([]);
    });
  });
});
