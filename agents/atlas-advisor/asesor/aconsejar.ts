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
   * Lo que le toca hacer a ELLA para ponerlo en marcha, del vocabulario.
   * Cuelga de la necesidad y no de la marca, porque dar de alta tus servicios
   * y tus horarios hay que hacerlo con cualquier programa de citas. Es la
   * sección «Para empezar» del boceto de la propietaria del 2026-09-25.
   */
  loQueTeCuesta?: string;
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
  /**
   * Lo mismo en dos palabras: «reservas», «facturas». Para el titular de una
   * tarjeta, donde la frase entera no cabe. Sale de `enCorto` del vocabulario.
   */
  cubreEnCorto: string[];
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

/**
 * CUÁNTAS SE ENSEÑAN: ESTÁ EN DISEÑO, NO DECIDIDO.
 *
 * Aquí decía «LA REGLA DE LA CASA — aprobada por la propietaria», con esta
 * frase: «el asesor devuelve UNA recomendación, nunca una lista». La
 * atribución era falsa y la corrigió ella el 2026-09-24: «nunca hemos dicho
 * que el asesor devuelva una sola (...) siempre podemos mostrar tres como
 * mínimo (...) no existe esa regla». La redacté yo y me quedé con su mitad
 * dura, ignorando el matiz que ella puso el mismo día.
 *
 * Decía también que había una prueba que fallaba si salían dos. La había y
 * está desconectada por orden suya, con el motivo escrito en
 * `__tests__/unaSola.test.ts`. Esto ya no lo vigila nadie, a propósito.
 *
 * LO QUE HACE HOY EL CÓDIGO, que es una decisión de diseño abierta y no una
 * ley: elige una y enseña las demás debajo por cercanía. La razón sigue
 * valiendo como argumento —un comparador entrega una lista y te deja elegir;
 * un asesor elige y dice por qué— pero es un argumento, no un acuerdo.
 *
 * Lo que sí está dicho por ella: lo mínimo es una, porque menos no hay, y
 * tres se pueden enseñar siempre. Y sigue vigente, de antes,
 * `MINIMO_ALTERNATIVAS_POR_DEFECTO = 3` en `atlas-curator/cobertura.ts`.
 */

/** Por qué ésta y no otra. Sale de datos verificados, nunca de una opinión. */
export type Desempate = {
  /** El motivo, dicho para quien pregunta. */
  porQue: string;
  /** Cuál de los criterios decidió. Se guarda para poder auditarlo. */
  criterio: "idioma" | "plan-gratuito" | "precio" | "curva" | "unica";
};

export type Consejo = {
  /**
   * Las formas de resolverlo, la mejor primero. Vacío cuando no hay ninguna,
   * que es un resultado válido y no un fallo.
   */
  caminos: Camino[];
  /**
   * UNA. Nunca una lista. `null` cuando no hay nada que proponer o cuando
   * varias empatan y no hay con qué decidir — y entonces se dice.
   */
  loQueHaria: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; desempate: Desempate } | null;
  /**
   * Lo que hace falta saber para poder elegir. Sólo cuando `loQueHaria` es
   * null por empate: es la única pregunta que decidiría, no una lista de
   * preguntas.
   */
  loQueNecesitoSaber: string | null;
  /** Por qué: qué necesidad suya resuelve cada pieza. */
  porQue: string[];
  /**
   * Las demás, de más cerca a más lejos. Cubren LO MISMO que la que manda:
   * una que cubre menos no es una alternativa, es otra cosa.
   *
   * Recortadas a unas pocas. El boceto de la propietaria enseña tres, y tiene
   * razón: catorce filas no son opciones, son el listado otra vez.
   */
  alternativas: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean }[];
  /** Cuántas más hay detrás, para el desplegable. */
  masAlternativas: number;
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
          cita = { necesidad: nec.titulo, loQueTeCuesta: nec.loQueTeCuesta, url: ev.fuente.url, fecha: ev.fuente.fechaConsulta };
          if (ev.plan?.certeza !== "verificado") {
            faltaPorConfirmar.push(`En qué plan entra «${nec.titulo.toLowerCase()}»: lo hemos visto en su página, pero no en qué tarifa.`);
          }
          break;
        }
        queResuelve.push(cita ?? { necesidad: nec.titulo, loQueTeCuesta: nec.loQueTeCuesta });
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
        cubreEnCorto: p.cubre.map((id) => getNecesidad(id)?.enCorto ?? id),
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

/**
 * CÓMO SE ELIGE ENTRE VARIAS QUE CUBREN LO MISMO.
 *
 * Cuando empatan en lo que ella pidió, no empatan en todo lo demás: de esas
 * herramientas tenemos idioma, plan gratuito, precio y curva, verificados y
 * con su fecha. Ahí está la decisión, y es comprobable.
 *
 * El orden no es de calidad —«no somos jueces»— sino de qué obstáculo le
 * quita antes a quien pregunta:
 *
 *  1. ESPAÑOL. Si una está en su idioma y la otra no, para una autónoma
 *     española eso decide. No es que la otra sea peor: es que no está pensada
 *     para ella.
 *  2. PLAN GRATUITO. Poder probarla sin pagar quita el miedo a equivocarse,
 *     que es lo que de verdad frena a quien no sabe de esto.
 *  3. PRECIO DE ENTRADA, el verificado y con su fecha.
 *  4. CURVA. La que se coge antes.
 *
 * Si después de los cuatro siguen empatadas, NO se enseñan las dos: se dice
 * que no se puede elegir y se pregunta lo que decidiría.
 */
