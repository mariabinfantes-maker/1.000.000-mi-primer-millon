import { readFileSync } from "node:fs";

/**
 * ¿DE QUÉ OFICIOS PODEMOS HACERNOS CARGO?
 *
 * La pregunta de la propietaria, 2026-09-24: «nosotros tenemos que tener claro
 * a quién servimos». No es la misma que «a cuántos les cubrimos algo».
 *
 * Un oficio está SERVIDO cuando cubrimos todo su núcleo —lo que si falla le
 * deja con el problema por el que vino—. Si falta una sola del núcleo, no
 * podemos responder de él, por muchas de las otras que cubramos.
 */
const R = "/home/user/1.000.000-mi-primer-millon";
const G = JSON.parse(readFileSync(R + "/data/investigacion/gremios/gremios.json", "utf8"));
const NUC = JSON.parse(readFileSync(R + "/data/investigacion/gremios/nucleo.json", "utf8"));
const N = JSON.parse(readFileSync(R + "/data/vocabulario/necesidades.json", "utf8"));
const regs = JSON.parse(readFileSync(R + "/data/verificacion/registros.json", "utf8"));

const necesidad = new Map(N.necesidades.map((n) => [n.id, n]));
const demuestra = new Map();
const preguntada = new Map();
for (const r of regs) {
  preguntada.set(r.capacidadId, (preguntada.get(r.capacidadId) ?? 0) + 1);
  if (r.estado !== "verificado" || r.profundidad === "no_disponible") continue;
  if (!demuestra.has(r.capacidadId)) demuestra.set(r.capacidadId, new Set());
  demuestra.get(r.capacidadId).add(r.herramientaId);
}
const quienLaCubre = (n) => {
  if (!n.imprescindibles.length) return [];
  const s = n.imprescindibles.map((c) => demuestra.get(c) ?? new Set());
  return [...s[0]].filter((h) => s.every((x) => x.has(h)));
};

const filas = G.gremios.map((g) => {
  const nuc = NUC.oficios[g.id];
  const detalle = nuc.nucleo.map((id) => {
    const n = necesidad.get(id);
    const quienes = quienLaCubre(n);
    const aCuantas = Math.max(...n.imprescindibles.map((c) => preguntada.get(c) ?? 0), 0);
    return { titulo: n.titulo, cuantas: quienes.length, seLePreguntoA: aCuantas };
  });
  const faltan = detalle.filter((d) => d.cuantas === 0);
  return { id: g.id, nombre: g.nombre, porQue: nuc.porQue, detalle, faltan, servido: faltan.length === 0 };
});

const servidos = filas.filter((f) => f.servido);
console.log(`PODEMOS HACERNOS CARGO DE ${servidos.length} DE ${filas.length} OFICIOS\n`);
for (const f of servidos) console.log("  SÍ   " + f.nombre + "\n       " + f.porQue);
console.log("\n── A éstos todavía no podemos responderles ──────────────");
for (const f of filas.filter((x) => !x.servido)) {
  console.log("\n  " + f.nombre + "  (le falta " + f.faltan.length + " de " + f.detalle.length + " del núcleo)");
  for (const d of f.faltan) {
    const deuda = d.seLePreguntoA < 33;
    console.log(`     ${deuda ? "sin preguntar " : "SIN CATÁLOGO  "}${d.titulo}  (preguntada a ${d.seLePreguntoA}/65)`);
  }
}
