/**
 * SEGUNDO FRENTE — LAS QUE VOLVIERON CASI VACÍAS.
 *
 * Gesden G5 dio 0 direcciones en dos barridos independientes, QVET 3 y
 * DriCloud 4. No se concluye nada de eso: se ataca con otras consultas, más
 * concretas y en las palabras que usan ellos (multigabinete, cita online,
 * software veterinario), y se busca también en sus PDF y sus notas de prensa.
 *
 * Y tres que no ha mirado nadie nunca: ReservaSimple, Mivete, TuReservaOnline.
 * De ésas ni siquiera consta que existan como producto; lo primero es eso.
 */
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;

const FLOJAS = [
  ["gesden-g5", "Gesden G5", "infomedsoftware.com", [
    "Gesden G5 agenda multigabinete multiusuario horarios por doctor",
    "Gesden cita online paciente reserva por internet clinica dental",
    "Gesden G5 precio licencia cuota mensual clinica dental Infomed",
    "Infomed Software Gesden manual PDF funcionalidades agenda recordatorios SMS",
  ]],
  ["qvet", "QVET", "qvet.net", [
    "QVET software veterinario agenda cita online propietario reserva",
    "QVET precio tarifa licencia modulos clinica veterinaria",
    "QVET recordatorios SMS email vacunas citas propietarios",
    "QVET manual ayuda documentacion agenda veterinarios horarios",
  ]],
  ["dricloud", "DriCloud", "dricloud.com", [
    "DriCloud cita online paciente elegir medico especialista agenda",
    "DriCloud recordatorios SMS email pacientes citas",
    "DriCloud precios planes ESENCIAL AVANZADO profesionales incluidos",
    "DriCloud widget reservas web propia integracion lista de espera",
  ]],
  ["treatwell", "Treatwell", "treatwell.es", [
    "Treatwell Connect software salon agenda por profesional empleados",
    "Treatwell partners precios comision tarifa salon",
    "Treatwell Connect recordatorios cliente cita SMS",
    "Treatwell widget reservas en tu propia web salon",
  ]],
];

const NUEVAS = [
  ["reservasimple", "ReservaSimple", "¿existe un producto español de reservas llamado ReservaSimple? Dame su web oficial si existe"],
  ["mivete", "Mivete", "¿existe un producto llamado Mivete de gestión de citas o reservas? Dame su web oficial si existe"],
  ["tureservaonline", "TuReservaOnline", "¿existe un producto español llamado TuReservaOnline de reservas de citas? Dame su web oficial si existe"],
];

const sleep = (m) => new Promise((r) => setTimeout(r, m));
const llama = async (nombre, cuerpo) => {
  const f = `${S}/salida/_qr-${nombre}.json`;
  await writeFile(f, JSON.stringify(cuerpo), "utf8");
  for (let n = 1; n <= 3; n++) {
    try {
      const so = await new Promise((res, rej) => execFile("curl", ["-sS", "-X", "POST",
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
        "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${f}`],
        { maxBuffer: 20e6, timeout: 180000 }, (e, s, r) => (e ? rej(new Error(e.message + r)) : res(s))));
      const p = JSON.parse(so);
      if (p.error) throw new Error("API " + p.error.code);
      return (p.candidates?.[0]?.content?.parts ?? []).map((x) => x.text ?? "").join("");
    } catch (e) { if (n === 3) return null; await sleep(4000 * n); }
  }
};

for (const [id, nom, dom, consultas] of FLOJAS) for (const [j, q] of consultas.entries()) {
  const d = `${S}/salida/ref-${id}-${j}.json`;
  if (existsSync(d)) continue;
  const txt = await llama(`${id}-${j}`, {
    contents: [{ parts: [{ text:
`Busca: ${q}

Sólo direcciones REALES que hayan aparecido en la búsqueda, del dominio ${dom} o de su ayuda, soporte, blog o PDF oficiales. NO inventes ni construyas direcciones.
Si el resultado es un PDF oficial del fabricante, dámelo igual y márcalo.

JSON y nada más:
{"urls":[{"u":"https://...","esPdf":true|false,"queParecePoner":"de qué va, en una línea"}],
 "loQueViste":"qué dicen los resultados sobre ${nom} y esta pregunta, sin inventar",
 "siNoHayNada":"si la búsqueda no devuelve nada útil, dilo aquí con esas palabras"}` }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 3000 },
  });
  const m = txt?.match(/\{[\s\S]*\}/);
  await writeFile(d, JSON.stringify({ id, consulta: q, ...(m ? JSON.parse(m[0]) : { fallo: true, bruto: (txt ?? "").slice(0, 400) }) }), "utf8");
  process.stdout.write(`${id}[${j}] `);
  await sleep(900);
}

for (const [id, nom, q] of NUEVAS) {
  const d = `${S}/salida/nueva-${id}.json`;
  if (existsSync(d)) continue;
  const txt = await llama(`n-${id}`, {
    contents: [{ parts: [{ text:
`${q}

Es una candidata de la que no sabemos NADA: ni si existe. Lo primero es eso.
No inventes: si no aparece un producto con ese nombre, dilo.

JSON y nada más:
{"existe":true|false|"no_estoy_seguro",
 "web":"https://... o null",
 "queEs":"una línea, o null",
 "deDonde":"España u otro sitio, o null",
 "porQueLoDigo":"qué resultados viste",
 "cuidado":"si el nombre choca con otra cosa distinta, dilo"}` }] }],
    tools: [{ google_search: {} }],
    generationConfig: { temperature: 0, maxOutputTokens: 2000 },
  });
  const m = txt?.match(/\{[\s\S]*\}/);
  await writeFile(d, JSON.stringify({ id, nombre: nom, ...(m ? JSON.parse(m[0]) : { fallo: true }) }), "utf8");
  process.stdout.write(`${id} `);
  await sleep(900);
}
console.log("\nfin del refuerzo");
