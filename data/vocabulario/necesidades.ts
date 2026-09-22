import fs from "node:fs";
import path from "node:path";
import { getCapacidad, getCapacidades } from "./repositorio";

/**
 * EL MAPA DE NECESIDADES — cómo lo dice la persona, no cómo lo llama el sector.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  BORRADOR. NADIE LO LEE TODAVÍA, IGUAL QUE EL VOCABULARIO.            │
 * │  Conectarlo a la web o al motor es una decisión de la propietaria.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Hasta hoy una categoría decía QUÉ ES una herramienta: un CRM es un CRM. Eso
 * vale para un directorio y no vale para asesorar, porque nadie llega diciendo
 * qué es — llega diciendo qué le pasa.
 *
 * Aquí la categoría dice QUÉ QUIERE CONSEGUIR la persona. El nombre técnico no
 * desaparece: baja de rango y pasa a ser `entradas` de una puerta. Quien
 * escribe «CRM» entra por «Vender más» y se le pregunta para qué, igual que a
 * quien escribe «se me olvida llamar a la gente». Y siempre queda la salida de
 * «ya sé lo que quiero»: entender para qué lo necesita no puede convertirse en
 * un peaje.
 *
 * TRES NIVELES, Y SÓLO DOS SE VEN:
 *
 *   puerta     → lo que quiero conseguir        (6)
 *   necesidad  → el problema concreto           (61)
 *   capacidad  → lo que se verifica             (151, en `vocabulario.json`)
 *
 * Una necesidad puede colgar de DOS puertas y no es un descuido: «que reserven
 * solos» es vender más para quien pierde citas fuera de horario, y orden para
 * quien tiene la agenda hecha un lío. El mismo hecho, dos problemas distintos.
 *
 * POR QUÉ VIVE DENTRO DE `data/vocabulario`. Porque validar que una necesidad
 * apunte a capacidades reales obliga a leer el vocabulario, y `aislamiento.
 * test.ts` congela a propósito la lista de quién puede hacerlo —«ampliarla
 * tiene que ser una decisión, no un descuido»—. Mover esto a su propia carpeta
 * exigiría tocar esa lista, y esa decisión no es de quien escribe el mapa.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LO QUE SOBRA Y LO QUE FALTA NO PESAN IGUAL
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Por eso hay DOS listas por necesidad y no una puntuación.
 *
 *  - `imprescindibles` → sin esto, no le sirve. Es lo ÚNICO que descalifica.
 *  - `ayudan`          → si lo trae, suma. Si no lo trae, es un aviso.
 *
 * Y nada penaliza por sobrar. Regla de la propietaria (2026-09-22): «busca dos
 * habitaciones, pero una de tres puede encajar si la tercera le sirve de
 * despacho. Explícale qué gana, qué coste o esfuerzo adicional supone y deja
 * que decida. En software, tener funciones adicionales no descalifica una
 * alternativa.» De ahí que `ajusteConLaNecesidad` no reste nunca por lo que
 * trae de más: lo cuenta aparte, para que se pueda contar y que decida quien
 * pregunta.
 *
 * La asimetría, dicha por ella y que es la razón de que sean dos listas:
 * «una alternativa con prestaciones adicionales y otra que carece de algo
 * imprescindible no son equivalentes».
 *
 * `imprescindibles` es deliberadamente CORTO —casi siempre una sola, la que ES
 * la necesidad—. Cada capacidad que se añade ahí excluye herramientas, y
 * excluir por criterios nuestros es lo contrario de lo que se pretende.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NADA DE ESTO TACHA UNA HERRAMIENTA DE LA LISTA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Lo que sale de aquí COLOCA, no expulsa. Decisión de la propietaria, en
 * ATLAS.md, «QUÉ VE LA PERSONA CUANDO PREGUNTA»:
 *
 *   «te la dejo de más cerca a más lejana las que te pueden ayudar las
 *    primeras tres pero si despliega podrás verlas todas las que hemos
 *    podido verificar»
 *
 * Y el motivo, que no es de pantalla: «las tres primeras son nuestra ayuda; el
 * desplegable es su derecho. Molnip informa y acompaña — elige ella.»
 *
 * Por eso `ajusteConLaNecesidad` NO devuelve un booleano de admisión. Devuelve
 * a qué distancia está cada herramienta de lo que esa persona pidió, y la
 * distancia ordena; no tacha. Una herramienta a la que le falta algo
 * imprescindible queda lejos y se dice por qué —«esto no está pensado para lo
 * que necesitas»—, no desaparece ni se la califica. De ahí que `estorba` no
 * exista y que `leFalta` sea una lista de motivos que se pueden leer en voz
 * alta: no somos jueces.
 *
 * Y la distancia se mide contra LO QUE ELLA PIDIÓ, nunca contra el catálogo
 * entero. Contar capacidades totales mediría cuánto la hemos mirado nosotros
 * —está avisado en `data/verificacion/cobertura.ts`—. Contar cuántas de SUS
 * necesidades cubre es otra cosa, y es la que ella definió: «se puede calcular
 * sin opinar. Es contar cuántas de sus necesidades cubre cada una, de las que
 * están comprobadas.»
 */

