import { describe, expect, it } from "vitest";
import {
  getCapacidades,
  getDominios,
  getRestricciones,
  getVocabulario,
  reclamaTerminoReservado,
  remitentesValidosDe,
} from "../repositorio";

/**
 * Que el vocabulario se sostenga por dentro: que nada apunte al vacío, que
 * nada se defina dos veces y que ninguna capacidad se coma una restricción.
 *
 * La última comprobación existe por un fallo real. `cap.field_job_capture`
 * llegó a definirse como «parte en el móvil: fotos, firma y sin cobertura»,
 * mientras el resto del diseño decía que el funcionamiento sin conexión vivía
 * en `req.offline_capable`. El mismo criterio contaba dos veces —una como
 * capacidad y otra como restricción— y lo detectó la propietaria leyendo, no
 * el sistema. Ahora lo detecta el sistema.
 */
describe("la coherencia interna del vocabulario", () => {
  const capacidades = getCapacidades();
  const dominios = getDominios();
  const restricciones = getRestricciones();
  const idsCapacidad = new Set(capacidades.map((c) => c.id));
  const idsDominio = new Set(dominios.map((d) => d.id));
  const idsRestriccion = new Set(restricciones.map((r) => r.id));

  it("las cifras aprobadas son exactamente estas", () => {
    // Fijadas a propósito: el vocabulario puede crecer, pero que crezca tiene
    // que ser una decisión, no un descuido. Cambiar estos números obliga a
    // tocar esta prueba, y eso obliga a explicar por qué.
    expect({
      areas: getVocabulario().areas.length,
      dominios: dominios.length,
      capacidades: capacidades.length,
    }).toEqual({ areas: 5, dominios: 23, capacidades: 146 });
  });

  it("cada dominio pertenece a un área que existe", () => {
    const areas = new Set(getVocabulario().areas.map((a) => a.id));
    expect(dominios.filter((d) => !areas.has(d.areaId)).map((d) => d.id)).toEqual([]);
  });

  it("cada capacidad vive en un dominio que existe", () => {
    expect(capacidades.filter((c) => !idsDominio.has(c.dominioId)).map((c) => c.id)).toEqual([]);
  });

  it("ningún dominio se queda vacío", () => {
    const ocupados = new Set(capacidades.map((c) => c.dominioId));
    expect(dominios.filter((d) => !ocupados.has(d.id)).map((d) => d.id)).toEqual([]);
  });

  it("toda capacidad dice qué es y qué no es", () => {
    const incompletas = capacidades
      .filter((c) => !c.definicion?.trim() || !c.noEs?.trim())
      .map((c) => c.id);
    expect(
      incompletas,
      "`noEs` es lo que evita que el vocabulario se degrade: sin frontera escrita, " +
        "cada capacidad nueva se solapa un poco con dos existentes y en un año nadie sabe cuál usar."
    ).toEqual([]);
  });

  it("`requiere` apunta siempre a una capacidad que existe", () => {
    const rotas = capacidades.flatMap((c) =>
      (c.requiere ?? []).filter((r) => !idsCapacidad.has(r)).map((r) => `${c.id} → ${r}`)
    );
    expect(rotas).toEqual([]);
  });

  it("ninguna capacidad se requiere a sí misma ni forma un ciclo", () => {
    const requiere = new Map(capacidades.map((c) => [c.id, c.requiere ?? []]));
    const ciclos: string[] = [];
    for (const inicio of requiere.keys()) {
      const visto = new Set<string>();
      const pila = [inicio];
      while (pila.length) {
        const actual = pila.pop()!;
        for (const siguiente of requiere.get(actual) ?? []) {
          if (siguiente === inicio) ciclos.push(inicio);
          else if (!visto.has(siguiente)) {
            visto.add(siguiente);
            pila.push(siguiente);
          }
        }
      }
    }
    expect(ciclos).toEqual([]);
  });

  it("`restriccionesTipicas` apunta siempre a una restricción que existe", () => {
    const rotas = capacidades.flatMap((c) =>
      (c.restriccionesTipicas ?? []).filter((r) => !idsRestriccion.has(r)).map((r) => `${c.id} → ${r}`)
    );
    expect(rotas).toEqual([]);
  });

  it("ninguna capacidad se apropia de lo que es una restricción", () => {
    const invasiones: string[] = [];
    for (const capacidad of capacidades) {
      for (const restriccion of restricciones) {
        for (const termino of restriccion.terminosReservados) {
          // La definición nunca puede mencionarlo: ahí describiría la
          // restricción como si fuera parte de la función.
          if (capacidad.definicion.toLowerCase().includes(termino.toLowerCase())) {
            invasiones.push(`${capacidad.id}.definicion reclama «${termino}» (${restriccion.id})`);
          }
          // En `noEs` sí puede aparecer, porque es donde se traza la frontera,
          // pero sólo si además dice dónde vive de verdad.
          if (reclamaTerminoReservado(capacidad.noEs, termino, remitentesValidosDe(restriccion.id))) {
            invasiones.push(
              `${capacidad.id}.noEs menciona «${termino}» sin remitir a ${restriccion.id} ` +
                "ni a ninguna capacidad que la lleve declarada"
            );
          }
        }
      }
    }
    expect(
      invasiones,
      "Un criterio no puede contar dos veces, como capacidad y como restricción. " +
        "Si la capacidad lo nombra, tiene que ser para decir que vive fuera de ella."
    ).toEqual([]);
  });

  it("toda restricción dice quién la impone de verdad", () => {
    const sinDueno = restricciones.filter((r) => !r.quienLaImpone?.trim()).map((r) => r.id);
    expect(
      sinDueno,
      "Sin este campo se acaba deduciendo la restricción del sector. Ya pasó: " +
        "presentar «clínica» como causa automática de datos en la UE habría descartado " +
        "herramientas perfectamente válidas para una consulta dental."
    ).toEqual([]);
  });

  it("las capacidades salidas de un borrador dejan constancia de dónde venían", () => {
    const sinOrigen = capacidades.filter((c) => !c.origenBorrador).map((c) => c.id);
    expect(sinOrigen).toEqual([]);
  });
});
