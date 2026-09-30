/**
 * LAS CINCO TARIFAS QUE EL CATÁLOGO NO PODÍA DEMOSTRAR.
 *
 * `npm run examen-catalogo` dejó a cinco fichas sin pasar el examen de entrada
 * por lo mismo: tienen precio escrito, pero sin la página que se abrió ni el
 * día que se abrió. Un precio sin fuente envejece sin que nos enteremos.
 *
 * Esto abre su tarifa —la dirección ya estaba guardada en cada ficha— y anota
 * lo que dice, con cita literal. Misma disciplina de siempre: sin cita no se
 * escribe el precio, y si la página no se abre se dice, nunca se rellena.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `Abre SOLO esta página de tarifas de ${t.nombre}: ${t.url}
Prohibido el conocimiento previo. Si no puedes abrirla, dilo con "abierta": false.

Copia lo que dice la página sobre sus precios. Quiero el plan más barato de pago y los demás que publique.

Responde SÓLO con este JSON:
{"abierta": true|false,
 "moneda": "EUR" | "USD" | "otra" | null,
 "precioInicial": "la frase tal como la leería un cliente, o null",
 "planes": [{"nombre":"como lo llama el fabricante","mensual":"...","anual":"...","cita":"frase literal de la página"}]}

REGLAS:
- Sin cita literal no se escribe el precio.
- Mensual y anual por separado SIEMPRE que la página publique los dos. Nunca calcules uno a partir del otro.
- Si un plan es gratuito, ponlo igual, con su cita.
- Si la página sirve precios en varias monedas, dime la que ves y no conviertas nada.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
for (const t of COLA) {
  const d = `${S}/salida/${t.id}.json`;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_q-${t.id}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text: PROMPT(t) }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 8000 },
  }), "utf8");
  let hecho = false;
  for (let i = 1; i <= 4 && !hecho; i++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 180000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      const meta = p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
      await writeFile(d, JSON.stringify({ ...t,
        recuperada: meta.some((m) => m.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS"),
        texto: p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "",
      }, null, 1), "utf8");
      hecho = true;
    } catch { await sleep(2000 * i); }
  }
  console.log(t.id, hecho ? "leída" : "FALLO");
  await sleep(600);
}
