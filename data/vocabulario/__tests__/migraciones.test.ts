import { describe, expect, it } from "vitest";
import type { Migracion } from "../esquema";
import {
  erroresDeMigracion,
  esFechaReal,
  getMigraciones,
  getRestricciones,
  getVocabulario,
} from "../repositorio";
import IDENTIFICADORES_EMITIDOS from "./identificadoresEmitidos.json";

/**
 * `migraciones.json` es el único sitio donde queda constancia de que un
 * identificador cambió de significado. Si nadie lo lee, nadie se entera de que
 * está mal hasta que ya da igual.
 *
 * Hoy la lista está vacía a propósito: los identificadores se emiten por
 * primera vez en la versión 3.0.0 y los cambios de nombre anteriores fueron de
 * borrador, no migraciones. Pero el validador se ejercita igual, con casos
 * inventados, para que el día que haga falta ya funcione en vez de estrenarse
 * el mismo día que se usa.
 */
describe("el registro de migraciones", () => {
  const registro = getMigraciones();
  const vocabulario = getVocabulario();
  const emitidos = IDENTIFICADORES_EMITIDOS as string[];
  const destinos = [
    ...vocabulario.capacidades.map((c) => c.id),
    ...getRestricciones().map((r) => r.id),
  ];

  it("se puede leer y tiene la forma esperada", () => {
    expect(registro).toBeDefined();
    expect(Array.isArray(registro.migraciones)).toBe(true);
    expect(registro.nota.trim().length).toBeGreaterThan(0);
  });

  it("va en la misma versión que el vocabulario", () => {
    expect(
      registro.version,
      "Si las versiones se separan, nadie sabe a qué estado del vocabulario " +
        "corresponde cada migración."
    ).toBe(vocabulario.version);
  });

  it("la versión tiene forma semántica", () => {
    expect(vocabulario.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("hoy está vacío, y eso es coherente con que nada se hubiera emitido antes", () => {
    expect(registro.migraciones).toEqual([]);
    const noActivas = vocabulario.capacidades.filter((c) => c.estado !== "activa").map((c) => c.id);
    expect(
      noActivas,
      "Una capacidad que no está activa tiene que aparecer en migraciones.json."
    ).toEqual([]);
  });

  it("toda migración registrada es válida", () => {
    const rotas = registro.migraciones.flatMap((m) =>
      erroresDeMigracion(m, emitidos, destinos).map((e) => `${m.de}: ${e}`)
    );
    expect(rotas).toEqual([]);
  });

  it("ninguna migración deja huérfano un identificador emitido", () => {
    // Regla 6, vista desde el otro lado: lo que sale de la lista de activos
    // tiene que tener su asiento aquí.
    const migrados = new Set(registro.migraciones.map((m) => m.de));
    const activos = new Set(vocabulario.capacidades.map((c) => c.id));
    const desaparecidos = emitidos.filter((id) => !activos.has(id) && !migrados.has(id));
    expect(
      desaparecidos,
      "Un identificador emitido no se borra: o sigue activo, o consta aquí " +
        "con su tipo, su fecha y su motivo."
    ).toEqual([]);
  });

  describe("la comprobación de fecha real", () => {
    it.each(["2026-09-02", "2024-02-29", "2000-02-29", "2026-12-31"])("acepta %s", (f) => {
      expect(esFechaReal(f)).toBe(true);
    });

    it.each(["2026-13-45", "2026-02-30", "2025-02-29", "1900-02-29", "2/9/2026", "2026-9-2", ""])(
      "rechaza %s",
      (f) => {
        expect(esFechaReal(f)).toBe(false);
      }
    );
  });

  /** Controles del validador: tiene que rechazar lo que está mal. */
  describe("el validador rechaza una migración mal formada", () => {
    const base: Migracion = {
      de: "cap.invoicing",
      a: ["cap.payment_collection"],
      tipo: "fusion",
      fecha: "2026-09-02",
      motivo: "ejemplo de prueba",
    };
    const emitidosDePrueba = ["cap.invoicing", "cap.payment_collection", "cap.online_store"];
    const destinosDePrueba = ["cap.payment_collection", "cap.online_store", "req.offline_capable"];
    const errores = (cambios: Partial<Migracion>) =>
      erroresDeMigracion({ ...base, ...cambios }, emitidosDePrueba, destinosDePrueba);

    it("acepta una migración correcta", () => {
      expect(errores({})).toEqual([]);
    });

    it("rechaza un origen que nunca se emitió", () => {
      expect(errores({ de: "cap.inventado" }).join()).toContain("no figura entre los identificadores emitidos");
    });

    it("rechaza un destino inexistente", () => {
      expect(errores({ a: ["cap.fantasma"] }).join()).toContain('el destino "cap.fantasma" no existe');
    });

    it("rechaza migrar a sí mismo", () => {
      expect(errores({ de: "cap.online_store", a: ["cap.online_store"] }).join()).toContain(
        "no puede migrar a sí mismo"
      );
    });

    it("rechaza una fusión con varios destinos", () => {
      // Una fusión tiene un único sucesor: por eso el alias resuelve solo.
      expect(errores({ a: ["cap.payment_collection", "cap.online_store"] }).join()).toContain(
        "una fusion no puede tener 2 destino(s)"
      );
    });

    it("rechaza una escisión con un solo destino", () => {
      expect(errores({ tipo: "escision", a: ["cap.payment_collection"] }).join()).toContain(
        "una escision no puede tener 1 destino(s)"
      );
    });

    it("acepta una escisión con dos destinos", () => {
      expect(errores({ tipo: "escision", a: ["cap.payment_collection", "cap.online_store"] })).toEqual([]);
    });

    it("acepta una reclasificación a una restricción", () => {
      // Es lo que le pasó a la residencia de datos: dejó de ser capacidad.
      expect(errores({ tipo: "reclasificacion", a: ["req.offline_capable"] })).toEqual([]);
    });

    it("rechaza una baja con destino", () => {
      expect(errores({ tipo: "baja" }).join()).toContain("una baja no puede tener 1 destino(s)");
    });

    it("acepta una baja sin destino", () => {
      expect(errores({ tipo: "baja", a: [] })).toEqual([]);
    });

    it("rechaza una fecha mal formada", () => {
      expect(errores({ fecha: "2/9/2026" }).join()).toContain("fecha inválida");
    });

    it("rechaza una fecha con formato correcto que no existe", () => {
      // El formato solo no basta: "2026-13-45" pasa cualquier expresión regular
      // razonable y no es ninguna fecha.
      for (const fecha of ["2026-13-45", "2026-02-30", "2025-02-29", "2026-00-10", "2026-04-31"]) {
        expect(errores({ fecha }).join(), fecha).toContain("fecha inválida");
      }
    });

    it("acepta fechas reales, incluido un 29 de febrero bisiesto", () => {
      for (const fecha of ["2026-09-02", "2024-02-29", "2026-12-31", "2026-01-01"]) {
        expect(errores({ fecha }), fecha).toEqual([]);
      }
    });

    it("rechaza destinos repetidos", () => {
      // Escindir dos veces hacia el mismo sitio no es escindir: es una fusión
      // mal escrita, y contaría el destino dos veces al repartir.
      expect(
        errores({ tipo: "escision", a: ["cap.payment_collection", "cap.payment_collection"] }).join()
      ).toContain("destino repetido: cap.payment_collection");
    });

    it("una escisión a dos destinos distintos sigue valiendo", () => {
      expect(errores({ tipo: "escision", a: ["cap.payment_collection", "cap.online_store"] })).toEqual(
        []
      );
    });

    it("rechaza una migración sin motivo", () => {
      expect(errores({ motivo: "  " }).join()).toContain("sin motivo");
    });
  });
});
