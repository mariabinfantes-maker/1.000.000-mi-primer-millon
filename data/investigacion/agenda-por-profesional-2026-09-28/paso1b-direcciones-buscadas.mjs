/**
 * PASO 1b — DIRECCIONES BUSCADAS, NO RECORDADAS
 *
 * El paso 1 pedía las direcciones de memoria y casi ninguna se abría después.
 * Aquí se buscan. Sigue sin pedir evidencia: sólo dónde mirar. La evidencia
 * la da el paso 2, que lee esas páginas y exige cita literal.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `Busca ARTÍCULOS CONCRETOS del centro de ayuda o la documentación oficial de ${t.nombre} (no la portada, no el índice: artículos con su propia dirección) sobre dar de alta al personal, los horarios de cada profesional, y la página de reservas donde el cliente elige con quién. En español si existen.

Me interesa dónde se explicaría si cada profesional del equipo tiene su propia agenda y si quien reserva puede elegir con quién.

No me digas si lo tiene. Sólo dónde habría que mirarlo.

Termina con este JSON y nada detrás: {"urls":["https://...","https://..."]}
Como mucho SEIS, del dominio oficial de ${t.nombre}.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
let ok = 0, ko = 0;
for (const t of COLA) {
  const d = `${S}/salida/urlsc-${t.id}.json`;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_q1b-${t.id}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text: PROMPT(t) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 3000 },
  }), "utf8");
  try {
    const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
      { maxBuffer: 20e6, timeout: 180000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
    const p = JSON.parse(so);
    if (p.error) throw new Error("API " + p.error.code);
    await writeFile(d, p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "", "utf8");
    ok++; console.log(t.id, "ok");
  } catch (e) { ko++; console.log(t.id, "FALLO", String(e.message).slice(0, 80)); }
  await sleep(800);
}
console.log(`ok ${ok} · fallos ${ko}`);
