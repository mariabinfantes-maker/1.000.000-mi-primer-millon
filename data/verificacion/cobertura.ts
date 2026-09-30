import { getCapacidades, getCapacidadesDeDominio, getVocabulario } from "@/data/vocabulario/repositorio";
import { evidenciaDeRegistro } from "./evidencia";
import { getRegistros } from "./repositorio";
import type { RegistroVerificacion } from "./esquema";

/**
 * EL MAPA DEL AGUJERO — qué necesidades sabe cubrir Molnip y cuáles no.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  ESTO ES UN INFORME PARA DECIDIR QUÉ INVESTIGAR.                     │
 * │  NADA DEL MOTOR PUEDE CONSUMIRLO, Y NO ES UN DESCUIDO.               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * **Cubrir más capacidades NO significa encajar mejor con quien pregunta.**
 * Con la matriz al 7 % —8.268 de 9.815 pares nunca preguntados— ordenar por
 * «cuántas cubre» mediría cuánto hemos mirado nosotros, no lo que hace la
 * herramienta: la que tiene 21 capacidades verificadas ganaría a la que tiene
 * 3 porque a alguien le tocó comprobarla más. Sería publicar nuestro propio
 * proceso disfrazado de hecho, que es justo el error del que salió la sección
 * «MOLNIP ES UN INTERMEDIARIO» de ATLAS.md.
 *
 * Como FILTRO la evidencia sí vale y el motor ya la usa —«¿demuestra al menos
 * una de las que esta ruta exige?» es un sí o un no al que no le afecta que la
 * matriz esté hueca—. Lo que no vale es contar para ordenar.
 *
 * Si algún día alguien quiere que el motor lea de aquí, que tenga que borrar
 * este recuadro a mano y justificarlo en el diff. Condición de la propietaria
 * al autorizarlo (2026-09-22): «ese recuento serviría para investigar, no para
 * decidir automáticamente qué recomendar».
 *
 * POR QUÉ VIVE AQUÍ Y NO EN `lib/`. Cruzar vocabulario y evidencia obliga a
 * leer los dos, y las dos guardas de aislamiento sólo lo permiten desde
 * `data/verificacion`: `data/vocabulario/__tests__/aislamiento.test.ts` la
 * autoriza como lectora del vocabulario, y `data/verificacion/__tests__/
 * aislamiento.test.ts` ignora su propio directorio. Ponerlo en cualquier otro
 * sitio rompería una de las dos, y romperlas es una decisión, no un efecto
 * secundario.
 *
 * LO QUE DISTINGUE, Y ES TODO EL VALOR DEL MÓDULO. Un cero no es un cero:
 *
 *  - `demostrada`   → hay evidencia de que lo hace;
 *  - `descartada`   → hay evidencia de que NO lo hace;
 *  - `desconocida`  → se preguntó y la página no lo demostró;
 *  - `sinPreguntar` → NUNCA SE PREGUNTÓ.
 *
 * Los cuatro NO se deducen aquí: salen de `evidenciaDeRegistro()`, que es la
 * única lectura autorizada de la verificación. Contarlos por `estado` a mano
 * parece igual y no lo es: `estado: "verificado"` con
 * `profundidad: "no_disponible"` es evidencia de que la herramienta NO lo
 * hace, y leerlo como demostrado fue el bloqueante que encontró la revisión
 * del 2026-09-10 en la puerta de F3 —promovía justo la herramienta que sabía
 * que no servía—. Un informe que contara mal por el mismo motivo mandaría a
 * investigar lo que ya está contestado.
 *
 * Las dos últimas se veían iguales desde fuera y no lo son. El 2026-09-22 se
 * presentaron a la propietaria varias capacidades «a cero» —TPV, contabilidad,
 * impuestos, publicar en redes, firma electrónica— como si fueran huecos del
 * catálogo. Las cuatro estaban a 0 verificadas, 0 desconocidas y **65 de 65
 * sin preguntar**: no sabíamos que no las hacía nadie, sabíamos que no lo
 * habíamos preguntado. Lo cazó ella. Este módulo existe para que esa confusión
 * no vuelva a depender de quién mire la tabla.
 */

