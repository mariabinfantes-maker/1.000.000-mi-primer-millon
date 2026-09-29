/**
 * LOS BORRADORES DE LAS CINCO ESPAÑOLAS DE RESERVAS.
 *
 * `npx tsx agents/atlas-researcher/cli-borradores-reservas.ts`
 *
 * Junta las dos investigaciones que hay de cada una —la ficha completa del
 * 2026-09-28 y las capacidades, el tamaño y los límites del 2026-09-29— y
 * escribe el borrador. NO promueve nada: eso lo decide la propietaria, una a
 * una, con `npm run aprobar-borrador` y `npm run promover-borrador`.
 *
 * Deja a propósito sin rellenar lo que no se puede demostrar: la curva de
 * aprendizaje y seis de las siete notas. Es la decisión de la propietaria del
 * 2026-09-28 —donde no haya prueba, `null`— y la razón de que ninguna ficha
 * nueva venga con la frase de «miles de opiniones verificadas».
 */
import fs from "node:fs";
import path from "node:path";
import { escribirBorrador } from "@/agents/atlas-researcher/borrador";
import type { HerramientaPropuesta } from "@/agents/atlas-researcher/tipos";

const D = path.join(process.cwd(), "data", "investigacion");
const ficha = JSON.parse(fs.readFileSync(path.join(D, "reservas-espanolas-2026-09-29", "ficha-completa.json"), "utf8"));
const extra = JSON.parse(fs.readFileSync(path.join(D, "reservas-espanolas-2026-09-29", "capacidades-y-limites.json"), "utf8"));
const porId = new Map<string, any>(extra.herramientas.map((h: any) => [h.id, h]));

for (const h of ficha.herramientas) {
  const e = porId.get(h.id)!;

  /**
   * `casosNoRecomendados` son los LÍMITES, no sectores excluidos: qué topa
   * aunque seas su cliente. Corrección de la propietaria, 2026-09-28.
   */
  const limites: string[] = e.limites.map((l: any) => l.texto);

  const datos: Partial<any> = {
    nombre: h.nombre,
    paginaOficial: h.paginaOficial,
    urlPrecios: h.urlPrecios,
    categoriaId: h.categoriaId,
    descripcion: h.descripcion,
    problemasQueResuelve: h.problemasQueResuelve,
    casosDeUso: h.casosDeUso,
    idealPara: h.idealPara,
    segmentosIdeales: e.segmentosIdeales,
    industriasIdeales: h.industriasIdeales,
    noRecomendadaPara: h.noRecomendadaPara ?? limites[0],
    casosNoRecomendados: limites,
    funcionesPrincipales: h.funcionesPrincipales,
    integraciones: h.integraciones,
    integracionesPrincipales: h.integracionesPrincipales,
    // Nadie publica lo fácil que es su producto. Sin prueba, no se pone.
    curvaDeAprendizaje: undefined,
    precioInicial: h.precioInicial,
    modeloDePrecio: [h.modeloDePrecio],
    tienePlanGratuito: e.tienePlanGratuito,
    preciosComprobados: h.preciosComprobados,
    planesComprobados: h.planesComprobados,
    idiomasDisponibles: h.idiomasDisponibles,
    disponibleEnEspanol: h.disponibleEnEspanol,
    tieneAppMovil: h.tieneAppMovil ?? undefined,
    tieneApiPublica: h.tieneApiPublica ?? undefined,
    puntuaciones: h.puntuaciones,
    metodologiaValoracion: h.metodologiaValoracion,
    ventajas: h.ventajas,
    inconvenientes: h.inconvenientes,
    informacionEmpresa: h.informacionEmpresa,
  };

  const propuesta: HerramientaPropuesta = {
    datos: datos as never,
    // La afiliación está aparcada desde el 2026-09-17: ni se investiga ni se menciona.
    datosAfiliados: {},
    // Lo que falta a propósito: no se puede demostrar, así que no se inventa.
    camposFaltantes: ["curvaDeAprendizaje", "puntuaciones", "reputacion"],
    fuentes: [h.paginaOficial, h.urlPrecios],
    confianza: "alta",
    advertencias: [],
  };

  const r = escribirBorrador(h.id, propuesta);
  console.log(`${h.id.padEnd(10)} → ${path.relative(process.cwd(), r.rutaHerramienta)}`);
}
