/**
 * PASO 2 — MIRAR DONDE SÍ VIVE LA FUNCIÓN
 *
 * Misma disciplina que `cuatro.mjs` —prohibido el conocimiento previo, «sí»
 * sólo con cita literal, «no_consta» significa que no lo hemos encontrado y
 * nunca que no lo tenga— pero leyendo la documentación y la página de la
 * función, que es donde se explica una agenda, en vez de la portada y la de
 * precios, que es donde se miró en septiembre.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola2.json", "utf8"));

const PROMPT = (t) => `No escribas NADA fuera del JSON. Empieza por { y termina por }.

Lee SOLO las páginas oficiales de ${t.nombre} que te doy. Prohibido el conocimiento previo.

Pregunta: ¿estas páginas DEMUESTRAN que ${t.nombre} permite tener una agenda separada por cada profesional del equipo —con sus horarios y sus servicios— y que quien reserva pueda elegir con qué profesional?

Devuelve SÓLO:
{"agendaPorProfesional":{"estado":"si"|"no_consta","cita":"frase literal de la página, máximo 20 palabras, o null","url":"<la página donde lo leíste, o null>"},
 "eligeElCliente":{"estado":"si"|"no_consta","cita":"...","url":"..."}}

REGLAS QUE MANDAN:
- "si" SÓLO con cita literal de la página. Sin cita, es "no_consta".
- "no_consta" significa que no lo has encontrado. NO significa que no lo tenga.
- No deduzcas. El calendario personal de un usuario NO es una agenda por
  profesional. Repartir reuniones por turnos entre comerciales (round robin)
  NO es que el cliente elija profesional. Reservar una sala entre compañeros
  tampoco es esto.
- Un testimonio de un cliente NO es el fabricante: no vale como cita.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const N = Number(process.env.CONC || 3);
let ok = 0, ko = 0;
for (let i = 0; i < COLA.length; i += N) {
  await Promise.all(COLA.slice(i, i + N).map(async (t) => {
    const d = `${S}/salida/cap-${t.id}.json`;
    if (existsSync(d)) return;
    const cuerpo = {
      contents: [{ parts: [{ text: PROMPT(t) + `\n\nDirecciones:\n${t.urls.map((u) => "- " + u).join("\n")}` }] }],
      tools: [{ url_context: {} }],
      generationConfig: { temperature: 0, maxOutputTokens: 16000 },
    };
    const f = `${S}/salida/_q2-${t.id}.json`;
    await writeFile(f, JSON.stringify(cuerpo), "utf8");
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 240000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      await writeFile(d, JSON.stringify({ ...t,
        texto: p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "",
        leidas: (p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? []).map((u) => `${u.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS" ? "OK " : "NO "}${u.retrievedUrl}`),
      }, null, 1), "utf8");
      ok++;
    } catch (e) { ko++; }
  }));
  process.stdout.write(`\r  ${Math.min(i + N, COLA.length)}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
  await sleep(1500);
}
console.log("");
