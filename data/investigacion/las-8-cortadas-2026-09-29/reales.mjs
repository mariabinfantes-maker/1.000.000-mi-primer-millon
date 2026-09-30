/**
 * ARREGLO — 36 de las 62 direcciones eran redirecciones de Google.
 *
 * La fase 1 pidió a `google_search` las direcciones y devolvió envoltorios
 * `vertexaisearch.cloud.google.com/grounding-api-redirect/...`. Gemini SÍ leyó
 * el contenido a través de ellas, pero como cita no valen: caducan, y la
 * propietaria no puede abrirlas para comprobar nada. Una prueba que no se
 * puede enseñar no es una prueba.
 *
 * Aquí se piden otra vez, prohibiendo expresamente ese dominio.
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;

const AFECTADAS = [
  ["treatwell", "Treatwell", "treatwell.es"],
  ["tutorbird", "TutorBird", "tutorbird.com"],
  ["clinic-cloud", "Clinic Cloud", "clinic-cloud.com"],
  ["koibox", "Koibox", "koibox.cloud"],
];
const TEMAS = [
  ["reserva", "cómo reserva el cliente y si puede elegir profesional"],
  ["precios", "precios, planes y cuántos profesionales incluye cada uno"],
  ["recordatorios", "recordatorios automáticos de cita"],
  ["espera", "lista de espera y cancelar o cambiar la cita"],
  ["widget", "insertar las reservas en tu propia web"],
  ["idioma", "en qué idioma está el programa de gestión"],
];

const sleep = (m) => new Promise((r) => setTimeout(r, m));
for (const [id, nom, dom] of AFECTADAS) for (const [tema, q] of TEMAS) {
  const d = `${S}/salida/real-${id}-${tema}.json`;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_qx-${id}-${tema}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text:
`Busca en el sitio oficial de ${nom} (${dom}): ${q}

PROHIBIDO devolver direcciones de vertexaisearch.cloud.google.com, de grounding-api-redirect, o cualquier redirección. Necesito la dirección REAL y definitiva de la página, la que se ve en la barra del navegador.

Cada dirección tiene que empezar por https:// y estar en ${dom} o en un subdominio suyo (ayuda, soporte, blog, developers). Si sólo tienes una redirección y no sabes a dónde apunta, NO la des: déjala fuera y dilo.

JSON y nada más:
{"urls":["https://${dom}/...","..."],
 "noPudeSacarLaReal":"dilo aquí si sólo tenías redirecciones"}
Máximo 5.` }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 2000 },
  }), "utf8");
  let out = { id, tema, urls: [] };
  for (let n = 1; n <= 3; n++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 150000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      const txt = (p.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) { const r = JSON.parse(m[0]);
        out = { id, tema, urls: (r.urls ?? []).filter((u) => u.startsWith("https://") && !u.includes("vertexaisearch") && u.includes(dom.replace(/^www\./, ""))), noPudeSacarLaReal: r.noPudeSacarLaReal }; }
      break;
    } catch (e) { if (n < 3) await sleep(4000 * n); else out.fallo = String(e).slice(0, 120); }
  }
  await writeFile(d, JSON.stringify(out), "utf8");
  process.stdout.write(`${id}/${tema}:${out.urls.length} `);
  await sleep(900);
}
console.log("\nfin");
