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
    idsValidos: new Set(["systeme-io", "notion", "grammarly"]),
    nombres: { "systeme-io": "Systeme.io", notion: "Notion", grammarly: "Grammarly" },
    existentes: new Map([["notion", estrategia("notion")]]),
    ...overrides,
  };
}

describe("previsualizarLote", () => {
  it("no escribe nada: solo describe", () => {
    const existentes = new Map([["notion", estrategia("notion")]]);
    const antes = JSON.stringify([...existentes]);
    previsualizarLote([{ id: "notion", comision: "40 %" }], contexto({ existentes }));
    expect(JSON.stringify([...existentes])).toBe(antes);
  });

  it("distingue crear, cambiar y sin cambios", () => {
    const existentes = new Map([
      ["notion", estrategia("notion")],
      ["systeme-io", estrategia("systeme-io")],
    ]);
    const r = previsualizarLote(
      [
        // No hay estrategia guardada para grammarly: se creará.
        { id: "grammarly", comision: "20 %" },
        // notion sí la tiene, y la comisión es distinta.
        { id: "notion", comision: "40 %" },
        // systeme-io ya tiene exactamente esa plataforma: nada que cambiar.
        { id: "systeme-io", plataforma: "Programa propio" },
      ],
      contexto({ existentes })
    );
    expect(r.filas.map((f) => f.veredicto)).toEqual(["creara", "cambiara", "sin_cambios"]);
  });

  it("enseña el antes y el después de cada campo", () => {
    const existentes = new Map([["notion", estrategia("notion", { comision: "20 %" })]]);
    const r = previsualizarLote([{ id: "notion", comision: "40 %" }], contexto({ existentes }));
    expect(r.filas[0].cambios).toContainEqual({ campo: "Comisión", antes: "20 %", despues: "40 %" });
  });

  it("rechaza un id que no está en el catálogo", () => {
    const r = previsualizarLote([{ id: "herramienta-inventada" }], contexto());
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/no existe en el catálogo/i);
  });

  it("rechaza un enlace pegado a medias", () => {
    const r = previsualizarLote([{ id: "notion", enlace: "ps://notion.so/?ref=x" }], contexto());
    expect(r.filas[0].errores.join(" ")).toMatch(/empezar por https/i);
  });

  it("rechaza dejar en activo sin enlace", () => {
    const r = previsualizarLote([{ id: "notion", estado: "activo" }], contexto());
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/sin enlace/i);
  });

  it("acepta activo si la misma fila trae el enlace", () => {
    const r = previsualizarLote(
      [{ id: "notion", estado: "activo", enlace: "https://notion.so/?ref=molnip" }],
      contexto()
    );
    expect(r.filas[0].veredicto).toBe("cambiara");
    expect(r.filas[0].activa).toBe(true);
  });

  it("detecta filas repetidas para la misma cuenta", () => {
    const r = previsualizarLote(
      [
        { id: "notion", comision: "40 %" },
        { id: "notion", comision: "50 %" },
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
        { id: "notion", cuenta: "principal", comision: "40 %" },
        { id: "notion", cuenta: "impact", comision: "50 %" },
      ],
      contexto()
    );
    expect(r.filas.every((f) => f.veredicto !== "error")).toBe(true);
  });

  it("protege las herramientas intocables", () => {
    const r = previsualizarLote(
      [{ id: "systeme-io", enlace: "https://otro.test/?sa=x" }],
      contexto({ intocables: new Set(["systeme-io"]) })
    );
    expect(r.filas[0].veredicto).toBe("error");
    expect(r.filas[0].errores.join(" ")).toMatch(/protegida/i);
  });

  it("bloquea el archivo entero si falla más de la mitad de las filas", () => {
    const r = previsualizarLote(
      [{ id: "no-existe-1" }, { id: "no-existe-2" }, { id: "notion", comision: "40 %" }],
      contexto()
    );
    expect(r.bloqueo).toMatch(/columnas no están bien emparejadas/i);
    expect(filasAAplicar(r, true)).toEqual([]);
  });

  it("no bloquea cuando los fallos son minoría", () => {
    const r = previsualizarLote(
      [{ id: "no-existe" }, { id: "notion", comision: "40 %" }, { id: "grammarly", comision: "10 %" }],
      contexto()
    );
    expect(r.bloqueo).toBeUndefined();
  });
});

describe("las activaciones van aparte", () => {
  const entradas = [
    { id: "notion", comision: "40 %" },
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
      ["notion", estrategia("notion", { estado: "activo", enlaces: [{ segmento: "global", url: "https://notion.so/?ref=x" }] })],
    ]);
    const r = previsualizarLote([{ id: "notion", comision: "40 %" }], contexto({ existentes }));
    expect(r.filas[0].activa).toBe(false);
    expect(r.activaciones).toBe(0);
  });

  it("una fila con error nunca se cuenta como activación", () => {
    const r = previsualizarLote([{ id: "notion", estado: "activo" }], contexto());
    expect(r.filas[0].activa).toBe(false);
    expect(r.activaciones).toBe(0);
  });
});
