import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { evaluarHerramienta, recomendarHerramientas } from "../motor";
import type { PuertaDeEvidencia, RespuestasUsuario } from "../tipos";

/**
 * La vara de medir no se mueve.
 *
 * Dos criterios de ruta comparan contra una media —`profundidadFuncional`
 * contra sus iguales, `superioridadFrenteAlModulo` contra las suites—. Durante
 * meses esa media se calculó sobre **las candidatas que quedaban vivas** en
 * cada consulta, y eso tenía una consecuencia que nadie había querido: cada
 * vez que un filtro apartaba a una herramienta, la nota de todas las demás
 * cambiaba.
 *
 * Nos mordió dos veces en dos días, y las dos veces se descubrió por
 * casualidad al tocar otra cosa:
 *
 * 1. Al comprobar el plan gratuito de Nimble en su web, Nimble adelantó a
 *    Salesflare en `captura-sola` — no por Nimble, sino porque al filtrar por
 *    la necesidad el conjunto encogía y Salesflare perdía puntos.
 * 2. Al quitarle los puntos al plan gratuito, la puerta de evidencia pasó a
 *    cambiar un resultado de 3.240 en gestión de proyectos: apartaba a
 *    Zoho One y a Odoo —que sí carecen de evidencia ahí— y de rebote hundía a
 *    Zenkit, que no tenía nada que ver, por debajo de monday.com.
 *
 * Desde el 2026-09-18 la vara es el catálogo entero que recibe el motor.
 * «Llega más a fondo que sus alternativas» es una propiedad de la herramienta
 * frente a su mercado, no frente a quien haya sobrevivido a los filtros de hoy.
 *
 * OJO con lo que estas pruebas NO dicen: si cambia el catálogo —entra o sale
 * una herramienta— la vara cambia, y debe cambiar. Lo que no puede moverla es
 * un filtro de la consulta.
 */

const catalogo = getHerramientas();

/**
 * Una puerta de mentira que aparta a dos herramientas concretas de gestión de
 * proyectos, que es lo que hace la de verdad con Zoho One y Odoo.
 *
 * De mentira a propósito: la verificación entra al proyecto por un solo sitio
 * autorizado (ver `data/verificacion/__tests__/aislamiento.test.ts`), y una
 * prueba del motor no es ese sitio. Aquí lo que se comprueba es la CONDUCTA
 * del motor cuando algo aparta candidatas, y para eso una puerta inventada
 * vale igual y no rompe el aislamiento.
 */
const APARTADAS = ["zoho-one", "odoo"];
const puertaQueAparta: PuertaDeEvidencia = {
  filaDe: (categoriaId) =>
    categoriaId === "gestion-proyectos"
      ? { ambito: "gestion-proyectos", necesidad: "planificar el trabajo", exigeAlgunaDe: ["cap.prueba"] }
      : undefined,
  loDemuestra: (herramientaId) => !APARTADAS.includes(herramientaId),
};

/** Las notas de una consulta, por herramienta. */
function notasDe(respuestas: RespuestasUsuario, opciones = {}) {
  return new Map(
    recomendarHerramientas(respuestas, catalogo, opciones).todas.map((e) => [e.herramienta.id, e.puntuacionTotal])
  );
}

function desviaciones(sinFiltro: Map<string, number>, conFiltro: Map<string, number>) {
  return [...conFiltro].flatMap(([id, nota]) =>
    sinFiltro.has(id) && sinFiltro.get(id) !== nota ? [`${id}: ${sinFiltro.get(id)} → ${nota}`] : []
  );
}

describe("ningún filtro de la consulta mueve la vara de medir", () => {
  it("la puerta de evidencia aparta a unas y no toca la nota de las otras", () => {
    const respuestas: RespuestasUsuario = { categoriaId: "gestion-proyectos", tamanoEmpresa: "51-200" };
    const sin = notasDe(respuestas);
    const con = notasDe(respuestas, { evidencia: puertaQueAparta });

    // Que de verdad aparte a alguien: si no, la prueba no probaría nada.
    expect(con.size).toBeLessThan(sin.size);
    expect(
      desviaciones(sin, con),
      "apartar a otras les ha movido la nota: la vara se está calculando sobre las candidatas"
    ).toEqual([]);
  });

  /**
   * La comprobación directa de que el motor pasa el catálogo entero y no las
   * candidatas: la nota que saca una herramienta dentro de una consulta
   * filtrada tiene que ser exactamente la que saca medida contra todo.
   *
   * (No se prueba con el filtro de idioma: pasar `idiomaNecesario` no sólo
   * aparta candidatas, también suma los puntos del criterio de idioma, así
   * que la diferencia no diría nada sobre la vara.)
   */
  it("la nota dentro de una consulta filtrada es la misma que medida contra todo el catálogo", () => {
    const respuestas: RespuestasUsuario = { categoriaId: "gestion-proyectos", tamanoEmpresa: "51-200" };
    const resultado = recomendarHerramientas(respuestas, catalogo, { evidencia: puertaQueAparta });

    const desviadas = resultado.todas.flatMap((e) => {
      const aSolas = evaluarHerramienta(e.herramienta, respuestas, catalogo);
      return aSolas.puntuacionTotal === e.puntuacionTotal
        ? []
        : [`${e.herramienta.id}: ${e.puntuacionTotal} dentro, ${aSolas.puntuacionTotal} contra el catálogo`];
    });

    expect(resultado.todas.length).toBeGreaterThan(0);
    expect(desviadas, "el motor está pasando las candidatas como vara en vez del catálogo").toEqual([]);
  });

  it("ni filtrar por la necesidad concreta dentro de un ámbito", () => {
    const base: RespuestasUsuario = { categoriaId: "asistentes-ia", subtipoId: "escritura" };
    const sin = notasDe(base);
    const con = notasDe({ ...base, necesidadDelSubtipo: "texto-largo" });

    expect(con.size).toBeLessThanOrEqual(sin.size);
    expect(desviaciones(sin, con)).toEqual([]);
  });
});
