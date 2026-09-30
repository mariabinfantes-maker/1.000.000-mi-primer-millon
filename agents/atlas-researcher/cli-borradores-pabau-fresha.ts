/**
 * PABAU Y FRESHA: lo que ya estaba investigado y nadie había montado.
 *
 * `npx tsx agents/atlas-researcher/cli-borradores-pabau-fresha.ts`
 *
 * Las dos llevaban días con su ficha casi entera repartida por
 * `data/investigacion/`, en varias entregas del 2026-09-28 y del 29. Nunca se
 * juntaron. Les faltaban TRES campos, y dos de los tres eran el mismo dato
 * guardado con otro nombre:
 *
 *   paginaOficial  ←  `web`                    (barrido del 28)
 *   idealPara      ←  `paraQuienEstaPensada`   (barrido del 28)
 *
 * El tercero, el precio, sí era un hueco de verdad, y se cerró el 2026-09-30
 * con dos lecturas guardadas en `precios-pabau-fresha-2026-09-30`.
 *
 * NO promueve nada.
 */
import fs from "node:fs";
import path from "node:path";
import { escribirBorrador } from "@/agents/atlas-researcher/borrador";
import type { HerramientaPropuesta } from "@/agents/atlas-researcher/tipos";

const D = path.join(process.cwd(), "data", "investigacion");
const norm = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const DOS: Record<string, string> = { pabau: "Pabau", fresha: "Fresha" };
const clave: Record<string, string> = {};
for (const k of Object.keys(DOS)) { clave[norm(k)] = k; clave[norm(DOS[k])] = k; }

/** Todo lo que cualquier entrega diga de las dos, la última lectura gana. */
const unido: Record<string, any> = { pabau: {}, fresha: {} };
(function anda(d: string) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { anda(p); continue; }
    if (!e.name.endsWith(".json")) continue;
    let j: any;
    try { j = JSON.parse(fs.readFileSync(p, "utf8")); } catch { continue; }
    for (const h of Array.isArray(j.herramientas) ? j.herramientas : []) {
      const id = clave[norm(h.id ?? "")] ?? clave[norm(h.nombre ?? "")];
      if (!id) continue;
      for (const k of Object.keys(h)) {
        if (h[k] != null && (!Array.isArray(h[k]) || h[k].length)) unido[id][k] = h[k];
      }
    }
  }
})(D);

const precios = JSON.parse(
  fs.readFileSync(path.join(D, "precios-pabau-fresha-2026-09-30", "hallazgo.json"), "utf8")
);
const precioDe = new Map<string, any>(precios.herramientas.map((h: any) => [h.id, h]));

/**
 * `precioInicial` de Pabau NO es un hueco disfrazado: es el dato. Su tarifa
 * enseña los cinco planes con sus usuarios y ninguno con importe, y dice por
 * qué. Que una herramienta te obligue a una llamada para saber lo que cuesta
 * es justo lo que hay que decirle al cliente antes de que la haga.
 */
const PRECIO: Record<string, string> = {
  pabau: "No lo publican: su tarifa enseña los cinco planes con su número de usuarios, pero ninguno con importe, y pide una llamada para saberlo — «Our pricing depends on where you're located and the number of users you'll need on the system».",
  fresha: "Independent: 19,95 $ al mes. Team: 14,95 $ al mes por cada miembro del equipo con reservas. Enterprise, a medida a partir de veinte miembros.",
};

/** Derivado de `industriasIdeales`, regla de la propietaria del 2026-09-28. */
const NO_RECOMENDADA: Record<string, string> = {
  pabau: "No está pensada para negocios fuera de la clínica, la medicina estética y el bienestar.",
  fresha: "No está pensada para negocios fuera de la peluquería, la belleza y el bienestar.",
};

const MODELO = ["freemium", "suscripcion_mensual", "suscripcion_anual", "pago_unico", "por_usuario", "a_medida"];

for (const id of Object.keys(DOS)) {
  const h = unido[id];
  const pr = precioDe.get(id)!;
  const comoCobra = pr.comoCobra ? [String(pr.comoCobra)] : [];

  const limites: string[] = [
    ...(h.limites ?? []).map((l: any) => (typeof l === "string" ? l : l.texto)),
    ...(h.inconvenientes ?? []),
    ...comoCobra,
  ].filter(Boolean);

  const datos: Record<string, unknown> = {
    nombre: h.nombre ?? DOS[id],
    // El barrido del 28 lo guardó como `web`. Es el mismo dato.
    paginaOficial: h.paginaOficial ?? h.web,
    urlPrecios: pr.url,
    categoriaId: h.categoriaId,
    descripcion: h.descripcion,
    problemasQueResuelve: h.problemasQueResuelve,
    casosDeUso: h.casosDeUso,
    // Mismo caso: el barrido del 28 lo llamó `paraQuienEstaPensada`.
    idealPara: h.idealPara ?? h.paraQuienEstaPensada,
    industriasIdeales: h.industriasIdeales,
    segmentosIdeales: h.segmentosIdeales,
    noRecomendadaPara: h.noRecomendadaPara ?? NO_RECOMENDADA[id],
    casosNoRecomendados: limites,
    funcionesPrincipales: h.funcionesPrincipales,
    integraciones: h.integraciones,
    integracionesPrincipales: h.integracionesPrincipales ?? h.integraciones?.slice(0, 5),
    precioInicial: PRECIO[id],
    modeloDePrecio: (h.modeloDePrecio ?? (id === "fresha" ? ["por_usuario", "suscripcion_mensual"] : ["a_medida"]))
      .filter((m: string) => MODELO.includes(m)),
    tienePlanGratuito: pr.hayPlanGratuitoPermanente ?? h.tienePlanGratuito,
    /**
     * El recibo apunta a la tarifa que SÍ se abrió. En Pabau no lleva cita
     * porque no hay cifra que citar: la fecha y la dirección siguen siendo
     * ciertas, y el examen sólo pide esas dos.
     */
    preciosComprobados: {
      url: pr.url,
      fecha: precios.fecha,
      ...(pr.resultado === "SÍ PUBLICAN" ? { cita: pr.citaLiteral } : {}),
    },
    idiomasDisponibles: h.idiomasDisponibles ?? h.idiomaDelProducto,
    // SIN DEDUCIR: las dos se gestionan en inglés según el barrido del 28.
    disponibleEnEspanol: h.disponibleEnEspanol,
    tieneAppMovil: h.tieneAppMovil ?? undefined,
    tieneApiPublica: h.tieneApiPublica ?? undefined,
    puntuaciones: h.puntuaciones,
    metodologiaValoracion: h.metodologiaValoracion,
    ventajas: h.ventajas,
    inconvenientes: [...(h.inconvenientes ?? []), ...comoCobra],
    informacionEmpresa: h.informacionEmpresa,
    curvaDeAprendizaje: h.curvaDeAprendizaje ?? undefined,
    objetivoPendienteDeInvestigacion: true,
  };

  const propuesta: HerramientaPropuesta = {
    datos: datos as never,
    datosAfiliados: {},
    camposFaltantes: ["curvaDeAprendizaje", "reputacion"],
    fuentes: (h.paginasQueAbriste ?? [datos.paginaOficial]).filter(Boolean) as string[],
    confianza: "alta",
    advertencias: [],
  };
  const r = escribirBorrador(id, propuesta);
  console.log(`${id.padEnd(10)} → ${path.relative(process.cwd(), r.rutaHerramienta)}`);
}
