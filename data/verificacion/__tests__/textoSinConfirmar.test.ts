import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { afirmaAusencia } from "../evidencia";

/**
 * Lo que la persona lee cuando no hemos podido confirmar lo que pedía.
 *
 * Vive aquí, y no en `components/__tests__/`, porque usa `afirmaAusencia()`:
 * un archivo de pruebas fuera de este directorio que importara la verificación
 * ampliaría la lista de lectores autorizados, y esa lista corta es justo lo
 * que hace comprobable todo lo demás. La regla que se comprueba nació en F2,
 * así que su prueba se queda con ella.
 *
 * El entorno de pruebas es `node`, sin DOM: se lee el texto del componente en
 * el propio archivo, igual que hacen las otras pruebas de componentes.
 */
const raiz = process.cwd();
const leer = (...partes: string[]) => fs.readFileSync(path.join(raiz, ...partes), "utf8");

const AVISO = leer("components", "AvisoSinVerificar.tsx");
const PANTALLA = leer("components", "PantallaRecomendacion.tsx");
const PAGINA = leer("app", "resultado", "[token]", "page.tsx");

/** El texto visible, sin etiquetas, atributos ni comentarios. */
function textoVisible(fuente: string): string {
  return fuente
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .split("\n")
    .map((l) => l.replace(/\/\/.*$/, ""))
    .join("\n")
    .replace(/className="[^"]*"/g, " ")
    .replace(/<[^>]+>/g, " ");
}

describe("el aviso de «no lo he podido confirmar»", () => {
  it("dice exactamente lo que aprobó la propietaria", () => {
    expect(AVISO).toContain(
      "Con la información comprobada que tenemos, no he podido confirmar que estas herramientas"
    );
    expect(AVISO).toContain("hagan lo que necesitas");
  });

  it("nombra la necesidad que no se pudo confirmar", () => {
    expect(AVISO).toContain("Buscabas <strong");
    expect(AVISO).toContain("{necesidad}");
  });

  it("deja claro que podrían hacerlo igualmente", () => {
    expect(AVISO).toContain("Eso no significa que no lo hagan");
  });

  /**
   * La regla de F2, aplicada al texto: no hay ni un registro que demuestre una
   * ausencia, así que ninguna frase puede afirmarla.
   */
  it("ninguna frase afirma que las herramientas no lo tengan", () => {
    for (const [nombre, fuente] of [
      ["AvisoSinVerificar.tsx", AVISO],
      ["PantallaRecomendacion.tsx", PANTALLA],
      ["resultado/[token]/page.tsx", PAGINA],
    ] as const) {
      const frases = textoVisible(fuente)
        .split(/[.\n]/)
        .map((f) => f.trim())
        .filter(Boolean);
      expect(frases.filter(afirmaAusencia), nombre).toEqual([]);
    }
  });

  /**
   * Podría tratarse de una herramienta que todavía no se ha comprobado. Decir
   * que se revisaron sus páginas sería inventarse el trabajo hecho — la
   * propietaria lo corrigió sobre el borrador del 2026-09-10.
   */
  it("no afirma que se hayan revisado las páginas oficiales", () => {
    for (const frase of ["He revisado las páginas", "he revisado las páginas", "todas las páginas"]) {
      expect(AVISO, frase).not.toContain(frase);
    }
  });

  it("no usa lenguaje técnico", () => {
    const visible = textoVisible(AVISO);
    for (const jerga of ["cap.", "verificado", "evidencia", "registro", "capacidad"]) {
      expect(visible.toLowerCase(), jerga).not.toContain(jerga.toLowerCase());
    }
  });

  it("la culpa no es de quien pregunta", () => {
    expect(AVISO).toContain("no he podido");
    for (const culpa of ["no has", "no lo has", "deberías haber"]) {
      expect(textoVisible(AVISO).toLowerCase(), culpa).not.toContain(culpa);
    }
  });
});

describe("cómo se presentan las alternativas", () => {
  it("el bloque va titulado como no comprobado para esa necesidad", () => {
    expect(PANTALLA).toContain("sin esa necesidad comprobada");
  });

  it("se pide comprobarlo antes de contratar", () => {
    expect(PANTALLA).toContain("Antes de contratar ninguna, comprueba tú mismo en su");
  });

  it("la franja de confianza se oculta sólo en ese estado", () => {
    expect(PANTALLA).toContain("{!sinConfirmar && (");
    expect(PANTALLA).toContain("PUNTOS_DE_CONFIANZA.map");
  });

  it("el título del enlace compartido no lo llama recomendación", () => {
    expect(PAGINA).toContain('"Alternativas sin confirmar"');
    expect(PAGINA).toContain("no ha podido confirmar");
  });
});