export type Puerta = {
  id: string;
  /** El título, en voz de la persona. Nunca el nombre del software. */
  titulo: string;
  /** Frases con las que llega quien tiene este problema. */
  loQueDice: string[];
  /**
   * Nombres técnicos que traen aquí: «CRM», «ERP», «programa de facturación».
   * No son categorías — son puertas de entrada. Se conservan porque mucha
   * gente sí llega con el nombre aprendido, y mandarla a empezar de cero
   * sería cobrarle un peaje por saber algo.
   */
  entradas: string[];
};

export type Necesidad = {
  id: string;
  titulo: string;
  loQueDice: string[];
  /** Puede colgar de varias. Ver la cabecera. */
  puertas: string[];
  /** Sin esto no le sirve. Lo único que descalifica. */
  imprescindibles: string[];
  /** Si lo trae, suma. Si no, es un aviso — nunca un descarte. */
  ayudan: string[];
};

export type MapaDeNecesidades = {
  version: string;
  fecha: string;
  nota: string;
  puertas: Puerta[];
  necesidades: Necesidad[];
};

const RUTA = path.join(process.cwd(), "data", "vocabulario", "necesidades.json");

let cache: MapaDeNecesidades | null = null;

export function getMapaDeNecesidades(): MapaDeNecesidades {
  cache ??= JSON.parse(fs.readFileSync(RUTA, "utf8")) as MapaDeNecesidades;
  return cache;
}

export function getPuertas(): Puerta[] {
  return getMapaDeNecesidades().puertas;
}

export function getNecesidades(): Necesidad[] {
  return getMapaDeNecesidades().necesidades;
}

export function getNecesidad(id: string): Necesidad | undefined {
  return getNecesidades().find((n) => n.id === id);
}

/** Las necesidades que cuelgan de una puerta, en el orden en que están escritas. */
export function necesidadesDePuerta(puertaId: string): Necesidad[] {
  return getNecesidades().filter((n) => n.puertas.includes(puertaId));
}

/**
 * Qué le pasa a una herramienta frente a UNA necesidad.
 *
 * Función pura: recibe lo que se sabe de la herramienta y no lo va a buscar.
 * No lee la verificación ni el catálogo — no puede, y tampoco debe: mezclarlo
 * aquí ataría el mapa a la forma que hoy tienen los datos.
 *
 * Los cuatro estados de la verificación sobreviven enteros. `leFalta` es
 * ausencia DEMOSTRADA y descalifica; `sinComprobar` es que no lo sabemos y
 * sólo avisa. Confundirlos sería convertir «no nos consta» en «no lo tiene»,
 * que es justo lo que las reglas de lectura de F2 prohíben.
 */
/**
 * Cómo puede presentarse una herramienta frente a UNA necesidad.
 *
 * NO EXISTE UN VALOR QUE SIGNIFIQUE «NO APARECE», y es a propósito: en el
 * desplegable salen todas las que hemos verificado y elige ella.
 *
 * Los tres valores son la respuesta a dos correcciones de la propietaria
 * (2026-09-22), y las dos van juntas:
 *
 * **«Mostrar no equivale a recomendar.»** Antes esto era un booleano `sirve`,
 * y un booleano sólo sabe decir sí o no. Se enseñaban igual la herramienta que
 * resuelve la necesidad y la que no sabemos si la resuelve. Recomendar exige
 * haberlo comprobado; enseñar, no.
 *
 * **«No está pensada para esto» no significa «no lo hemos comprobado».** Son
 * dos estados distintos y NINGUNO se deduce del otro. Con los datos de hoy la
 * diferencia lo es todo: hay CERO ausencias demostradas en 1.547
 * comprobaciones, así que en la práctica casi todo cae en `sin_comprobar`. Si
 * los dos compartieran valor —o frase—, estaríamos diciendo «no lo hace» cada
 * vez que queremos decir «no lo sabemos», que es la regla 3 de F2 al revés.
 */
