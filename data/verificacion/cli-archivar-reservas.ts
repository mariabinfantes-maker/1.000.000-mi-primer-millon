/**
 * ARCHIVAR LAS CAPACIDADES DE RESERVAS QUE YA ESTABAN INVESTIGADAS.
 *
 * `npx tsx data/verificacion/cli-archivar-reservas.ts [--escribir]`
 *
 * NO investiga nada. Las capacidades de las diez herramientas de reservas se
 * verificaron el 2026-09-28 y el 29, con cita literal y dirección, y quedaron
 * en `data/investigacion/`. El examen de entrada las cuenta en
 * `data/verificacion/registros.json`, y ahí no estaban. Esto es sólo el paso
 * que faltaba: llevarlas de una carpeta a la otra sin tocar su contenido.
 *
 * Las tres formas en que se guardaron, que no son la misma y por eso hace
 * falta este archivo:
 *   · las cinco españolas: `capacidades[] {id, estado, cita, url}`
 *   · las tandas 1 a 3:    su RESUMEN guardó sólo los ids, pero el crudo de
 *                          esa misma entrega —`crudo/tanda-N-crudo.json`—
 *                          trae la cita, la dirección, el título de la página
 *                          y la frase de al lado. Se lee el crudo.
 *   · las tandas 4 y 5:    `capacidades[] {capacidadId, estado, profundidad…}`
 *
 * UNA COSA QUE NO SE LEYÓ, SE APLICA: `profundidad`.
 *
 * El esquema la exige en todo registro `verificado`. Las tandas 4 y 5 la
 * traen; las otras dos formas no la preguntaron. Donde falta se pone `nativa`
 * y NO es un dato leído: es una convención, la misma con la que están los 633
 * registros nativos que ya hay. Se aplica sólo cuando se cumplen las dos
 * condiciones a la vez —la herramienta es de reservas o de clínicas, y la
 * capacidad es una de las ocho de reservas—, es decir, cuando la función
 * verificada ES el producto.
 *
 * Queda marcada en cada registro con `profundidadEsConvencion: true` para que
 * se pueda revisar o revertir sin volver a investigar nada. Si la propietaria
 * prefiere que no se dé por nativa, se quita esa marca y ya.
 */
import fs from "node:fs";
import path from "node:path";

const D = path.join(process.cwd(), "data");
const leer = (p: string) => JSON.parse(fs.readFileSync(path.join(D, p), "utf8"));
const escribir = process.argv.includes("--escribir");

const sinCita: string[] = [];
const fueraSinFicha: string[] = [];
const fueraPorCapacidad: string[] = [];
const OCHO = new Set([
  "cap.per_resource_booking_calendar", "cap.online_self_service_booking",
  "cap.customer_appointment_reminders", "cap.booking_cancellation_and_rescheduling",
  "cap.capacity_and_time_slots", "cap.no_show_and_deposits",
  "cap.booking_waitlist", "cap.embeddable_booking_widget",
]);
const CATEGORIAS_DE_RESERVAS = new Set(["reservas-citas", "clinicas-salud", "formacion-academias", "agenda-planificacion"]);

type Hallazgo = { capacidadId: string; cita?: string; url?: string; profundidad?: string; planMinimo?: string | null; planEstado?: string; fecha: string };
const porHerramienta = new Map<string, Hallazgo[]>();
const mete = (id: string, h: Hallazgo) => {
  const ya = porHerramienta.get(id) ?? [];
  if (!ya.some((x) => x.capacidadId === h.capacidadId)) ya.push(h);
  porHerramienta.set(id, ya);
};

// 1. el barrido del 28: la agenda por profesional
for (const h of leer("investigacion/agenda-por-profesional-2026-09-28/HALLAZGO-GPT.json").herramientas) {
  const id = h.id ?? h.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");
  if (h.agendaPorProfesional?.estado === "verificado" && h.agendaPorProfesional.cita)
    mete(id, { capacidadId: "cap.per_resource_booking_calendar", cita: h.agendaPorProfesional.cita, url: h.agendaPorProfesional.url, fecha: "2026-09-28" });
}
// 2. las cinco españolas
for (const h of leer("investigacion/reservas-espanolas-2026-09-29/capacidades-y-limites.json").herramientas)
  for (const c of h.capacidades ?? [])
    if (c.estado === "verificado" && c.cita) mete(h.id, { capacidadId: c.id, cita: c.cita, url: c.url, fecha: "2026-09-29" });
