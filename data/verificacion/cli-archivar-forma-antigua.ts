/**
 * LO QUE YA ESTABA INVESTIGADO Y NADIE HABÍA ARCHIVADO.
 *
 * `npx tsx data/verificacion/cli-archivar-forma-antigua.ts [--escribir]`
 *
 * NO investiga nada. Diez de las catorce herramientas que faltaban ya tenían
 * sus capacidades verificadas —con cita, dirección, título de página y frase
 * de al lado— desde el 2026-09-29, guardadas en `data/investigacion/`. Nunca
 * llegaron a `registros.json`, que es donde el examen de entrada las cuenta,
 * y por eso parecía que faltaba investigarlas.
 *
 * POR QUÉ NO SE VEÍAN: están en la FORMA ANTIGUA.
 *
 *   antigua:  { id, estado, cita, url, tituloDeLaPagina, fraseDeAlLado }
 *   nueva:    { capacidadId, estado, profundidad, fuentes: [{ tipo, url, cita }] }
 *
 * La prueba es la misma y está completa; lo único que cambia es dónde vive la
 * cita. Los archivadores nuevos sólo miraban `fuentes[]`, así que contaban
 * cero y la herramienta se quedaba fuera con su trabajo hecho.
 *
 * `profundidad` NO la trae la forma antigua. Se pone `nativa` por convención
 * —la misma con la que están los 633 registros nativos que ya hay— y SÓLO
 * cuando la capacidad es una de las ocho de reservas y la herramienta es de
 * reservas o clínicas, es decir, cuando la función verificada ES el producto.
 * Queda marcada con `profundidadEsConvencion: true` para poder revisarla o
 * revertirla sin volver a investigar.
 */
import fs from "node:fs";
import path from "node:path";

const D = path.join(process.cwd(), "data");
const RUTA = path.join(D, "verificacion", "registros.json");
const escribir = process.argv.includes("--escribir");

/** Las ocho de reservas: donde la función verificada ES el producto. */
const OCHO = new Set([
  "cap.per_resource_booking_calendar", "cap.online_self_service_booking",
  "cap.customer_appointment_reminders", "cap.booking_cancellation_and_rescheduling",
  "cap.capacity_and_time_slots", "cap.no_show_and_deposits",
  "cap.booking_waitlist", "cap.embeddable_booking_widget",
]);

const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const LAS14: Record<string, string> = {
  reservo: "Reservo", qvet: "QVET", "gesden-g5": "Gesden G5", setmore: "Setmore",
  "acuity-scheduling": "Acuity Scheduling", "simplybook-me": "SimplyBook.me",
  "zoho-bookings": "Zoho Bookings", reservio: "Reservio", bookeo: "Bookeo Appointments",
  teachworks: "Teachworks", tutorbird: "TutorBird", pabau: "Pabau", fresha: "Fresha",
  treatwell: "Treatwell",
};
const clave: Record<string, string> = {};
for (const k of Object.keys(LAS14)) { clave[norm(k)] = k; clave[norm(LAS14[k])] = k; }

const registros: any[] = JSON.parse(fs.readFileSync(RUTA, "utf8"));
const yaEstan = new Set(registros.map((r) => `${r.herramientaId}|${r.capacidadId}`));

/**
 * SÓLO LAS QUE TIENEN FICHA O DECISIÓN APROBADA.
 *
 * El validador rechaza un registro cuya herramienta no existe —«la
 * herramienta no existe»—, y eso ya pasó con Clinic Cloud el 2026-09-30.
 * Las capacidades de las que todavía no tienen ficha se quedan esperando en
 * `data/investigacion`, que es donde están ahora y donde no estorban: el día
 * que su ficha entre, este mismo comando las archiva sin repetir nada.
 */
