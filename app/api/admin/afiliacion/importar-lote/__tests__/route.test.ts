import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { POST as importarLote } from "../route";
import { POST as reemplazar } from "../../importar/route";
import { generarTokenSesion } from "@/lib/admin/sesion";
import { generarTokenCsrf } from "@/lib/admin/csrf";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { limpiarTablasDePrueba, postgresDisponible } from "@/data/db/__tests__/entornoPruebaPostgres";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * La importación en bloque contra Postgres real. Lo que se comprueba aquí no
 * es que "funcione": es que NO escriba cuando no debe.
 */

const envOriginal = { ...process.env };

/**
 * Un proveedor de mentira, en local: responde bien en /vivo y 404 en /roto.
 * Hace falta uno de verdad porque activar una cuenta ahora exige que el
 * enlace responda, y este entorno no tiene salida a internet.
 */
let servidor: Server;
let baseProveedor: string;

beforeAll(async () => {
  servidor = createServer((peticion, respuesta) => {
    if (peticion.url?.startsWith("/vivo")) {
      respuesta.writeHead(200).end("ok");
    } else {
      respuesta.writeHead(404).end("no");
    }
  });
  await new Promise<void>((listo) => servidor.listen(0, "127.0.0.1", listo));
  const direccion = servidor.address();
  const puerto = typeof direccion === "object" && direccion ? direccion.port : 0;
  baseProveedor = `http://127.0.0.1:${puerto}`;
});

afterAll(async () => {
  await new Promise<void>((listo) => servidor.close(() => listo()));
});

function peticion(url: string, body: unknown): Request {
  const sesion = generarTokenSesion("admin-test");
  const csrf = generarTokenCsrf();
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `molnip_admin_sesion=${sesion}; molnip_admin_csrf=${csrf}`,
      "x-csrf-token": csrf,
    },
    body: JSON.stringify(body),
  });
}

const URL_LOTE = "https://molnip.com/api/admin/afiliacion/importar-lote";
const URL_REEMPLAZO = "https://molnip.com/api/admin/afiliacion/importar";

async function sembrar(estrategia: EstrategiaAfiliacion) {
  await guardarEstrategiaAfiliacion(estrategia, { usuario: "siembra" });
}

function estrategia(id: string, cuenta: Record<string, unknown> = {}): EstrategiaAfiliacion {
  return {
    herramientaId: id,
    cuentas: [
      {
        id: "principal",
        plataforma: "Programa propio",
        estado: "aprobado",
        enlaces: [],
        ultimaRevision: "2026-08-30",
        ...cuenta,
      },
    ],
  } as EstrategiaAfiliacion;
}

