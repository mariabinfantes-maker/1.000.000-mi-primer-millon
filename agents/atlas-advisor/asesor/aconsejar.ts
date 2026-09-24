import { getTodasLasHerramientas } from "@/data/repositorio";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getEsqueleto } from "@/data/vocabulario/asesor";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";
import { buscar, type Solucion } from "./buscar";

/**
 * El paso 4 del asesor: ACONSEJAR.
 *
 * «Explica qué haría, por qué, qué alternativas tienes y qué sigue sin
 * comprobarse» (propietaria, 2026-09-24).
 *
 * Aquí NO se puntúa y NO se juzga a nadie. Las reglas viejas siguen mandando:
 * no somos jueces, de una herramienta que no encaja se dice que no está
 * pensada para ella, y el límite se cuenta sin pedir perdón. Y la de esta
 * fase: la IA puede conversar, pero **toda afirmación sobre una herramienta
 * sale de aquí**, que sólo lee datos verificados.
 */

/**
 * Lo que hay detrás de cada puerta de una herramienta.
 *
 * Las tres puertas salen del boceto de la propietaria (2026-09-24): «qué te
 * resuelve», «coste y puesta en marcha», «límites y fuentes». No son adorno:
 * cada una se llena con datos que ya tenemos y que hasta hoy no se enseñaban.
 *
 * La tercera es la que más importa. Es donde se ve CUÁNDO se comprobó cada
 * cosa y DÓNDE, con la frase literal de su página. Es la diferencia entre
 * «nos fiamos» y «míralo tú».
 */
export type QueResuelve = {
  /** La necesidad suya, con sus palabras. */
  necesidad: string;
  /**
   * Dónde y cuándo lo vimos. La frase literal existe y está en el registro,
   * pero el puerto de evidencia la deja fuera a propósito, así que aquí no se
   * inventa: se enlaza la página y se dice el día en que se abrió.
   */
  url?: string;
  fecha?: string;
};

export type Coste = {
  /** Tal cual lo dice el fabricante. No se traduce ni se redondea. */
  desde?: string;
  /** Cuándo se abrió esa página de precios, y cuál. Un precio sin fecha no vale. */
  comprobadoEl?: string;
  urlPrecios?: string;
  tienePlanGratuito?: boolean;
  curva?: string;
  enEspanol?: boolean;
};

export type Pieza = {
  herramientaId: string;
  nombre: string;
  /** Necesidades suyas que esta pieza cubre, con el título que ella entiende. */
  cubre: string[];
  /** En qué casas vive. Sirve para contar dónde se buscó, no para ordenar. */
  casas: string[];
  /** Puerta 1: qué te resuelve, con el recibo de cada cosa. */
  queResuelve: QueResuelve[];
  /** Puerta 2: coste y puesta en marcha. */
  coste: Coste;
  /**
   * Puerta 3: lo que falta por confirmar DE ESTA herramienta. Nunca se
   * convierte en «no lo hace»: dice qué no hemos podido comprobar.
   */
  faltaPorConfirmar: string[];
};

/**
 * UN CAMINO ES UNA FORMA DE RESOLVERLO, NO UNA HERRAMIENTA.
 *
 * Idea de la propietaria (2026-09-24, sobre el boceto de la conversación): lo
 * que ella tiene que elegir primero no es «¿Agiled o HoneyBook?», que son dos
 * nombres que no le dicen nada. Es «¿una herramienta que haga las dos cosas, o
 * dos que se repartan el trabajo?». Ésa sí es su decisión, y de ella se derivan
 * consecuencias que entiende: un sitio o dos, una cuota o dos, y si hace falta
 * que hablen entre sí.
 *
 * Los nombres van DETRÁS, al abrir el camino. Y si sólo hay una forma, se
 * enseña una: no se inventa la otra para que el boceto quede simétrico.
 */
