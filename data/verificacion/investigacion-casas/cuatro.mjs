import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
const S = "/tmp/claude-0/-home-user-1-000-000-mi-primer-millon/ab1c1d42-b597-536e-a467-9fde178942ad/scratchpad/cuatro";
const R = "/home/user/1.000.000-mi-primer-millon";
const V = JSON.parse(readFileSync(R + "/data/vocabulario/vocabulario.json", "utf8"));
const cap = new Map(V.capacidades.map((c) => [c.id, c]));
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `No escribas NADA fuera del JSON. Empieza por { y termina por }.

Lee SOLO las páginas oficiales de ${t.nombre} que te doy. Prohibido el conocimiento previo.

Para cada capacidad, di si la página DEMUESTRA que ${t.nombre} la tiene.

${t.caps.map((c) => `[${c}] ${cap.get(c).etiqueta} — ${cap.get(c).definicion}${cap.get(c).noEs ? ` (${cap.get(c).noEs})` : ""}`).join("\n")}

Devuelve SÓLO:
{"resultados":[{"id":"<el id entre corchetes>","estado":"si"|"no_consta","cita":"frase literal de la página, máximo 15 palabras, o null","url":"<la página donde lo leíste, o null>"}]}

REGLAS QUE MANDAN:
- "si" SÓLO con cita literal. Sin cita, es "no_consta".
- "no_consta" significa que no lo has encontrado. NO significa que no lo tenga.
- No deduzcas. Un calendario de tareas NO es una agenda por profesional. Cobrar
  con tarjeta por internet NO es un TPV de mostrador. Una ficha de cliente NO
  es un expediente. Respeta lo que dice cada definición.
- Un testimonio de un cliente NO es el fabricante: no vale como cita.
- Responde a TODAS, una por una.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const N = Number(process.env.CONC || 4);
let ok = 0, ko = 0;
for (let i = 0; i < COLA.length; i += N) {
  await Promise.all(COLA.slice(i, i + N).map(async (t) => {
    const d = `${S}/salida/${t.id}.json`;
    if (existsSync(d)) return;
    const urls = [t.url, t.precios].filter(Boolean).slice(0, 2);
    const cuerpo = {
      contents: [{ parts: [{ text: PROMPT(t) + `\n\nDirecciones:\n${urls.map((u) => "- " + u).join("\n")}` }] }],
      tools: [{ url_context: {} }],
      generationConfig: { temperature: 0, maxOutputTokens: 16000 },
    };
    const f = `${S}/salida/_q-${t.id}.json`;
    await writeFile(f, JSON.stringify(cuerpo), "utf8");
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 180000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      await writeFile(d, JSON.stringify({ ...t,
        texto: p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "",
        leidas: (p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? []).map((u) => `${u.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS" ? "OK " : "NO "}${u.retrievedUrl}`),
      }, null, 1), "utf8");
      ok++;
    } catch { ko++; }
  }));
  process.stdout.write(`\r  ${Math.min(i + N, COLA.length)}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
  await sleep(1500);
}
console.log("");
