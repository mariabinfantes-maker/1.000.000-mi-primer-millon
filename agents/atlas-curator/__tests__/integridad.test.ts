import { describe, expect, it } from "vitest";
import { getCategorias, getHerramientas, getProblemas } from "@/data/repositorio";
import { recomendarHerramientas } from "@/agents/atlas-advisor";
import { perfilesDePrueba } from "@/agents/atlas-advisor/__tests__/perfiles";
import {
  MINIMO_POR_OBJETIVO,
  UMBRAL_CONCENTRACION,
  detectarCategoriasSecundariasDesiguales,
  detectarConcentracion,
  detectarObjetivosContradictorios,
  detectarObjetivosSinCompetencia,
  detectarSinObjetivo,
  detectarSubtiposIncompletos,
} from "../integridad";
import { MINIMO_POR_SUBTIPO, SUBTIPOS_POR_CATEGORIA, cubreCategoria, esCategoriaPublica, subtiposDe } from "@/data/taxonomia";

/**
 * Las garantías del sprint de integridad del 2026-08-27.
 *
 * Estas pruebas corren contra el CATÁLOGO REAL, no contra fixtures. Es
 * deliberado: los tres agujeros que se encontraron aquel día (dos tercios
 * del catálogo sin objetivo, una sola herramienta con categorías
 * secundarias, una categoría que mezclaba productos no sustituibles) eran
 * todos invisibles ficha a ficha y solo se veían mirando el conjunto. Una
 * prueba con datos inventados los habría vuelto a pasar por alto.
 */

const herramientas = await getHerramientas();
const problemas = await getProblemas();
const categorias = await getCategorias();
const activas = herramientas.filter((h) => h.estado === "activo");

describe("garantía 1 — nadie se queda sin objetivo por descuido", () => {
  it("toda herramienta activa tiene objetivo o está marcada como pendiente", () => {
    const huerfanas = detectarSinObjetivo(activas);
    expect(huerfanas.map((h) => h.motivo)).toEqual([]);
  });

  it("lo que está pendiente lo está a propósito y de forma medible", () => {
    const pendientes = activas.filter((h) => h.objetivoPendienteDeInvestigacion);
    for (const h of pendientes) {
      expect(h.problemasIds ?? [], `${h.nombre} no puede tener objetivo Y estar pendiente`).toHaveLength(0);
    }
    // Se puede contar: es una deuda visible, no un silencio.
    expect(pendientes.length).toBeLessThan(activas.length * 0.1);
  });
});

describe("garantía 2 — ningún objetivo contradice una limitación central", () => {
  it("el catálogo no tiene asignaciones contradictorias", () => {
    expect(detectarObjetivosContradictorios(activas).map((h) => h.motivo)).toEqual([]);
  });

  it("la regla curada detecta el caso real que la originó", () => {
    const inventada = {
      ...activas[0],
      id: "prueba",
      nombre: "Prueba",
      problemasIds: ["automatizar-tareas"],
      inconvenientes: ["Pocas integraciones nativas directas, dependiendo de Zapier para otras herramientas"],
    };
    expect(detectarObjetivosContradictorios([inventada])).toHaveLength(1);
  });

  it("NO marca el falso positivo que tumbó la detección por palabras clave", () => {
    // "El CRM es menos potente que el de HubSpot" no es incompatible con
    // conseguir clientes: es un matiz de calidad, no una carencia nuclear.
    const inventada = {
      ...activas[0],
      id: "prueba",
      problemasIds: ["conseguir-clientes"],
      inconvenientes: ["El CRM es menos potente que el de especialistas como HubSpot o Pipedrive"],
    };
    expect(detectarObjetivosContradictorios([inventada])).toEqual([]);
  });
});