/**
 * 3. Las tandas. Se lee PRIMERO el crudo, que es donde están las citas.
 *
 * El resumen de las tandas 1 a 3 guardó sólo los ids —un fallo de cómo se
 * anotó, no de la investigación— y las 127 citas se recuperaron a `crudo/` el
 * 2026-09-29. Leer el resumen aquí dejaba fuera 89 capacidades que sí estaban
 * demostradas. Por eso el crudo va delante: `mete` respeta lo que ya hay.
 */
for (const f of ["crudo/tanda-1-crudo.json", "crudo/tanda-2-crudo.json", "crudo/tanda-3-crudo.json",
                 "crudo/tanda-4-crudo.json", "tanda-4.json", "tanda-5.json"]) {
  let j: any;
  try { j = leer(`investigacion/reservas-17-2026-09-29/${f}`); } catch { continue; }
  for (const h of j.herramientas ?? []) {
    for (const c of h.capacidades ?? []) {
      if (c.estado !== "verificado") continue;
      const cita = c.cita ?? c.fuentes?.[0]?.cita;
      const url = c.url ?? c.fuentes?.[0]?.url;
      // Sin cita no hay registro: lo dice el esquema y no se fuerza.
      if (!cita || !url) { sinCita.push(`${h.id}/${c.capacidadId ?? c.id}`); continue; }
      mete(h.id, { capacidadId: c.capacidadId ?? c.id, cita, url, profundidad: c.profundidad,
                   planMinimo: c.planMinimo, planEstado: c.planEstado, fecha: "2026-09-29" });
    }
    for (const c of h.capacidadesVerificadas ?? []) sinCita.push(`${h.id}/${c}`);
  }
}

const ficha = new Map<string, any>();
for (const f of fs.readdirSync(path.join(D, "borradores", "herramientas")))
  ficha.set(f.replace(/\.json$/, ""), leer(`borradores/herramientas/${f}`));

/**
 * SÓLO SE ARCHIVA LO DE LAS QUE ESTÁN DENTRO O ENTRANDO.
 *
 * Un registro de verificación apunta a una herramienta y `registros.test.ts`
 * comprueba que exista, así que archivar a lo loco deja registros colgando de
 * fichas que no están: pasó con 59 el 2026-09-29.
 *
 * Pero tampoco vale sólo «las del catálogo», porque entonces no entra ninguna
 * nueva: el examen pide capacidades archivadas para promover, y archivarlas
 * pedía estar promovida. Pez que se muerde la cola.
 *
 * La regla que lo rompe sin aflojar nada: cuenta la que YA está en el
 * catálogo, y también la que tiene una decisión `aprobado` registrada, que es
 * la firma explícita de la propietaria y significa que está a punto de ser
 * ficha. Las que sólo tienen borrador, no.
 *
 * Las que esperan decisión conservan su investigación intacta en
 * `data/investigacion/`, y este archivo se vuelve a pasar cuando entren.
 */
