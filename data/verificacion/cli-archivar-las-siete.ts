/**
 * ARCHIVAR LAS CAPACIDADES DE LAS SIETE.
 *
 * `npx tsx data/verificacion/cli-archivar-las-siete.ts [--escribir]`
 *
 * NO investiga nada. Lleva las capacidades que GPT ya entregó, con cita y
 * dirección, de `data/investigacion/las-siete-2026-09-30/crudo/` a
 * `registros.json`, que es donde el examen de entrada las cuenta.
 *
 * Tres cosas que hace a propósito:
 *
 * 1. **`no_consta` se traduce a `desconocido`.** No existe en el vocabulario
 *    del esquema, y significa lo mismo: buscado y no encontrado, que no es
 *    «no lo tiene». El crudo se queda como llegó.
 *
 * 2. **`planEstado` se archiva siempre como `desconocido`**, aunque GPT diga
 *    `verificado` y nombre el plan. El esquema pide, para darlo por
 *    verificado, una fuente aparte con `rol: "plan_consultado"` cuya cita
 *    nombre el plan; lo que trae GPT es el plan leído en la tabla de tarifas,
 *    que es otra cosa. No es que GPT se equivoque: es que la prueba que trae
 *    no es la que el esquema pide. El plan que dijo queda en la nota para no
 *    perderlo.
 *
 * 3. **`profundidad` NO se inventa.** El encargo del 2026-09-30 la pide
 *    obligatoria en todo `verificado`, así que aquí viene leída. Si faltara,
 *    el registro se queda fuera y se dice cuál.
 */
import fs from "node:fs";
import path from "node:path";

const D = path.join(process.cwd(), "data");
const CARPETA = path.join(D, "investigacion", "las-siete-2026-09-30", "crudo");
const RUTA = path.join(D, "verificacion", "registros.json");
const escribir = process.argv.includes("--escribir");

const registros: any[] = JSON.parse(fs.readFileSync(RUTA, "utf8"));
const yaEstan = new Set(registros.map((r) => `${r.herramientaId}|${r.capacidadId}`));

const nuevos: any[] = [];
const saltados: string[] = [];

for (const f of fs.readdirSync(CARPETA).filter((x) => x.endsWith("-crudo.json"))) {
  const entrega = JSON.parse(fs.readFileSync(path.join(CARPETA, f), "utf8"));
  const fecha = entrega.fecha;
  for (const h of entrega.herramientas ?? []) {
    for (const c of h.capacidades ?? []) {
      const estado = c.estado === "no_consta" || c.estado == null ? "desconocido" : c.estado;
      if (estado !== "verificado") continue;

      const clave = `${h.id}|${c.capacidadId}`;
      if (yaEstan.has(clave)) { saltados.push(clave + " (ya estaba)"); continue; }
      if (!c.profundidad) { saltados.push(clave + " (sin profundidad)"); continue; }
      if (!(c.fuentes ?? []).length) { saltados.push(clave + " (sin fuente)"); continue; }

      const notas = [c.nota, c.planMinimo ? `Plan que nombró la tarifa: ${c.planMinimo}.` : null]
        .filter(Boolean)
        .join(" ");

      nuevos.push({
        herramientaId: h.id,
        capacidadId: c.capacidadId,
        estado: "verificado",
        profundidad: c.profundidad,
        ...(c.integraCon ? { integraCon: c.integraCon } : {}),
        planEstado: "desconocido",
        fuentes: c.fuentes.map((s: any) => ({
          tipo: s.tipo,
          url: s.url,
          fechaConsulta: fecha,
          cita: s.cita,
          rol: "capacidad",
        })),
        confianza: c.confianza ?? "alta",
        ...(notas ? { nota: notas } : {}),
        proximaRevision: `${Number(fecha.slice(0, 4)) + 1}${fecha.slice(4)}`,
      });
    }
  }
}

for (const s of saltados) console.log("  salta:", s);
console.log(`\n${nuevos.length} registros nuevos${escribir ? "" : "  (en seco — usa --escribir)"}`);
for (const n of nuevos) console.log(`  ${n.herramientaId.padEnd(16)} ${n.capacidadId.padEnd(42)} ${n.profundidad}`);

if (escribir && nuevos.length) {
  fs.writeFileSync(RUTA, JSON.stringify([...registros, ...nuevos], null, 2) + "\n");
  console.log(`\nEscrito. registros.json pasa de ${registros.length} a ${registros.length + nuevos.length}.`);
}
