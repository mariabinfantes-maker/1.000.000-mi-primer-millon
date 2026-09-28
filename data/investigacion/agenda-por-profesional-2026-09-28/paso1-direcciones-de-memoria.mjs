/**
 * PASO 1 — ¿DÓNDE HAY QUE MIRAR?
 *
 * La investigación guardada dice que `cap.per_resource_booking_calendar` se
 * preguntó a 64 de 65 y salió «desconocido» en las 64. Pero sus notas dicen
 * dónde se miró: «la página oficial y la de precios». Para una función como
 * ésta —que cada profesional tenga su agenda y que el cliente elija con
 * quién— ése es el sitio equivocado: vive en la documentación o en la página
 * de la función, no en la portada.
 *
 * Así que el cero no era un dato sobre los productos: era un dato sobre dónde
 * miramos. Este paso sólo pide DIRECCIONES. La evidencia no sale de aquí: sale
 * del paso 2, que lee esas páginas y exige cita literal.
 */
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
const S = process.env.SC;
const COLA = JSON.parse(await readFile(S + "/cola.json", "utf8"));

const PROMPT = (t) => `Necesito las DIRECCIONES de las páginas oficiales de ${t.nombre} donde se explique su agenda y sus reservas: la página de la función, su documentación o su centro de ayuda.

Me interesa en concreto si permite que cada profesional del equipo tenga su propia agenda y que el cliente elija con quién reserva.

No me digas si lo tiene o no. Sólo dónde habría que mirarlo.

Devuelve SÓLO este JSON, sin nada alrededor:
{"urls":["https://...","https://..."]}

Como mucho cuatro direcciones, del dominio oficial de ${t.nombre}, y las más específicas que conozcas.`;

const sleep = (m) => new Promise((r) => setTimeout(r, m));
for (const t of COLA) {
  const d = `${S}/salida/urls-${t.id}.json`;
  if (existsSync(d)) continue;
  const cuerpo = {
    contents: [{ parts: [{ text: PROMPT(t) }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 2000 },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || "gemini-3.6-flash"}:generateContent`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) }
  );
  const j = await res.json();
  const txt = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
  await writeFile(d, txt, "utf8");
  console.log(t.id, txt.replace(/\s+/g, " ").slice(0, 150));
  await sleep(400);
}