export type ComoSePresenta =
  /** Todas sus imprescindibles están DEMOSTRADAS. Lo único que se recomienda. */
  | "recomendable"
  /** Se comprobó que NO hace algo imprescindible. Se muestra diciendo qué. */
  | "le_falta_algo"
  /** No se ha comprobado algo imprescindible. Se muestra diciendo que no se sabe. */
  | "sin_comprobar";

/**
 * Qué le pasa a una herramienta frente a UNA necesidad.
 *
 * Función pura: recibe lo que se sabe de la herramienta y no lo va a buscar.
 * No lee la verificación ni el catálogo — no puede, y tampoco debe: mezclarlo
 * aquí ataría el mapa a la forma que hoy tienen los datos.
 *
 * Los cuatro estados de la verificación sobreviven enteros y SEPARADOS. Que
 * falte algo (`leFalta`) es ausencia demostrada; que no se sepa
 * (`noSabemosSiLoHace`) es otra cosa. Nunca se juntan en un campo.
 */
export type AjusteConLaNecesidad = {
  necesidadId: string;
  /** Imprescindibles que sí demuestra. */
  resuelve: string[];
  /** Imprescindibles que se comprobó que NO hace. */
  leFalta: string[];
  /** Imprescindibles que no se han comprobado. NO son lo mismo que `leFalta`. */
  noSabemosSiLoHace: string[];
  /** De las que ayudan, las que demuestra. Se nombran; no se puntúan. */
  aporta: string[];
  /** De las que ayudan, las que no se han comprobado. */
  noSabemosSiTrae: string[];
  comoSePresenta: ComoSePresenta;
};

export function ajusteConLaNecesidad(
  necesidad: Necesidad,
  demostradas: ReadonlySet<string>,
  descartadas: ReadonlySet<string>
): AjusteConLaNecesidad {
  const resuelve: string[] = [];
  const leFalta: string[] = [];
  const noSabemosSiLoHace: string[] = [];
  const aporta: string[] = [];
  const noSabemosSiTrae: string[] = [];

  for (const cap of necesidad.imprescindibles) {
    if (demostradas.has(cap)) resuelve.push(cap);
    else if (descartadas.has(cap)) leFalta.push(cap);
    else noSabemosSiLoHace.push(cap);
  }
  for (const cap of necesidad.ayudan) {
    if (demostradas.has(cap)) aporta.push(cap);
    else if (!descartadas.has(cap)) noSabemosSiTrae.push(cap);
  }

  /**
   * El orden de las tres preguntas importa. Primero lo que SABEMOS que no
   * hace, porque es lo más serio y lo más raro; después lo que no hemos
   * mirado. Al revés, una ausencia demostrada quedaría tapada por un hueco
   * nuestro en la misma necesidad.
   */
  const comoSePresenta: ComoSePresenta =
    leFalta.length > 0 ? "le_falta_algo" : noSabemosSiLoHace.length > 0 ? "sin_comprobar" : "recomendable";

  return { necesidadId: necesidad.id, resuelve, leFalta, noSabemosSiLoHace, aporta, noSabemosSiTrae, comoSePresenta };
}

/**
 * La etiqueta de una capacidad tal como entra a mitad de frase.
 *
 * Las etiquetas del vocabulario están escritas para una lista —«Reserva online
 * por la propia persona»— y dentro de una frase la mayúscula suelta chirría.
 * Se baja, salvo cuando empieza por una sigla: «TPV y caja» o «API abierta» no
 * se tocan.
 */
function etiqueta(capacidadId: string): string {
  const texto = getCapacidad(capacidadId)?.etiqueta ?? capacidadId;
  const esSigla = texto.length > 1 && texto[0] === texto[0].toUpperCase() && texto[1] === texto[1].toUpperCase();
  return esSigla ? texto : texto.charAt(0).toLowerCase() + texto.slice(1);
}

