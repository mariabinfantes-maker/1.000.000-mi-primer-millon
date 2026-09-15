import { beforeEach, describe, expect, it } from "vitest";
import { limpiarTablasDePrueba, poolDePrueba, postgresDisponible } from "@/data/db/__tests__/entornoPruebaPostgres";
import { describirPasada, orquestar } from "../index";
import { ejecutarSiguiente, esDescartada, type ResultadoEjecucion } from "../ejecutor";
import {
  anotar,
  crearSolicitud,
  haySolicitudViva,
  leerBitacora,
  leerSolicitud,
  listarInterrumpidas,
  listarPorEstado,
  marcarTerminada,
  reclamarSiguiente,
  ultimasEjecuciones,
} from "../repositorio";

/**
 * Estas pruebas hablan con un Postgres LOCAL y temporal que levanta
 * `vitest.global-setup.postgres.ts`. Nunca tocan Neon: si el entorno no
 * tiene los binarios, se saltan enteras.
 *
 * ── Sobre firmar autorizaciones ───────────────────────────────────────
 *
 * En el bloque 1 no existe ningún comando, CLI ni función que firme una
 * autorización: eso es del panel de la propietaria, que es el bloque 2.
 * Donde una prueba necesita una solicitud ya firmada, la simula con un
 * UPDATE directo, escrito aquí a la vista y sólo aquí. Que haga falta
 * escribirlo a mano en el test es, precisamente, la señal de que el código
 * de producción no puede hacerlo.
 */
function simularFirmaDeLaPropietaria(id: number) {
  return poolDePrueba().query(
    `UPDATE solicitudes_orquestador
     SET estado = 'autorizada', autorizada_en = now(), autorizada_por = 'prueba'
     WHERE id = $1 AND estado = 'esperando_autorizacion'`,
    [id]
  );
}

const pool = () => poolDePrueba();

/** El id de una solicitud recién reclamada, sea cual sea el resultado. */
function idDe(r: Awaited<ReturnType<typeof reclamarSiguiente>>): number | undefined {
  if (!r) return undefined;
  return r.ok ? r.solicitud.id : r.id;
}
const opciones = () => ({ pool: poolDePrueba() });

describe.skipIf(!postgresDisponible())("el buzón de solicitudes", () => {
  beforeEach(limpiarTablasDePrueba);

  it("una tarea libre nace lista; una que gasta dinero nace esperando firma", async () => {
    const libre = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    const cara = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());

    expect(libre).toMatchObject({ estado: "lista", carril: "libre", motivo: "ninguno" });
    expect(cara).toMatchObject({ estado: "esperando_autorizacion", carril: "conPermiso", motivo: "gasta_dinero" });
  });

  it("el carril no lo elige quien pide: sale del catálogo del código", async () => {
    const solicitud = await crearSolicitud({ tareaId: "convertir-verificacion", argumentos: ["salida.json"] }, opciones());
    expect(solicitud.motivo).toBe("escribe_datos");
    expect(solicitud.estado).toBe("esperando_autorizacion");
  });

  it("una tarea que no está en el catálogo no crea nada", async () => {
    await expect(crearSolicitud({ tareaId: "rm-rf" }, opciones())).rejects.toThrow(/no es una tarea del catálogo/);
    expect((await listarPorEstado(["lista", "esperando_autorizacion"], opciones())).solicitudes).toEqual([]);
  });

  it("los argumentos se revisan antes de guardarlos, no al ejecutar", async () => {
    await expect(crearSolicitud({ tareaId: "investigar-lote", argumentos: ["--force"] }, opciones())).rejects.toThrow(
      /Argumentos rechazados/
    );
    await expect(crearSolicitud({ tareaId: "investigar-lote" }, opciones())).rejects.toThrow(/necesita argumentos/);
  });

  it("no se apila dos veces lo mismo mientras siga viva", async () => {
    await crearSolicitud({ tareaId: "informe-curador" }, opciones());

    expect(await haySolicitudViva("informe-curador", [], opciones())).toBe(true);
    expect(await haySolicitudViva("informe-historial", [], opciones())).toBe(false);
  });

  it("una solicitud ya cerrada deja de contar como viva", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("e1", opciones());
    await marcarTerminada(solicitud.id, "completada", "e1", {}, opciones());

    expect(await haySolicitudViva("informe-curador", [], opciones())).toBe(false);
  });
});

