/**
 * FASE 1 — ENCONTRAR LAS DIRECCIONES, NAVEGANDO.
 *
 * No se inventan URLs: ya nos costó cuatro juegos de direcciones falsas de un
 * centro de ayuda. Se busca con google_search y se anota lo que devuelve.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const TEMAS = [
  ["precios", "precios planes tarifas cuántos usuarios o profesionales incluye cada plan"],
  ["reserva", "reserva online cita online cómo reserva el cliente y si elige profesional"],
  ["recordatorios", "recordatorios automáticos SMS email WhatsApp aviso de cita"],
  ["cancelar", "cancelar o cambiar la cita el propio cliente, y lista de espera"],
  ["senal", "señal o depósito al reservar, política de ausencias o no-show"],
  ["widget", "insertar widget de reservas en tu propia web, integraciones"],
  ["idioma", "idiomas del producto y del soporte, en qué idioma atienden"],
];

const sleep = (m) => new Promise((r) => setTimeout(r, m));
for (const t of COLA) for (const [tema, q] of TEMAS) {
  const d = `${S}/salida/url-${t.id}-${tema}.json`;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_qu-${t.id}-${tema}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text:
`Busca en el sitio oficial ${t.dom} de ${t.nombre}: ${q}

Devuelve SÓLO las direcciones REALES que hayas encontrado en la búsqueda, del dominio ${t.dom} o de su centro de ayuda oficial. NO inventes direcciones ni las construyas por lógica: si no aparecieron en los resultados, no las pongas.

JSON y nada más:
{"urls":["https://...","https://..."]}
Máximo 4. Si no encuentras ninguna: {"urls":[]}` }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 2000 },
  }), "utf8");
  for (let i = 1; i <= 3; i++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 150000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      const txt = (p.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
      const m = txt.match(/\{[\s\S]*\}/);
      await writeFile(d, JSON.stringify({ id: t.id, tema, urls: m ? (JSON.parse(m[0]).urls ?? []) : [] }), "utf8");
      process.stdout.write(`${t.id}/${tema} ok\n`);
      break;
    } catch (e) {
      if (i === 3) { await writeFile(d, JSON.stringify({ id: t.id, tema, urls: [], fallo: String(e).slice(0,120) }), "utf8"); process.stdout.write(`${t.id}/${tema} FALLO\n`); }
      else await sleep(3000 * i);
    }
  }
  await sleep(900);
}
