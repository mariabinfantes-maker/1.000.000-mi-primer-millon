import { describe, expect, it } from "vitest";
import { getHerramientas } from "@/data/repositorio";
import { recomendarHerramientas } from "../motor";
import { perfilesDePrueba } from "./perfiles";
import {
  PREGUNTAS_DIFERENCIACION,
  cobertaraDeOpciones,
  filtrarPorNecesidad,
  preguntaParaAmbito,
} from "../preguntasDiferenciacion";
import { cubreCategoria, cubreSubtipo } from "@/data/taxonomia";
import type { RespuestasUsuario } from "../tipos";

/**
 * Piloto de preguntas adaptativas — subtipo "escritura".
 *
 * Lo que estas pruebas tienen que demostrar no es que la pregunta funcione:
 * es que **no hace trampa**. Repartir visibilidad habría sido trivial —
 * bastaba con rotar ganadores— y habría sido mentirle a quien pregunta. Aquí
 * se comprueba que cada herramienta gana porque su propia ficha declara la
 * capacidad que la persona pidió, y que ninguna gana de otra forma.
 */

const herramientas = (await getHerramientas()).filter((h) => h.estado === "activo");
const pregunta = PREGUNTAS_DIFERENCIACION[0];
const escritura = herramientas.filter((h) => cubreSubtipo(h, "escritura"));

const AMBITO = { categoriaId: "asistentes-ia", subtipoId: "escritura" } as const;

/** Las candidatas de un ámbito: su subtipo si lo tiene, o la categoría entera. */
function candidatasDe(p: (typeof PREGUNTAS_DIFERENCIACION)[number]) {
  return p.subtipoId
    ? herramientas.filter((h) => cubreSubtipo(h, p.subtipoId!))
    : herramientas.filter((h) => cubreCategoria(h, p.categoriaId));
}
const baseDe = (p: (typeof PREGUNTAS_DIFERENCIACION)[number]): RespuestasUsuario => ({
  categoriaId: p.categoriaId,
  subtipoId: p.subtipoId,
});

describe("la pregunta solo existe donde se declaró", () => {
  it("aparece en el subtipo escritura", () => {
    expect(preguntaParaAmbito("asistentes-ia", "escritura")).toBeDefined();
  });

  it("NO aparece en ningún otro ámbito del catálogo", () => {
    // Los ámbitos SIN pregunta declarada: gestión de proyectos se queda fuera
    // a propósito (75% de concentración, por debajo del umbral del 90%).
    const otros: [string, string | undefined][] = [
      ["asistentes-ia", "video"],
      ["asistentes-ia", "agenda-planificacion"],
      ["asistentes-ia", "presentaciones"],
      ["asistentes-ia", undefined],
      ["gestion-proyectos", undefined],
      ["plataformas-todo-en-uno", undefined],
      ["crm", "escritura"],
    ];
    for (const [categoriaId, subtipoId] of otros) {
      expect(preguntaParaAmbito(categoriaId, subtipoId), `${categoriaId}/${subtipoId}`).toBeUndefined();
    }
  });

  it("cada ámbito tiene como mucho UNA pregunta", () => {
    const ambitos = PREGUNTAS_DIFERENCIACION.map((p) => p.ambito);
    expect(new Set(ambitos).size).toBe(ambitos.length);
  });
});

describe("cada respuesta filtra por una capacidad declarada, no por un nombre", () => {
  it("ninguna opción menciona un identificador de herramienta", () => {
    const fuente = JSON.stringify(PREGUNTAS_DIFERENCIACION.map((p) => ({ ...p, opciones: p.opciones.map((o) => ({ ...o, senal: String(o.senal) })) })));
    for (const h of herramientas) {
      expect(fuente.includes(h.id), `la pregunta nombra a ${h.id}`).toBe(false);
    }
  });

  it("cada opción de CADA ámbito la cubre al menos una ficha, por su propio texto", () => {
    for (const p of PREGUNTAS_DIFERENCIACION)
      for (const { opcionId, herramientaIds } of cobertaraDeOpciones(candidatasDe(p), p))
        expect(herramientaIds.length, `nadie declara "${opcionId}" en ${p.ambito}`).toBeGreaterThan(0);
  });

  it("las opciones de cada ámbito seleccionan conjuntos distintos: ninguna es decorado", () => {
    for (const p of PREGUNTAS_DIFERENCIACION) {
      const conjuntos = cobertaraDeOpciones(candidatasDe(p), p).map((c) => c.herramientaIds.join("|"));
      expect(new Set(conjuntos).size, p.ambito).toBe(conjuntos.length);
    }
  });

  it("cada respuesta CAMBIA de verdad el conjunto de candidatas", () => {
    for (const p of PREGUNTAS_DIFERENCIACION) {
      const todas = candidatasDe(p);
      for (const opcion of p.opciones) {
        const filtradas = filtrarPorNecesidad(todas, p, opcion.id);
        expect(filtradas.seAplico, `${p.ambito}/${opcion.id} no se aplica`).toBe(true);
        expect(filtradas.candidatas.length, `${p.ambito}/${opcion.id} no reduce nada`).toBeLessThan(todas.length);
      }
    }
  });
});

