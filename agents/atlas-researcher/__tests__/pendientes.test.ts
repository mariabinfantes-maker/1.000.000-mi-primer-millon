import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { estaAprobado, registrarDecision } from "../decision";
import { eliminarPendiente, leerPendiente, listarPendientes, registrarPendiente } from "../pendientes";

describe("el registro de pendientes", () => {
  let dirBase: string;

  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-pendientes-"));
  });

  afterEach(() => {
    fs.rmSync(dirBase, { recursive: true, force: true });
  });

  it("un pendiente escrito se puede volver a leer entero", () => {
    registrarPendiente(
      {
        id: "viday",
        nombreHerramienta: "ViDay",
        estado: "no_consta",
        motivo: '"ViDay": no consta programa de afiliados.',
        datosAfiliados: { affiliateStatus: "not_available" },
      },
      { dirBase }
    );

    const leido = leerPendiente("viday", { dirBase });

    expect(leido).toMatchObject({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta" });
    expect(leido?.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("la cita de ausencia se conserva, que es lo que distingue los dos motivos", () => {
    registrarPendiente(
      {
        id: "sin-programa",
        nombreHerramienta: "SinPrograma",
        estado: "ausencia_demostrada",
        motivo: "…",
        datosAfiliados: {},
        pruebaDeAusencia: { cita: "We do not offer an affiliate program.", fuente: "https://ejemplo.test/faq" },
      },
      { dirBase }
    );

    expect(leerPendiente("sin-programa", { dirBase })?.pruebaDeAusencia?.fuente).toBe("https://ejemplo.test/faq");
  });

  it("sin pendientes no falla: devuelve una lista vacía", () => {
    expect(listarPendientes({ dirBase })).toEqual({ pendientes: [], corruptos: [] });
    expect(leerPendiente("lo-que-sea", { dirBase })).toBeUndefined();
  });

  it("el listado es estable entre ejecuciones", () => {
    for (const id of ["zeta", "alfa", "media"]) {
      registrarPendiente({ id, nombreHerramienta: id, estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    }

    expect(listarPendientes({ dirBase }).pendientes.map((p) => p.id)).toEqual(["alfa", "media", "zeta"]);
  });

  /**
   * La puerta que da sentido a haber parado: un pendiente NO está
   * autorizado por existir. Hasta que hay una decisión "aprobado"
   * registrada, la investigación completa no se gasta.
   */
  it("un pendiente recién creado no está autorizado", () => {
    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });

    expect(estaAprobado("viday", { dirBase })).toBe(false);

    registrarDecision("viday", "aprobado", "Cubre un hueco: reserva online en español.", { dirBase });
    expect(estaAprobado("viday", { dirBase })).toBe(true);
  });

  it("una decisión 'rechazado' tampoco autoriza", () => {
    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    registrarDecision("viday", "rechazado", "No aporta nada que el catálogo no tenga.", { dirBase });

    expect(estaAprobado("viday", { dirBase })).toBe(false);
  });

  it("eliminar un pendiente que no existe no falla", () => {
    expect(() => eliminarPendiente("no-existe", { dirBase })).not.toThrow();

    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "…", datosAfiliados: {} }, { dirBase });
    eliminarPendiente("viday", { dirBase });
    expect(leerPendiente("viday", { dirBase })).toBeUndefined();
  });
});

/**
 * Regresión de los cinco puntos que la revisión de `6a12144` marcó como no
 * aptos. Cada bloque nombra el defecto que impide volver.
 */
describe("REGRESIÓN · 1. repetir un lote no degrada la evidencia", () => {
  let dirBase: string;
  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "reg1-"));
  });
  afterEach(() => fs.rmSync(dirBase, { recursive: true, force: true }));

  const PRUEBA = { cita: "We do not offer an affiliate program.", fuente: "https://ejemplo.test/faq" };

  function observar(estado: "no_consta" | "ausencia_demostrada", prueba?: typeof PRUEBA) {
    return registrarPendiente(
      {
        id: "viday",
        nombreHerramienta: "ViDay",
        estado,
        motivo: `observación ${estado}`,
        datosAfiliados: {},
        ...(prueba ? { pruebaDeAusencia: prueba } : {}),
      },
      { dirBase }
    );
  }

  it("una ausencia demostrada NO se degrada a no_consta, y conserva su cita", () => {
    observar("ausencia_demostrada", PRUEBA);
    const despues = observar("no_consta");

    expect(despues.estado).toBe("ausencia_demostrada");
    expect(despues.pruebaDeAusencia).toEqual(PRUEBA);
  });

  it("la fecha original de espera no se reinicia por observar de nuevo", () => {
    const primera = observar("no_consta");
    const ruta = path.join(dirBase, "pendientes", "viday.json");
    fs.writeFileSync(ruta, JSON.stringify({ ...JSON.parse(fs.readFileSync(ruta, "utf-8")), fecha: "2026-01-05" }, null, 2));

    const despues = observar("no_consta");

    expect(despues.fecha).toBe("2026-01-05");
    expect(despues.fechaUltimaObservacion).toBe(primera.fecha);
  });

  it("la observación nueva se registra aparte, aunque sea más débil", () => {
    observar("ausencia_demostrada", PRUEBA);
    const despues = observar("no_consta");

    expect(despues.observaciones).toHaveLength(2);
    expect(despues.observaciones[1].estado).toBe("no_consta");
    expect(despues.observaciones[0].pruebaDeAusencia).toEqual(PRUEBA);
  });

  it("si la observación nueva es MÁS fuerte, sí sustituye", () => {
    observar("no_consta");
    const despues = observar("ausencia_demostrada", PRUEBA);

    expect(despues.estado).toBe("ausencia_demostrada");
    expect(despues.pruebaDeAusencia).toEqual(PRUEBA);
    expect(despues.observaciones).toHaveLength(2);
  });
});