/** Lo que se sabe de un par herramienta×capacidad. Cuatro estados, no dos. */
export type EstadoDeCobertura = "demostrada" | "descartada" | "desconocida" | "sinPreguntar";

export type CoberturaDeCapacidad = {
  capacidadId: string;
  etiqueta: string;
  dominioId: string;
  /** Herramientas con evidencia de que SÍ lo hace. */
  demuestran: string[];
  /** Herramientas con evidencia de que NO lo hace. */
  descartan: string[];
  /** Se preguntó y la página no lo demostró. */
  desconocidas: string[];
  /** Nunca se preguntó. Suele ser el grupo más grande con diferencia. */
  sinPreguntar: number;
};

export type CoberturaDeDominio = {
  dominioId: string;
  nombre: string;
  areaId: string;
  capacidades: CoberturaDeCapacidad[];
  /** Cuántas de sus capacidades tienen al menos una herramienta que las demuestre. */
  conAlgunaHerramienta: number;
  /** Cuántas no tiene NADIE demostradas. Ojo: puede ser por no haber preguntado. */
  sinNingunaHerramienta: number;
  /** Cuántas capacidades no se preguntaron a NINGUNA herramienta. El hueco de verdad. */
  jamasPreguntadas: number;
  /** Herramientas distintas que demuestran algo de este dominio. */
  herramientas: number;
};

export type MapaDeCobertura = {
  versionDelVocabulario: string;
  totalHerramientas: number;
  totalCapacidades: number;
  /** Pares posibles = herramientas × capacidades. */
  paresPosibles: number;
  paresPreguntados: number;
  paresDemostrados: number;
  paresJamasPreguntados: number;
  areas: { areaId: string; nombre: string; dominios: CoberturaDeDominio[] }[];
};

/**
 * La cobertura de UNA capacidad.
 *
 * `herramientaIds` es el universo contra el que se mide: sin él no se puede
 * saber cuántas no se preguntaron, que es el dato que más cuesta ver y el que
 * más se confunde.
 */
export function coberturaDeCapacidad(
  capacidadId: string,
  herramientaIds: readonly string[],
  registros: readonly RegistroVerificacion[]
): CoberturaDeCapacidad {
  const capacidad = getCapacidades().find((c) => c.id === capacidadId);
  const porHerramienta = new Map<string, RegistroVerificacion>();
  for (const r of registros) if (r.capacidadId === capacidadId) porHerramienta.set(r.herramientaId, r);

  const cobertura: CoberturaDeCapacidad = {
    capacidadId,
    etiqueta: capacidad?.etiqueta ?? capacidadId,
    dominioId: capacidad?.dominioId ?? "",
    demuestran: [],
    descartan: [],
    desconocidas: [],
    sinPreguntar: 0,
  };

  for (const herramientaId of herramientaIds) {
    switch (estadoDelPar(herramientaId, capacidadId, porHerramienta.get(herramientaId))) {
      case "demostrada":
        cobertura.demuestran.push(herramientaId);
        break;
      case "descartada":
        cobertura.descartan.push(herramientaId);
        break;
      case "desconocida":
        cobertura.desconocidas.push(herramientaId);
        break;
      case "sinPreguntar":
        cobertura.sinPreguntar += 1;
        break;
    }
  }

  return cobertura;
}

/**
 * Qué sabemos de un par concreto. Cuatro respuestas posibles, nunca dos.
 *
 * No decide nada por su cuenta: traduce el veredicto de `evidenciaDeRegistro()`
 * al vocabulario de este informe. Si mañana cambian las reglas de lectura de la
 * verificación, el recuento cambia con ellas y no se queda atrás.
 */
export function estadoDelPar(
  herramientaId: string,
  capacidadId: string,
  registro: RegistroVerificacion | undefined
): EstadoDeCobertura {
  const evidencia = evidenciaDeRegistro(herramientaId, capacidadId, registro);
  if (evidencia.estado === "demostrada") return "demostrada";
  if (evidencia.estado === "ausencia_demostrada") return "descartada";
  // `no_consta` con origen `sin_registro` es el par que nunca se preguntó.
  return evidencia.origen === "sin_registro" ? "sinPreguntar" : "desconocida";
}

