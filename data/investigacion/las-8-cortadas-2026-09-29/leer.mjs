/**
 * FASE 2 — UNA PÁGINA CADA VEZ.
 *
 * Cada página en su propia llamada. Se guarda si se abrió o no, porque
 * «no se pudo abrir» y «leída y no lo dice» son cosas distintas y ninguna
 * de las dos es «no lo tiene».
 */
import { execFile } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const URLS = JSON.parse(await readFile(S + "/urls.json", "utf8"));
const NOM = { "clinic-cloud":"Clinic Cloud", dricloud:"DriCloud", koibox:"Koibox", flowww:"flowww",
              tutorbird:"TutorBird", qvet:"QVET", "gesden-g5":"Gesden G5", treatwell:"Treatwell" };

const P = (n, u) => `Lee SOLO esta página oficial de ${n}: ${u}
Prohibido el conocimiento previo. Si no puedes abrirla, "abierta":false y nada más.

Para cada punto: "si" SÓLO con cita literal DE ESTA PÁGINA. Sin cita, "no_consta".
"no_consta" = no lo he encontrado aquí. NO significa que no lo tenga.
"no" SÓLO si la página dice expresamente que NO lo hace.

JSON y nada más:
{"abierta":true|false,
 "titulo":"título exacto de la página",
 "fraseDeAlLado":"una frase cualquiera de la página, sin relación con lo que busco",
 "agenda_por_profesional":{"e":"si|no_consta|no","c":"cita o null"},
 "elige_el_cliente":{"e":"...","c":"..."},
 "reserva_online":{"e":"...","c":"..."},
 "recordatorios":{"e":"...","c":"...","canal":"sms|email|whatsapp|varios|null","sePagaAparte":true|false|null},
 "cancelar_y_cambiar":{"e":"...","c":"...","soloCancelar":true|false|null},
 "aforo_y_franjas":{"e":"...","c":"..."},
 "senal_y_ausencias":{"e":"...","c":"..."},
 "lista_de_espera":{"e":"...","c":"..."},
 "widget_en_tu_web":{"e":"...","c":"..."},
 "precio":{"e":"...","c":"cita con cifra","moneda":"EUR|USD|null","plan":"nombre del plan o null"},
 "tamano":{"e":"...","c":"cuántos profesionales o usuarios incluye cada plan"},
 "idioma_gestion":{"e":"...","c":"..."},
 "limites":["topes, licencias por sede, cargos por persona extra, lo que sea"]}

OJO: el calendario personal de un usuario NO es agenda por profesional.
Que el negocio asigne profesional NO es que el cliente elija.
Lista de espera exige que AVISEN al liberarse; apuntar en papel no cuenta.
Widget exige insertar en la propia web; un botón que lleva a otra página no.
Un testimonio de cliente no vale como cita.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const tareas = Object.entries(URLS).flatMap(([id, us]) => us.map((u, i) => ({ id, u, i })));
console.log(tareas.length + " páginas");
for (const { id, u, i } of tareas) {
  const d = `${S}/salida/pag-${id}-${i}.json`;
  if (existsSync(d)) continue;
  const f = `${S}/salida/_qp-${id}-${i}.json`;
  await writeFile(f, JSON.stringify({
    contents: [{ parts: [{ text: P(NOM[id], u) }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 4000 },
  }), "utf8");
  let ok = false;
  for (let n = 1; n <= 3; n++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 180000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      const meta = p.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
      const txt = (p.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
      const m = txt.match(/\{[\s\S]*\}/);
      await writeFile(d, JSON.stringify({ id, url: u, recuperada: meta.map((x) => x.urlRetrievalStatus).join(","),
        r: m ? JSON.parse(m[0]) : null, bruto: m ? undefined : txt.slice(0, 600) }), "utf8");
      ok = true; break;
    } catch (e) { if (n < 3) await sleep(4000 * n); else await writeFile(d, JSON.stringify({ id, url: u, fallo: String(e).slice(0, 150) }), "utf8"); }
  }
  process.stdout.write((ok ? "." : "x"));
  await sleep(700);
}
console.log("\nfin");
