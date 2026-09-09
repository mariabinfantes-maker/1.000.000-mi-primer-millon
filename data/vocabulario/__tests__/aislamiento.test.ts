import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { accedeAlVocabulario } from "../repositorio";

/**
 * El contrato de la fase F1: el vocabulario existe como dato y NADIE lo lee
 * todavía. Ni el motor, ni las fichas, ni la interfaz.
 *
 * No es una formalidad. Que el motor empiece a filtrar por capacidad es un
 * cambio que altera lo que ve la gente, y va en F3 con simulación previa de
 * todas las rutas actuales. Si alguien lo importa antes sin darse cuenta, esta
 * prueba lo dice en voz alta en vez de dejarlo pasar.
 *
 * La primera versión sólo reconocía `import ... from`. La revisión
 * independiente enumeró lo que se le escapaba, y lo más probable de todo era
 * justamente lo que no veía: leer el JSON con `fs.readFileSync` y `path.join`,
 * que es exactamente como `data/repositorio.ts` lee sus datos.
 *
 * Cuando llegue F3, esta prueba se borra a propósito y se sustituye por las que
 * comprueben el filtrado. Borrarla será una decisión; que deje de existir en
 * silencio, no.
 */
describe("el aislamiento del vocabulario", () => {
  const raiz = process.cwd();
  const DIRECTORIOS_IGNORADOS = new Set(["node_modules", ".next", ".git", "dist", "coverage"]);
  const EXTENSIONES = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
  /**
   * Los únicos lugares autorizados a tocar el vocabulario.
   *
   * `data/vocabulario` es el propio módulo. `data/verificacion` se añadió al
   * empezar F2, porque un registro de verificación apunta a una capacidad y
   * validar que esa capacidad exista obliga a leer el vocabulario; sin eso, F2
   * podría escribir registros contra identificadores inventados.
   *
   * La intención de la guarda no cambia: lo que no puede leerlo es lo que ve la
   * gente. El motor, la interfaz y las fichas siguen fuera, y que lo lean sigue
   * siendo F3, con simulación previa de todas las rutas actuales.
   */
  const AUTORIZADOS = [path.join("data", "vocabulario"), path.join("data", "verificacion")];

  function archivosDeCodigo(dir: string, acumulado: string[] = []): string[] {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      const relativa = path.relative(raiz, completa);
      // Se compara la RUTA, no el nombre: antes, cualquier carpeta llamada
      // "vocabulario" quedaba excluida estuviera donde estuviera.
      if (AUTORIZADOS.some((a) => relativa === a || relativa.startsWith(a + path.sep))) continue;
      if (DIRECTORIOS_IGNORADOS.has(entrada.name) || entrada.name.startsWith(".")) continue;
      if (entrada.isDirectory()) archivosDeCodigo(completa, acumulado);
      else if (EXTENSIONES.test(entrada.name)) acumulado.push(completa);
    }
    return acumulado;
  }

  const archivos = archivosDeCodigo(raiz);

  it("la lista de autorizados es exactamente ésta", () => {
    // Fijada a propósito: ampliarla tiene que ser una decisión, no un descuido.
    // Cada nombre de aquí es alguien que puede leer el vocabulario.
    expect(AUTORIZADOS).toEqual([path.join("data", "vocabulario"), path.join("data", "verificacion")]);
  });

  it("hay código que revisar", () => {
    // Si el recorrido se rompiera, la prueba pasaría revisando cero archivos.
    expect(archivos.length).toBeGreaterThan(100);
  });

  it("nada fuera de data/vocabulario lo toca todavía", () => {
    const culpables = archivos
      .filter((f) => accedeAlVocabulario(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(
      culpables,
      "F1 sólo añade datos y pruebas. Que el motor lea el vocabulario es F3, " +
        "y exige simular antes todas las rutas que hoy funcionan."
    ).toEqual([]);
  });

  /**
   * Controles del detector. Cada línea de aquí abajo es una forma real de
   * llegar al vocabulario, y la prueba anterior sólo vale si todas se detectan.
   */
  describe("el detector reconoce cada forma de acceso", () => {
    const DEBE_DETECTAR: [string, string][] = [
      ["import con alias", 'import { getCapacidades } from "@/data/vocabulario/repositorio";'],
      ["import de JSON", 'import v from "@/data/vocabulario/vocabulario.json";'],
      ["import por efecto", 'import "@/data/vocabulario/repositorio";'],
      ["import dinámico", 'const m = await import("@/data/vocabulario/repositorio");'],
      ["require", 'const { getCapacidades } = require("@/data/vocabulario/repositorio");'],
      ["ruta relativa", 'import { getCapacidades } from "../vocabulario/repositorio";'],
      ["ruta relativa hacia arriba", 'import x from "../../data/vocabulario/esquema";'],
      [
        "lectura directa con path.join",
        'const v = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "vocabulario", "vocabulario.json"), "utf8"));',
      ],
      ["lectura directa por nombre", 'await fs.promises.readFile("vocabulario.json", "utf8");'],
      ["lectura de migraciones", 'readFileSync("./data/vocabulario/migraciones.json");'],
      ["esquema por su ruta", 'type T = import("@/data/vocabulario/esquema").Capacidad;'],
    ];

    it.each(DEBE_DETECTAR)("detecta: %s", (_nombre, codigo) => {
      expect(accedeAlVocabulario(codigo)).toBe(true);
    });

    const NO_DEBE_DETECTAR: [string, string][] = [
      ["otro repositorio", 'import { getTodasLasHerramientas } from "@/data/repositorio";'],
      ["la palabra en prosa", "// el vocabulario de capacidades se conectará en F3"],
      ["otro JSON del proyecto", 'readFileSync(path.join(DIR_DATOS, "categorias.json"), "utf8");'],
      ["una carpeta parecida", 'import x from "@/lib/vocabularioDeMarca";'],
    ];

    it.each(NO_DEBE_DETECTAR)("no confunde: %s", (_nombre, codigo) => {
      expect(accedeAlVocabulario(codigo)).toBe(false);
    });
  });
});
