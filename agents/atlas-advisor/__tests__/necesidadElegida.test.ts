import { describe, expect, it } from "vitest";
import { recomendarHerramientas } from "../motor";
import { NINGUNA_DE_ESTAS } from "../necesidades";
import { construirHerramienta } from "./fixtures";
import type { PuertaDeEvidencia, RespuestasUsuario } from "../tipos";

/**
 * La pregunta de aclaración dentro del motor — opción B, 2026-09-16.
 *
 * Aquí no se importa nada de `data/verificacion`: el motor recibe la puerta
 * por parámetro y estas pruebas la construyen a mano, igual que las de la
 * puerta por categoría. La conducta se comprueba aquí; que con los datos
 * reales pase lo que la simulación midió, en `data/verificacion/__tests__`.
 */

/** Una puerta que cree a quien esté en `demuestran`, para las capacidades listadas. */
function puertaDe(demuestran: Record<string, string[]>): PuertaDeEvidencia {
  return {
    filaDe: () => undefined,
    loDemuestra: (h, c) => (demuestran[h] ?? []).includes(c),
  };
}

const ids = (r: { todas: { herramienta: { id: string } }[] }) => r.todas.map((e) => e.herramienta.id).sort();

// Un catálogo donde las etiquetas de objetivo mienten a propósito: la que
// reserva citas está etiquetada como «organizar», no como «ahorrar tiempo».
const catalogo = [
  construirHerramienta({ id: "reserva-etiquetada-mal", nombre: "R", categoriaId: "crm", problemasIds: ["organizar-empresa"] }),
  construirHerramienta({ id: "corrector", nombre: "C", categoriaId: "asistentes-ia", problemasIds: ["ahorrar-tiempo"] }),
  construirHerramienta({ id: "suite-que-reserva", nombre: "S", categoriaId: "plataformas-todo-en-uno", problemasIds: ["ahorrar-tiempo"] }),
];
const puerta = puertaDe({
  "reserva-etiquetada-mal": ["cap.online_self_service_booking"],
  "suite-que-reserva": ["cap.online_self_service_booking"],
  corrector: ["cap.text_correction"],
});
const perfil: RespuestasUsuario = { problemaIdsCandidatos: ["ahorrar-tiempo"], tamanoEmpresa: "1-10" };

describe("la necesidad elegida activa la puerta sobre TODO el catálogo", () => {
  it("pasa quien la demuestra aunque su etiqueta de objetivo sea otra", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia: puerta });
    expect(ids(r)).toEqual(["reserva-etiquetada-mal", "suite-que-reserva"]);
  });

  it("y no pasa quien no la demuestra, por muy bien etiquetada que esté", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo, { evidencia: puerta });
    expect(ids(r)).not.toContain("corrector");
  });

  it("sin la pregunta, el motor sigue como antes: por etiqueta de objetivo", () => {
    const r = recomendarHerramientas(perfil, catalogo, { evidencia: puerta });
    expect(ids(r)).toEqual(["corrector", "suite-que-reserva"]);
  });

  it("sin puerta no hay nada que comprobar, y el motor se comporta como antes", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "citas-reserva" }, catalogo);
    expect(ids(r)).toEqual(["corrector", "suite-que-reserva"]);
  });

  it("la preferencia de suite sigue aplicándose antes de la puerta", () => {
    const r = recomendarHerramientas(
      { ...perfil, necesidadElegida: "citas-reserva", preferenciaSuite: "todo_en_uno" },
      catalogo,
      { evidencia: puerta }
    );
    expect(ids(r)).toEqual(["suite-que-reserva"]);
  });

  it("una fila que agrupa capacidades pasa con cualquiera de ellas", () => {
    const dos = [
      construirHerramienta({ id: "web", nombre: "W", problemasIds: ["conseguir-clientes"] }),
      construirHerramienta({ id: "landing", nombre: "L", problemasIds: ["conseguir-clientes"] }),
      construirHerramienta({ id: "ninguna", nombre: "N", problemasIds: ["conseguir-clientes"] }),
    ];
    const p = puertaDe({ web: ["cap.website_builder"], landing: ["cap.landing_pages"] });
    const r = recomendarHerramientas(
      { problemaIdsCandidatos: ["conseguir-clientes"], necesidadElegida: "web-o-captacion" },
      dos,
      { evidencia: p }
    );
    expect(ids(r)).toEqual(["landing", "web"]);
  });

  it("la entrada por categoría ignora la necesidad elegida: no es su pregunta", () => {
    const con = recomendarHerramientas({ categoriaId: "crm", necesidadElegida: "citas-reserva" }, catalogo, { evidencia: puerta });
    const sin = recomendarHerramientas({ categoriaId: "crm" }, catalogo, { evidencia: puerta });
    expect(ids(con)).toEqual(ids(sin));
  });
});

describe("cuando no hay nada que recomendar, se dice cuál es el motivo", () => {
  it("«ninguna de éstas» no devuelve el catálogo entero ni nada genérico", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: NINGUNA_DE_ESTAS }, catalogo, { evidencia: puerta });
    expect(r.top).toEqual([]);
    expect(r.todas).toEqual([]);
    expect(r.sinRecomendacion).toEqual({ tipo: "ninguna_de_estas", objetivoId: "ahorrar-tiempo" });
  });

  it("una necesidad que nadie ha demostrado se nombra, en palabras de la persona", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "actas" }, catalogo, { evidencia: puerta });
    expect(r.top).toEqual([]);
    expect(r.sinRecomendacion).toMatchObject({
      tipo: "necesidad_sin_cobertura",
      objetivoId: "ahorrar-tiempo",
      necesidadId: "actas",
      necesidad: "Sacar el acta y los acuerdos de una reunión",
    });
  });

  it("un id que no es de este objetivo no se interpreta: no se cae al catálogo", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "captar-datos" }, catalogo, { evidencia: puerta });
    expect(r.todas).toEqual([]);
    expect(r.sinRecomendacion).toEqual({ tipo: "necesidad_no_entendida" });
  });

  it("un id inventado tampoco", () => {
    const r = recomendarHerramientas({ ...perfil, necesidadElegida: "lo-que-sea" }, catalogo, { evidencia: puerta });
    expect(r.sinRecomendacion).toEqual({ tipo: "necesidad_no_entendida" });
  });
});
