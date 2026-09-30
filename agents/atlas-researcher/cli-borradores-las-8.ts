/**
 * LAS 8 QUE SÓLO ESPERABAN EL TEXTO DE LA FICHA.
 *
 * `npx tsx agents/atlas-researcher/cli-borradores-las-8.ts`
 *
 * Reservo, Setmore, Acuity, SimplyBook.me, Zoho Bookings, Reservio, Bookeo y
 * Teachworks. De las ocho ya estaba lo caro —de cuatro a siete capacidades
 * verificadas, los sectores, para quién es, el tamaño en seis y el precio en
 * cinco—, guardado desde el 2026-09-28 y el 29 sin montar.
 *
 * POR ESO ESTE CONSTRUCTOR COSE DOS FUENTES, y es la diferencia con el de las
 * siete:
 *   · la entrega nueva de `las-8-2026-09-30/crudo/`, que trae el texto;
 *   · TODO lo anterior que haya en `data/investigacion/` de esa herramienta,
 *     de donde salen el tamaño, los sectores y para quién es.
 *
 * Y sabe los dos alias que tenían paradas a Pabau y Fresha:
 *   paginaOficial ← `web`     ·     idealPara ← `paraQuienEstaPensada`
 *
 * NO promueve nada.
 */
import fs from "node:fs";
import path from "node:path";
import { escribirBorrador } from "@/agents/atlas-researcher/borrador";
import type { HerramientaPropuesta } from "@/agents/atlas-researcher/tipos";

const D = path.join(process.cwd(), "data", "investigacion");
const NUEVO = path.join(D, "las-8-2026-09-30", "crudo");
const MODELO = ["freemium", "suscripcion_mensual", "suscripcion_anual", "pago_unico", "por_usuario", "a_medida"];
const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

/** Lo que traiga la entrega nueva: ésa es la ficha. */
const nuevas = new Map<string, any>();
let fechaEntrega = "2026-09-30";
for (const f of fs.existsSync(NUEVO) ? fs.readdirSync(NUEVO).filter((x) => x.endsWith(".json")) : []) {
  const j = JSON.parse(fs.readFileSync(path.join(NUEVO, f), "utf8"));
  fechaEntrega = j.fecha ?? fechaEntrega;
  for (const h of j.herramientas ?? []) nuevas.set(h.id, h);
}
if (!nuevas.size) { console.log("No hay entrega nueva en", path.relative(process.cwd(), NUEVO)); process.exit(0); }

/** Todo lo anterior, para el tamaño, los sectores y para quién es. */
const antes: Record<string, any> = {};
for (const id of nuevas.keys()) antes[id] = {};
(function anda(d: string) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { anda(p); continue; }
    if (!e.name.endsWith(".json")) continue;
    let j: any;
    try { j = JSON.parse(fs.readFileSync(p, "utf8")); } catch { return; }
    for (const h of Array.isArray(j.herramientas) ? j.herramientas : []) {
      const id = [...nuevas.keys()].find((k) => norm(k) === norm(h.id ?? "") || norm(k) === norm(h.nombre ?? ""));
      if (!id) continue;
      for (const k of Object.keys(h)) {
        if (h[k] != null && (!Array.isArray(h[k]) || h[k].length)) antes[id][k] = h[k];
      }
    }
  }
})(D);

/** Las inversiones de `noRecomendadaPara`, escritas aparte con su porqué. */
const inversiones = new Map<string, string>();
for (const d of fs.readdirSync(D).filter((x) => x.startsWith("sectores-derivados-"))) {
  for (const f of fs.readdirSync(path.join(D, d)).filter((x) => x.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(D, d, f), "utf8"));
    for (const h of j.herramientas ?? []) if (h.id && h.noRecomendadaPara) inversiones.set(h.id, h.noRecomendadaPara);
  }
}

for (const [id, h] of nuevas) {
  const a = antes[id] ?? {};
  const comoCobra = h.notaDelPrecio ? [String(h.notaDelPrecio)] : [];
  const limites: string[] = [
    ...(h.limites ?? a.limites ?? []).map((l: any) => (typeof l === "string" ? l : l.texto)),
    ...(h.inconvenientes ?? []),
    ...comoCobra,
  ].filter(Boolean);

  const interfaz = h.idioma?.interfaz;
  const idiomasGestion: string[] | undefined =
    interfaz?.estado === "verificado" ? interfaz.idiomas : (a.idiomaDelProducto as string[] | undefined);

  const datos: Record<string, unknown> = {
    nombre: h.nombre ?? a.nombre,
    paginaOficial: h.paginaOficial ?? a.paginaOficial ?? a.web,
    urlPrecios: h.urlPrecios ?? h.urlDelPrecio,
    categoriaId: h.categoriaId,
    descripcion: h.descripcion,
    problemasQueResuelve: h.problemasQueResuelve,
    casosDeUso: h.casosDeUso,
    idealPara: h.idealPara ?? a.idealPara ?? a.paraQuienEstaPensada,
    // El tamaño y los sectores NO vienen de la entrega nueva: no se le pidieron.
    segmentosIdeales: h.segmentosIdeales ?? a.segmentosIdeales,
    industriasIdeales: h.industriasIdeales ?? a.industriasIdeales,
    noRecomendadaPara: h.noRecomendadaPara ?? inversiones.get(id),
    casosNoRecomendados: limites,
    funcionesPrincipales: h.funcionesPrincipales,
    integraciones: h.integraciones,
    integracionesPrincipales: h.integracionesPrincipales,
    curvaDeAprendizaje: h.curvaDeAprendizaje ?? undefined,
    precioInicial: h.precioInicial,
    modeloDePrecio: (h.modeloDePrecio ?? ["suscripcion_mensual"]).filter((m: string) => MODELO.includes(m)),
    tienePlanGratuito: h.tienePlanGratuito ?? a.tienePlanGratuito ?? undefined,
    /** El recibo: `citaDelPrecio` son las cifras; sin cifra, sólo fecha y dirección. */
    preciosComprobados: (() => {
      const url = h.urlDelPrecio ?? h.urlPrecios;
      if (!url) return undefined;
      const cita = h.citaDelPrecio ?? "";
      const ensenaUnPrecio = /[0-9]|[€$£]|gratis|gratuit|free/i.test(cita);
      return { url, fecha: fechaEntrega, ...(ensenaUnPrecio ? { cita } : {}) };
    })(),
    idiomasDisponibles: idiomasGestion,
    disponibleEnEspanol: interfaz?.estado === "verificado" ? interfaz.idiomas?.includes("es") : undefined,
    tieneAppMovil: h.tieneAppMovil ?? undefined,
    tieneApiPublica: h.tieneApiPublica ?? undefined,
    puntuaciones: h.puntuaciones,
    metodologiaValoracion: h.metodologiaValoracion,
    ventajas: h.ventajas,
    inconvenientes: [...(h.inconvenientes ?? []), ...comoCobra],
    informacionEmpresa: h.informacionEmpresa,
    objetivoPendienteDeInvestigacion: true,
  };

  const propuesta: HerramientaPropuesta = {
    datos: datos as never,
    datosAfiliados: {},
    camposFaltantes: ["reputacion"],
    fuentes: [...(h.paginasQueAbriste ?? []), ...(a.paginasQueAbriste ?? [])].filter(Boolean) as string[],
    confianza: "alta",
    advertencias: [],
  };
  const r = escribirBorrador(id, propuesta);
  console.log(`${id.padEnd(18)} → ${path.relative(process.cwd(), r.rutaHerramienta)}`);
}