describe("las tres pueden ganar cuando el perfil encaja de verdad", () => {
  const base: RespuestasUsuario = { ...AMBITO, tamanoEmpresa: "11-50", presupuesto: "medio" };

  it("en cada ámbito, ninguna ganadora es promocionada", () => {
    for (const p of PREGUNTAS_DIFERENCIACION) {
      const ranking = recomendarHerramientas(baseDe(p), herramientas).todas.map((e) => e.herramienta.id);
      const cobertura = cobertaraDeOpciones(candidatasDe(p), p);
      for (const opcion of p.opciones) {
        const declaran = cobertura.find((c) => c.opcionId === opcion.id)!.herramientaIds;
        const esperada = ranking.find((id) => declaran.includes(id));
        const { top } = recomendarHerramientas({ ...baseDe(p), necesidadDelSubtipo: opcion.id }, herramientas, { cantidad: 1 });
        expect(top[0]?.herramienta.id, `${p.ambito}/${opcion.id} promociona a alguien`).toBe(esperada);
      }
    }
  });

  it("cada respuesta produce una ganadora distinta", () => {
    const ganadoras = pregunta.opciones.map((opcion) => {
      const { top } = recomendarHerramientas({ ...base, necesidadDelSubtipo: opcion.id }, herramientas, { cantidad: 1 });
      return top[0]?.herramienta.id;
    });
    expect(ganadoras.every(Boolean)).toBe(true);
    expect(new Set(ganadoras).size, `ganadoras: ${ganadoras.join(", ")}`).toBe(pregunta.opciones.length);
  });

  it("y lo hace con TODOS los perfiles válidos, no solo con uno afortunado", () => {
    for (const opcion of pregunta.opciones) {
      const ganadoras = new Set<string>();
      for (const perfil of perfilesDePrueba({ ...AMBITO, necesidadDelSubtipo: opcion.id })) {
        const { top } = recomendarHerramientas(perfil, herramientas, { cantidad: 1 });
        if (top[0]) ganadoras.add(top[0].herramienta.id);
      }
      // Dentro de una necesidad concreta el conjunto es pequeño y estable:
      // lo que importa es que la ganadora sea SIEMPRE una que declara esa
      // capacidad, nunca otra colada por puntuación general.
      const quienesDeclaran = new Set(
        cobertaraDeOpciones(escritura, pregunta).find((c) => c.opcionId === opcion.id)!.herramientaIds
      );
      for (const id of ganadoras) expect(quienesDeclaran.has(id), `${id} gana "${opcion.id}" sin declararlo`).toBe(true);
    }
  });

  it("nadie es promocionado: gana quien ya iba primero entre las que declaran esa capacidad", () => {
    // Esta es la prueba que impide el truco. Repartir visibilidad habría sido
    // trivial: rotar ganadores. Aquí se exige que la ganadora de cada
    // respuesta sea EXACTAMENTE la que ya iba más arriba, en el ranking sin
    // filtrar, entre las que declaran esa capacidad por su propia ficha.
    const rankingSinFiltrar = recomendarHerramientas(base, herramientas).todas.map((e) => e.herramienta.id);

    for (const opcion of pregunta.opciones) {
      const declaran = cobertaraDeOpciones(escritura, pregunta).find((c) => c.opcionId === opcion.id)!.herramientaIds;
      const esperada = rankingSinFiltrar.find((id) => declaran.includes(id));
      const { top } = recomendarHerramientas({ ...base, necesidadDelSubtipo: opcion.id }, herramientas, { cantidad: 1 });
      expect(top[0]?.herramienta.id, `"${opcion.id}" promociona a alguien`).toBe(esperada);
    }
  });

  it("y tampoco se reordena a las supervivientes entre sí", () => {
    const rankingSinFiltrar = recomendarHerramientas(base, herramientas).todas.map((e) => e.herramienta.id);
    for (const opcion of pregunta.opciones) {
      const conFiltro = recomendarHerramientas({ ...base, necesidadDelSubtipo: opcion.id }, herramientas).todas.map(
        (e) => e.herramienta.id
      );
      const mismasEnOrdenOriginal = rankingSinFiltrar.filter((id) => conFiltro.includes(id));
      expect(conFiltro, `"${opcion.id}" cambia el orden relativo`).toEqual(mismasEnOrdenOriginal);
    }
  });

  it("la puntuación absoluta puede variar con el conjunto, y eso ya pasaba antes", () => {
    // Varios criterios son RELATIVOS a las competidoras (cobertura útil,
    // relevancia frente a las demás). Al estrecharse el conjunto cambian, y
    // eso ocurría ya con los filtros de categoría y de subtipo mucho antes de
    // este piloto: Grammarly puntúa 31 sin filtro, 30 en su categoría y 31 en
    // su subtipo. Lo que no puede pasar —y lo comprueban las dos pruebas de
    // arriba— es que ese movimiento cambie quién gana o el orden entre ellas.
    const enCategoria = recomendarHerramientas({ categoriaId: "asistentes-ia" }, herramientas).todas;
    const sinFiltro = recomendarHerramientas({}, herramientas).todas;
    const idsComunes = enCategoria.map((e) => e.herramienta.id);
    const algunaCambia = idsComunes.some(
      (id) =>
        enCategoria.find((e) => e.herramienta.id === id)!.puntuacionTotal !==
        sinFiltro.find((e) => e.herramienta.id === id)?.puntuacionTotal
    );
    expect(algunaCambia, "si esto falla, los criterios dejaron de ser relativos y hay que revisar el comentario").toBe(true);
  });
});

