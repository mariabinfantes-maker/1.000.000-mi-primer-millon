import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El contrato de F3: la verificación entra en la aplicación por UN solo sitio.
 *
 * Hasta el bloque 5 esta prueba decía que nadie la leía. Ya no puede decirlo
 * —el motor la usa— y borrarla habría sido quedarse sin guarda justo cuando
 * empieza a hacer falta. Así que cambia de promesa: la lista de lectores
 * autorizados es explícita y corta, y cualquier lector nuevo hace fallar esta
 * prueba hasta que alguien lo añada a mano y lo justifique en el diff.
 *
 * Un solo punto de entrada es lo que hace comprobable todo lo demás: si la
 * evidencia entrara por cuatro sitios, ninguna regla sobre cómo se lee valdría
 * nada.
 */
describe("el aislamiento de la verificación", () => {
  const raiz = process.cwd();
  const IGNORADOS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
  const EXTENSIONES = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
  const PROPIO = path.join("data", "verificacion");
  /**
   * Quién puede leer la verificación, y por qué.
   *
   * Cada línea es una decisión, no una excepción de conveniencia. Añadir una
   * es ampliar la superficie por la que la evidencia entra en el producto, y
   * eso tiene que verse en un diff.
   */
  const AUTORIZADOS = new Map([
    [
      path.join("app", "api", "recomendaciones", "route.ts"),
      "F3, bloque 5: el único punto por el que la verificación llega al motor. El motor la recibe por parámetro y no la importa.",
    ],
    [
      path.join("data", "vocabulario", "__tests__", "aislamiento.test.ts"),
      "La guarda del vocabulario NOMBRA esta ruta para autorizarla, pero no lee nada de aquí.",
    ],
  ]);
  const EXENTOS = new Set(AUTORIZADOS.keys());

  /** Las mismas formas de acceso que vigila la guarda del vocabulario. */
  const ACCESOS = [
    /data\/verificacion/,
    /["'`](?:\.{1,2}\/)+verificacion\//,
    /["'`]data["'`]\s*,\s*["'`]verificacion["'`]/,
    /plausibles\.json|registros\.json/,
    /verificacion\/(?:repositorio|esquema)/,
  ];
  /**
   * Quita los comentarios antes de mirar.
   *
   * Documentar esta separación exige nombrar la ruta —este archivo mismo la
   * nombra veinte veces—, y un comentario no lee nada. Sin esto, la guarda
   * cazaba `tipos.ts` por explicar en prosa que el motor NO importa la
   * verificación, que es exactamente lo contrario de lo que persigue. Misma
   * decisión que en `independenciaAfiliacion.test.ts`, por el mismo motivo.
   */
  function sinComentarios(codigo: string): string {
    return codigo
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .split("\n")
      .map((linea) => linea.replace(/\/\/.*$/, ""))
      .join("\n");
  }

  const accede = (codigo: string) => ACCESOS.some((r) => r.test(sinComentarios(codigo)));

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

  it("los lectores autorizados son exactamente éstos", () => {
    expect([...AUTORIZADOS.keys()]).toEqual([
      path.join("app", "api", "recomendaciones", "route.ts"),
      path.join("data", "vocabulario", "__tests__", "aislamiento.test.ts"),
    ]);
  });

  it("cada autorización dice por qué lo está", () => {
    for (const [archivo, porque] of AUTORIZADOS) expect(porque.length, archivo).toBeGreaterThan(40);
  });

  it("y el punto autorizado existe y lee la verificación de verdad", () => {
    const ruta = path.join(raiz, "app", "api", "recomendaciones", "route.ts");
    expect(fs.existsSync(ruta)).toBe(true);
    expect(accede(fs.readFileSync(ruta, "utf8"))).toBe(true);
  });

  /**
   * El motor decide qué se recomienda, así que si importara la verificación
   * por su cuenta ya no habría un punto de entrada, habría dos.
   */
  it("el motor NO importa la verificación: la recibe por parámetro", () => {
    const dir = path.join(raiz, "agents", "atlas-advisor");
    const culpables = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .filter((f) => accede(fs.readFileSync(path.join(dir, f), "utf8")));
    expect(culpables).toEqual([]);
  });

  it("hay código que revisar", () => {
    expect(codigo.length).toBeGreaterThan(100);
  });

  it("nadie más lee los registros", () => {
    const culpables = codigo
      .filter((f) => accede(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(
      culpables,
      "La verificación entra por un solo sitio. Si hace falta otro, se añade a AUTORIZADOS con su motivo y se discute en el diff."
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
      // Nombrar la ruta explicando que NO se importa no es importarla.
      "// el motor no importa nada de data/verificacion: la recibe por parámetro",
      "/* ver data/verificacion/registros.json */",
    ]) {
      expect(accede(inocente), inocente).toBe(false);
    }

    // Y el mismo texto, fuera de un comentario, sí es un acceso.
    expect(accede('import x from "@/data/verificacion/registros.json";')).toBe(true);
  });
});
