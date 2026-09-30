import { getTodasLasHerramientas } from "@/data/repositorio";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getCapacidad } from "@/data/vocabulario/repositorio";
import { getEsqueleto } from "@/data/vocabulario/asesor";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";
import { buscar, type Solucion } from "./buscar";
import {
  ORDEN_DEL_ESPANOL,
  avisoDelEspanol,
  espanolDe,
  type EspanolDeUnaHerramienta,
} from "./espanol";
import {
  comoSeDice,
  importeDelPlanQueCubre,
  sonComparables,
  sumar,
  type ImporteComparable,
} from "./precio";

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

/**
 * La cifra más barata de pago, de los planes que se citaron textualmente.
 *
 * `precioInicial` no sirve para enseñar de un vistazo: en 52 de las 65 fichas
 * es una frase entera —«Gratis para 1-2 usuarios. Plan Basic desde US$49 por
 * organización/mes (facturación anual) o US$69 al mes»—. Puesta en una lista
 * rompe la pantalla y no contesta «¿cuánto me cuesta?».
 *
 * `planesComprobados` sí: cada plan trae su cifra corta y su cita literal de
 * la página del fabricante, con fecha. Se toma la de pago más barata y **se
 * enseña tal cual, con su unidad** —«10,99 $/usuario/mes»—, porque quitar el
 * «por usuario» cambiaría lo que dice. La moneda no se convierte: sigue
 * vigente que convertir sin un cambio verificado sería inventar un número.
 */
function masBarato(h: { planesComprobados?: { planes?: { nombre: string; mensual?: string; anual?: string }[] } } | undefined): string | undefined {
  const planes = h?.planesComprobados?.planes ?? [];
  let mejor: { texto: string; n: number } | undefined;
  for (const plan of planes) {
    const texto = plan.anual ?? plan.mensual;
    if (!texto) continue;
    const m = texto.replace(/\s/g, "").match(/(\d+(?:[.,]\d+)?)/);
    if (!m) continue;
    const n = Number(m[1].replace(",", "."));
    // El plan gratuito no es «el precio»: se dice aparte, con su clase.
    if (!Number.isFinite(n) || n <= 0) continue;
    if (!mejor || n < mejor.n) mejor = { texto, n };
  }
  return mejor?.texto;
}

