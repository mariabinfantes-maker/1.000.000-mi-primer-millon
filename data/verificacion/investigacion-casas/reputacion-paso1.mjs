/**
 * REPUTACIÓN, PASO 1 — LAS DIRECCIONES REALES DE G2 Y CAPTERRA.
 *
 * El catálogo guardaba la nota y el número de reseñas de 60 de las 65 fichas,
 * pero no dónde se leyeron: el esquema no tenía dónde anotarlo. Eso hizo que
 * durante meses se confundiera «no está anotada la fuente» con «nadie lo
 * investigó». Son cosas distintas y ésta arregla la primera.
 *
 * Aquí sólo se buscan las direcciones. La cifra la lee el paso 2, que abre la
 * página y exige cita literal.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `Busca la página de reseñas de ${t.nombre} (${t.web}) en G2 y en Capterra.

Quiero la dirección de su ficha de producto, la que muestra la nota media y el número de reseñas.

Si en alguna de las dos no tiene ficha, dilo con null. No te inventes una dirección.

Termina con este JSON y nada detrás:
{"g2":"https://www.g2.com/products/.../reviews o null","capterra":"https://www.capterra.com/p/.../ o null"}`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
let ok = 0, ko = 0;
for (const t of COLA) {
  const d = `${S}/salida/url-${t.id}.json`;
  if (existsSync(d)) { ok++; continue; }
  const f = `${S}/salida/_q1-${t.id}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text: PROMPT(t) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 2500 },
  }), "utf8");
  let hecho = false;
  for (let i = 1; i <= 3 && !hecho; i++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 150000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      await writeFile(d, p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "", "utf8");
      ok++; hecho = true;
    } catch { await sleep(2000 * i); }
  }
  if (!hecho) ko++;
  process.stdout.write(`\r  ${ok + ko}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
  await sleep(400);
}
console.log("");
