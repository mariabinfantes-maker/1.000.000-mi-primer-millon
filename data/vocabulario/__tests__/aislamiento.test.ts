import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El contrato de la fase F1: el vocabulario existe como dato y NADIE lo lee
 * todavía. Ni el motor, ni las fichas, ni la interfaz.
 *
 * No es una formalidad. Que el motor empiece a filtrar por capacidad es un
 * cambio que altera lo que ve la gente, y va en F3 con simulación previa de
 * todas las rutas actuales. Si alguien lo importa antes sin darse cuenta, esta
 * prueba lo dice en voz alta en vez de dejarlo pasar.
 *
 * Cuando llegue F3, esta prueba se borra a propósito y se sustituye por las
 * que comprueben el filtrado. Borrarla será una decisión; que deje de existir
 * en silencio, no.
 */
describe("el aislamiento del vocabulario", () => {
  const raiz = process.cwd();
  const IGNORADOS = new Set(["node_modules", ".next", ".git", "data/vocabulario"]);

  function archivosDeCodigo(dir: string, acumulado: string[] = []): string[] {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const completa = path.join(dir, entrada.name);
      const relativa = path.relative(raiz, completa);
      if (IGNORADOS.has(entrada.name) || IGNORADOS.has(relativa) || entrada.name.startsWith(".")) continue;
      if (entrada.isDirectory()) archivosDeCodigo(completa, acumulado);
      else if (/\.(ts|tsx)$/.test(entrada.name)) acumulado.push(completa);
    }
    return acumulado;
  }

  it("nada fuera de data/vocabulario lo importa todavía", () => {
    const culpables = archivosDeCodigo(raiz)
      .filter((f) => /from\s+["'][^"']*data\/vocabulario/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(raiz, f));
    expect(
      culpables,
      "F1 sólo añade datos y pruebas. Que el motor lea el vocabulario es F3, " +
        "y exige simular antes todas las rutas que hoy funcionan."
    ).toEqual([]);
  });
});