describe.skipIf(!postgresDisponible())("POST /api/admin/afiliacion/importar-lote", () => {
  beforeEach(async () => {
    process.env.MOLNIP_E2E = "true";
    // Necesario para que la comprobación acepte 127.0.0.1. Solo funciona
    // fuera de producción: hay una prueba que lo comprueba.
    process.env.MOLNIP_PERMITIR_RED_LOCAL = "true";
    await limpiarTablasDePrueba();
  });
  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("previsualizar NO escribe nada, por mucho que las filas sean válidas", async () => {
    const respuesta = await importarLote(
      peticion(URL_LOTE, { modo: "previsualizar", entradas: [{ id: "asana", comision: "40 %" }] })
    );
    const datos = await respuesta.json();
    expect(respuesta.status).toBe(200);
    expect(datos.resumen.total).toBe(1);
    // Lo importante: la base sigue igual que antes de llamar.
    expect(await getEstrategiaAfiliacion("asana")).toBeUndefined();
  });

  it("aplicar escribe las filas buenas", async () => {
    const respuesta = await importarLote(
      peticion(URL_LOTE, { modo: "aplicar", entradas: [{ id: "asana", comision: "40 %" }] })
    );
    const datos = await respuesta.json();
    expect(datos.ok).toBe(true);
    expect(datos.aplicadas).toBe(1);
    const guardada = await getEstrategiaAfiliacion("asana");
    expect(guardada?.cuentas[0].comision).toBe("40 %");
  });

  it("sin confirmación, una activación NO se aplica y queda contada como pendiente", async () => {
    const entradas = [
      { id: "asana", comision: "40 %" },
      { id: "monday-com", estado: "activo", enlace: "https://monday.com/?ref=molnip" },
    ];
    const datos = await (await importarLote(peticion(URL_LOTE, { modo: "aplicar", entradas }))).json();

    expect(datos.aplicadas).toBe(1);
    expect(datos.activacionesPendientes).toBe(1);
    // La que activaba no se ha escrito.
    expect(await getEstrategiaAfiliacion("monday-com")).toBeUndefined();
    expect((await getEstrategiaAfiliacion("asana"))?.cuentas[0].comision).toBe("40 %");
  });

  it("con la confirmación aparte y el enlace vivo, la activación sí se aplica", async () => {
    const enlace = `${baseProveedor}/vivo?ref=molnip`;
    const datos = await (
      await importarLote(
        peticion(URL_LOTE, {
          modo: "aplicar",
          entradas: [{ id: "monday-com", estado: "activo", enlace }],
          incluirActivaciones: true,
        })
      )
    ).json();

    expect(datos.aplicadas).toBe(1);
    expect(datos.activacionesAplicadas).toBe(1);
    const guardada = await getEstrategiaAfiliacion("monday-com");
    expect(guardada?.cuentas[0].estado).toBe("activo");
    expect(guardada?.cuentas[0].enlaces[0].url).toBe(enlace);
  });

  it("si el enlace NO responde, se importan los demás datos pero NO se activa", async () => {
    const enlace = `${baseProveedor}/roto?ref=molnip`;
    const datos = await (
      await importarLote(
        peticion(URL_LOTE, {
          modo: "aplicar",
          entradas: [{ id: "monday-com", estado: "activo", enlace, comision: "25 % recurrente" }],
          incluirActivaciones: true,
        })
      )
    ).json();

    expect(datos.activacionesBloqueadas).toBe(1);
    expect(datos.activacionesAplicadas).toBe(0);

    const guardada = await getEstrategiaAfiliacion("monday-com");
    // Los demás datos SÍ entran.
    expect(guardada?.cuentas[0].comision).toBe("25 % recurrente");
    expect(guardada?.cuentas[0].enlaces[0].url).toBe(enlace);
    // Pero la cuenta no queda activa.
    expect(guardada?.cuentas[0].estado).not.toBe("activo");
  });

  it("activar SIEMPRE comprueba el enlace, aunque no se pida la comprobación", async () => {
    // Si dependiera de una bandera del cliente, omitirla bastaría para
    // activar un enlace que no lleva a ninguna parte.
    const datos = await (
      await importarLote(
        peticion(URL_LOTE, {
          modo: "aplicar",
          entradas: [{ id: "monday-com", estado: "activo", enlace: `${baseProveedor}/roto` }],
          incluirActivaciones: true,
          comprobarEnlaces: false,
        })
      )
    ).json();

    expect(datos.activacionesBloqueadas).toBe(1);
    expect((await getEstrategiaAfiliacion("monday-com"))?.cuentas[0].estado).not.toBe("activo");
  });

  it("la vista previa avisa de si el enlace responde, cuando se pide", async () => {
    const datos = await (
      await importarLote(
        peticion(URL_LOTE, {
          modo: "previsualizar",
          entradas: [
            { id: "asana", enlace: `${baseProveedor}/vivo` },
            { id: "clickup", enlace: `${baseProveedor}/roto` },
          ],
          comprobarEnlaces: true,
        })
      )
    ).json();

    expect(datos.resumen.enlacesComprobados).toBe(true);
    expect(datos.resumen.filas[0].avisos.join(" ")).toMatch(/el enlace responde/i);
    expect(datos.resumen.filas[1].avisos.join(" ")).toMatch(/NO responde/i);
    // Y sigue sin escribir nada.
    expect(await getEstrategiaAfiliacion("asana")).toBeUndefined();
  });

  it("no toca una cuenta que ya está ACTIVA", async () => {
    await sembrar(
      estrategia("monday-com", { estado: "activo", enlaces: [{ segmento: "global", url: "https://monday.com/?ref=bueno" }] })
    );
    const datos = await (
      await importarLote(
        peticion(URL_LOTE, {
          modo: "aplicar",
          entradas: [{ id: "monday-com", enlace: "https://otro.test/?ref=malo" }],
          incluirActivaciones: true,
        })
      )
    ).json();

    expect(datos.error).toMatch(/no hay ninguna fila que aplicar/i);
    const guardada = await getEstrategiaAfiliacion("monday-com");
    expect(guardada?.cuentas[0].enlaces[0].url).toBe("https://monday.com/?ref=bueno");
  });

  it("no pisa un enlace ya guardado", async () => {
    await sembrar(estrategia("asana", { enlaces: [{ segmento: "global", url: "https://asana.so/?ref=bueno" }] }));
    await importarLote(
      peticion(URL_LOTE, { modo: "aplicar", entradas: [{ id: "asana", enlace: "https://otro.test/?ref=malo" }] })
    );
    expect((await getEstrategiaAfiliacion("asana"))?.cuentas[0].enlaces[0].url).toBe("https://asana.so/?ref=bueno");
  });

  it("no toca Systeme.io", async () => {
    await sembrar(estrategia("systeme-io", { comision: "60 % recurrente vitalicio" }));
    await importarLote(peticion(URL_LOTE, { modo: "aplicar", entradas: [{ id: "systeme-io", comision: "1 %" }] }));
    expect((await getEstrategiaAfiliacion("systeme-io"))?.cuentas[0].comision).toBe("60 % recurrente vitalicio");
  });

  it("un archivo con demasiadas filas se rechaza entero", async () => {
    const entradas = Array.from({ length: 501 }, () => ({ id: "asana" }));
    const respuesta = await importarLote(peticion(URL_LOTE, { modo: "aplicar", entradas }));
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).error).toMatch(/máximo son 500/i);
  });
});

describe.skipIf(!postgresDisponible())("POST /api/admin/afiliacion/importar — reemplazo completo", () => {
  beforeEach(async () => {
    process.env.MOLNIP_E2E = "true";
    await limpiarTablasDePrueba();
  });
  afterEach(() => {
    process.env = { ...envOriginal };
  });

  it("sin confirmar, NO reemplaza y explica por qué", async () => {
    await sembrar(estrategia("asana", { comision: "20 %" }));
    const respuesta = await reemplazar(peticion(URL_REEMPLAZO, [estrategia("asana", { comision: "99 %" })]));

    expect(respuesta.status).toBe(400);
    const datos = await respuesta.json();
    expect(datos.requiereConfirmacion).toBe(true);
    expect(datos.error).toMatch(/REEMPLAZA/);
    // Nada se ha tocado.
    expect((await getEstrategiaAfiliacion("asana"))?.cuentas[0].comision).toBe("20 %");
  });

  it("confirmando explícitamente, sí reemplaza", async () => {
    await sembrar(estrategia("asana", { comision: "20 %" }));
    const respuesta = await reemplazar(
      peticion(URL_REEMPLAZO, { reemplazar: true, estrategias: [estrategia("asana", { comision: "99 %" })] })
    );

    expect(respuesta.status).toBe(200);
    expect((await getEstrategiaAfiliacion("asana"))?.cuentas[0].comision).toBe("99 %");
  });
});