/**
 * LA ÚNICA FORMA AUTORIZADA de poner en palabras lo que sabemos de una
 * herramienta frente a una necesidad.
 *
 * Que sea la única es lo que hace comprobable la corrección de la propietaria:
 * hay pruebas que exigen que la frase de «no lo hace» y la de «no lo sabemos»
 * NUNCA coincidan, y que la segunda no afirme nunca una ausencia. Si mañana
 * alguien redacta esto en otro sitio, esas pruebas dejan de proteger nada.
 *
 * Mismo patrón, y por el mismo motivo, que `describir()` en
 * `data/verificacion/evidencia.ts`. No se puede reutilizar aquélla porque la
 * guarda de aislamiento de la verificación no deja que este módulo la lea, y
 * romper la guarda es una decisión que no es de quien escribe una frase.
 *
 * Y la frase dice **cómo le afecta a ella**, no sólo qué falta: por eso nombra
 * la necesidad que se queda sin resolver. «Le falta cap.online_self_service_
 * booking» no le sirve a nadie; «sin eso, que puedan reservar sin llamarte se
 * queda sin resolver» sí.
 */
export function describirElAjuste(necesidad: Necesidad, ajuste: AjusteConLaNecesidad): string {
  const enMinuscula = necesidad.titulo.charAt(0).toLowerCase() + necesidad.titulo.slice(1);

  if (ajuste.comoSePresenta === "le_falta_algo") {
    const faltan = ajuste.leFalta.map(etiqueta).join(", ");
    return (
      `Lo hemos comprobado: no hace ${faltan}. ` +
      `Sin eso, ${enMinuscula} se te queda sin resolver. No está pensada para esto.`
    );
  }

  if (ajuste.comoSePresenta === "sin_comprobar") {
    const dudosas = ajuste.noSabemosSiLoHace.map(etiqueta).join(", ");
    return (
      `No nos consta que haga ${dudosas}, y es lo que hace falta para ${enMinuscula}. ` +
      `Lo hemos buscado en su página y no ha quedado demostrado; podría hacerlo igualmente.`
    );
  }

  const hace = ajuste.resuelve.map(etiqueta).join(", ");
  const extras = ajuste.aporta.length > 0 ? ` Además trae ${ajuste.aporta.map(etiqueta).join(", ")}.` : "";
  return `Hace ${hace}, y está comprobado. Con eso, ${enMinuscula} queda resuelto.${extras}`;
}

/**
 * Todo lo que puede estar mal en el mapa. Devuelve frases, no lanza.
 *
 * La que más importa es la última: que no quede ninguna capacidad sin
 * necesidad. Una capacidad huérfana es trabajo verificado que nadie puede
 * pedir, y se quedaría muerta sin que nadie se entere.
 */
export function erroresDelMapa(mapa: MapaDeNecesidades = getMapaDeNecesidades()): string[] {
  const errores: string[] = [];
  const activas = new Set(getCapacidades().filter((c) => c.estado === "activa").map((c) => c.id));
  const idsPuerta = new Set(mapa.puertas.map((p) => p.id));
  const vistas = new Set<string>();
  const usadas = new Set<string>();

  if (idsPuerta.size !== mapa.puertas.length) errores.push("hay dos puertas con el mismo identificador");

  for (const n of mapa.necesidades) {
    if (vistas.has(n.id)) errores.push(`necesidad repetida: ${n.id}`);
    vistas.add(n.id);
    if (n.imprescindibles.length === 0) errores.push(`${n.id} no declara ninguna imprescindible: no podría filtrar nada`);
    if (n.puertas.length === 0) errores.push(`${n.id} no cuelga de ninguna puerta`);
    if (n.loQueDice.length === 0) errores.push(`${n.id} no tiene ni una frase de cómo lo dice la persona`);
    for (const p of n.puertas) if (!idsPuerta.has(p)) errores.push(`${n.id} apunta a una puerta que no existe: ${p}`);
    for (const cap of [...n.imprescindibles, ...n.ayudan]) {
      if (!activas.has(cap)) errores.push(`${n.id} apunta a una capacidad inexistente o no activa: ${cap}`);
      usadas.add(cap);
    }
    for (const cap of n.imprescindibles) {
      if (n.ayudan.includes(cap)) errores.push(`${n.id} tiene ${cap} en las dos listas: o descalifica o suma, no las dos`);
    }
  }

  const huerfanas = [...activas].filter((c) => !usadas.has(c));
  if (huerfanas.length > 0) {
    errores.push(`${huerfanas.length} capacidad(es) sin ninguna necesidad que las pida: ${huerfanas.join(", ")}`);
  }

  const sinNecesidades = mapa.puertas.filter((p) => !mapa.necesidades.some((n) => n.puertas.includes(p.id)));
  for (const p of sinNecesidades) errores.push(`la puerta ${p.id} no tiene ninguna necesidad detrás`);

  return errores;
}

