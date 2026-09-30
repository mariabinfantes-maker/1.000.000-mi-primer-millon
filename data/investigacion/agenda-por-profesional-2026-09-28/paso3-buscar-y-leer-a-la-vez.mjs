/**
 * PASO 3 — QUE BUSQUE LAS PÁGINAS, NO QUE SE LAS INVENTE
 *
 * El paso 2 dio «no_consta» casi en todas, pero la causa no era el producto:
 * de las direcciones que el paso 1 dio de memoria, casi ninguna se abrió.
 * «No pudimos abrir la página» no es «no lo hemos encontrado», y desde luego
 * no es «no lo tiene». Aquí se busca primero y se lee después, y cada «sí»
 * sigue exigiendo cita literal.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `Busca en internet las páginas oficiales de ${t.nombre} (su web, su documentación o su centro de ayuda) que expliquen su agenda y sus reservas, ábrelas y léelas.

Pregunta: ¿esas páginas DEMUESTRAN que ${t.nombre} permite que cada profesional del equipo tenga su propia agenda —con sus horarios y sus servicios— y que quien reserva pueda elegir con qué profesional?

Termina tu respuesta con este JSON y nada detrás:
{"agendaPorProfesional":{"estado":"si"|"no_consta","cita":"frase literal de la página, máximo 20 palabras, o null","url":"<la página donde lo leíste, o null>"},
 "eligeElCliente":{"estado":"si"|"no_consta","cita":"...","url":"..."},
 "enEspanol":{"estado":"si"|"no_consta","cita":"...","url":"..."}}

REGLAS QUE MANDAN:
- "si" SÓLO con cita literal de una página oficial del fabricante que hayas abierto.
  Sin cita, es "no_consta".
- "no_consta" significa que no lo has encontrado. NO significa que no lo tenga.
- No deduzcas. El calendario personal de un usuario NO es una agenda por
  profesional. Repartir reuniones por turnos entre comerciales (round robin)
  NO es que el cliente elija profesional. Reservar una sala entre compañeros
  tampoco es esto.
- Un testimonio de un cliente NO es el fabricante: no vale como cita.
- "enEspanol" es si el producto en sí (no sólo su web comercial) está en español.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const N = Number(process.env.CONC || 3);
let ok = 0, ko = 0;
for (let i = 0; i < COLA.length; i += N) {
  await Promise.all(COLA.slice(i, i + N).map(async (t) => {
    const d = `${S}/salida/busca-${t.id}.json`;
    if (existsSync(d)) return;
    const cuerpo = {
      contents: [{ parts: [{ text: PROMPT(t) }] }],
      tools: [{ google_search: {} }, { url_context: {} }],
      generationConfig: { temperature: 0, maxOutputTokens: 20000 },
    };
    const f = `${S}/salida/_q3-${t.id}.json`;
    await writeFile(f, JSON.stringify(cuerpo), "utf8");
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 300000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code + " " + p.error.message);
      await writeFile(d, JSON.stringify({ ...t,
        texto: p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "",
        leidas: (p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? []).map((u) => `${u.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS" ? "OK " : "NO "}${u.retrievedUrl}`),
      }, null, 1), "utf8");
      ok++;
    } catch (e) { ko++; console.error("\n" + t.id + ": " + String(e.message).slice(0, 160)); }
  }));
  process.stdout.write(`\r  ${Math.min(i + N, COLA.length)}/${COLA.length} · ok ${ok} · fallos ${ko}   `);
  await sleep(1500);
}
console.log("");
