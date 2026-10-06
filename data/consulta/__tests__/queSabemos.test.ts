import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { herramientasDelCatalogo, indiceDeInvestigacion, queSabemosDe } from "../queSabemos";
import { informe } from "../cli-que-sabemos";

/**
 * «¿QUÉ SABEMOS DE X?» encuentra lo que está guardado aunque no esté en la
 * ficha. Nace del caso DriCloud (2026-10-05): se dijo «no tenemos guardado si
 * ofrece una prueba gratuita» mirando sólo la ficha, y la entrega del 30 de
 * septiembre lo decía.
 */
describe("qué sabemos de una herramienta", () => {
  it("DriCloud: encuentra el porqué del plan gratuito, que la ficha no guarda", () => {
    const s = queSabemosDe("dricloud")!;
    expect(s.ficha?.tienePlanGratuito).toBe(false);
    expect(s.ficha?.fundamentoPlanGratuito).toBeUndefined();
    const texto = informe(s);
    expect(texto).toContain("La demostración gratuita no es un plan.");
    expect(texto).toContain("data/investigacion/las-siete-2026-09-30/crudo/dricloud-flowww-crudo.json");
  });

  it("todas las herramientas del catálogo tienen alguna entrega de investigación enlazada", () => {
    const hs = herramientasDelCatalogo();
    const idx = indiceDeInvestigacion(hs);
    const sinNada = hs.filter((h) => !(idx.entregas.get(h.id) ?? []).some((e) => !e.soloPorNombre));
    expect(sinNada.map((h) => h.id)).toEqual([]);
  });

  /**
   * Las respuestas en bruto llegan envueltas en un bloque de código. Hasta el
   * 2026-10-06 la consulta no las abría, y se dijo que de las 65 originales no
   * había nada sobre lo fácil que es usarlas: estaba la nota de facilidad de
   * uso que se leyó en Capterra el 29 de septiembre.
   */
  it("Asana: lee la nota de facilidad de uso guardada en una respuesta en bruto", () => {
    const s = queSabemosDe("asana")!;
    const leida = s.entregas
      .filter((e) => e.ruta.startsWith("data/investigacion/reputacion-las-15-2026-09-29/crudo/"))
      .flatMap((e) => e.objetos)
      .find((o) => o.enlace === "texto");
    expect(leida?.campos.capterra).toMatchObject({ facilidadDeUso: 4.4, numeroDeResenas: 12319 });
    expect(informe(s)).toContain('"facilidadDeUso":4.4');
  });

  it("un id que no existe no inventa nada", () => {
    expect(queSabemosDe("no-existe-esta-herramienta")).toBeNull();
  });
});

/**
 * LA CONSULTA ES PARA PERSONAS, NO PARA EL PRODUCTO. Lee la verificación con
 * permiso de `data/verificacion/__tests__/aislamiento.test.ts` precisamente
 * porque nada del producto la usa: si un día el asesor o la web la importaran,
 * la evidencia entraría por una segunda puerta. Esto lo impide.
 */
describe("nadie del producto importa la consulta", () => {
  // Se vigila importarla, no nombrarla: el catálogo del Orchestrator
  // (`agents/atlas-orchestrator/tareas.ts`) escribe su ruta como texto para
  // lanzarla con `npm run`, y eso no la mete en el producto.
  it("app, agents, lib y components no la importan", () => {
    const raiz = process.cwd();
    const quien: string[] = [];
    const recorrer = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) recorrer(p);
        else if (/\.(ts|tsx|js|mjs)$/.test(e.name) && /(?:from\s+|import\(\s*|require\(\s*)["'`][^"'`]*\bconsulta\//.test(fs.readFileSync(p, "utf-8"))) quien.push(path.relative(raiz, p));
      }
    };
    for (const d of ["app", "agents", "lib", "components"]) recorrer(path.join(raiz, d));
    expect(quien).toEqual([]);
  });
});