const enCatalogo = new Set(
  fs.readdirSync(path.join(D, "herramientas")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
);
const dirDecisiones = path.join(D, "borradores", "decisiones");
if (fs.existsSync(dirDecisiones))
  for (const f of fs.readdirSync(dirDecisiones).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(fs.readFileSync(path.join(dirDecisiones, f), "utf8"));
    if (d.decision === "aprobado") enCatalogo.add(d.id ?? f.replace(/\.json$/, ""));
  }
const nuevos: any[] = [];
const esperandoFicha: string[] = [];
let convencion = 0;
for (const [id, hs] of porHerramienta) {
  if (!enCatalogo.has(id)) { esperandoFicha.push(id); continue; }
  const cat = ficha.get(id)?.categoriaId;
  for (const h of hs) {
    let profundidad = h.profundidad;
    let esConvencion = false;
    if (!profundidad) {
      /**
       * Sin categoría no se puede aplicar la convención, y la categoría vive
       * en el borrador. Las nueve que esperan ficha de GPT todavía no lo
       * tienen, así que sus capacidades —investigadas y con cita— se quedan
       * aquí esperando. No se pierden: se cuentan y se nombran.
       */
      if (!(cat && CATEGORIAS_DE_RESERVAS.has(cat) && OCHO.has(h.capacidadId))) {
        (cat ? fueraPorCapacidad : fueraSinFicha).push(`${id}/${h.capacidadId}`);
        continue;
      }
      profundidad = "nativa"; esConvencion = true; convencion++;
    }
    nuevos.push({
      herramientaId: id, capacidadId: h.capacidadId, estado: "verificado", profundidad,
      ...(esConvencion ? { profundidadEsConvencion: true } : {}),
      planEstado: h.planEstado ?? "desconocido",
      ...(h.planEstado === "verificado" && h.planMinimo ? { planMinimo: h.planMinimo } : {}),
      fuentes: [{ tipo: "pagina_oficial", url: h.url, fechaConsulta: h.fecha, cita: h.cita, rol: "capacidad" }],
      confianza: "alta",
      proximaRevision: h.fecha.replace(/^2026/, "2027"),
    });
  }
}

console.log(`${nuevos.length} registros nuevos`);
console.log(`   ${esperandoFicha.length} herramientas con investigación lista pero sin ficha todavía: ${esperandoFicha.join(", ")}`);
console.log(`   ${convencion} con la profundidad puesta por convención (marcados)`);
console.log(`   ${sinCita.length} capacidades descartadas por no traer cita`);
console.log(`   ${fueraSinFicha.length} esperando a que su herramienta tenga ficha: ${[...new Set(fueraSinFicha.map((x) => x.split("/")[0]))].join(", ")}`);
if (fueraPorCapacidad.length) console.log(`   ${fueraPorCapacidad.length} fuera por no ser una de las ocho de reservas`);
for (const [id] of porHerramienta) console.log(`   ${id.padEnd(22)}${nuevos.filter((r) => r.herramientaId === id).length}`);

if (!escribir) { console.log("\n(en seco — pasa --escribir para guardar)"); process.exit(0); }
const ruta = path.join(D, "verificacion", "registros.json");
const actual = JSON.parse(fs.readFileSync(ruta, "utf8"));
const arr = Array.isArray(actual) ? actual : actual.registros;
// Idempotente: se puede volver a pasar sin duplicar nada.
const ya = new Set(arr.map((r: any) => `${r.herramientaId}/${r.capacidadId}`));
const aAnadir = nuevos.filter((r) => !ya.has(`${r.herramientaId}/${r.capacidadId}`));
console.log(`   ${nuevos.length - aAnadir.length} ya estaban archivados`);
arr.push(...aAnadir);

/**
 * LIMPIEZA FINAL. Una herramienta aprobada puede quedarse sin promover —le
 * falta un campo, la para una advertencia— y entonces sus registros quedan
 * colgando de una ficha que no existe, que es lo que `registros.test.ts`
 * prohíbe.
 *
 * Así que al cerrar se quitan los registros de todo lo que no esté en el
 * catálogo. No se pierde nada: la investigación sigue entera en
 * `data/investigacion/` y este archivo es idempotente, así que en cuanto la
 * ficha entre se vuelve a pasar y vuelven a su sitio.
 *
 * Por eso conviene pasarlo DESPUÉS de cada ronda de promociones, no antes.
 */
const enCatalogoAhora = new Set(
  fs.readdirSync(path.join(D, "herramientas")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
);
const colgando = arr.filter((r: any) => !enCatalogoAhora.has(r.herramientaId));
if (colgando.length) {
  const de = [...new Set(colgando.map((r: any) => r.herramientaId))];
  console.log(`   ${colgando.length} registros retirados por no tener ficha todavía: ${de.join(", ")}`);
  const limpio = arr.filter((r: any) => enCatalogoAhora.has(r.herramientaId));
  arr.length = 0;
  arr.push(...limpio);
}
fs.writeFileSync(ruta, JSON.stringify(actual, null, 1));
console.log(`\nguardado: ${arr.length} registros en total`);
