import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getPlan, versionDelVocabulario } from "../repositorio";

/**
 * El plan de lotes de F2: qué herramienta se verifica, en qué orden y por qué.
 *
 * Que cada herramienta aparezca UNA sola vez no es burocracia. Si una se
 * repite, se verifica dos veces y las dos versiones se contradicen tarde o
 * temprano; si falta, se queda sin verificar y nadie lo nota hasta que el motor
 * la descarta en silencio.
 */
describe("el plan de verificación", () => {
  const plan = getPlan();
  const catalogo = getTodasLasHerramientas().map((h) => h.id);
  const asignadas = plan.lotes.flatMap((l) => l.herramientaIds);

  it("verifica contra la misma versión del vocabulario que hay en el repositorio", () => {
    expect(
      plan.versionVocabulario,
      "Si el vocabulario avanza y el plan no, se estaría verificando contra capacidades que ya no son las mismas."
    ).toBe(versionDelVocabulario());
  });

  it("cubre el catálogo entero: las 62", () => {
    expect(asignadas.length).toBe(62);
    expect(catalogo.length).toBe(62);
  });

  it("ninguna herramienta se repite", () => {
    const repetidas = asignadas.filter((id, i) => asignadas.indexOf(id) !== i);
    expect(repetidas).toEqual([]);
  });

  it("ninguna herramienta se queda fuera", () => {
    expect(catalogo.filter((id) => !asignadas.includes(id))).toEqual([]);
  });

  it("ninguna herramienta del plan es inventada", () => {
    expect(asignadas.filter((id) => !catalogo.includes(id))).toEqual([]);
  });

  it("son tres lotes, numerados 1, 2 y 3", () => {
    expect(plan.lotes.map((l) => l.numero)).toEqual([1, 2, 3]);
  });

  it("cada lote explica por qué existe y por qué va en ese orden", () => {
    for (const lote of plan.lotes) {
      expect(lote.motivo.trim().length, `lote ${lote.numero}`).toBeGreaterThan(80);
      expect(lote.nombre.trim().length, `lote ${lote.numero}`).toBeGreaterThan(0);
      expect(lote.herramientaIds.length, `lote ${lote.numero}`).toBeGreaterThan(0);
    }
  });

  it("el reparto es el aprobado: 30 · 18 · 14", () => {
    expect(plan.lotes.map((l) => l.herramientaIds.length)).toEqual([30, 18, 14]);
  });

  it("el lote 1 son las rutas que hoy funcionan, y sólo ésas", () => {
    const herramientas = getTodasLasHerramientas();
    const categorias = new Set(
      plan.lotes[0].herramientaIds.map((id) => herramientas.find((h) => h.id === id)!.categoriaId)
    );
    expect([...categorias].sort()).toEqual(["crm", "gestion-proyectos"]);
  });

  it("el lote 2 son todos los asistentes de IA, ninguno suelto en otro lote", () => {
    const asistentes = getTodasLasHerramientas()
      .filter((h) => h.categoriaId === "asistentes-ia")
      .map((h) => h.id)
      .sort();
    expect(plan.lotes[1].herramientaIds.slice().sort()).toEqual(asistentes);
  });

  it("la verificación no importa nada de afiliación", () => {
    // La afiliación no puede influir en la verificación funcional, y la forma
    // más simple de garantizarlo es que este módulo no sepa que existe.
    //
    // Se miran las IMPORTACIONES, no la prosa: el primer intento buscaba la
    // palabra en todo el archivo y saltaba con el propio comentario que
    // prohíbe importarlo.
    const dir = path.join(process.cwd(), "data", "verificacion");
    const archivos = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".ts"))
      .map((e) => path.join(dir, e.name));
    expect(archivos.length).toBeGreaterThan(0);
    const PROHIBIDO = /(?:from|require\()\s*["'`][^"'`]*(?:afiliado|esquemaInterno|estrategia-afiliad|repositorioAfiliados)/i;
    for (const archivo of archivos) {
      const codigo = fs.readFileSync(archivo, "utf8");
      expect(PROHIBIDO.test(codigo), `${path.basename(archivo)} importa algo de afiliación`).toBe(
        false
      );
    }
  });

  it("esa comprobación detectaría una importación de afiliación", () => {
    // Control: una prueba que no puede fallar no demuestra nada.
    const PROHIBIDO = /(?:from|require\()\s*["'`][^"'`]*(?:afiliado|esquemaInterno|estrategia-afiliad|repositorioAfiliados)/i;
    for (const linea of [
      'import { getAfiliados } from "@/data/repositorioAfiliados";',
      'import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";',
      'const x = require("../afiliados/indice.json");',
    ]) {
      expect(PROHIBIDO.test(linea), linea).toBe(true);
    }
    // Y no confunde un comentario que sólo habla de ello.
    expect(PROHIBIDO.test("// no importa nada de data/afiliados/")).toBe(false);
  });
});
