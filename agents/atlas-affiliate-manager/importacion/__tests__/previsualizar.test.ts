import { describe, it, expect } from "vitest";
import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import { previsualizarLote, filasAAplicar, type ContextoPrevisualizacion } from "../previsualizar";

function estrategia(id: string, cuenta: Partial<EstrategiaAfiliacion["cuentas"][0]> = {}): EstrategiaAfiliacion {
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
      } as EstrategiaAfiliacion["cuentas"][0],
    ],
  };
}

function contexto(overrides: Partial<ContextoPrevisualizacion> = {}): ContextoPrevisualizacion {
  return {
    idsValidos: new Set(["systeme-io", "asana", "grammarly", "monday-com"]),
    nombres: { "systeme-io": "Systeme.io", asana: "Asana", grammarly: "Grammarly", "monday-com": "monday.com" },
    existentes: new Map([["asana", estrategia("asana")]]),
    ...overrides,
  };
}

describe("previsualizarLote", () => {
  it("no escribe nada: solo describe", () => {
    const existentes = new Map([["asana", estrategia("asana")]]);
    const antes = JSON.stringify([...existentes]);
    previsualizarLote([{ id: "asana", comision: "40 %" }], contexto({ existentes }));
    expect(JSON.stringify([...existentes])).toBe(antes);
  });

  it("distingue crear, cambiar y sin cambios", () => {
    const existentes = new Map([
      ["asana", estrategia("asana")],
      ["monday-com", estrategia("monday-com")],
    ]);
    const r = previsualizarLote(
      [
        // No hay estrategia guardada para grammarly: se creará.
        { id: "grammarly", comision: "20 %" },
        // asana sí la tiene, y la comisión es distinta.
        { id: "asana", comision: "40 %" },
        // monday-com ya tiene exactamente esa plataforma: nada que cambiar.
        { id: "monday-com", plataforma: "Programa propio" },
      ],
      contexto({ existentes })
    );
    expect(r.filas.map((f) => f.veredicto)).toEqual(["creara", "cambiara", "sin_cambios"]);
  });

  it("enseña el antes y el después de cada campo", () => {
    const existentes = new Map([["asana", estrategia("asana", { comision: "20 %" })]]);
    const r = previsualizarLote([{ id: "asana", comision: "40 %" }], contexto({ existentes }));
    expect(r.filas[0].cambios).toContainEqual({ campo: "Comisión", antes: "20 %", despues: "40 %" });
  });

  it("rechaza un id que no está en el catálogo", () => {
    const r = previsualizarLote([{ id: "herramienta-inventada" }], contexto());
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/no existe en el catálogo/i);
  });

  it("rechaza un enlace pegado a medias", () => {
    const r = previsualizarLote([{ id: "asana", enlace: "ps://asana.so/?ref=x" }], contexto());
    expect(r.filas[0].errores.join(" ")).toMatch(/empezar por https/i);
  });

  it("rechaza dejar en activo sin enlace", () => {
    const r = previsualizarLote([{ id: "asana", estado: "activo" }], contexto());
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/sin enlace/i);
  });

  it("acepta activo si la misma fila trae el enlace", () => {
    const r = previsualizarLote(
      [{ id: "asana", estado: "activo", enlace: "https://asana.so/?ref=molnip" }],
      contexto()
    );
    expect(r.filas[0].veredicto).toBe("cambiara");
    expect(r.filas[0].activa).toBe(true);
  });

  it("detecta filas repetidas para la misma cuenta", () => {
    const r = previsualizarLote(
      [
        { id: "asana", comision: "40 %" },
        { id: "asana", comision: "50 %" },
      ],
      contexto()
    );
    // Sin esto, la segunda pisaría a la primera en silencio.
    expect(r.filas[1].veredicto).toBe("error");
    expect(r.filas[1].errores.join(" ")).toMatch(/repetida/i);
  });

  it("una misma herramienta con dos cuentas distintas NO es repetida", () => {
    const r = previsualizarLote(
      [
        { id: "asana", cuenta: "principal", comision: "40 %" },
        { id: "asana", cuenta: "impact", comision: "50 %" },
      ],
      contexto()
    );
    expect(r.filas.every((f) => f.veredicto !== "error")).toBe(true);
  });

  it("protege Systeme.io por nombre", () => {
    const r = previsualizarLote([{ id: "systeme-io", enlace: "https://otro.test/?sa=x" }], contexto());
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/protegida/i);
  });

  it("bloquea el archivo entero si falla más de la mitad de las filas", () => {
    const r = previsualizarLote(
      [
        { id: "no-existe-1" },
        { id: "no-existe-2" },
        { id: "no-existe-3" },
        { id: "asana", comision: "40 %" },
      ],
      contexto()
    );
    expect(r.bloqueo).toMatch(/columnas no están bien emparejadas/i);
    expect(filasAAplicar(r, true)).toEqual([]);
  });

  it("NO usa ese umbral en archivos de una o dos filas", () => {
    // Con una sola fila mala, "las columnas no están bien emparejadas" sería
    // mentira: lo que hay es un problema concreto en esa fila, y el mensaje
    // debe dejar verlo en vez de taparlo con una explicación equivocada.
    const r = previsualizarLote([{ id: "no-existe" }], contexto());
    expect(r.bloqueo).toBeUndefined();
    expect(r.filas[0].errores.join(" ")).toMatch(/no existe en el catálogo/i);
  });

  it("no bloquea cuando los fallos son minoría", () => {
    const r = previsualizarLote(
      [{ id: "no-existe" }, { id: "asana", comision: "40 %" }, { id: "grammarly", comision: "10 %" }],
      contexto()
    );
    expect(r.bloqueo).toBeUndefined();
  });
});

