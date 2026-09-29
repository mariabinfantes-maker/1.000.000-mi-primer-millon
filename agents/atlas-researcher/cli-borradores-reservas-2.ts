/**
 * LOS BORRADORES DE LAS CINCO QUE FALTABAN DE RESERVAS.
 *
 * `npx tsx agents/atlas-researcher/cli-borradores-reservas-2.ts`
 *
 * AgendaPro, Cliniko, Jane, Square Appointments y Schedulista. Las cinco
 * pasan el examen de entrada y el validador; las otras cinco de reservas
 * —Nubimed, Archivex, ViDay, BEWE y Bookitit— ya las escribió
 * `cli-borradores-reservas.ts` y éste no las toca.
 *
 * NO promueve nada. Eso lo decide la propietaria, una a una, con
 * `npm run aprobar-borrador` y `npm run promover-borrador`.
 *
 * DE DÓNDE SALE CADA COSA, porque son cuatro fuentes distintas y conviene
 * saberlo antes de fiarse de un dato:
 *   · la ficha —descripción, ventajas, inconvenientes…— de las tandas 4 y 5 y
 *     de las entregas 1 y 2, todas de GPT navegando el 2026-09-29;
 *   · el tamaño y los límites, de las tandas 1 a 3 del mismo día;
 *   · el sector, derivado en `sectores-derivados-2026-09-29` de lo que el
 *     barrido del 28 ya había leído. NO es investigación nueva;
 *   · el precio, de donde lo traiga cada una.
 *
 * Cuando una herramienta tiene DOS lecturas del mismo campo —Square y
 * Schedulista se investigaron dos veces— se toma la segunda, que es más rica,
 * y la primera se queda donde está sin borrarse.
 */
import fs from "node:fs";
import path from "node:path";
import { escribirBorrador } from "@/agents/atlas-researcher/borrador";
import type { HerramientaPropuesta } from "@/agents/atlas-researcher/tipos";

const D = path.join(process.cwd(), "data", "investigacion");
const leer = (p: string) => JSON.parse(fs.readFileSync(path.join(D, p), "utf8"));

const LAS_CINCO = ["agendapro", "cliniko", "jane", "square-appointments", "schedulista"];

