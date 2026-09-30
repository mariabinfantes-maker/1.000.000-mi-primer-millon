import { readFileSync, readdirSync, writeFileSync } from "node:fs";

/**
 * A cuántos gremios podemos servir HOY, y qué separa a los que no.
 *
 * Lo pidió la propietaria el 2026-09-24, después de comprobar que no existe
 * ninguna lista de a quién hemos decidido servir. Esto no decide nada: pone
 * delante el dato para decidir.
 *
 * La distinción que manda es la del propio proyecto: una necesidad que NADIE
 * cubre no es lo mismo si se preguntó y no consta que si nunca se preguntó.
 * Lo primero es un hueco de catálogo —hay que salir a buscar herramienta—; lo
 * segundo es deuda nuestra y se arregla preguntando.
 */
const R = "/home/user/1.000.000-mi-primer-millon";
const G = JSON.parse(readFileSync(R + "/data/investigacion/gremios/gremios.json", "utf8"));
const N = JSON.parse(readFileSync(R + "/data/vocabulario/necesidades.json", "utf8"));
const regs = JSON.parse(readFileSync(R + "/data/verificacion/registros.json", "utf8"));
const fichas = readdirSync(R + "/data/herramientas").filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(R + "/data/herramientas/" + f, "utf8"))).filter((h) => h.estado === "activo");

const necesidad = new Map(N.necesidades.map((n) => [n.id, n]));
const demuestra = new Map();   // capacidad -> herramientas que la demuestran
const preguntada = new Map();  // capacidad -> a cuántas se preguntó
for (const r of regs) {
  preguntada.set(r.capacidadId, (preguntada.get(r.capacidadId) ?? 0) + 1);
  if (r.estado !== "verificado" || r.profundidad === "no_disponible") continue;
  if (!demuestra.has(r.capacidadId)) demuestra.set(r.capacidadId, new Set());
  demuestra.get(r.capacidadId).add(r.herramientaId);
}

/** Quién cubre una necesidad entera: todos sus imprescindibles demostrados. */
function quienLaCubre(n) {
  if (!n.imprescindibles.length) return [];
  const sets = n.imprescindibles.map((c) => demuestra.get(c) ?? new Set());
  return [...sets[0]].filter((h) => sets.every((s) => s.has(h)));
}

const filas = G.gremios.map((g) => {
  const suyas = g.necesidades.map((id) => necesidad.get(id));
  const detalle = suyas.map((n) => {
    const quienes = quienLaCubre(n);
    // "Sin preguntar" cuando a la mayoría del catálogo no se le preguntó por
    // sus imprescindibles. Es lo que separa un hueco real de una deuda nuestra.
    const aCuantas = Math.max(...n.imprescindibles.map((c) => preguntada.get(c) ?? 0), 0);
    return { titulo: n.titulo, cuantas: quienes.length, seLePreguntoA: aCuantas };
  });
  const cubiertas = detalle.filter((d) => d.cuantas > 0);
  const huecoReal = detalle.filter((d) => d.cuantas === 0 && d.seLePreguntoA >= fichas.length / 2);
  const sinPreguntar = detalle.filter((d) => d.cuantas === 0 && d.seLePreguntoA < fichas.length / 2);
  return { id: g.id, nombre: g.nombre, de: detalle.length, cubiertas, huecoReal, sinPreguntar, detalle };
});

filas.sort((a, b) => b.cubiertas.length - a.cubiertas.length || a.nombre.localeCompare(b.nombre, "es"));
writeFileSync(R + "/data/investigacion/gremios/medicion.json", JSON.stringify({ medidoEl: "2026-09-24", filas }, null, 1));

console.log("GREMIO                                        cubiertas  sin catálogo  sin preguntar");
for (const f of filas) {
  console.log(
    "  " + f.nombre.padEnd(44) +
    `${f.cubiertas.length}/${f.de}`.padStart(8) +
    String(f.huecoReal.length).padStart(13) +
    String(f.sinPreguntar.length).padStart(15)
  );
}
console.log("\n── Lo que falta por gremio ─────────────────────────────");
for (const f of filas) {
  if (!f.huecoReal.length && !f.sinPreguntar.length) continue;
  console.log("\n" + f.nombre);
  for (const d of f.huecoReal) console.log("   SIN CATÁLOGO   " + d.titulo + `  (preguntado a ${d.seLePreguntoA})`);
  for (const d of f.sinPreguntar) console.log("   sin preguntar  " + d.titulo + `  (sólo a ${d.seLePreguntoA} de ${fichas.length})`);
}