const CURVA_ORDEN: Record<string, number> = { muy_facil: 0, facil: 1, media: 2, dificil: 3 };

type Opcion = { piezas: Pieza[]; laConexionNoEstaComprobada: boolean };

/** El precio de entrada de una solución entera. Suma sus piezas. */
function euros(o: Opcion): number | null {
  let total = 0;
  for (const p of o.piezas) {
    const m = String(p.coste.desde ?? "").match(/(\d+(?:[.,]\d+)?)/);
    if (!m) return null;
    total += parseFloat(m[1].replace(",", "."));
  }
  return total;
}

const nombreDe = (o: Opcion) => o.piezas.map((p) => p.nombre).join(" + ");

/**
 * LAS DEMÁS, DE MÁS CERCA A MÁS LEJOS.
 *
 * La propietaria quiere ver también las otras, «en orden de cercanía al mejor
 * servicio para ella» (2026-09-24): una manda y las demás se ven debajo.
 *
 * Lo que no vale es que ese orden sea el alfabeto. Eso es lo que hacía este
 * módulo, y fue un fallo mío: al desempatar por el nombre, Agiled salía la
 * primera casi siempre por empezar por A, y parecía recomendada cuando sólo
 * era su inicial. Lo detectó la propietaria el 2026-09-24: «Agiled parece la
 * dueña de todo».
 *
 * El orden es el MISMO del desempate, aplicado una y otra vez: menos piezas,
 * español, plan gratuito, precio, curva. Así el segundo es segundo por una
 * razón que se puede decir en voz alta, y no es un ranking de calidad —nadie
 * es peor— sino distancia a lo que ella pidió.
 */
export function ordenarPorCercania(opciones: Opcion[]): Opcion[] {
  const restantes = [...opciones];
  const orden: Opcion[] = [];
  while (restantes.length) {
    const r = elegirUna(restantes);
    const siguiente = "empate" in r ? restantes[0] : r.elegida;
    orden.push(siguiente);
    restantes.splice(restantes.indexOf(siguiente), 1);
  }
  return orden;
}