export type Coste = {
  /**
   * La cifra corta para una lista: «10,99 $/usuario/mes». Sale de los planes
   * citados. Puede faltar: 15 fichas no tienen planes comprobados.
   */
  desdeCorto?: string;
  /** Tal cual lo dice el fabricante. No se traduce ni se redondea. */
  desde?: string;
  /** Cuándo se abrió esa página de precios, y cuál. Un precio sin fecha no vale. */
  comprobadoEl?: string;
  urlPrecios?: string;
  tienePlanGratuito?: boolean;
  curva?: string;
  /**
   * El español, en tres estados y partido en dos pantallas. Antes aquí había
   * un `enEspanol?: boolean`, y ese booleano es el fallo que se corrige el
   * 2026-09-30: `undefined` —«no lo hemos mirado»— desempataba igual que
   * `false` —«no lo tiene»—, así que cinco herramientas que sí listan español
   * caían antes de que nadie mirara su precio. El porqué entero está en
   * `espanol.ts`; aquí sólo viaja el estado, sin resolverlo en un sí/no.
   */
  espanol: EspanolDeUnaHerramienta;
  /**
   * El precio DEL PLAN QUE CUBRE LO QUE PIDIÓ, cuando se puede comparar con
   * el de al lado: misma moneda, misma periodicidad y la misma forma de
   * cobrar. `null` cuando no se puede, que es lo normal —de 57 fichas con
   * tarifa comprobada, 45 están en dólares y 12 en euros—. El porqué está en
   * `precio.ts`; `desde` sigue siendo el texto de la tarifa, tal cual, y es
   * lo que se enseña.
   */
  importe: ImporteComparable | null;
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
  /**
   * LO QUE ESTA HERRAMIENTA HACE DE MÁS, y está demostrado.
   *
   * Sale de las capacidades `ayudan` de SUS necesidades: las que suman pero no
   * descalifican. Una herramienta de reservas que además demuestra
   * recordatorios automáticos no es igual que una que no, y eso es lo único
   * que distingue de verdad a dos que cubren lo mismo.
   *
   * Nace de una observación de la propietaria (2026-09-25): «las tres tarjetas
   * repiten prácticamente la misma explicación (...) eso debe salir de
   * diferencias comprobadas relevantes para esta persona, sin inventar
   * ventajas para distinguirlas». Por eso se lee de la evidencia y sólo entra
   * lo que está `demostrada`; si no hay diferencia, no se escribe ninguna.
   */
  ademas: string[];
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
  opciones: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] }[];
  /**
   * LAS DEMÁS QUE CUBREN LO MISMO, de verdad y no sólo contadas.
   *
   * `hayMas` era sólo un número: las opciones de detrás no se construían, así
   * que el «Dímelo y te las enseño todas» de la pantalla era una promesa que
   * los datos no podían cumplir. La propietaria lo dijo así el 2026-09-30:
   * «cinco sitios en pantalla no deberían convertirse en cinco únicas
   * opciones accesibles».
   *
   * Van ordenadas por cercanía a lo que ella pidió —el mismo desempate,
   * aplicado una y otra vez—, no por el alfabeto.
   */
  masOpciones: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] }[];
  /** Cuántas quedan aún detrás de `opciones` y `masOpciones`. Cero casi siempre. */
  hayMas: number;
  /**
   * LAS QUE CUBREN SÓLO UNA PARTE, detrás del «ver más» y nunca delante.
   *
   * Antes no existían: `mejoresPorTamano` se queda con la mejor de cada
   * tamaño, y todo lo que cubriera menos se tiraba ahí mismo, así que no
   * llegaba ni al desplegable. Medido el 2026-09-29: de 90 herramientas, 20 no
   * aparecían NUNCA en 1.891 casos.
   *
   * La propietaria, 2026-09-30: «una herramienta que resuelve sólo las
   * reservas puede interesar si la persona conserva su facturación actual; no
   * debe presentarse como si resolviera ambas». Las dos mitades, otra vez:
   * está, y está dicho lo que no hace.
   *
   * Por eso van en su propio sitio y no mezcladas en `opciones`: el
   * desplegable de arriba dice «y N más que también lo cubren», y de éstas eso
   * sería mentira. Cada una trae su `noCubre` y su `faltaPorConfirmar`, que es
   * donde se cuenta el alcance.
   */
  parciales: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] }[];
  /** Cuántas parciales más hay por detrás de las que se enseñan. */
  hayMasParciales: number;
};

/** Cuántas se enseñan sin desplegar. */
const A_LA_VISTA = 4;

/**
 * Cuántas PARCIALES se enseñan al desplegar. Menos que las completas, a
 * propósito: son otra cosa —resuelven un trozo— y una lista larga de trozos
 * vuelve a ser el listado del que Molnip huye. Las demás se cuentan.
 */
const PARCIALES_A_LA_VISTA = 8;

/**
 * NINGUNA HERRAMIENTA DEL CATÁLOGO PUEDE QUEDAR FUERA DE ALCANCE.
 *
 * Esto era un tope de 20, y con él Zoho Bookings no aparecía nunca: demuestra
 * «que reserven solos», que la demuestran 34, y se quedaba la 25ª. La
 * propietaria, 2026-09-30: «si tenemos 90 herramientas, tiene que mostrar las
 * 90». Y lleva razón: una herramienta que está en el catálogo y no se puede
 * alcanzar por ningún camino es trabajo tirado.
 *
 * Así que el camino «todo en un sitio» —donde cada herramienta aparece sola,
 * cubra todo o cubra una parte— **no tiene tope**: se construyen todas. Como
 * mucho son 90, que es el catálogo entero.
 *
 * Las COMBINACIONES sí lo tienen, y no es lo mismo: de 90 herramientas salen
 * cientos de parejas, y cada herramienta de una pareja ya aparece ella sola
 * más arriba. Topar ahí no esconde ninguna herramienta; topar en las solas, sí.
 */