describe.skipIf(!postgresDisponible())("reclamar es atómico y no se reparte dos veces", () => {
  beforeEach(limpiarTablasDePrueba);

  it("dos procesos a la vez se llevan solicitudes distintas", async () => {
    await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await crearSolicitud({ tareaId: "informe-historial" }, opciones());

    const [a, b] = await Promise.all([reclamarSiguiente("e1", opciones()), reclamarSiguiente("e2", opciones())]);

    expect(a?.ok).toBe(true);
    expect(b?.ok).toBe(true);
    expect(idDe(a)).not.toBe(idDe(b));
  });

  it("con una sola solicitud, uno se la lleva y el otro se va de vacío", async () => {
    await crearSolicitud({ tareaId: "informe-curador" }, opciones());

    const resultados = await Promise.all([
      reclamarSiguiente("e1", opciones()),
      reclamarSiguiente("e2", opciones()),
      reclamarSiguiente("e3", opciones()),
    ]);

    expect(resultados.filter(Boolean)).toHaveLength(1);
  });

  /** La regla de la propietaria, en una prueba: el silencio nunca es permiso. */
  it("una solicitud sin firmar no se reclama jamás, por mucho que pase el tiempo", async () => {
    await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET creada_en = now() - interval '400 days'`);

    expect(await reclamarSiguiente("e1", opciones())).toBeUndefined();
    expect((await listarPorEstado(["esperando_autorizacion"], opciones())).solicitudes[0].tareaId).toBe("investigar-lote");
  });

  it("firmada sí se reclama, y sólo entonces", async () => {
    const solicitud = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());
    expect(await reclamarSiguiente("e1", opciones())).toBeUndefined();

    await simularFirmaDeLaPropietaria(solicitud.id);

    const reclamada = await reclamarSiguiente("e1", opciones());
    expect(reclamada?.ok).toBe(true);
    if (reclamada?.ok) {
      expect(reclamada.solicitud.id).toBe(solicitud.id);
      expect(reclamada.solicitud.autorizadaEn).toBeInstanceOf(Date);
    }
  });
});

describe.skipIf(!postgresDisponible())("una ejecución cortada a mitad queda registrada y no se reintenta", () => {
  beforeEach(limpiarTablasDePrueba);

  it("la fila reclamada que nunca terminó no vuelve a la cola", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("la-que-se-cayo", opciones());
    // Aquí se apaga la máquina. No hay marcarTerminada.

    expect(await reclamarSiguiente("la-siguiente-pasada", opciones())).toBeUndefined();

    const { solicitudes: interrumpidas } = await listarInterrumpidas(opciones());
    expect(interrumpidas.map((s) => s.id)).toEqual([solicitud.id]);
    expect(interrumpidas[0].reclamadaPor).toBe("la-que-se-cayo");
  });

  it("queda escrito quién la reclamó y cuándo, aunque nadie la cerrara", async () => {
    await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("la-que-se-cayo", opciones());

    const asientos = await leerBitacora(opciones());
    expect(asientos.map((a) => a.evento)).toEqual(["reclamada", "creada"]);
    expect(asientos[0].ejecucionId).toBe("la-que-se-cayo");
  });

  it("nadie puede cerrar una solicitud que no estaba en curso", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await expect(marcarTerminada(solicitud.id, "completada", "e1", {}, opciones())).rejects.toThrow(/no está en curso/);
  });

  it("una solicitud cerrada no se puede volver a cerrar", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("e1", opciones());
    await marcarTerminada(solicitud.id, "fallida", "e1", { resultado: "salió con error" }, opciones());

    await expect(marcarTerminada(solicitud.id, "completada", "e1", {}, opciones())).rejects.toThrow(/no está en curso/);
    expect((await leerSolicitud(solicitud.id, opciones()))?.resultado).toBe("salió con error");
  });
});

describe.skipIf(!postgresDisponible())("la bitácora no se reescribe", () => {
  beforeEach(limpiarTablasDePrueba);

  it("no se puede modificar un asiento", async () => {
    await anotar({ tareaId: "informe-curador", evento: "creada" }, opciones());
    await expect(pool().query(`UPDATE bitacora_orquestador SET detalle = 'otra cosa'`)).rejects.toThrow(/append-only/);
  });

  it("no se puede borrar un asiento", async () => {
    await anotar({ tareaId: "informe-curador", evento: "creada" }, opciones());
    await expect(pool().query(`DELETE FROM bitacora_orquestador`)).rejects.toThrow(/append-only/);
  });

  it("la última ejecución de una tarea sale de los asientos 'completada', no de los intentos", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("e1", opciones());
    await marcarTerminada(solicitud.id, "fallida", "e1", {}, opciones());

    expect(await ultimasEjecuciones(opciones())).toEqual([]);

    const segunda = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("e2", opciones());
    await marcarTerminada(segunda.id, "completada", "e2", {}, opciones());

    const ultimas = await ultimasEjecuciones(opciones());
    expect(ultimas).toHaveLength(1);
    expect(ultimas[0].tareaId).toBe("informe-curador");
  });
});

describe.skipIf(!postgresDisponible())("la segunda puerta: el ejecutor vuelve a mirar el carril", () => {
  beforeEach(limpiarTablasDePrueba);

  /**
   * Entre crear la solicitud y ejecutarla hay una base de datos. Si una
   * fila de `conPermiso` apareciera como ejecutable sin firma —un error,
   * una mano ajena—, el ejecutor tiene que negarse. Se fuerza a mano ese
   * estado imposible para comprobar que se niega de verdad.
   */
  it("una tarea que pide permiso y llega a la cola sin firma no se ejecuta", async () => {
    const solicitud = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET estado = 'lista' WHERE id = $1`, [solicitud.id]);

    const lanzamientos: string[][] = [];
    const ejecutada = await ejecutarSiguiente("e1", {
      ...opciones(),
      lanzar: async (_e, argumentos) => {
        lanzamientos.push(argumentos);
        return { ok: true, codigoSalida: 0, salida: "" } satisfies ResultadoEjecucion;
      },
    });

    expect(lanzamientos).toEqual([]);
    expect(ejecutada && !esDescartada(ejecutada) ? ejecutada.rechazo : undefined).toContain(
      "necesita la firma de la propietaria"
    );
    expect((await leerSolicitud(solicitud.id, opciones()))?.estado).toBe("rechazada");
  });

  it("una tarea cuyo id ya no está en el catálogo se rechaza, se registra y no lanza", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET tarea_id = 'tarea-que-ya-no-existe' WHERE id = $1`, [
      solicitud.id,
    ]);

    const reclamada = await reclamarSiguiente("e1", opciones());

    expect(reclamada?.ok).toBe(false);
    if (reclamada && !reclamada.ok) expect(reclamada.explicacion).toContain("no está en el catálogo");

    const asientos = await leerBitacora(opciones());
    expect(asientos.map((a) => a.evento)).toEqual(["rechazada", "reclamada", "creada"]);
    const { solicitudes } = await listarPorEstado(["rechazada"], opciones());
    expect(solicitudes).toEqual([]); // no se puede leer, pero está cerrada
    const { rows } = await pool().query(`SELECT estado FROM solicitudes_orquestador WHERE id = $1`, [solicitud.id]);
    expect(rows[0].estado).toBe("rechazada");
  });
});

describe.skipIf(!postgresDisponible())("una pasada completa", () => {
  beforeEach(limpiarTablasDePrueba);

  function lanzadorFalso() {
    const lanzadas: string[] = [];
    return {
      lanzadas,
      lanzar: async (_e: string, argumentos: string[]) => {
        lanzadas.push(argumentos[1]);
        return { ok: true, codigoSalida: 0, salida: "hecho" } satisfies ResultadoEjecucion;
      },
    };
  }

  it("una pasada sola sólo ejecuta el carril libre", async () => {
    const falso = lanzadorFalso();

    const resumen = await orquestar({ ...opciones(), ...falso, ahora: new Date("2026-09-15T10:00:00Z") });

    expect(resumen.propuestas.length).toBeGreaterThan(0);
    for (const propuesta of resumen.propuestas) expect(propuesta.tarea.carril).toBe("libre");
    expect(resumen.ejecutadas).toHaveLength(resumen.propuestas.length);
    expect(resumen.ejecutadas.every((e) => e.resultado?.ok)).toBe(true);
  });

  /**
   * Hoy ninguna tarea de `conPermiso` tiene cadencia periódica: todas son
   * `manual`. Es decir, el Orchestrator **no propone por su cuenta nada
   * que gaste dinero o escriba datos** — sólo entra en la cola si alguien
   * lo pide. Si algún día se le da cadencia a una de ellas, esta prueba
   * salta, y esa decisión se toma a la vista y no por descuido.
   */
  it("nada que gaste dinero o escriba datos se propone solo", async () => {
    const resumen = await orquestar({ ...opciones(), ...lanzadorFalso(), soloPlanificar: true, ahora: new Date() });

    expect(resumen.propuestas.filter((p) => p.tarea.carril === "conPermiso")).toEqual([]);
    expect((await listarPorEstado(["esperando_autorizacion"], opciones())).solicitudes).toEqual([]);
  });

  it("una solicitud que espera firma sobrevive a la pasada sin ejecutarse", async () => {
    const pedida = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());
    const falso = lanzadorFalso();

    const resumen = await orquestar({ ...opciones(), ...falso, ahora: new Date() });

    expect(falso.lanzadas.some((modulo) => modulo.includes("cli-lote"))).toBe(false);
    expect(resumen.esperandoFirma.map((s) => s.id)).toEqual([pedida.id]);
    expect((await leerSolicitud(pedida.id, opciones()))?.estado).toBe("esperando_autorizacion");
  });

  it("dos pasadas seguidas no duplican lo que sigue sin ejecutarse", async () => {
    const ahora = new Date("2026-09-15T10:00:00Z");
    await orquestar({ ...opciones(), ...lanzadorFalso(), soloPlanificar: true, ahora });
    const { solicitudes: listasTrasLaPrimera } = await listarPorEstado(["lista"], opciones());

    const segunda = await orquestar({ ...opciones(), ...lanzadorFalso(), soloPlanificar: true, ahora });

    expect(segunda.creadas).toEqual([]);
    expect(segunda.yaEstaban.length).toBe(listasTrasLaPrimera.length);
    expect((await listarPorEstado(["lista"], opciones())).solicitudes.map((s) => s.id)).toEqual(listasTrasLaPrimera.map((s) => s.id));
  });

  it("lo semanal no se repite al día siguiente", async () => {
    const falso = lanzadorFalso();
    await orquestar({ ...opciones(), ...falso, ahora: new Date("2026-09-15T10:00:00Z") });

    const segunda = await orquestar({ ...opciones(), ...lanzadorFalso(), ahora: new Date("2026-09-16T10:00:00Z") });

    expect(segunda.propuestas.map((p) => p.tarea.id)).not.toContain("informe-afiliacion");
    expect(segunda.propuestas.every((p) => p.tarea.cadencia === "cada_ejecucion" || p.tarea.carril === "conPermiso")).toBe(
      true
    );
  });

  it("--solo-plan crea las solicitudes pero no ejecuta nada", async () => {
    const falso = lanzadorFalso();

    const resumen = await orquestar({ ...opciones(), ...falso, soloPlanificar: true, ahora: new Date() });

    expect(falso.lanzadas).toEqual([]);
    expect(resumen.ejecutadas).toEqual([]);
    expect(resumen.creadas.length).toBeGreaterThan(0);
    expect((await listarPorEstado(["lista"], opciones())).solicitudes.length).toBeGreaterThan(0);
  });

  it("el resumen dice en cristiano lo que espera y por qué", async () => {
    await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());

    const resumen = await orquestar({ ...opciones(), ...lanzadorFalso(), ahora: new Date() });

    const texto = describirPasada(resumen).join("\n");
    expect(texto).toContain("Esperando tu autorización");
    expect(texto).toContain("gasta dinero");
    expect(texto).not.toContain("conPermiso");
  });

  it("una pasada que encuentra restos de otra cortada los enseña y no los toca", async () => {
    await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("la-que-se-cayo", opciones());

    const resumen = await orquestar({ ...opciones(), ...lanzadorFalso(), ahora: new Date() });

    expect(resumen.interrumpidas).toHaveLength(1);
    expect(describirPasada(resumen).join("\n")).toContain("NO se reintentan solas");
    expect((await listarInterrumpidas(opciones())).solicitudes[0].reclamadaPor).toBe("la-que-se-cayo");
  });
});

/**
 * Las cuatro garantías que sostienen el buzón, cada una con el defecto que
 * impide volver.
 */
describe.skipIf(!postgresDisponible())("CORRECCIÓN · sólo quien reclamó puede cerrar", () => {
  beforeEach(limpiarTablasDePrueba);

  it("otro ejecutor no puede cerrar lo que no reclamó", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("la-mia", opciones());

    await expect(marcarTerminada(solicitud.id, "completada", "la-de-otro", {}, opciones())).rejects.toThrow(
      /no está en curso a nombre de "la-de-otro"/
    );

    const { rows } = await pool().query(`SELECT estado FROM solicitudes_orquestador WHERE id = $1`, [solicitud.id]);
    expect(rows[0].estado).toBe("en_curso");
  });

  it("quien la reclamó sí puede", async () => {
    const solicitud = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await reclamarSiguiente("la-mia", opciones());

    const cerrada = await marcarTerminada(solicitud.id, "completada", "la-mia", {}, opciones());
    expect(cerrada.estado).toBe("completada");
  });
});

describe.skipIf(!postgresDisponible())("CORRECCIÓN · una fila inválida no detiene la pasada", () => {
  beforeEach(limpiarTablasDePrueba);

  function lanzador() {
    const lanzadas: string[] = [];
    /** El `argv` entero de cada lanzamiento, para poder mirar los argumentos y no sólo el módulo. */
    const argvs: string[][] = [];
    return {
      lanzadas,
      argvs,
      lanzar: async (_e: string, argumentos: string[]) => {
        lanzadas.push(argumentos[1]);
        argvs.push(argumentos);
        return { ok: true, codigoSalida: 0, salida: "hecho" } satisfies ResultadoEjecucion;
      },
    };
  }

  /**
   * Antes, una fila así lanzaba desde `reclamarSiguiente` y la excepción
   * subía hasta el CLI: las solicitudes que venían detrás no se ejecutaban
   * y nadie se enteraba de por qué.
   */
  it("una fila con un tarea_id que ya no existe se rechaza y las siguientes se ejecutan igual", async () => {
    const mala = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET tarea_id = 'ya-no-existe' WHERE id = $1`, [mala.id]);
    const buena = await crearSolicitud({ tareaId: "informe-historial" }, opciones());

    const falso = lanzador();
    const resumen = await orquestar({ ...opciones(), ...falso, soloPlanificar: false, ahora: new Date() });

    expect(resumen.descartadas.map((d) => d.id)).toContain(mala.id);
    expect(resumen.ejecutadas.map((e) => e.solicitud.id)).toContain(buena.id);
    expect(falso.lanzadas.some((m) => m.includes("cli-informe-historial"))).toBe(true);
  });

  /**
   * El agujero de seguridad: argumentos que se colaron en la fila antes de
   * que existiera el tipo por tarea, o metidos a mano en la base.
   */
  it("una fila con una travesía de directorios se rechaza sin ejecutarse, y la siguiente sigue", async () => {
    const mala = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET argumentos = '["../../../etc/passwd"]'::jsonb WHERE id = $1`, [
      mala.id,
    ]);
    const buena = await crearSolicitud({ tareaId: "informe-historial" }, opciones());

    const falso = lanzador();
    const resumen = await orquestar({ ...opciones(), ...falso, ahora: new Date() });

    expect(resumen.descartadas.map((d) => d.id)).toContain(mala.id);
    // Lo que importa no es que no se lanzara esa tarea —el planificador crea
    // otra solicitud limpia y ésa sí corre—, sino que la travesía no llegó a
    // ningún `argv`.
    expect(falso.argvs.flat().some((a) => a.includes("etc/passwd"))).toBe(false);
    expect(resumen.ejecutadas.map((e) => e.solicitud.id)).not.toContain(mala.id);
    expect(resumen.ejecutadas.map((e) => e.solicitud.id)).toContain(buena.id);
  });

  it("el rechazo queda escrito en la bitácora, no sólo en la fila", async () => {
    const mala = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET argumentos = '["/etc/shadow"]'::jsonb WHERE id = $1`, [mala.id]);

    await orquestar({ ...opciones(), ...lanzador(), ahora: new Date() });

    const asientos = (await leerBitacora(opciones())).filter((a) => a.solicitudId === mala.id);
    expect(asientos.map((a) => a.evento)).toEqual(["rechazada", "reclamada", "creada"]);
    expect(asientos[0].detalle).toMatch(/fuera del repositorio|no admite/);
  });

  it("el resumen lo cuenta y dice que las siguientes siguieron", async () => {
    const mala = await crearSolicitud({ tareaId: "informe-curador" }, opciones());
    await pool().query(`UPDATE solicitudes_orquestador SET tarea_id = 'ya-no-existe' WHERE id = $1`, [mala.id]);

    const resumen = await orquestar({ ...opciones(), ...lanzador(), ahora: new Date() });

    const texto = describirPasada(resumen).join("\n");
    expect(texto).toContain("no se pudieron leer");
    expect(texto).toContain("una fila mala no para la pasada");
  });
});