/** La cobertura de un dominio entero, capacidad por capacidad. */
export function coberturaDeDominio(
  dominioId: string,
  herramientaIds: readonly string[],
  registros: readonly RegistroVerificacion[]
): CoberturaDeDominio {
  const dominio = getVocabulario().dominios.find((d) => d.id === dominioId);
  const capacidades = getCapacidadesDeDominio(dominioId)
    .filter((c) => c.estado === "activa")
    .map((c) => coberturaDeCapacidad(c.id, herramientaIds, registros));

  const herramientas = new Set<string>();
  for (const c of capacidades) for (const h of c.demuestran) herramientas.add(h);

  return {
    dominioId,
    nombre: dominio?.nombre ?? dominioId,
    areaId: dominio?.areaId ?? "",
    capacidades,
    conAlgunaHerramienta: capacidades.filter((c) => c.demuestran.length > 0).length,
    sinNingunaHerramienta: capacidades.filter((c) => c.demuestran.length === 0).length,
    // Ni una sola pregunta hecha sobre esa capacidad, a ninguna herramienta.
    jamasPreguntadas: capacidades.filter((c) => c.sinPreguntar === herramientaIds.length).length,
    herramientas: herramientas.size,
  };
}

/**
 * El mapa entero: las 5 áreas, sus dominios y la cobertura de cada uno.
 *
 * Es lo que contesta «¿qué hay detrás de cada puerta?» antes de decidir qué
 * categorías se abren y qué se manda a investigar. **No contesta cuál
 * recomendar**: para eso está la evidencia como filtro, no este recuento.
 */
export function mapaDeCobertura(herramientaIds: readonly string[]): MapaDeCobertura {
  const vocabulario = getVocabulario();
  const registros = getRegistros();
  const activas = vocabulario.capacidades.filter((c) => c.estado === "activa");

  const areas = vocabulario.areas.map((area) => ({
    areaId: area.id,
    nombre: area.nombre,
    dominios: vocabulario.dominios
      .filter((d) => d.areaId === area.id)
      .map((d) => coberturaDeDominio(d.id, herramientaIds, registros)),
  }));

  /**
   * Los totales se suman de la misma cuenta que se enseña por dominio, no de
   * `registros` en bruto. Si se contaran aparte, el titular y el desglose
   * podrían discrepar y nadie sabría cuál mirar.
   */
  let demostrados = 0;
  let jamasPreguntados = 0;
  for (const area of areas)
    for (const dominio of area.dominios)
      for (const capacidad of dominio.capacidades) {
        demostrados += capacidad.demuestran.length;
        jamasPreguntados += capacidad.sinPreguntar;
      }

  const posibles = herramientaIds.length * activas.length;

  return {
    versionDelVocabulario: vocabulario.version,
    totalHerramientas: herramientaIds.length,
    totalCapacidades: activas.length,
    paresPosibles: posibles,
    paresPreguntados: posibles - jamasPreguntados,
    paresDemostrados: demostrados,
    paresJamasPreguntados: jamasPreguntados,
    areas,
  };
}

/**
 * Las capacidades que nadie demuestra, ordenadas por lo que cuesta cerrarlas.
 *
 * Sirve para decidir a quién se pregunta primero — `sinPreguntar` alto quiere
 * decir que el hueco puede ser sólo nuestro y que una tanda lo resolvería.
 */
export function huecosPorInvestigar(
  herramientaIds: readonly string[],
  registros: readonly RegistroVerificacion[] = getRegistros()
): CoberturaDeCapacidad[] {
  return getCapacidades()
    .filter((c) => c.estado === "activa")
    .map((c) => coberturaDeCapacidad(c.id, herramientaIds, registros))
    .filter((c) => c.demuestran.length === 0)
    .sort((a, b) => b.sinPreguntar - a.sinPreguntar || a.etiqueta.localeCompare(b.etiqueta));
}