const SIN_TOPE = Number.POSITIVE_INFINITY;
const COMBINACIONES_AL_DESPLEGAR = 20;

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
  loQueHaria: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; desempate: Desempate } | null;
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
  alternativas: { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] }[];
  /** Cuántas más hay detrás, para el desplegable. */
  masAlternativas: number;
  /**
   * Lo que sigue sin comprobarse. Nunca se convierte en «no lo hace».
   * Incluye lo que nadie demuestra y, en las combinaciones, que no sabemos si
   * las piezas se entienden entre ellas.
   */
  sinComprobar: string[];
  /**
   * LO QUE IMPIDE RECOMENDAR UNA PARA EL CONJUNTO.
   *
   * Necesidades que ella ha pedido y que NO están confirmadas en ninguna
   * candidata, con su nombre corto. Vacío cuando sí se puede recomendar.
   *
   * No es un adorno del texto: cambia el juicio. Con esto lleno, Molnip no
   * dice «empezaría por ésta» y luego una pega —«empieza por esta; eso sí, no
   * cubre algo que acabas de pedirme», que es una contradicción—. Dice lo que
   * sí tiene comprobado en las que hay, dice lo que falta por confirmar, y
   * deja claro que para elegir una para TODO falta resolver ese punto.
   *
   * Propietaria, 2026-09-25: «lo que falta es que la nueva respuesta cambie el
   * juicio del asesor, no sólo las etiquetas y una frase al final».
   *
   * Y se llama «sin confirmar», no «no lo tienen»: lo que sabemos es que no lo
   * hemos comprobado en estas herramientas, no que no exista.
   */
  sinConfirmarEnNinguna: string[];
  /** Cuántas herramientas se miraron y en cuántas casas. Para poder decirlo. */
  dondeSeBusco: { herramientas: number; casas: number };
};

