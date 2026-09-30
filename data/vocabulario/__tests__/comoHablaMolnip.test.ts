import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getDimensiones } from "../asesor";

/**
 * CÓMO HABLA MOLNIP — regla de la propietaria, 2026-09-25.
 *
 *   «Ser cercano sí, pero respetuoso y considerado. Ese lenguaje callejero no
 *    me gusta, estamos en un entorno de negocios (...) todo el lenguaje que me
 *    has presentado no es universal, está pensado sólo para impulsar la
 *    mediocridad en los negocios. Has confundido cercanía y educación con un
 *    lenguaje para muy pocas personas, porque si alguien que no es de España
 *    no va a sentirse cómodo.»
 *
 * No es una preferencia de estilo. `lib/pais.ts` dice a quién servimos:
 * España, México, Argentina, Colombia, Chile y Perú. En cinco de esos seis
 * países nadie dice «atendéis» ni «vuestro», y «coger» es vulgar. Un texto
 * así no es cercano: es excluyente.
 *
 * Esta prueba existe porque ese registro no lo detecta nadie leyendo desde
 * Madrid. Se escribe solo, frase a frase, y cuando se nota ya está en
 * cincuenta sitios. Fue el caso: cinco preguntas en vosotros y «se coge
 * rápido» en la tarjeta, en un producto que dice servir a seis países.
 */

/** Formas de vosotros: sólo existen en España. */
const VOSOTROS = /\b\w+(?:áis|éis)\b|\bvosotros\b|\bvuestr[oa]s?\b/i;

/**
 * Palabras que en España son normales y fuera no, o son vulgares.
 * `coger` lo es en buena parte de América; el resto rebaja a quien pregunta.
 */
const DE_AQUI_SOLO = /\b(?:coge[rs]?|apañ\w+|liarl\w+|curr\w+|chav\w+|vale\?|majo)\b/i;

/** Lo que Molnip le dice a quien pregunta. Sus necesidades no: ésas son la voz de ella. */
function frasesDeMolnip(): { donde: string; texto: string }[] {
  const frases: { donde: string; texto: string }[] = [];
  for (const d of getDimensiones()) {
    frases.push({ donde: `${d.id}: pregunta`, texto: d.pregunta });
    frases.push({ donde: `${d.id}: porQuePreguntamos`, texto: d.porQuePreguntamos });
    for (const r of d.respuestas) frases.push({ donde: `${d.id}/${r.id}`, texto: r.texto });
  }
  return frases;
}

describe("cómo habla Molnip", () => {
  it("ninguna frase usa formas que sólo se dicen en España", () => {
    const malas = frasesDeMolnip().filter((f) => VOSOTROS.test(f.texto));
    expect(malas.map((f) => `${f.donde}: «${f.texto}»`)).toEqual([]);
  });

  it("ninguna frase usa palabras vulgares fuera de España ni coloquialismos que rebajan", () => {
    const malas = frasesDeMolnip().filter((f) => DE_AQUI_SOLO.test(f.texto));
    expect(malas.map((f) => `${f.donde}: «${f.texto}»`)).toEqual([]);
  });

  /**
   * «No estoy segura» daba por hecho que quien pregunta es mujer. La mayoría
   * de la web habla de «la clienta» a propósito, pero eso es cómo hablamos
   * NOSOTROS de ella; ponerle el género en la boca a quien contesta es otra
   * cosa.
   */
  it("ninguna respuesta le pone género a quien contesta", () => {
    // «solo» queda fuera: en «Solo yo» es adverbio y no le pone género a nadie.
    const genero = /\b(?:segur[ao]|cansad[ao]|list[ao]|tranquil[ao]|preparad[ao])\b/i;
    const malas = getDimensiones()
      .flatMap((d) => d.respuestas.map((r) => ({ donde: `${d.id}/${r.id}`, texto: r.texto })))
      .filter((f) => genero.test(f.texto));
    expect(malas.map((f) => `${f.donde}: «${f.texto}»`)).toEqual([]);
  });

  /** Y lo mismo en la pantalla del asesor, que es texto suelto y se escapa. */
  it("las pantallas del asesor tampoco", () => {
    const dir = path.join(process.cwd(), "app", "asesor");
    const malas: string[] = [];
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".tsx"))) {
      const codigo = fs
        .readFileSync(path.join(dir, f), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .split("\n")
        .map((l) => l.replace(/\/\/.*$/, ""))
        .join("\n");
      for (const t of codigo.match(/"[^"]{6,}"|>[^<>{}]{6,}</g) ?? []) {
        if (VOSOTROS.test(t) || DE_AQUI_SOLO.test(t)) malas.push(`${f}: ${t.trim()}`);
      }
    }
    expect(malas).toEqual([]);
  });
});