describe("garantía 4 — las categorías secundarias se aplican igual a todas las suites", () => {
  it("toda desigualdad detectada está registrada como investigación pendiente, no ignorada", () => {
    // No se exige cero: ClickFunnels, HoneyBook y Kartra declaran módulos de
    // CRM pero ninguna de sus funciones principales lo sustancia. Forzarles
    // una categoría secundaria sería inventar una capacidad; ocultar el aviso
    // sería peor. Se exige que estén contadas y explicadas.
    for (const hallazgo of detectarCategoriasSecundariasDesiguales(activas)) {
      expect(hallazgo.herramientaId).toBeTruthy();
      expect(hallazgo.motivo).toContain("categorías secundarias justificadas");
    }
  });

  it("toda suite compite donde se buscan suites", () => {
    for (const suite of activas.filter((h) => h.tipoProducto === "suite")) {
      expect(cubreCategoria(suite, "plataformas-todo-en-uno"), suite.nombre).toBe(true);
    }
  });

  it("ninguna categoría secundaria apunta a una categoría que no existe o no es pública", () => {
    const publicas = new Set(categorias.filter((c) => esCategoriaPublica(c)).map((c) => c.id));
    for (const h of activas)
      for (const id of h.categoriasSecundarias ?? [])
        expect(publicas.has(id), `${h.nombre} -> ${id}`).toBe(true);
  });
});

describe("garantía 5 — una categoría secundaria nunca aporta puntos", () => {
  it("la misma ficha puntúa igual con una categoría o con tres", () => {
    const suite = activas.find((h) => h.tipoProducto === "suite" && (h.categoriasSecundarias ?? []).length > 0)!;
    const sinExtras = { ...suite, categoriasSecundarias: [] };
    const conMuchas = { ...suite, categoriasSecundarias: ["crm", "gestion-proyectos", "asistentes-ia"] };

    // Se evalúan en su categoría principal, donde ambas versiones compiten.
    const perfil = { categoriaId: suite.categoriaId, tamanoEmpresa: "11-50" as const, presupuesto: "medio" as const };
    const catalogo = activas.filter((h) => h.id !== suite.id);

    const a = recomendarHerramientas(perfil, [...catalogo, sinExtras]).todas.find((e) => e.herramienta.id === suite.id);
    const b = recomendarHerramientas(perfil, [...catalogo, conMuchas]).todas.find((e) => e.herramienta.id === suite.id);

    expect(a?.puntuacionTotal).toBeDefined();
    expect(b?.puntuacionTotal).toBe(a?.puntuacionTotal);
  });
});

describe("garantía 6 — cobertura y competencia real por objetivo y subtipo", () => {
  it(`ningún objetivo baja de ${MINIMO_POR_OBJETIVO} alternativas`, () => {
    expect(detectarObjetivosSinCompetencia(activas, problemas).map((h) => h.motivo)).toEqual([]);
  });

  it("toda herramienta de una categoría con subtipos declara el suyo", () => {
    const sinDeclarar = detectarSubtiposIncompletos(activas).filter((h) => h.tipo === "subtipo_sin_declarar");
    expect(sinDeclarar.map((h) => h.motivo)).toEqual([]);
  });

  it(`los subtipos por debajo de ${MINIMO_POR_SUBTIPO} quedan registrados como deuda, no ocultos`, () => {
    const flojos = detectarSubtiposIncompletos(activas).filter((h) => h.tipo === "subtipo_sin_competencia");
    // No se exige que sean cero: se exige que estén contados y explicados.
    for (const f of flojos) expect(f.motivo).toContain("no se puede comparar");
  });
});