describe.skipIf(!postgresDisponible())("CORRECCIÓN · el carril sale del código, nunca de la fila", () => {
  beforeEach(limpiarTablasDePrueba);

  it("la base ya no guarda el carril ni el motivo", async () => {
    const { rows } = await pool().query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'solicitudes_orquestador' AND column_name IN ('carril', 'motivo')`
    );
    expect(rows).toEqual([]);
  });

  it("una solicitud leída trae el carril de tareas.ts", async () => {
    const cara = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());
    const leida = await leerSolicitud(cara.id, opciones());

    expect(leida).toMatchObject({ carril: "conPermiso", motivo: "gasta_dinero" });
  });

  /**
   * Antes esto era una puerta: la fila decía su propio carril, y la fila es
   * lo que se puede manipular. Ahora no hay dónde escribir la mentira.
   */
  it("no hay ninguna columna donde escribir un carril falso", async () => {
    const cara = await crearSolicitud({ tareaId: "investigar-lote", argumentos: ["data/lote.json"] }, opciones());

    await expect(
      pool().query(`UPDATE solicitudes_orquestador SET carril = 'libre' WHERE id = $1`, [cara.id])
    ).rejects.toThrow(/carril/);

    expect((await leerSolicitud(cara.id, opciones()))?.carril).toBe("conPermiso");
  });
});

/**
 * El aislamiento de fallos: una tarea que revienta es un hecho de esa
 * tarea, no de la pasada. Antes, una excepción al lanzar el proceso subía
 * hasta el CLI y dejaba sin ejecutar todo lo que venía detrás.
 */
describe.skipIf(!postgresDisponible())("CORRECCIÓN · una tarea que falla no arrastra a las demás", () => {
  beforeEach(limpiarTablasDePrueba);

  /** Revienta al lanzar la tarea cuyo módulo contenga `revienta`, y ejecuta el resto. */
  function lanzadorQueRevientaCon(fragmento: string) {
    const lanzadas: string[] = [];
    return {
      lanzadas,
      lanzar: async (_e: string, argumentos: string[]) => {
        const modulo = argumentos[1];
        if (modulo.includes(fragmento)) throw new Error("ENOENT: no se pudo lanzar el proceso");
        lanzadas.push(modulo);
        return { ok: true, codigoSalida: 0, salida: "hecho" } satisfies ResultadoEjecucion;
      },
    };
  }

  it("la excepción al lanzar se registra como fallida y la pasada continúa", async () => {
    const falso = lanzadorQueRevientaCon("cli-informe-curador");

    const resumen = await orquestar({ ...opciones(), ...falso, ahora: new Date() });

    expect(resumen.cortes).toEqual([]);

    const curador = resumen.ejecutadas.find((e) => e.solicitud.tareaId === "informe-curador");
    expect(curador?.resultado?.ok).toBe(false);
    expect(curador?.resultado?.salida).toContain("No se pudo lanzar la tarea");

    // Las demás se ejecutaron igual.
    expect(resumen.ejecutadas.length).toBeGreaterThan(1);
    expect(resumen.ejecutadas.filter((e) => e.resultado?.ok).length).toBeGreaterThan(0);
  });

  it("la que falló queda cerrada como fallida, no en curso", async () => {
    const falso = lanzadorQueRevientaCon("cli-informe-curador");

    await orquestar({ ...opciones(), ...falso, ahora: new Date() });

    const { rows } = await pool().query(
      `SELECT estado, resultado FROM solicitudes_orquestador WHERE tarea_id = 'informe-curador'`
    );
    expect(rows[0].estado).toBe("fallida");
    expect(rows[0].resultado).toContain("No se pudo lanzar");
    expect((await listarInterrumpidas(opciones())).solicitudes).toEqual([]);
  });

  it("el fallo deja su asiento en la bitácora", async () => {
    await orquestar({ ...opciones(), ...lanzadorQueRevientaCon("cli-informe-curador"), ahora: new Date() });

    const asientos = (await leerBitacora(opciones())).filter((a) => a.tareaId === "informe-curador");
    expect(asientos.map((a) => a.evento)).toEqual(["fallida", "reclamada", "creada"]);
    expect(asientos[0].detalle).toContain("No se pudo lanzar");
  });

  it("si revientan varias, todas quedan registradas y ninguna para el reparto", async () => {
    const falso = lanzadorQueRevientaCon("cli-informe-");

    const resumen = await orquestar({ ...opciones(), ...falso, ahora: new Date() });

    const informes = resumen.ejecutadas.filter((e) => e.solicitud.tareaId.startsWith("informe-"));
    expect(informes.length).toBeGreaterThan(1);
    for (const i of informes) expect(i.resultado?.ok, i.solicitud.tareaId).toBe(false);
    // Y lo que no es un informe sí corrió.
    expect(falso.lanzadas.length).toBeGreaterThan(0);
    expect(resumen.cortes).toEqual([]);
  });
});