function elegirUna(candidatas: Opcion[]): { elegida: Opcion; desempate: Desempate } | { empate: string } {
  let opciones = candidatas;
  if (opciones.length === 1) {
    return { elegida: opciones[0], desempate: { criterio: "unica", porQue: "Es la única que cubre lo que me has contado." } };
  }

  /**
   * ANTES QUE NADA, MENOS PIEZAS.
   *
   * Cubriendo lo mismo, una herramienta es mejor consejo que dos, y dos que
   * tres: es un programa que aprender y una cuota, y no hace falta que hablen
   * entre sí —que es justo lo que no podemos comprobar—. Sin esto, el
   * desempate por precio recetaba tres programas a una peluquera porque
   * sumaban menos euros, y eso no es asesorar.
   */
  const menosPiezas = Math.min(...opciones.map((o) => o.piezas.length));
  const simples = opciones.filter((o) => o.piezas.length === menosPiezas);
  if (simples.length === 1) {
    return { elegida: simples[0], desempate: {
      criterio: "unica",
      porQue: menosPiezas === 1
        ? `${nombreDe(simples[0])} se encarga de todo ella sola. Un programa que aprender y una cuota, en vez de varios que además tendrían que entenderse entre sí.`
        : `Es la forma de cubrirlo con menos programas: ${menosPiezas} en vez de más.`,
    } };
  }
  opciones = simples;

  const enEspanol = opciones.filter((o) => o.piezas.every((p) => p.coste.enEspanol));
  if (enEspanol.length === 1) {
    return { elegida: enEspanol[0], desempate: {
      criterio: "idioma",
      porQue: `De las que te valen, ${nombreDe(enEspanol[0])} es la única que está en español. Las otras no están pensadas para trabajar en tu idioma.`,
    } };
  }
  const quedan1 = enEspanol.length > 1 ? enEspanol : opciones;

  const gratis = quedan1.filter((o) => o.piezas.every((p) => p.coste.tienePlanGratuito));
  if (gratis.length === 1) {
    return { elegida: gratis[0], desempate: {
      criterio: "plan-gratuito",
      porQue: `${nombreDe(gratis[0])} tiene plan gratuito, así que puedes probarla antes de pagar nada.`,
    } };
  }
  const quedan2 = gratis.length > 1 ? gratis : quedan1;

  const conPrecio = quedan2
    .map((o) => ({ o, e: euros(o) }))
    .filter((x): x is { o: Opcion; e: number } => x.e !== null)
    .sort((a, b) => a.e - b.e);
  if (conPrecio.length > 1 && conPrecio[0].e < conPrecio[1].e) {
    return { elegida: conPrecio[0].o, desempate: {
      criterio: "precio",
      porQue: `Cubriendo lo mismo, ${nombreDe(conPrecio[0].o)} es la más barata para empezar. Míralo en su tarifa antes de decidir: los precios cambian.`,
    } };
  }
  const quedan3 = conPrecio.length > 1 ? conPrecio.filter((x) => x.e === conPrecio[0].e).map((x) => x.o) : quedan2;

  const curva = quedan3
    .map((o) => ({ o, c: Math.max(...o.piezas.map((p) => CURVA_ORDEN[p.coste.curva ?? ""] ?? 9)) }))
    .sort((a, b) => a.c - b.c);
  if (curva.length > 1 && curva[0].c < curva[1].c && curva[0].c < 9) {
    return { elegida: curva[0].o, desempate: {
      criterio: "curva",
      porQue: `Las dos te sirven, pero ${nombreDe(curva[0].o)} se coge antes. Para empezar, eso vale más que cualquier función de más.`,
    } };
  }

  // No se enseñan las dos. Se dice que no se puede elegir y se pregunta.
  return { empate: `${quedan3.length > 1 ? quedan3.length : opciones.length} salen igual de bien con lo que me has contado, y no tengo con qué decidir entre ellas. Dime cuánto puedes gastar al mes y si trabajas sola o con gente, y te digo cuál.` };
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
      // Una línea por necesidad. El «no significa que no exista» se dice UNA
      // vez donde se enseñan, no pegado a cada una: repetido siete veces
      // dejaba de ser honestidad y se leía como una disculpa.
      `«${getNecesidad(id)?.titulo ?? id}»: no lo he encontrado en ninguna de las ${r.seMiraron}.`
  );

  if (r.soluciones.length === 0) {
    // Decir que no es un resultado válido. Es la forma `no-cubierto` del
    // esqueleto, y existe para no rellenar con lo que haya.
    return { caminos: [], loQueHaria: null, loQueNecesitoSaber: null, porQue: [], alternativas: [], masAlternativas: 0, sinComprobar, dondeSeBusco };
  }

  const mejor = r.soluciones[0];

  // Alternativa sólo lo que cubre LO MISMO. Una que cubre menos no es una
  // alternativa: es otra cosa, y ofrecerla sería rellenar hasta tres.
  let alternativas = r.soluciones
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

  /**
   * LA REGLA DE LA CASA, aplicada. De todas las que cubren lo mismo sale UNA,
   * elegida con datos verificados, o ninguna y una pregunta. Nunca una lista.
   */
  const empatadas = r.soluciones
    .filter((s) => s.cubreImprescindibles === mejor.cubreImprescindibles)
    .map((s) => aPieza(s, fichas, delCaso, puerto));
  const elegida = elegirUna(empatadas);

  if ("empate" in elegida) {
    if (mejor.cubreImprescindibles < mejor.deImprescindibles) {
      sinComprobar.push(`De lo que me has contado, lo que he encontrado cubre ${mejor.cubreImprescindibles} de ${mejor.deImprescindibles} cosas.`);
    }
    return { caminos, loQueHaria: null, loQueNecesitoSaber: elegida.empate, porQue: [], alternativas: [], masAlternativas: 0, sinComprobar, dondeSeBusco };
  }

  const loQueHaria = { ...elegida.elegida, desempate: elegida.desempate };
  // Las demás, de más cerca a más lejos, sin repetir la que manda.
  const todasLasDemas = ordenarPorCercania(empatadas.filter((o) => o !== elegida.elegida));
  alternativas = todasLasDemas.slice(0, A_LA_VISTA);
  const masAlternativas = Math.max(0, todasLasDemas.length - A_LA_VISTA);
  const porQue = [
    ...loQueHaria.piezas.map((p) => `${p.nombre} se encarga de ${p.cubre.map((c) => `«${c.toLowerCase()}»`).join(" y ")}.`),
    elegida.desempate.porQue,
  ];

  if (loQueHaria.laConexionNoEstaComprobada) {
    sinComprobar.unshift(
      `Que ${loQueHaria.piezas.map((p) => p.nombre).join(" y ")} se entiendan entre sí no lo hemos comprobado: sabemos lo que hace cada una por separado.`
    );
  }
  if (mejor.cubreImprescindibles < mejor.deImprescindibles) {
    sinComprobar.push(
      `De lo que me has contado, esto cubre ${mejor.cubreImprescindibles} de ${mejor.deImprescindibles} cosas.`
    );
  }
  return { caminos, loQueHaria, loQueNecesitoSaber: null, porQue, alternativas, masAlternativas, sinComprobar, dondeSeBusco };
}

/** Las reglas de presentación que este módulo tiene que respetar, para poder probarlas. */
export function reglasQueAplican(): string[] {
  return getEsqueleto().reglasDePresentacion.map((r) => r.id);
}