describe("garantía 3 — aviso de concentración, sin tocar ningún dato", () => {
  it("detecta cuando alguien gana casi todo un ámbito", () => {
    const ganadores = [
      ...Array.from({ length: 19 }, () => ({ ambito: "prueba", herramientaId: "a" })),
      { ambito: "prueba", herramientaId: "b" },
    ];
    const avisos = detectarConcentracion(ganadores);
    expect(avisos).toHaveLength(1);
    expect(avisos[0].proporcion).toBeGreaterThanOrEqual(UMBRAL_CONCENTRACION);
  });

  it("no avisa cuando hay competencia de verdad", () => {
    const ganadores = [
      ...Array.from({ length: 6 }, () => ({ ambito: "prueba", herramientaId: "a" })),
      ...Array.from({ length: 4 }, () => ({ ambito: "prueba", herramientaId: "b" })),
    ];
    expect(detectarConcentracion(ganadores)).toEqual([]);
  });

  it("la concentración se mide DENTRO de cada subtipo, que es donde tiene sentido", () => {
    // Comparar quién gana "asistentes de IA" entero mezcla un corrector con
    // un generador de vídeo: eso es lo que los subtipos vinieron a evitar.
    // La medida útil es la de dentro de cada clase de producto.
    //
    // Hoy esta medida destapa un hueco real y aún sin resolver: incluso en
    // subtipos con 3 y 4 alternativas (escritura, reuniones), una sola gana
    // el 100% de los perfiles. No es un fallo de los subtipos — es que el
    // cuestionario pregunta tamaño de empresa y presupuesto, y ninguna de
    // esas dos cosas decide si necesitas Grammarly o Jasper. Falta una
    // pregunta que distinga, y añadirla es una decisión de producto.
    //
    // La prueba no falla por ello: avisar es su trabajo, y taparlo con un
    // reparto artificial sería empeorar una recomendación a propósito.
    const ganadores: { ambito: string; herramientaId: string }[] = [];
    for (const [categoriaId, subtipos] of Object.entries(SUBTIPOS_POR_CATEGORIA))
      for (const subtipo of subtipos)
        for (const perfil of perfilesDePrueba({ categoriaId, subtipoId: subtipo.id })) {
          const { top } = recomendarHerramientas(perfil, activas, { cantidad: 1 });
          if (top.length > 0) ganadores.push({ ambito: `${categoriaId}/${subtipo.id}`, herramientaId: top[0].herramienta.id });
        }

    const avisos = detectarConcentracion(ganadores);
    // Cada aviso tiene que ser accionable: ámbito, herramienta y proporción.
    for (const aviso of avisos) {
      expect(aviso.ambito).toContain("/");
      expect(aviso.herramientaId).toBeTruthy();
      expect(aviso.proporcion).toBeGreaterThanOrEqual(UMBRAL_CONCENTRACION);
    }
    // Y ninguno puede pasar inadvertido: si algún día no queda ninguno,
    // querrá decir que se añadió la pregunta que faltaba.
    expect(avisos.every((a) => a.motivo.includes("no están distinguiendo"))).toBe(true);
  });

  it("las categorías del catálogo real quedan medidas y los avisos son legibles", () => {
    const ganadores: { ambito: string; herramientaId: string }[] = [];
    for (const categoria of categorias.filter((c) => esCategoriaPublica(c)))
      for (const perfil of perfilesDePrueba({ categoriaId: categoria.id })) {
        const { top } = recomendarHerramientas(perfil, activas, { cantidad: 1 });
        if (top.length > 0) ganadores.push({ ambito: categoria.id, herramientaId: top[0].herramienta.id });
      }
    // Es un AVISO, no una prohibición: no cambia ni una puntuación. Se
    // comprueba que se pueda leer y actuar sobre él.
    for (const aviso of detectarConcentracion(ganadores)) {
      expect(aviso.proporcion).toBeGreaterThanOrEqual(UMBRAL_CONCENTRACION);
      expect(aviso.motivo).toContain("los criterios no están distinguiendo");
    }
  });
});

describe("garantía adicional — los subtipos impiden la comparación absurda", () => {
  it("quien no dice qué tipo de asistente busca recibe uno de cada clase, no tres correctores", () => {
    const subtipos = SUBTIPOS_POR_CATEGORIA["asistentes-ia"].map((s) => s.id);
    for (const perfil of perfilesDePrueba({ categoriaId: "asistentes-ia" })) {
      const { top } = recomendarHerramientas(perfil, activas, { cantidad: 3 });
      const vistos = top.flatMap((e) => subtiposDe(e.herramienta)).filter((id) => subtipos.includes(id));
      expect(new Set(vistos).size, JSON.stringify(perfil)).toBe(vistos.length);
    }
  });
});
