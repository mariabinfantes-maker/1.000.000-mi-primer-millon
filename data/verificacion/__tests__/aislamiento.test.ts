import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El contrato de F2: produce datos verificados y NADIE productivo los lee.
 *
 * Es la misma promesa que hizo F1 con el vocabulario, y por la misma razón: que
 * el motor empiece a usar esto es F3, y exige simular antes todas las rutas que
 * hoy funcionan. Si alguien lo conecta antes sin darse cuenta, esta prueba lo
 * dice en voz alta.
 *
 * Cuando llegue F3, esta prueba se borra a propósito.
 */
describe("el aislamiento de la verificación", () => {
  const raiz = process.cwd();
  const IGNORADOS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
  const EXTENSIONES = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
  const PROPIO = path.join("data", "verificacion");
  /**
   * La guarda del vocabulario NOMBRA esta ruta para autorizarla, pero no lee
   * nada de aquí. Excluirla es exacto, no una excepción de conveniencia: si
   * algún día leyera de verdad, la exclusión seguiría siendo visible en esta
   * lista y habría que justificarla.
   */
  const EXENTOS = new Set([path.join("data", "vocabulario", "__tests__", "aislamiento.test.ts")]);

  /** Las mismas formas de acceso que vigila la guarda del vocabulario. */
  const ACCESOS = [
    /data\/verificacion/,
    /["'`](?:\.{1,2}\/)+verificacion\//,
    /["'`]data["'`]\s*,\s*["'`]verificacion["'`]/,
    /plausibles\.json|registros\.json/,
    /verificacion\/(?:repositorio|esquema)/,
  ];
  const accede = (codigo: string) => ACCESOS.some((r) => r.test(codigo));

  function archivos(dir: string, acc: string[] = []): string[] {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, e.name);
      const relativa = path.relative(raiz, completa);
      if (relativa === PROPIO || relativa.startsWith(PROPIO + path.sep)) continue;
      if (EXENTOS.has(relativa)) continue;
      if (IGNORADOS.has(e.name) || e.name.startsWith(".")) continue;
      if (e.isDirectory()) archivos(completa, acc);
      else if (EXTENSIONES.test(e.name)) acc.push(completa);
    }
    return acc;
  }

  const codigo = archivos(raiz);

  it("la lista de exentos es exactamente ésta", () => {
    expect([...EXENTOS]).toEqual([path.join("data", "vocabulario", "__tests__", "aislamiento.test.ts")]);
  });

  it("hay código que revisar", () => {
    expect(codigo.length).toBeGreaterThan(100);
  });

  it("nada fuera de data/verificacion lee los registros", () => {
    const culpables = codigo
      .filter((f) => accede(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(
      culpables,
      "F2 sólo produce datos. Que el motor los use es F3, y exige simular antes todas las rutas actuales."
    ).toEqual([]);
  });

  it("el detector reconoce las formas de acceso", () => {
    for (const linea of [
      'import { getRegistros } from "@/data/verificacion/repositorio";',
      'import r from "@/data/verificacion/registros.json";',
      'const m = await import("@/data/verificacion/repositorio");',
      'require("../verificacion/repositorio")',
      'fs.readFileSync(path.join(process.cwd(), "data", "verificacion", "registros.json"))',
      'readFile("plausibles.json")',
    ]) {
      expect(accede(linea), linea).toBe(true);
    }
    for (const inocente of [
      'import { getTodasLasHerramientas } from "@/data/repositorio";',
      "// la verificación de F2 se conecta al motor en F3",
      'readFileSync(path.join(DIR_DATOS, "categorias.json"))',
    ]) {
      expect(accede(inocente), inocente).toBe(false);
    }
  });
});