function aPieza(
  s: Solucion,
  fichas: Map<string, ReturnType<typeof getTodasLasHerramientas>[number]>,
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia
): { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] } {
  /**
   * Lo que esta solución NO le resuelve, con sus nombres cortos.
   *
   * Es la otra mitad de dejar de descartar lo sencillo: una herramienta puede
   * entrar cubriendo menos, pero entonces hay que decir qué falta. Es la regla
   * de `AGENTS.md` —«decir que no es un resultado válido»— llegando por fin a
   * la pantalla, y no en letra pequeña.
   */
  const cubiertas = new Set(s.partes.flatMap((p) => p.cubre));
  const fuera = delCaso.filter((n) => n.importancia === "imprescindible" && !cubiertas.has(n.necesidad.id));
  const noCubre = fuera.map((n) => n.necesidad.enCorto);

  /**
   * «NO LO HACE» Y «NO NOS CONSTA» NO SON LO MISMO, Y AQUÍ SE SEPARAN.
   *
   * `noCubre` dice sólo que esta solución no cubre esa necesidad, y eso tiene
   * dos causas muy distintas: que alguien abriera la página y demostrara que
   * no lo hace (`ausencia_demostrada`), o que nadie lo haya confirmado
   * (`no_consta`). Escribir «No resuelve facturas» de las dos es afirmar algo
   * que no nos consta, y es justo lo que Molnip no hace.
   *
   * Medido el 2026-09-30 sobre «emitir una factura en condiciones»: de las 90
   * herramientas, 14 demostradas y 76 «no consta». Ausencias demostradas,
   * CERO. Así que hoy casi todo lo que no se cubre es «sin confirmar», y
   * decirlo de otra forma sería inventarse una carencia.
   *
   * *(Propietaria, 2026-09-30: «"no resuelve facturas" sólo cuando está
   * demostrado; si falta información, "facturación sin confirmar"».)*
   */
  const noLoHace: string[] = [];
  const sinConfirmar: string[] = [];
  for (const n of fuera) {
    const demostradoQueNo = n.necesidad.imprescindibles.some((cap) =>
      s.partes.some((p) => puerto.estadoDe(p.herramientaId, cap).estado === "ausencia_demostrada")
    );
    (demostradoQueNo ? noLoHace : sinConfirmar).push(n.necesidad.enCorto);
  }

  return {
    noCubre,
    noLoHace,
    sinConfirmar,
    piezas: s.partes.map((p) => {
      const h = fichas.get(p.herramientaId);
      const queResuelve: QueResuelve[] = [];
      const faltaPorConfirmar: string[] = [];
      /**
       * Los planes que F2 demostró para lo que ella pidió. Si esta pieza cubre
       * dos necesidades y cada una vive en un plan distinto, no sabemos cuál
       * de los dos incluye al otro —el esquema no ordena los escalones—, así
       * que no hay precio comparable y el precio no decidirá. Inventar aquí el
       * «mayor» sería adivinar la tarifa de otro.
       */
      const planesQueCubren = new Set<string>();

      for (const id of p.cubre) {
        const nec = getNecesidad(id);
        if (!nec) continue;
        // El recibo se busca en la capacidad imprescindible que la sostiene.
        let cita: QueResuelve | undefined;
        for (const cap of nec.imprescindibles) {
          const ev = puerto.estadoDe(p.herramientaId, cap);
          if (ev.estado !== "demostrada" || !ev.fuente) continue;
          cita = { necesidad: nec.titulo, loQueTeCuesta: nec.loQueTeCuesta, url: ev.fuente.url, fecha: ev.fuente.fechaConsulta };
          if (ev.plan?.certeza === "verificado" && ev.plan.nombre) planesQueCubren.add(ev.plan.nombre);
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
      /**
       * Antes esto decía «No hemos confirmado que esté en español» tanto de la
       * que no lo está como de la que no hemos mirado, y son cosas distintas:
       * a una le consta que no, de la otra no nos consta nada. Ahora cada una
       * dice lo suyo, y de la que sí está confirmada no se dice nada, porque
       * no hay nada que advertir.
       */
      const aviso = avisoDelEspanol(espanolDe(h));
      if (aviso) faltaPorConfirmar.push(aviso);

      // Lo que suma, demostrado, de las necesidades que ella trajo.
      const ademas: string[] = [];
      for (const id of p.cubre) {
        for (const cap of getNecesidad(id)?.ayudan ?? []) {
          if (puerto.estadoDe(p.herramientaId, cap).estado !== "demostrada") continue;
          const etiqueta = getCapacidad(cap)?.etiqueta;
          if (etiqueta && !ademas.includes(etiqueta)) ademas.push(etiqueta);
        }
      }

      return {
        herramientaId: p.herramientaId,
        nombre: h?.nombre ?? p.herramientaId,
        ademas,
        cubre: p.cubre.map((id) => getNecesidad(id)?.titulo ?? id),
        cubreEnCorto: p.cubre.map((id) => getNecesidad(id)?.enCorto ?? id),
        casas: p.casas,
        queResuelve,
        coste: {
          desde: h?.precioInicial,
          desdeCorto: masBarato(h),
          comprobadoEl: h?.preciosComprobados?.fecha,
          urlPrecios: h?.preciosComprobados?.url ?? h?.urlPrecios,
          tienePlanGratuito: h?.tienePlanGratuito,
          curva: h?.curvaDeAprendizaje,
          espanol: espanolDe(h),
          importe: planesQueCubren.size === 1
            ? importeDelPlanQueCubre(h, [...planesQueCubren][0])
            : null,
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
 *  4. CURVA. La que se aprende antes.
 *
 * Si después de los cuatro siguen empatadas, NO se enseñan las dos: se dice
 * que no se puede elegir y se pregunta lo que decidiría.
 */
const CURVA_ORDEN: Record<string, number> = { muy_facil: 0, facil: 1, media: 2, dificil: 3 };

type Opcion = { piezas: Pieza[]; laConexionNoEstaComprobada: boolean; noCubre: string[]; noLoHace: string[]; sinConfirmar: string[] };

/**
 * Lo que cuesta una solución entera, cuando se puede decir.
 *
 * Antes esto era `euros()`, y no eran euros: cogía el primer número del texto
 * libre de la tarifa y lo sumaba, así que «$9 USD/mes» le ganaba a «15,90 €».
 * Ahora suma importes que de verdad se pueden sumar, o devuelve `null`. El
 * porqué entero está en `precio.ts`.
 */
function importeDe(o: Opcion): ImporteComparable | null {
  return sumar(o.piezas.map((p) => p.coste.importe));
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

  /**
   * EL ESPAÑOL, SIN CONVERTIR LO DESCONOCIDO EN UN «NO».
   *
   * Esto era `filter((o) => o.piezas.every((p) => p.coste.enEspanol))`, y esa
   * línea tenía dos fallos en uno. El primero: `undefined` es falsy, así que
   * «no lo hemos mirado» eliminaba exactamente igual que «no lo tiene»; Koibox
   * —selector de idioma en español publicado en su propio soporte— se caía
   * aquí, en el paso 2 de 5, y con ella Square Appointments, TIMIFY, Booksy y
   * Schedulista. El segundo: *filtrar* es descartar, y el idioma no descarta a
   * nadie; como mucho ordena.
   *
   * Ahora se ordena por estado —confirmado, sin confirmar, no disponible— y se
   * queda el mejor grupo que haya. Dos consecuencias que son la regla de la
   * propietaria del 2026-09-30, entera:
   *
   *  - Si el mejor grupo es «sin confirmar», el idioma NO decide y no se dice
   *    que decidió: se sigue bajando por plan gratuito, precio y curva. Una
   *    candidata sin confirmar no puede presentarse como si ya cumpliera.
   *  - Ninguna se va de la lista. `ordenarPorCercania` vuelve a llamar aquí con
   *    las que quedan, así que las de abajo siguen estando; y lo que no nos
   *    consta se dice en `faltaPorConfirmar`, no se calla.
   */
  const rangoDelEspanol = (o: Opcion) =>
    Math.max(...o.piezas.map((p) => ORDEN_DEL_ESPANOL[p.coste.espanol.panel]));
  const mejorIdioma = Math.min(...opciones.map(rangoDelEspanol));
  const enEspanol = opciones.filter((o) => rangoDelEspanol(o) === mejorIdioma);
  if (mejorIdioma === ORDEN_DEL_ESPANOL.confirmado && enEspanol.length === 1) {
    return { elegida: enEspanol[0], desempate: {
      criterio: "idioma",
      // «De las que te valen» daba por explicado un encaje que la pantalla no
      // contaba (propietaria, 2026-09-25). Ahora el encaje se dice antes, en el
      // propio consejo, así que esta frase sólo tiene que aportar lo suyo: el
      // idioma desempata, no justifica.
      //
      // Y dice «de las que te valen» y no «de las tres» porque las que valen no
      // son siempre tres: el número salía de un caso concreto y se quedó escrito.
      porQue: `Y es la única de las que te valen que está en español confirmado; de las demás no nos consta que puedas trabajar en tu idioma.`,
    } };
  }
  const quedan1 = enEspanol.length > 0 ? enEspanol : opciones;

  const gratis = quedan1.filter((o) => o.piezas.every((p) => p.coste.tienePlanGratuito));
  if (gratis.length === 1) {
    return { elegida: gratis[0], desempate: {
      criterio: "plan-gratuito",
      porQue: `${nombreDe(gratis[0])} tiene plan gratuito, así que puedes probarla antes de pagar nada.`,
    } };
  }
  const quedan2 = gratis.length > 1 ? gratis : quedan1;

  /**
   * EL PRECIO SÓLO DECIDE CUANDO SE PUEDE COMPARAR DE VERDAD.
   *
   * Hacen falta las tres cosas a la vez, y si falla una el precio se retira
   * del desempate en lugar de inventarse un ganador:
   *
   *  1. TODAS tienen importe del plan que cubre lo que pidió. Si a una le
   *     falta, no se compara a las demás entre ellas: la que falta podría ser
   *     justo la más barata, y dejarla fuera sería castigarla por un hueco
   *     NUESTRO.
   *  2. Todas en la misma moneda, la misma periodicidad y la misma forma de
   *     cobrar. Aquí no se convierten divisas —la propietaria lo dijo
   *     expresamente: «no hace falta montar ahora un sistema de cambio de
   *     divisas»—; se reconoce que no son comparables y punto.
   *  3. Una es estrictamente más barata que la siguiente.
   */
  const conPrecio = quedan2
    .map((o) => ({ o, i: importeDe(o) }))
    .filter((x): x is { o: Opcion; i: ImporteComparable } => x.i !== null)
    .sort((a, b) => a.i.cantidad - b.i.cantidad);
  const elPrecioPuedeDecidir =
    conPrecio.length === quedan2.length && sonComparables(conPrecio.map((x) => x.i));
  if (elPrecioPuedeDecidir && conPrecio.length > 1 && conPrecio[0].i.cantidad < conPrecio[1].i.cantidad) {
    const g = conPrecio[0];
    return { elegida: g.o, desempate: {
      criterio: "precio",
      porQue: `Cubriendo lo mismo, ${nombreDe(g.o)} es la más barata: ${comoSeDice(g.i)} con el plan ${g.i.plan}, que es el que incluye lo que me has pedido. Míralo en su tarifa antes de decidir: los precios cambian.`,
    } };
  }
  const quedan3 = elPrecioPuedeDecidir && conPrecio.length > 1
    ? conPrecio.filter((x) => x.i.cantidad === conPrecio[0].i.cantidad).map((x) => x.o)
    : quedan2;

  const curva = quedan3
    .map((o) => ({ o, c: Math.max(...o.piezas.map((p) => CURVA_ORDEN[p.coste.curva ?? ""] ?? 9)) }))
    .sort((a, b) => a.c - b.c);
  if (curva.length > 1 && curva[0].c < curva[1].c && curva[0].c < 9) {
    return { elegida: curva[0].o, desempate: {
      criterio: "curva",
      porQue: `Las dos te sirven, pero ${nombreDe(curva[0].o)} se aprende antes. Para empezar, eso vale más que cualquier función de más.`,
    } };
  }

  // No se enseñan las dos. Se dice que no se puede elegir y se pregunta.
  return { empate: `${quedan3.length > 1 ? quedan3.length : opciones.length} salen igual de bien con lo que me has contado, y no tengo con qué decidir entre ellas. Dime qué presupuesto manejas al mes y si trabajas sola o con más personas, y te digo cuál.` };
}


export function aconsejar(
  delCaso: readonly NecesidadDelCaso[],
  puerto: PuertoDeEvidencia = getPuertoDeEvidencia()
): Consejo {
  const fichas = new Map(getTodasLasHerramientas().map((h) => [h.id, h]));
  const r = buscar(delCaso, puerto);
  const dondeSeBusco = { herramientas: r.seMiraron, casas: r.casasRecorridas.length };

  /**
   * Se nombra lo MÁS CONCRETO que tengamos, no lo más corto.
   *
   * `enCorto` de «tener la agenda bajo control» es «agenda», y con eso se
   * perdía lo que ella acababa de pedir: que el paciente elija profesional al
   * reservar. Cuando una necesidad se sostiene sobre una sola capacidad, esa
   * capacidad tiene nombre propio —«agenda por profesional o recurso»— y es
   * el que hay que decir. Propietaria, 2026-09-25: «se pierde la necesidad
   * concreta».
   */
  const sinConfirmarEnNinguna = r.nadieDemuestra
    .map((id) => {
      const necesidad = getNecesidad(id);
      if (!necesidad) return undefined;
      const unaSola = necesidad.imprescindibles.length === 1 ? getCapacidad(necesidad.imprescindibles[0]) : undefined;
      return unaSola?.etiqueta?.toLowerCase() ?? necesidad.enCorto;
    })
    .filter((x): x is string => Boolean(x));

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
    return { caminos: [], loQueHaria: null, loQueNecesitoSaber: null, porQue: [], alternativas: [], masAlternativas: 0, sinComprobar, sinConfirmarEnNinguna, dondeSeBusco };
  }

  const mejor = r.soluciones[0];

  /**
   * LO SENCILLO NO SE DESCARTA POR CUBRIR MENOS.
   *
   * Aquí había una regla mía, y estaba mal guardada. `AGENTS.md` dice «primero
   * que sirva, después que encaje»: comprueba que funcione antes de ordenar
   * por precio o idioma. Yo lo convertí en «gana quien cubra más casillas», y
   * encima me apoyé en «tres es la consecuencia, no un objetivo», que habla de
   * no rellenar con malas — no de tirar la buena por ser sencilla.
   *
   * La consecuencia, medida el 2026-09-25: Molnip apilaba herramientas en 15
   * de 17 casos, y en los oficios las sueltas llegaban a la lista CERO veces.
   * A una peluquera se le tiraba Agiled —que le resuelve las reservas y las
   * facturas— por no cubrir además el stock y los turnos, y en su lugar se le
   * ofrecían tres programas apilados con dos cuotas y sin saber si se hablan
   * entre ellos. La propietaria: «no le compliques la vida al cliente».
   *
   * Ahora se guarda **la mejor de cada tamaño**: la mejor suelta, la mejor
   * pareja, el mejor trío. Ninguna se descarta por ser sencilla y ninguna
   * entra para rellenar, porque sólo entra si es la mejor en su tamaño. Y
   * cada una dice lo que NO cubre, que es lo que permite elegir lo sencillo
   * sin esconder nada.
   */
  const mejoresPorTamano = (() => {
    const techo = new Map<number, number>();
    for (const sol of r.soluciones) {
      const n = sol.partes.length;
      techo.set(n, Math.max(techo.get(n) ?? 0, sol.cubreImprescindibles));
    }
    return r.soluciones.filter((sol) => sol.cubreImprescindibles === techo.get(sol.partes.length));
  })();

  let alternativas = mejoresPorTamano
    .slice(1)
    .slice(0, 3)
    .map((s) => aPieza(s, fichas, delCaso, puerto));

  // Los caminos se agrupan por FORMA. Entra la mejor de cada tamaño, así que
  // «todo en un sitio» sigue existiendo aunque cubra menos que un apilamiento.
  /**
   * LO QUE CUBRE MENOS SIGUE EXISTIENDO. Todo lo que `mejoresPorTamano` deja
   * fuera por cubrir menos que el techo de su tamaño. No compite por el primer
   * puesto —eso no cambia— pero se puede ver, que es distinto.
   */
  const parcialesPorForma = (forma: "una_sola" | "varias") =>
    r.soluciones
      .filter((s) => s.forma === forma && !mejoresPorTamano.includes(s))
      .sort((a, b) => b.cubreImprescindibles - a.cubreImprescindibles || b.cubreDeseables - a.cubreDeseables);

  /**
   * El bloque de un camino: las 4 de delante, las que se despliegan detrás
   * —ordenadas por cercanía— y la cuenta de las que aún quedan.
   */
  const reparto = (suyas: Solucion[], tope: number) => {
    const delante = suyas.slice(0, A_LA_VISTA).map((s) => aPieza(s, fichas, delCaso, puerto));
    const cola = suyas.slice(A_LA_VISTA);
    const cuantas = Number.isFinite(tope) ? Math.min(cola.length, tope) : cola.length;
    /**
     * Ordenar por cercanía cuesta caro cuando son muchas —vuelve a desempatar
     * una y otra vez—, así que se ordenan las 20 primeras y el resto conserva
     * el orden de la búsqueda, que ya va por cuánto cubre. Ninguna se pierde:
     * lo que cambia es sólo cuánto afinamos el orden de la cola larga.
     */
    const enPiezas = cola.slice(0, cuantas).map((s) => aPieza(s, fichas, delCaso, puerto));
    const masOpciones = [
      ...ordenarPorCercania(enPiezas.slice(0, COMBINACIONES_AL_DESPLEGAR)),
      ...enPiezas.slice(COMBINACIONES_AL_DESPLEGAR),
    ];
    return { opciones: delante, masOpciones, hayMas: Math.max(0, cola.length - cuantas) };
  };

  const alDia = mejoresPorTamano;
  const caminos: Camino[] = [];
  for (const forma of ["una_sola", "varias"] as const) {
    const suyas = alDia.filter((s) => s.forma === forma);
    const parciales = parcialesPorForma(forma);
    if (suyas.length === 0 && parciales.length === 0) continue;
    const queCubre = delCaso
      .filter((n) => n.importancia === "imprescindible")
      .map((n) => n.necesidad.titulo.toLowerCase());
    caminos.push(
      forma === "una_sola"
        ? {
            forma: "todo-en-uno",
            titulo: "Todo en un sitio",
            queImplica: `Una sola herramienta se encarga de ${queCubre.map((c) => `«${c}»`).join(" y de ")}. Un programa que aprender y una cuota.`,
            ...reparto(suyas, SIN_TOPE),
            // Sin tope tampoco aquí: una herramienta que cubre una parte sigue
            // siendo una herramienta del catálogo, y tiene que poder verse.
            parciales: parciales.map((s) => aPieza(s, fichas, delCaso, puerto)),
            hayMasParciales: 0,
          }
        : {
            forma: "por-separado",
            titulo: "Por separado",
            queImplica: `Cada herramienta hace una parte. Suelen ser más finas en lo suyo, y son dos programas y dos cuotas.`,
            ...reparto(suyas, COMBINACIONES_AL_DESPLEGAR),
            parciales: parciales.slice(0, PARCIALES_A_LA_VISTA).map((s) => aPieza(s, fichas, delCaso, puerto)),
            hayMasParciales: Math.max(0, parciales.length - PARCIALES_A_LA_VISTA),
          }
    );
  }

  /**
   * LA REGLA DE LA CASA, aplicada. De todas las que cubren lo mismo sale UNA,
   * elegida con datos verificados, o ninguna y una pregunta. Nunca una lista.
   */
  const empatadas = mejoresPorTamano.map((s) => aPieza(s, fichas, delCaso, puerto));
  const elegida = elegirUna(empatadas);

  if ("empate" in elegida) {
    if (mejor.cubreImprescindibles < mejor.deImprescindibles) {
      sinComprobar.push(`De lo que me has contado, lo que he encontrado cubre ${mejor.cubreImprescindibles} de ${mejor.deImprescindibles} cosas.`);
    }
    return { caminos, loQueHaria: null, loQueNecesitoSaber: elegida.empate, porQue: [], alternativas: [], masAlternativas: 0, sinComprobar, sinConfirmarEnNinguna, dondeSeBusco };
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
  return { caminos, loQueHaria, loQueNecesitoSaber: null, porQue, alternativas, masAlternativas, sinComprobar, sinConfirmarEnNinguna, dondeSeBusco };
}

/** Las reglas de presentación que este módulo tiene que respetar, para poder probarlas. */
export function reglasQueAplican(): string[] {
  return getEsqueleto().reglasDePresentacion.map((r) => r.id);
}