describe("REGRESIÓN · 4. ningún id sale de su carpeta", () => {
  let dirBase: string;
  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "reg4-"));
  });
  afterEach(() => fs.rmSync(dirBase, { recursive: true, force: true }));

  for (const malo of ["../fuera", "..", "a/b", "/absoluto", "CON-MAYUSCULAS", "con espacio", ""]) {
    it(`rechaza el id ${JSON.stringify(malo)}`, () => {
      expect(() =>
        registrarPendiente({ id: malo, nombreHerramienta: "X", estado: "no_consta", motivo: "m", datosAfiliados: {} }, { dirBase })
      ).toThrow(/inválido/);
      expect(() => leerPendiente(malo, { dirBase })).toThrow(/inválido/);
      expect(() => eliminarPendiente(malo, { dirBase })).toThrow(/inválido/);
    });
  }

  it("no ha escrito nada fuera de la carpeta de pendientes", () => {
    try {
      registrarPendiente({ id: "../fuera", nombreHerramienta: "X", estado: "no_consta", motivo: "m", datosAfiliados: {} }, { dirBase });
    } catch {
      /* esperado */
    }
    expect(fs.existsSync(path.join(dirBase, "fuera.json"))).toBe(false);
  });
});

describe("REGRESIÓN · 5. escritura atómica y listado tolerante", () => {
  let dirBase: string;
  beforeEach(() => {
    dirBase = fs.mkdtempSync(path.join(os.tmpdir(), "reg5-"));
  });
  afterEach(() => fs.rmSync(dirBase, { recursive: true, force: true }));

  it("un fichero corrupto se reporta aparte y NO impide listar los demás", () => {
    for (const id of ["a-buena", "z-buena"]) {
      registrarPendiente({ id, nombreHerramienta: id, estado: "no_consta", motivo: "m", datosAfiliados: {} }, { dirBase });
    }
    fs.writeFileSync(path.join(dirBase, "pendientes", "m-rota.json"), "{ truncado");

    const { pendientes, corruptos } = listarPendientes({ dirBase });

    expect(pendientes.map((p) => p.id)).toEqual(["a-buena", "z-buena"]);
    expect(corruptos).toHaveLength(1);
    expect(corruptos[0].fichero).toBe("m-rota.json");
    expect(corruptos[0].error).toContain("corrupto");
  });

  it("la escritura no deja temporales a medias", () => {
    registrarPendiente({ id: "viday", nombreHerramienta: "ViDay", estado: "no_consta", motivo: "m", datosAfiliados: {} }, { dirBase });

    const ficheros = fs.readdirSync(path.join(dirBase, "pendientes"));
    expect(ficheros).toEqual(["viday.json"]);
    expect(ficheros.some((f) => f.includes(".tmp"))).toBe(false);
  });

  it("leer un pendiente corrupto nombra el fichero en el error", () => {
    fs.mkdirSync(path.join(dirBase, "pendientes"), { recursive: true });
    fs.writeFileSync(path.join(dirBase, "pendientes", "rota.json"), "{ truncado");

    expect(() => leerPendiente("rota", { dirBase })).toThrow(/rota\.json/);
  });
});
