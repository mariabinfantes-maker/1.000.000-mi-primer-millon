/**
 * PASO 4 — UNA PÁGINA CADA VEZ, Y DECIR CUÁL NO SE PUDO ABRIR
 *
 * Los pasos anteriores pedían varias páginas en una sola llamada y muchas no
 * se abrían; el resultado era «no_consta» en bloque sin saber si habíamos
 * mirado. Aquí cada página va en su propia llamada, con reintentos, y se
 * guarda si se abrió o no.
 *
 * La distinción es la de siempre y es la que importa:
 *   - leída y no aparece  → «no lo hemos encontrado»
 *   - no se pudo abrir    → no hemos mirado; no dice nada del producto
 * Ninguna de las dos es «no lo tiene».
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola2.json", "utf8"));

const PROMPT = (t, u) => `Lee SOLO esta página oficial de ${t.nombre}: ${u}
Prohibido el conocimiento previo. Si no puedes abrirla, dilo con "abierta":false.

¿Esta página DEMUESTRA que ${t.nombre} permite (a) que cada profesional del equipo tenga su propia agenda con sus horarios y servicios, y (b) que quien reserva pueda elegir con qué profesional?

Responde SÓLO con este JSON:
{"abierta":true|false,
 "agendaPorProfesional":{"estado":"si"|"no_consta","cita":"frase literal, máx 20 palabras, o null"},
 "eligeElCliente":{"estado":"si"|"no_consta","cita":"..."},
 "enEspanol":{"estado":"si"|"no_consta","cita":"..."}}

REGLAS: "si" sólo con cita literal de esta página. Sin cita, "no_consta".
"no_consta" = no lo he encontrado aquí; NO significa que no lo tenga.
No deduzcas: el calendario personal de un usuario no es agenda por profesional;
repartir reuniones por turnos (round robin) no es que el cliente elija.
Un testimonio de cliente no vale como cita.
"enEspanol" es si el producto está en español, no sólo esta página.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const tareas = COLA.flatMap((t) => t.urls.map((u, i) => ({ t, u, i })));
let hechas = 0;
for (const { t, u, i } of tareas) {
  const d = `${S}/salida/p9-${t.id}-${i}.json`;
  hechas++;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_q9-${t.id}-${i}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text: PROMPT(t, u) }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 4000 },
  }), "utf8");
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 150000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      const meta = p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
      await writeFile(d, JSON.stringify({ id: t.id, nombre: t.nombre, url: u,
        recuperada: meta.some((m) => m.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS"),
        texto: p.candidates?.[0]?.content?.parts?.map((x) => x.text).join("") ?? "",
      }, null, 1), "utf8");
      break;
    } catch { await sleep(2000 * intento); }
  }
  process.stdout.write(`\r  ${hechas}/${tareas.length}   `);
  await sleep(500);
}
console.log("");