export type Camino = {
  forma: "todo-en-uno" | "por-separado";
  /** El título que ella lee. En sus términos, no en los nuestros. */
  titulo: string;
  /** Qué implica elegir este camino, dicho en una línea. */
  queImplica: string;
  /**
   * Las opciones concretas de este camino, la primera es la que propondría.
   * Recortadas a unas pocas: enseñar cincuenta parejas no es dar opciones, es
   * devolver el listado. Las demás se cuentan en `hayMas` y se despliegan si
   * ella quiere —la regla del desplegable, acordada tiempo atrás: «si
   * despliega podrá verlas todas las que hemos podido verificar»—.
   */
  opciones: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean }[];
  /** Cuántas más hay detrás del desplegable. Cero cuando no hay ninguna. */
  hayMas: number;
};

/** Cuántas se enseñan sin desplegar. */
const A_LA_VISTA = 4;

export type Consejo = {
  /**
   * Las formas de resolverlo, la mejor primero. Vacío cuando no hay ninguna,
   * que es un resultado válido y no un fallo.
   */
  caminos: Camino[];
  /** Lo que haría. Vacío cuando no hay nada que proponer, que es un resultado. */
  loQueHaria: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean } | null;
  /** Por qué: qué necesidad suya resuelve cada pieza. */
  porQue: string[];
  /** Alternativas reales, no relleno: sólo las que cubren lo mismo. */
  alternativas: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean }[];
  /**
   * Lo que sigue sin comprobarse. Nunca se convierte en «no lo hace».
   * Incluye lo que nadie demuestra y, en las combinaciones, que no sabemos si
   * las piezas se entienden entre ellas.
   */
  sinComprobar: string[];
  /** Cuántas herramientas se miraron y en cuántas casas. Para poder decirlo. */
  dondeSeBusco: { herramientas: number; casas: number };
};

function aPieza(
  s: Solucion,
  fichas: Map<string, ReturnType<typeof getTodasLasHerramientas>[number]>,
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia
): { piezas: Pieza[]; laConexionNoEstaComprobada: boolean } {
  return {
    piezas: s.partes.map((p) => {
      const h = fichas.get(p.herramientaId);
      const queResuelve: QueResuelve[] = [];
      const faltaPorConfirmar: string[] = [];

      for (const id of p.cubre) {
        const nec = getNecesidad(id);
        if (!nec) continue;
        // El recibo se busca en la capacidad imprescindible que la sostiene.
        let cita: QueResuelve | undefined;
        for (const cap of nec.imprescindibles) {
          const ev = puerto.estadoDe(p.herramientaId, cap);
          if (ev.estado !== "demostrada" || !ev.fuente) continue;
          cita = { necesidad: nec.titulo, url: ev.fuente.url, fecha: ev.fuente.fechaConsulta };
          if (ev.plan?.certeza !== "verificado") {
            faltaPorConfirmar.push(`En qué plan entra «${nec.titulo.toLowerCase()}»: lo hemos visto en su página, pero no en qué tarifa.`);
          }
          break;
        }
        queResuelve.push(cita ?? { necesidad: nec.titulo });
      }

      // Lo que ella pidió y ESTA pieza no cubre. En una combinación lo pone la
      // otra; en una sola, es un hueco y se dice.
      for (const n of delCaso) {
        if (p.cubre.includes(n.necesidad.id)) continue;
        if (s.partes.some((o) => o.cubre.includes(n.necesidad.id))) continue;
        faltaPorConfirmar.push(`No nos consta que cubra «${n.necesidad.titulo.toLowerCase()}».`);
      }
      if (h && !h.disponibleEnEspanol) {
        faltaPorConfirmar.push("No hemos confirmado que esté en español.");
      }

      return {
        herramientaId: p.herramientaId,
        nombre: h?.nombre ?? p.herramientaId,
        cubre: p.cubre.map((id) => getNecesidad(id)?.titulo ?? id),
        casas: p.casas,
        queResuelve,
        coste: {
          desde: h?.precioInicial,
          comprobadoEl: h?.preciosComprobados?.fecha,
          urlPrecios: h?.preciosComprobados?.url ?? h?.urlPrecios,
          tienePlanGratuito: h?.tienePlanGratuito,
          curva: h?.curvaDeAprendizaje,
          enEspanol: h?.disponibleEnEspanol,
        },
        faltaPorConfirmar: [...new Set(faltaPorConfirmar)],
      };
    }),
    laConexionNoEstaComprobada: Boolean(s.laConexionNoEstaComprobada),
  };
}