/** La ficha: lo último que llegó gana, porque cada entrega es más rica que la anterior. */
const ficha = new Map<string, any>();
for (const f of ["reservas-17-2026-09-29/tanda-4.json", "reservas-17-2026-09-29/tanda-5.json",
                 "lo-que-falta-2026-09-29/entrega-1.json", "lo-que-falta-2026-09-29/entrega-2.json"]) {
  for (const h of leer(f).herramientas ?? []) {
    const antes = ficha.get(h.id) ?? {};
    /**
     * Las listas de PRUEBAS se suman, no se sustituyen.
     *
     * Square y Schedulista se investigaron dos veces y cada entrega trae sus
     * propias pruebas. Machacando la lista se perdía la de tarifa de la tanda
     * 4 y Schedulista se quedaba sin recibo del precio, con el precio delante.
     */
    ficha.set(h.id, { ...antes, ...h,
      pruebas: [...(antes.pruebas ?? []), ...(h.pruebas ?? []), ...(h.fuentesDatosGenerales ?? [])],
      paginasQueAbriste: [...new Set([...(antes.paginasQueAbriste ?? []), ...(h.paginasQueAbriste ?? [])])],
    });
  }
}
/** El tamaño y los límites, de las tandas 1 a 3. */
const extra = new Map<string, any>();
for (const f of ["reservas-17-2026-09-29/tanda-1.json", "reservas-17-2026-09-29/tanda-2.json",
                 "reservas-17-2026-09-29/tanda-3.json"]) {
  const j = leer(f);
  for (const h of j.herramientas ?? []) extra.set(h.id, h);
  for (const [id, v] of Object.entries(j.losDosPendientes ?? {})) extra.set(id, { ...(extra.get(id) ?? {}), ...(v as object) });
}
/** El sector, derivado de lo ya leído el 28. */
const sector = new Map<string, string[]>(
  leer("sectores-derivados-2026-09-29/sectores.json").herramientas.map((s: any) => [s.id, s.industriasIdeales])
);
/** Y el barrido del 28, que es de donde salen `idealPara` y los idiomas de algunas. */
const b28 = new Map<string, any>(
  leer("agenda-por-profesional-2026-09-28/HALLAZGO-GPT.json").herramientas.map((h: any) => [
    h.id ?? h.nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-"), h])
);

const MODELO = ["freemium", "suscripcion_mensual", "suscripcion_anual", "pago_unico", "por_usuario", "a_medida"];

for (const id of LAS_CINCO) {
  const h = ficha.get(id);
  const e = extra.get(id) ?? {};
  const g = b28.get(id) ?? {};
  if (!h) { console.log(`${id}: sin ficha, se salta`); continue; }

  /**
   * `casosNoRecomendados` son los LÍMITES, no sectores excluidos: qué topa
   * aunque seas su cliente. Corrección de la propietaria, 2026-09-28.
   */
  const advertencias: string[] = [];
  if (!h.idiomasDisponibles?.length && !g.idiomaDelProducto?.length) advertencias.push("Los idiomas no están demostrados.");

  /**
   * CÓMO COBRA VA A LA FICHA, NO A UNA ADVERTENCIA.
   *
   * `modeloDePrecio` sólo sabe decir seis cosas, y algunas herramientas cobran
   * de otra manera: Square por punto de venta, Schedulista por tramos de
   * usuarios. Antes eso se guardaba como advertencia del borrador para no
   * perderlo, y salía mal por los dos lados: no lo veía el cliente, que es
   * quien lo necesita antes de contratar, y bloqueaba la promoción, porque el
   * criterio de calidad no promueve con advertencias abiertas. A Schedulista
   * la dejó fuera del catálogo el 2026-09-29.
   *
   * Va a `inconvenientes`, que es la lista que sale en la ficha pública, y que
   * no es una lista de defectos sino de lo que hay que tener en cuenta. Ahí
   * cumple su función. Decisión de la propietaria del 2026-09-29.
   */
  const comoCobra = h.notaDelPrecio
    ? [h.notaDelPrecio.replace(/^El fabricante cobra/, "Se cobra").replace(/^Además de la cuota, Square cobra/, "Además de la cuota se cobra")]
    : [];


  const limites: string[] = [
    ...(e.limites ?? []).map((l: any) => (typeof l === "string" ? l : l.texto)),
    ...(h.inconvenientes ?? []),
    ...comoCobra,
  ].filter(Boolean);

  const datos: Record<string, unknown> = {
    nombre: h.nombre ?? g.nombre,
    paginaOficial: h.paginaOficial ?? g.web,
    /**
     * La dirección de la tarifa. Si la ficha no la trae, se usa la de la
     * propia prueba de tarifa: es la página que se abrió de verdad, y el
     * catálogo exige que el recibo y este campo apunten al mismo sitio.
     */
    urlPrecios: h.urlPrecios ?? (h.pruebas ?? []).find((x: any) => x.tipo === "tarifa_oficial")?.url,
    categoriaId: h.categoriaId,
    descripcion: h.descripcion,
    problemasQueResuelve: h.problemasQueResuelve,
    casosDeUso: h.casosDeUso,
    idealPara: h.idealPara ?? g.paraQuienEstaPensada,
    segmentosIdeales: h.segmentosIdeales ?? e.segmentosIdeales,
    industriasIdeales: h.industriasIdeales ?? sector.get(id),
    /**
     * SIN RELLENO. Antes esto decía `h.noRecomendadaPara ?? limites[0]`, y
     * copiaba el primer límite en un campo que significa otra cosa.
     *
     * No son lo mismo y la propietaria lo dejó dicho el 2026-09-28:
     * `noRecomendadaPara` es PARA QUIÉN NO ESTÁ PENSADA —sale por descarte de
     * saber para quién sí—, y `casosNoRecomendados` son los LÍMITES: qué topa
     * aunque seas su cliente.
     *
     * Lo que producía: ViDay salía con «No está pensada para… el plan Empresa
     * incluye hasta tres CIFs con contabilidades separadas», que no es para
     * quién no está pensada; es su tarifa. Y la tarjeta imprimía la misma
     * frase dos veces en dos campos distintos.
     *
     * Si no consta, se queda vacío y el validador protesta. Que proteste: eso
     * es el hueco enseñándose, no un fallo.
     */
    noRecomendadaPara: h.noRecomendadaPara,
    casosNoRecomendados: limites,
    funcionesPrincipales: h.funcionesPrincipales,
    integraciones: h.integraciones,
    integracionesPrincipales: h.integracionesPrincipales,
    // Nadie publica lo fácil que es su producto. Sin prueba, no se pone.
    curvaDeAprendizaje: undefined,
    precioInicial: h.precioInicial ?? e.precioInicial ?? g.precioMasBajo?.cita,
    modeloDePrecio: (h.modeloDePrecio ?? ["suscripcion_mensual"]).filter((m: string) => MODELO.includes(m)),
    tienePlanGratuito: h.tienePlanGratuito ?? e.tienePlanGratuito,
    /**
     * EL RECIBO DEL PRECIO, que este constructor se dejaba y por eso AgendaPro
     * y Cliniko no pasaban el examen de entrada.
     *
     * No se inventa: se saca de la propia prueba que GPT ya entregó, la que
     * lleva `tipo: "tarifa_oficial"`. Si no hay ninguna, se queda sin recibo y
     * el examen lo dirá, que para eso está.
     */
    preciosComprobados: (() => {
      const p = (h.pruebas ?? []).find((x: any) => x.tipo === "tarifa_oficial" && x.url);
      return p ? { url: p.url, fecha: h.fecha ?? "2026-09-29", cita: p.cita } : undefined;
    })(),
    idiomasDisponibles: h.idiomasDisponibles ?? g.idiomaDelProducto,
    /**
     * SIN DEDUCIR. Antes se ponía `true` si la lista de idiomas incluía «es».
     *
     * `disponibleEnEspanol` no es «tiene español en alguna parte»: es que la
     * parte de GESTIÓN, la que usa el negocio, esté en español. Schedulista lo
     * demuestra: su página de reservas está en español y su panel, su app y sus
     * avisos al profesional siguen en inglés, y su propia ayuda lo dice —«will
     * remain in English»—. Deducirlo de la lista ponía `true` en la ficha de
     * una herramienta que se gestiona en inglés, en el campo que más pesa en un
     * catálogo español.
     *
     * Sólo se rellena con evidencia directa sobre la gestión.
     */
    disponibleEnEspanol: h.disponibleEnEspanol,
    tieneAppMovil: h.tieneAppMovil ?? undefined,
    tieneApiPublica: h.tieneApiPublica ?? undefined,
    puntuaciones: h.puntuaciones,
    metodologiaValoracion: h.metodologiaValoracion,
    ventajas: h.ventajas,
    inconvenientes: [...(h.inconvenientes ?? []), ...comoCobra],
    informacionEmpresa: h.informacionEmpresa,
    /**
     * EL HUECO, DICHO. Ninguna de éstas trae `objetivo`, y el catálogo tiene
     * desde el 2026-08-27 un campo para eso: `objetivoPendienteDeInvestigacion`.
     * Nació porque 38 de 56 fichas se habían quedado sin objetivo y, como la
     * puerta «por objetivo» filtra estricto, ese 68% era invisible para quien
     * entraba por ahí — y no había forma de distinguir «aún no investigado»
     * de «no encaja».
     *
     * Se marca `true`, que es lo que ese campo significa: pendiente, y en la
     * cola del Researcher. No es un relleno: es el hueco declarándose.
     *
     * Y se quita en cuanto la ficha recibe sus `problemasIds`: el Curador
     * comprueba que nadie tenga objetivo Y esté pendiente a la vez, porque
     * entonces la deuda deja de ser medible.
     */
    objetivoPendienteDeInvestigacion: true,
  };

  const propuesta: HerramientaPropuesta = {
    datos: datos as never,
    // La afiliación está aparcada desde el 2026-09-17: ni se investiga ni se menciona.
    datosAfiliados: {},
    // Lo que falta a propósito: no se puede demostrar, así que no se inventa.
    camposFaltantes: ["curvaDeAprendizaje", "puntuaciones", "reputacion"],
    fuentes: (h.paginasQueAbriste ?? [h.paginaOficial]).filter(Boolean),
    confianza: "alta",
    advertencias,
  };

  const r = escribirBorrador(id, propuesta);
  console.log(`${id.padEnd(20)} → ${path.relative(process.cwd(), r.rutaHerramienta)}${advertencias.length ? "   ⚠ " + advertencias.length : ""}`);
}