describe("nadie se queda sin recomendación", () => {
  it("si ninguna ficha declara la capacidad, se conserva el conjunto y se avisa", () => {
    const inventada = { ...pregunta, opciones: [{ id: "imposible", etiqueta: "x", descripcion: "x", senal: /qwertyzzz/ }] };
    const resultado = filtrarPorNecesidad(escritura, inventada, "imposible");
    expect(resultado.candidatas).toEqual(escritura);
    expect(resultado.seAplico).toBe(false);
    expect(resultado.aviso).toContain("no dejar a la persona sin recomendación");
  });

  it("una respuesta que no existe tampoco vacía nada", () => {
    const resultado = filtrarPorNecesidad(escritura, pregunta, "no-existe");
    expect(resultado.candidatas).toEqual(escritura);
    expect(resultado.seAplico).toBe(false);
  });

  it("contestar nunca deja el resultado vacío, con ningún perfil", () => {
    for (const opcion of [...pregunta.opciones.map((o) => o.id), "respuesta-basura"])
      for (const perfil of perfilesDePrueba({ ...AMBITO, necesidadDelSubtipo: opcion })) {
        const { top } = recomendarHerramientas(perfil, herramientas, { cantidad: 3 });
        expect(top.length, JSON.stringify(perfil)).toBeGreaterThan(0);
      }
  });
});

describe("no toca ningún otro recorrido", () => {
  it("las demás puertas dan exactamente el mismo resultado con y sin el campo", () => {
    const otras: RespuestasUsuario[] = [
      { categoriaId: "crm" },
      { categoriaId: "gestion-proyectos" },
      { categoriaId: "plataformas-todo-en-uno" },
      { categoriaId: "asistentes-ia" },
      { categoriaId: "asistentes-ia", subtipoId: "video" },
      { problemaIdsCandidatos: ["conseguir-clientes"] },
      { problemaIdsCandidatos: ["ahorrar-tiempo"] },
      { problemaIdsCandidatos: ["organizar-empresa"] },
      { problemaIdsCandidatos: ["automatizar-tareas"] },
      { problemaIdsCandidatos: ["atencion-cliente"] },
    ];
    for (const base of otras)
      for (const perfil of perfilesDePrueba(base)) {
        const sin = recomendarHerramientas(perfil, herramientas, { cantidad: 3 });
        const con = recomendarHerramientas({ ...perfil, necesidadDelSubtipo: "corregir" }, herramientas, { cantidad: 3 });
        expect(con.top.map((e) => e.herramienta.id), JSON.stringify(perfil)).toEqual(sin.top.map((e) => e.herramienta.id));
      }
  });
});
