import { describe, expect, it } from "vitest";
import { getTodasLasHerramientas, getProblemas } from "@/data/repositorio";
import { detectarProblemasPorTexto } from "../deteccionProblema";
import { recomendarHerramientas } from "../motor";

/**
 * Regresión del fallo del 2026-09-02, encontrado por la propietaria
 * probando Molnip en producción como una usuaria cualquiera:
 *
 *   «Soy peluquera, tengo entre 1 y 10 empleados y estoy perdiendo citas»
 *   → Grammarly (100/100), Canva y Reclaim.ai
 *
 * Ninguna de las tres gestiona citas. La detección determinista no entendió
 * la frase, `seleccionarCandidatas` devolvía el catálogo entero, y ganaba la
 * herramienta que mejor encaja en tamaño, precio, facilidad e idioma —
 * criterios que nunca preguntan si la herramienta sirve para algo.
 *
 * Estas pruebas fijan el comportamiento correcto: cuando Molnip no entiende
 * la necesidad, o cuando el catálogo no la cubre, NO recomienda. Dice que no.
 */

const HERRAMIENTAS = getTodasLasHerramientas();
const PROBLEMAS = getProblemas();

/** El recorrido real de la puerta "Cuéntanoslo": texto libre → detección → motor. */
function recomendarDesdeTextoLibre(texto: string, extra: Record<string, unknown> = {}) {
  const detectados = detectarProblemasPorTexto(texto, PROBLEMAS);
  return recomendarHerramientas(
    { problemaIdsCandidatos: detectados.length > 0 ? detectados : undefined, ...extra },
    HERRAMIENTAS
  );
}

describe("el caso de la peluquera", () => {
  const FRASE = "Soy peluquera, estoy perdiendo citas";

  it("no recomienda nada, en vez de recomendar cualquier cosa", () => {
    const r = recomendarDesdeTextoLibre(FRASE, { tamanoEmpresa: "1-10", industria: "peluquería" });
    expect(r.sinRecomendacion).toEqual({ tipo: "necesidad_no_entendida" });
    expect(r.top).toHaveLength(0);
  });

  it("nunca puede aparecer Grammarly ni Canva", () => {
    const r = recomendarDesdeTextoLibre(FRASE, { tamanoEmpresa: "1-10", industria: "peluquería" });
    const nombres = r.top.map((t) => t.herramienta.id);
    expect(nombres).not.toContain("grammarly");
    expect(nombres).not.toContain("canva");
  });

  it("no evalúa el catálogo entero por detrás", () => {
    const r = recomendarDesdeTextoLibre(FRASE, { tamanoEmpresa: "1-10" });
    // Antes: 62 de 62. La ausencia de resultado tiene que ser real, no
    // cosmética: si `todas` trajera el catálogo, cualquier pantalla futura
    // podría enseñarlo sin darse cuenta.
    expect(r.todas).toHaveLength(0);
  });
});

describe("frases cotidianas que la detección no comprende", () => {
  // Las ocho medidas el 2026-09-02. Ninguna puede abrir el catálogo entero.
  const NO_COMPRENDIDAS = [
    "Soy peluquera, estoy perdiendo citas",
    "Tengo una clínica dental y se me olvidan las citas de los pacientes",
    "Quiero vender mis productos por internet",
    "Llevo el control de mi almacén en papel",
    "Necesito contratar y llevar las nóminas",
    "Quiero hacerme una página web",
    "Tengo que firmar contratos a distancia",
    "Quiero conseguir más clientes",
  ];

  it.each(NO_COMPRENDIDAS)("«%s» no abre el catálogo entero", (frase) => {
    const r = recomendarDesdeTextoLibre(frase, { tamanoEmpresa: "1-10" });
    expect(r.top).toHaveLength(0);
    expect(r.sinRecomendacion?.tipo).toBe("necesidad_no_entendida");
  });

  it("ninguna preferencia de compra basta por sí sola para recomendar", () => {
    // "Prefiero una plataforma todo en uno" describe CÓMO quiere comprar,
    // no QUÉ necesita. Sin objetivo, no hay recomendación posible.
    for (const preferenciaSuite of ["todo_en_uno", "especializada"] as const) {
      const r = recomendarHerramientas({ preferenciaSuite, tamanoEmpresa: "1-10" }, HERRAMIENTAS);
      expect(r.sinRecomendacion).toEqual({ tipo: "necesidad_no_entendida" });
      expect(r.top).toHaveLength(0);
    }
  });

  it("un cuestionario totalmente vacío tampoco recomienda", () => {
    const r = recomendarHerramientas({}, HERRAMIENTAS);
    expect(r.sinRecomendacion).toEqual({ tipo: "necesidad_no_entendida" });
  });
});

describe("objetivo entendido pero sin cobertura en el catálogo", () => {
  it("lo distingue de no haber entendido, y tampoco rellena", () => {
    // Un objetivo real de la taxonomía que ninguna ficha declara todavía.
    const inexistente = "objetivo-que-ninguna-herramienta-cubre";
    const r = recomendarHerramientas({ problemaIdsCandidatos: [inexistente] }, HERRAMIENTAS);
    expect(r.sinRecomendacion).toEqual({ tipo: "sin_cobertura", objetivoIds: [inexistente] });
    expect(r.top).toHaveLength(0);
  });
});

describe("los recorridos que ya funcionaban siguen funcionando", () => {
  it("por categoría: CRM sigue devolviendo tres", () => {
    const r = recomendarHerramientas({ categoriaId: "crm", tamanoEmpresa: "1-10" }, HERRAMIENTAS);
    expect(r.sinRecomendacion).toBeUndefined();
    expect(r.top).toHaveLength(3);
  });

  it("por categoría y subtipo: los cuatro subtipos nuevos siguen devolviendo tres", () => {
    for (const subtipoId of ["video", "agenda-planificacion", "presentaciones", "espacio-trabajo"]) {
      const r = recomendarHerramientas(
        { categoriaId: "asistentes-ia", subtipoId, tamanoEmpresa: "1-10" },
        HERRAMIENTAS
      );
      expect(r.sinRecomendacion, `subtipo ${subtipoId}`).toBeUndefined();
      expect(r.top, `subtipo ${subtipoId}`).toHaveLength(3);
    }
  });

  it("por objetivo: los cinco objetivos del catálogo siguen recomendando", () => {
    for (const problema of PROBLEMAS) {
      const r = recomendarHerramientas(
        { problemaIdsCandidatos: [problema.id], tamanoEmpresa: "1-10" },
        HERRAMIENTAS
      );
      expect(r.sinRecomendacion, `objetivo ${problema.id}`).toBeUndefined();
      expect(r.top.length, `objetivo ${problema.id}`).toBeGreaterThan(0);
    }
  });

  it("por texto libre comprendido: sigue recomendando con normalidad", () => {
    const r = recomendarDesdeTextoLibre("Se me escapan cosas y estoy desorganizado", { tamanoEmpresa: "1-10" });
    expect(r.sinRecomendacion).toBeUndefined();
    expect(r.top).toHaveLength(3);
  });

  it("una categoría sin herramientas devuelve vacío, no el catálogo entero", () => {
    // Comportamiento que ya existía y no debe cambiar: quien pide justo esa
    // categoría no recibe otra cosa a cambio.
    const r = recomendarHerramientas({ categoriaId: "reservas-citas" }, HERRAMIENTAS);
    expect(r.top).toHaveLength(0);
    expect(r.todas).toHaveLength(0);
  });
});