describe("las activaciones van aparte", () => {
  const entradas = [
    { id: "asana", comision: "40 %" },
    { id: "grammarly", estado: "activo", enlace: "https://grammarly.com/?ref=molnip" },
  ];

  it("se cuentan por separado", () => {
    const r = previsualizarLote(entradas, contexto());
    expect(r.aplicables).toBe(1);
    expect(r.activaciones).toBe(1);
  });

  it("el botón principal NO incluye la activación", () => {
    const r = previsualizarLote(entradas, contexto());
    expect(filasAAplicar(r, false)).toEqual([1]);
  });

  it("con la confirmación aparte, sí", () => {
    const r = previsualizarLote(entradas, contexto());
    expect(filasAAplicar(r, true)).toEqual([1, 2]);
  });

  it("una cuenta que YA estaba activa y no cambia de estado no cuenta como activación", () => {
    const existentes = new Map([
      ["asana", estrategia("asana", { estado: "activo", enlaces: [{ segmento: "global", url: "https://asana.so/?ref=x" }] })],
    ]);
    const r = previsualizarLote([{ id: "asana", comision: "40 %" }], contexto({ existentes }));
    expect(r.filas[0].activa).toBe(false);
    expect(r.activaciones).toBe(0);
  });

  it("una fila con error nunca se cuenta como activación", () => {
    const r = previsualizarLote([{ id: "asana", estado: "activo" }], contexto());
    expect(r.filas[0].activa).toBe(false);
    expect(r.activaciones).toBe(0);
  });
});

describe("el bloqueo solo acusa a las columnas cuando de verdad lo parecen", () => {
  it("una mayoría de errores por PROTECCIÓN no bloquea el archivo", () => {
    // El caso real, visto con navegador: un CSV de cinco filas bien
    // emparejado donde tres fallaban por protecciones correctas se bloqueaba
    // acusando a las columnas. Las protecciones son negativas deliberadas del
    // sistema y en un archivo normal habrá varias.
    const existentes = new Map([
      ["asana", estrategia("asana", { enlaces: [{ segmento: "global", url: "https://asana.com/?ref=viejo" }] })],
      ["grammarly", estrategia("grammarly", { estado: "activo", enlaces: [{ segmento: "global", url: "https://g.test/?r=1" }] })],
    ]);
    const r = previsualizarLote(
      [
        { id: "systeme-io", comision: "1 %" },
        { id: "asana", enlace: "https://otro.test/?ref=x" },
        { id: "grammarly", enlace: "https://otro.test/?ref=y" },
        { id: "monday-com", comision: "25 %" },
      ],
      contexto({ existentes })
    );
    expect(r.conError).toBe(3);
    expect(r.bloqueo).toBeUndefined();
    // Y la fila buena sigue siendo aplicable.
    expect(filasAAplicar(r, false)).toEqual([4]);
  });

  it("una mayoría de ids que no existen SÍ bloquea, que es el síntoma real", () => {
    const r = previsualizarLote(
      [{ id: "25 % recurrente" }, { id: "https://x.test" }, { id: "90 días" }, { id: "asana", comision: "10 %" }],
      contexto()
    );
    expect(r.bloqueo).toMatch(/no corresponde a ninguna herramienta/i);
  });
});