/**
 * A qué distancia está una herramienta de LO QUE ESA PERSONA PIDIÓ.
 *
 * Es la medida que sustituye a la puntuación, y la diferencia no es de grado:
 * «ésta es mejor» es un juicio sobre una empresa; «ésta se parece más a lo que
 * me has pedido» es una medida entre dos cosas que tenemos delante. Ninguna
 * queda mal — unas están más lejos de SU necesidad, y eso no las hace peores.
 *
 * El denominador son las necesidades que ella nombró, nunca el catálogo. Por
 * eso `deCuantas` viaja al lado de `cubre`: «3 de 4» se puede decir en voz
 * alta y «3» a secas no significa nada.
 *
 * Los tres recuentos —`cubre`, `leFaltan`, `sinComprobar`— SUMAN `deCuantas`,
 * y hay una prueba que lo exige. Así la frase se puede decir entera y sin
 * huecos: «de tus cuatro, dos las resuelve, una no la hace y de la otra no lo
 * sabemos». Si no sumaran, algo se estaría cayendo por el camino sin que nadie
 * lo notase.
 *
 * `sinComprobar` no se reparte entre los otros dos. Es la parte que no sabemos
 * y que hay que enseñar tal cual, porque si se callara, la herramienta que más
 * hemos mirado parecería la que más cubre. Y NO se junta con `leFaltan`: no
 * haberlo comprobado no es haber comprobado que no.
 *
 * Aquí NO se ordena. Ordenar es del motor, va en F3 y tiene su propia regla ya
 * escrita —«primero que sirva, después que encaje»—: la compatibilidad
 * funcional verificada va antes que el tamaño, el precio, el idioma o la
 * facilidad. Esta función sólo da el material con el que se ordenará.
 */
export type AjusteConLoQuePidio = {
  /** Una por cada necesidad que ella nombró, en el orden en que las nombró. */
  porNecesidad: AjusteConLaNecesidad[];
  /** De las suyas, cuántas resuelve del todo. */
  cubre: number;
  /** Cuántas pidió. El denominador que hace legible al numerador. */
  deCuantas: number;
  /** De las suyas, en cuántas se comprobó que le falta algo imprescindible. */
  leFaltan: number;
  /** De las suyas, en cuántas no hemos comprobado algo imprescindible. */
  sinComprobar: number;
  /**
   * Lo que trae y ella no pidió. **Una LISTA, nunca un número.**
   *
   * Y no es una pega de estilo. Corrección de la propietaria (2026-09-22):
   * «los extras aportan cuando tienen utilidad para esa persona. La tercera
   * habitación sirve si puede aprovecharla; tener más funciones no debería
   * subir automáticamente una herramienta.»
   *
   * Un número se suma, y sumarlo ordenaría: la suite con cuarenta funciones
   * adelantaría a la que hace justo lo que le hace falta, sin que nadie haya
   * dicho que esas cuarenta le sirvan de algo. Y encima volvería a medir
   * cuánto la hemos mirado nosotros, que es de lo que avisa
   * `data/verificacion/cobertura.ts`.
   *
   * Así que esto se ENSEÑA para que ella juzgue si le sirve —es su tercera
   * habitación y sabrá si la usa de despacho—, y no entra en la distancia.
   * Hay una prueba que exige que añadir extras no mueva `cubre`.
   */
  traeAdemas: string[];
};

export function ajusteConLoQuePidio(
  necesidades: readonly Necesidad[],
  demostradas: ReadonlySet<string>,
  descartadas: ReadonlySet<string>
): AjusteConLoQuePidio {
  const porNecesidad = necesidades.map((n) => ajusteConLaNecesidad(n, demostradas, descartadas));
  const pedidas = new Set(necesidades.flatMap((n) => [...n.imprescindibles, ...n.ayudan]));

  const cuantas = (estado: ComoSePresenta) => porNecesidad.filter((a) => a.comoSePresenta === estado).length;

  return {
    porNecesidad,
    cubre: cuantas("recomendable"),
    deCuantas: necesidades.length,
    leFaltan: cuantas("le_falta_algo"),
    sinComprobar: cuantas("sin_comprobar"),
    traeAdemas: [...demostradas].filter((c) => !pedidas.has(c)).sort(),
  };
}