const enCatalogo = new Set(
  fs.readdirSync(path.join(D, "herramientas")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
);
const DEC = path.join(D, "borradores", "decisiones");
const aprobadas = new Set(
  (fs.existsSync(DEC) ? fs.readdirSync(DEC) : [])
    .filter((f) => f.endsWith(".json"))
    .filter((f) => JSON.parse(fs.readFileSync(path.join(DEC, f), "utf8")).decision === "aprobado")
    .map((f) => f.replace(/\.json$/, ""))
);

/** La mejor prueba de cada par, de cualquier entrega. */
const mejor = new Map<string, { id: string; cid: string; c: any; fecha: string }>();

function anda(d: string) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { anda(p); continue; }
    if (!e.name.endsWith(".json")) continue;
    let j: any;
    try { j = JSON.parse(fs.readFileSync(p, "utf8")); } catch { continue; }
    const fecha = j.fecha ?? "2026-09-29";
    for (const h of Array.isArray(j.herramientas) ? j.herramientas : []) {
      const id = clave[norm(h.id ?? "")] ?? clave[norm(h.nombre ?? "")];
      if (!id) continue;
      for (const c of h.capacidades ?? []) {
        if (c.estado !== "verificado") continue;
        const cid = c.capacidadId ?? c.id;
        if (!cid) continue;
        const tieneNueva = (c.fuentes ?? []).length > 0;
        const tieneVieja = c.cita && c.url;
        if (!tieneNueva && !tieneVieja) continue;
        // La forma nueva gana si existe; si no, vale la antigua.
        const k = `${id}|${cid}`;
        if (!mejor.has(k) || tieneNueva) mejor.set(k, { id, cid, c, fecha });
      }
    }
  }
}
anda(path.join(D, "investigacion"));

const nuevos: any[] = [];
const saltados: string[] = [];
for (const { id, cid, c, fecha } of mejor.values()) {
  const k = `${id}|${cid}`;
  if (yaEstan.has(k)) { saltados.push(k + " (ya estaba)"); continue; }
  if (!enCatalogo.has(id) && !aprobadas.has(id)) { saltados.push(k + " (esperando a que su ficha entre)"); continue; }

  const fuentes = (c.fuentes ?? []).length
    ? c.fuentes.map((s: any) => ({ tipo: s.tipo ?? "documentacion", url: s.url, fechaConsulta: fecha, cita: s.cita, rol: "capacidad" }))
    : [{ tipo: "documentacion", url: c.url, fechaConsulta: fecha, cita: c.cita, rol: "capacidad" }];

  const esConvencion = !c.profundidad;
  if (esConvencion && !OCHO.has(cid)) { saltados.push(k + " (sin profundidad y no es de las ocho de reservas)"); continue; }

  nuevos.push({
    herramientaId: id,
    capacidadId: cid,
    estado: "verificado",
    profundidad: c.profundidad ?? "nativa",
    ...(esConvencion ? { profundidadEsConvencion: true } : {}),
    ...(c.integraCon ? { integraCon: c.integraCon } : {}),
    planEstado: "desconocido",
    fuentes,
    confianza: c.confianza ?? "alta",
    ...(c.nota ? { nota: c.nota } : {}),
    proximaRevision: `${Number(fecha.slice(0, 4)) + 1}${fecha.slice(4)}`,
  });
}

const porHerramienta = new Map<string, number>();
for (const n of nuevos) porHerramienta.set(n.herramientaId, (porHerramienta.get(n.herramientaId) ?? 0) + 1);
for (const [id, n] of [...porHerramienta].sort()) console.log(`  ${id.padEnd(18)} ${n} registros`);
console.log(`\n${nuevos.length} registros nuevos${escribir ? "" : "  (en seco — usa --escribir)"}`);
if (saltados.length) console.log(`${saltados.length} saltados`);

if (escribir && nuevos.length) {
  fs.writeFileSync(RUTA, JSON.stringify([...registros, ...nuevos], null, 2) + "\n");
  console.log(`Escrito. registros.json pasa de ${registros.length} a ${registros.length + nuevos.length}.`);
}