export function aconsejar(
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia = getPuertoDeEvidencia()
): Consejo {
  const fichas = new Map(getTodasLasHerramientas().map((h) => [h.id, h]));
  const r = buscar(delCaso, puerto);
  const dondeSeBusco = { herramientas: r.seMiraron, casas: r.casasRecorridas.length };

  const sinComprobar = r.nadieDemuestra.map(
    (id) =>
      `«${getNecesidad(id)?.titulo ?? id}»: ninguna de las ${r.seMiraron} herramientas del catálogo nos lo ha demostrado en su página. No es que no exista: es que no lo hemos podido comprobar.`
  );

  if (r.soluciones.length === 0) {
    // Decir que no es un resultado válido. Es la forma `no-cubierto` del
    // esqueleto, y existe para no rellenar con lo que haya.
    return { caminos: [], loQueHaria: null, porQue: [], alternativas: [], sinComprobar, dondeSeBusco };
  }

  const mejor = r.soluciones[0];
  const loQueHaria = aPieza(mejor, fichas, delCaso, puerto);

  // Alternativa sólo lo que cubre LO MISMO. Una que cubre menos no es una
  // alternativa: es otra cosa, y ofrecerla sería rellenar hasta tres.
  const alternativas = r.soluciones
    .slice(1)
    .filter((s) => s.cubreImprescindibles === mejor.cubreImprescindibles)
    .slice(0, 3)
    .map((s) => aPieza(s, fichas, delCaso, puerto));

  // Los caminos se agrupan por FORMA, y sólo entran los que de verdad
  // resuelven tanto como el mejor: un camino que cubre menos no es una manera
  // distinta de resolverlo, es resolverlo a medias.
  const alDia = r.soluciones.filter((s) => s.cubreImprescindibles === mejor.cubreImprescindibles);
  const caminos: Camino[] = [];
  for (const forma of ["una_sola", "varias"] as const) {
    const suyas = alDia.filter((s) => s.forma === forma);
    if (suyas.length === 0) continue;
    const queCubre = delCaso
      .filter((n) => n.importancia === "imprescindible")
      .map((n) => n.necesidad.titulo.toLowerCase());
    caminos.push(
      forma === "una_sola"
        ? {
            forma: "todo-en-uno",
            titulo: "Todo en un sitio",
            queImplica: `Una sola herramienta se encarga de ${queCubre.map((c) => `«${c}»`).join(" y de ")}. Un programa que aprender y una cuota.`,
            opciones: suyas.slice(0, A_LA_VISTA).map((s) => aPieza(s, fichas, delCaso, puerto)),
            hayMas: Math.max(0, suyas.length - A_LA_VISTA),
          }
        : {
            forma: "por-separado",
            titulo: "Por separado",
            queImplica: `Cada herramienta hace una parte. Suelen ser más finas en lo suyo, y son dos programas y dos cuotas.`,
            opciones: suyas.slice(0, A_LA_VISTA).map((s) => aPieza(s, fichas, delCaso, puerto)),
            hayMas: Math.max(0, suyas.length - A_LA_VISTA),
          }
    );
  }

  const porQue = loQueHaria.piezas.map(
    (p) => `${p.nombre} se encarga de ${p.cubre.map((c) => `«${c.toLowerCase()}»`).join(" y ")}.`
  );

  if (loQueHaria.laConexionNoEstaComprobada) {
    sinComprobar.unshift(
      `Que ${loQueHaria.piezas.map((p) => p.nombre).join(" y ")} se entiendan entre sí no lo hemos comprobado: sabemos lo que hace cada una por separado.`
    );
  }
  if (mejor.cubreImprescindibles < mejor.deImprescindibles) {
    sinComprobar.push(
      `De lo que nos has contado, esto cubre ${mejor.cubreImprescindibles} de ${mejor.deImprescindibles} cosas.`
    );
  }
  return { caminos, loQueHaria, porQue, alternativas, sinComprobar, dondeSeBusco };
}

/** Las reglas de presentación que este módulo tiene que respetar, para poder probarlas. */
export function reglasQueAplican(): string[] {
  return getEsqueleto().reglasDePresentacion.map((r) => r.id);
}
