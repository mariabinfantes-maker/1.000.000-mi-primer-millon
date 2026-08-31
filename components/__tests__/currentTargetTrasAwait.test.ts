import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";

/**
 * `evento.currentTarget` vale null en cuanto el despacho del evento termina.
 * En un manejador `async`, eso ocurre en el primer `await`: todo lo que venga
 * después lee null y revienta.
 *
 * El fallo es especialmente traicionero porque solo aparece en el camino
 * bueno. En el formulario de ingresos se manifestó así: el apunte se guardaba
 * en la base de datos, y acto seguido el `reset()` lanzaba, el catch lo
 * recogía y la pantalla decía "Cannot read properties of null". Quien lo
 * viera daría el guardado por fallido y volvería a enviarlo — sobre una tabla
 * que no admite modificaciones ni borrados, así que el duplicado se queda.
 *
 * Por eso esta comprobación mira el árbol de sintaxis en vez de buscar texto:
 * necesita distinguir el `await` de la misma función del de una función
 * anidada, y eso una expresión regular no lo sabe hacer.
 */

const RAIZ = join(__dirname, "..", "..");

function ficheros(): string[] {
  const salida: string[] = [];
  for (const carpeta of ["components", "app"]) {
    const base = join(RAIZ, carpeta);
    for (const entrada of readdirSync(base, { recursive: true, encoding: "utf-8" })) {
      if (entrada.endsWith(".tsx")) salida.push(join(base, entrada));
    }
  }
  return salida;
}

function esFuncion(nodo: ts.Node): nodo is ts.FunctionLikeDeclaration {
  return (
    ts.isFunctionDeclaration(nodo) ||
    ts.isFunctionExpression(nodo) ||
    ts.isArrowFunction(nodo) ||
    ts.isMethodDeclaration(nodo)
  );
}

/** Usos de `currentTarget` situados después de un `await` de la MISMA función. */
function usosPeligrosos(ruta: string): string[] {
  const texto = readFileSync(ruta, "utf-8");
  const fuente = ts.createSourceFile(ruta, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hallazgos: string[] = [];

  function revisarFuncion(funcion: ts.FunctionLikeDeclaration) {
    const awaits: number[] = [];
    const accesos: ts.Node[] = [];

    // Recorre solo el cuerpo propio: al topar con otra función, se recurre
    // aparte para que su `await` no cuente como si fuera de esta.
    function propio(nodo: ts.Node) {
      if (nodo !== funcion && esFuncion(nodo)) {
        revisarFuncion(nodo);
        return;
      }
      if (ts.isAwaitExpression(nodo)) awaits.push(nodo.getStart());
      if (ts.isPropertyAccessExpression(nodo) && nodo.name.text === "currentTarget") accesos.push(nodo);
      ts.forEachChild(nodo, propio);
    }
    ts.forEachChild(funcion, propio);

    if (awaits.length === 0) return;
    const primerAwait = Math.min(...awaits);
    for (const acceso of accesos) {
      if (acceso.getStart() > primerAwait) {
        const { line } = fuente.getLineAndCharacterOfPosition(acceso.getStart());
        hallazgos.push(`${relative(RAIZ, ruta)}:${line + 1}`);
      }
    }
  }

  function recorrer(nodo: ts.Node) {
    if (esFuncion(nodo)) {
      revisarFuncion(nodo);
      return;
    }
    ts.forEachChild(nodo, recorrer);
  }
  recorrer(fuente);
  return hallazgos;
}

describe("currentTarget después de await", () => {
  it("no se usa en ningún componente", () => {
    const hallazgos = ficheros().flatMap(usosPeligrosos);
    expect(hallazgos).toEqual([]);
  });

  it("la comprobación detecta el patrón cuando existe (control negativo)", () => {
    const carpeta = mkdtempSync(join(tmpdir(), "ct-"));
    const ruta = join(carpeta, "Malo.tsx");
    writeFileSync(
      ruta,
      `export default function C() {
         async function enviar(e: any) {
           await fetch("/x");
           e.currentTarget.reset();
         }
         return <form onSubmit={enviar} />;
       }`
    );
    expect(usosPeligrosos(ruta)).toHaveLength(1);
  });

  it("no se queja del await de una función anidada (control negativo)", () => {
    const carpeta = mkdtempSync(join(tmpdir(), "ct-ok-"));
    const ruta = join(carpeta, "Bueno.tsx");
    writeFileSync(
      ruta,
      `export default function C() {
         function enviar(e: any) {
           const f = e.currentTarget;
           setTimeout(async () => { await fetch("/x"); }, 0);
           return f;
         }
         return <form onSubmit={enviar} />;
       }`
    );
    expect(usosPeligrosos(ruta)).toEqual([]);
  });
});
