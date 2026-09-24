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
  /**
   * El mismo concepto, en dos palabras y como lo diría ella: «reservas»,
   * «facturas», «agenda».
   *
   * No sustituye a `titulo` —ése es la frase entera, la que se lee cuando hay
   * sitio— sino que existe para los sitios donde una frase larga no cabe sin
   * convertir la pantalla en deberes. Nace de esto, el 2026-09-24: «no son
   * tarjetas que uno mire y entienda, el vocabulario es raro». El titular de
   * una tarjeta decía «una herramienta para cada cosa», que es cómo lo
   * llamamos nosotros; con esto dice «reservas y facturas», que es cómo lo
   * llama ella.
   */
  enCorto: string;
  loQueDice: string[];
  /** Puede colgar de varias. Ver la cabecera. */
  puertas: string[];
  /** Sin esto no le sirve. Lo único que descalifica. */
  imprescindibles: string[];
  /** Si lo trae, suma. Si no, es un aviso — nunca un descarte. */
  ayudan: string[];
  /**
   * Lo que le cuesta a ELLA ponerlo en marcha. En su idioma y sin adornos.
   *
   * Cuelga de la NECESIDAD y no de la herramienta a propósito: dar de alta tus
   * servicios y tus horarios hay que hacerlo con cualquier programa de citas,
   * así que no es una pega de ninguna marca ni un dato que haya que verificar
   * — es lo que va a tener que hacer ella, y callarlo sería vender humo.
   *
   * Sale de la regla de la casa de tres habitaciones: «explícale qué gana, qué
   * coste o esfuerzo adicional supone y deja que decida». Sin esta frase sólo
   * se cuenta la mitad.
   *
   * Opcional porque está a medio escribir. Que falte no es que sea gratis: es
   * que todavía no lo hemos puesto.
   */
  loQueTeCuesta?: string;
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
 * Lo que se sabe de un par herramienta×capacidad. CUATRO estados, no dos.
 *
 * Es el mismo reparto que `EstadoDeCobertura` en `data/verificacion`, y está
 * repetido aquí a mano porque la guarda de aislamiento de la verificación no
 * deja que este módulo la lea. Repetir un tipo es feo; romper una guarda para
 * ahorrárselo es peor, y no es decisión de quien escribe esto.
 *
 * La primera versión de este módulo recibía sólo dos conjuntos —lo demostrado
 * y lo descartado— y todo lo demás caía en un único cajón al que se le puso la
 * frase «lo hemos buscado en su página». Con los datos de hoy eso era falso en
 * el 84 % de los casos: 8.268 de 9.815 pares no se preguntaron nunca. Lo cazó
 * la propietaria.
 */
export type EstadoDeLaCapacidad = "demostrada" | "descartada" | "desconocida" | "sinPreguntar";

/**
 * Cómo puede presentarse una herramienta frente a UNA necesidad.
 *
 * NO EXISTE UN VALOR QUE SIGNIFIQUE «NO APARECE», y es a propósito: en el
 * desplegable salen todas las que hemos verificado y elige ella.
 *
 * **«Mostrar no equivale a recomendar.»** Antes esto era un booleano `sirve`, y
 * un booleano sólo sabe decir sí o no. Se enseñaban igual la herramienta que
 * resuelve la necesidad y la que no sabemos si la resuelve. Recomendar exige
 * haberlo comprobado; enseñar, no.
 *
 * **«No está pensada para esto» no significa «no lo hemos comprobado».** Son
 * dos estados distintos y NINGUNO se deduce del otro. Con los datos de hoy la
 * diferencia lo es todo: hay CERO ausencias demostradas en 1.547
 * comprobaciones, así que en la práctica casi todo cae en `sin_comprobar`.
 *
 * Y son TRES, no cuatro, a propósito. `desconocida` y `sinPreguntar` cambian
 * la FRASE pero comparten estado, para que no puedan ordenar. Regla de la
 * propietaria (2026-09-22): «esa diferencia entre desconocidos no debería
 * convertirse en una penalización». Que la hayamos mirado y no saliera insinúa
 * un poco la ausencia; que no la hayamos mirado no dice nada. Ordenar por esa
 * diferencia sería convertir una sospecha en un dato.
 */
export type ComoSePresenta =
  /** Todas sus imprescindibles están DEMOSTRADAS. Lo único que se recomienda. */
  | "recomendable"
  /** Se comprobó que NO hace algo imprescindible. Se muestra diciendo qué. */
  | "le_falta_algo"
  /** No se sabe si hace algo imprescindible. Se muestra diciendo por qué no se sabe. */
  | "sin_comprobar";

/**
 * Qué le pasa a una herramienta frente a UNA necesidad.
 *
 * Función pura: recibe una función que contesta qué se sabe de cada capacidad
 * y no lo va a buscar. No lee la verificación ni el catálogo — no puede, y
 * tampoco debe: mezclarlo aquí ataría el mapa a la forma que hoy tienen los
 * datos.
 */
export type AjusteConLaNecesidad = {
  necesidadId: string;
  /** Imprescindibles que sí demuestra. */
  resuelve: string[];
  /** Imprescindibles que se comprobó que NO hace. */
  leFalta: string[];
  /** Imprescindibles que se buscaron y no quedaron demostradas. */
  buscadasSinEncontrar: string[];
  /** Imprescindibles que NUNCA se preguntaron. Hueco nuestro, no suyo. */
  sinPreguntar: string[];
  /** De las que ayudan, las que demuestra. Se nombran; no se puntúan. */
  aporta: string[];
  comoSePresenta: ComoSePresenta;
};

export function ajusteConLaNecesidad(
  necesidad: Necesidad,
  estadoDe: (capacidadId: string) => EstadoDeLaCapacidad
): AjusteConLaNecesidad {
  const resuelve: string[] = [];
  const leFalta: string[] = [];
  const buscadasSinEncontrar: string[] = [];
  const sinPreguntar: string[] = [];
  const aporta: string[] = [];

  for (const cap of necesidad.imprescindibles) {
    const estado = estadoDe(cap);
    if (estado === "demostrada") resuelve.push(cap);
    else if (estado === "descartada") leFalta.push(cap);
    else if (estado === "desconocida") buscadasSinEncontrar.push(cap);
    else sinPreguntar.push(cap);
  }
  for (const cap of necesidad.ayudan) if (estadoDe(cap) === "demostrada") aporta.push(cap);

  /**
   * El orden de las preguntas importa. Primero lo que SABEMOS que no hace,
   * porque es lo más serio y lo más raro; después lo que no sabemos. Al revés,
   * una ausencia demostrada quedaría tapada por un hueco nuestro en la misma
   * necesidad.
   */
  const comoSePresenta: ComoSePresenta =
    leFalta.length > 0
      ? "le_falta_algo"
      : buscadasSinEncontrar.length + sinPreguntar.length > 0
        ? "sin_comprobar"
        : "recomendable";

  return { necesidadId: necesidad.id, resuelve, leFalta, buscadasSinEncontrar, sinPreguntar, aporta, comoSePresenta };
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

function lista(ids: string[]): string {
  return ids.map(etiqueta).join(", ");
}

/**
 * LA ÚNICA FORMA AUTORIZADA de poner en palabras lo que sabemos de una
 * herramienta frente a una necesidad.
 *
 * Que sea la única es lo que hace comprobable la corrección de la propietaria:
 * hay pruebas que exigen que las frases de «no lo hace», «lo buscamos y no
 * salió» y «todavía no lo hemos mirado» sean SIEMPRE distintas, y que ninguna
 * de las dos últimas afirme una ausencia. Si mañana alguien redacta esto en
 * otro sitio, esas pruebas dejan de proteger nada.
 *
 * Mismo patrón, y por el mismo motivo, que `describir()` en
 * `data/verificacion/evidencia.ts`. No se puede reutilizar aquélla porque la
 * guarda de aislamiento de la verificación no deja que este módulo la lea.
 *
 * Y la frase dice **cómo le afecta a ella**: nombra la necesidad que se queda
 * sin resolver. «Le falta cap.online_self_service_booking» no le sirve a nadie.
 */
export function describirElAjuste(necesidad: Necesidad, ajuste: AjusteConLaNecesidad): string {
  const suyo = necesidad.titulo.charAt(0).toLowerCase() + necesidad.titulo.slice(1);

  if (ajuste.comoSePresenta === "le_falta_algo") {
    return (
      `Lo hemos comprobado: no hace ${lista(ajuste.leFalta)}. ` +
      `Sin eso, ${suyo} se te queda sin resolver. No está pensada para esto.`
    );
  }

  if (ajuste.comoSePresenta === "sin_comprobar") {
    const partes: string[] = [];
    // Nunca preguntado: el hueco es NUESTRO y se dice así, sin disfrazarlo de
    // búsqueda. Es lo que pasa en el 84 % de los pares.
    if (ajuste.sinPreguntar.length > 0) {
      partes.push(`Todavía no hemos comprobado si hace ${lista(ajuste.sinPreguntar)}.`);
    }
    // Preguntado y sin evidencia: aquí sí hubo búsqueda, y sólo aquí se dice.
    if (ajuste.buscadasSinEncontrar.length > 0) {
      partes.push(
        `Hemos buscado ${lista(ajuste.buscadasSinEncontrar)} en su página y no ha quedado demostrado; ` +
          `podría hacerlo igualmente.`
      );
    }
    return `${partes.join(" ")} Y es lo que hace falta para ${suyo}.`;
  }

  const extras = ajuste.aporta.length > 0 ? ` Además trae ${lista(ajuste.aporta)}.` : "";
  return `Hace ${lista(ajuste.resuelve)}, y está comprobado. Con eso, ${suyo} queda resuelto.${extras}`;
}

/**
 * Cuánto le importa a ELLA una necesidad.
 *
 * No confundir con los dos niveles de DENTRO de la necesidad
 * (`imprescindibles` / `ayudan`), que son estructurales y los mismos para todo
 * el mundo. Esto es situacional: sale de la conversación y cambia de una
 * persona a otra.
 *
 * Corrección de la propietaria (2026-09-22): «"sí, me ayudaría" no significa
 * "es imprescindible". Puede ser una ventaja deseable. Convertirla
 * automáticamente en requisito podría relegar una herramienta que resuelve
 * perfectamente el problema principal.»
 */
export type Importancia = "imprescindible" | "deseable";

/** Una necesidad tal como la trae ESTA persona. */
export type NecesidadDelCaso = {
  necesidad: Necesidad;
  importancia: Importancia;
  /**
   * Cierto cuando ella no la nombró y dijo que sí a una pregunta nuestra.
   * Se conserva para poder enseñarlo —«esto lo añadimos porque nos dijiste que
   * sí»— y para que se pueda quitar.
   */
  salioDeUnaPregunta?: boolean;
};

/**
 * A qué distancia está una herramienta de LO QUE ESA PERSONA TRAJO.
 *
 * Es la medida que sustituye a la puntuación, y la diferencia no es de grado:
 * «ésta es mejor» es un juicio sobre una empresa; «ésta se parece más a lo que
 * me has pedido» es una medida entre dos cosas que tenemos delante. Ninguna
 * queda mal — unas están más lejos de SU necesidad, y eso no las hace peores.
 *
 * El denominador son las necesidades que ella trajo, nunca el catálogo: los
 * totales viajan al lado de los recuentos, porque «3 de 4» se puede decir en
 * voz alta y «3» a secas no significa nada.
 *
 * LOS DOS NIVELES NO SE MEZCLAN, y ahí está toda la gracia. Una deseable no
 * puede relegar a quien resuelve las imprescindibles: se cuentan aparte y se
 * ordena primero por las imprescindibles. Es «primero que sirva, después que
 * encaje» un piso más arriba.
 *
 * Aquí NO se ordena. Ordenar es del motor y va en F3. Esto da el material.
 */
export type AjusteConLoQuePidio = {
  /** Una por cada necesidad que ella trajo, en el mismo orden. */
  porNecesidad: AjusteConLaNecesidad[];
  /** De sus IMPRESCINDIBLES: cuántas resuelve y cuántas trajo. Lo que ordena. */
  resuelveImprescindibles: number;
  deImprescindibles: number;
  /** De sus DESEABLES: lo mismo. Desempata; nunca relega. */
  resuelveDeseables: number;
  deDeseables: number;
  /** De sus imprescindibles, en cuántas se comprobó que le falta algo. */
  leFaltan: number;
  /** De sus imprescindibles, en cuántas no lo sabemos. Ni penaliza ni se calla. */
  sinComprobar: number;
  /**
   * Lo que trae de más, de entre lo que ayuda a sus necesidades. LISTA, nunca
   * número: «los extras aportan cuando tienen utilidad para esa persona».
   * Sumarlos ordenaría, y la suite con cuarenta funciones adelantaría a la que
   * hace justo lo que hace falta sin que nadie haya dicho que le sirvan.
   */
  traeAdemas: string[];
};

export function ajusteConLoQuePidio(
  delCaso: readonly NecesidadDelCaso[],
  estadoDe: (capacidadId: string) => EstadoDeLaCapacidad
): AjusteConLoQuePidio {
  const porNecesidad = delCaso.map((n) => ajusteConLaNecesidad(n.necesidad, estadoDe));
  const conAjuste = delCaso.map((n, i) => ({ ...n, ajuste: porNecesidad[i] }));
  const de = (importancia: Importancia) => conAjuste.filter((n) => n.importancia === importancia);
  const imprescindibles = de("imprescindible");
  const deseables = de("deseable");
  const resueltas = (grupo: typeof conAjuste) =>
    grupo.filter((n) => n.ajuste.comoSePresenta === "recomendable").length;

  return {
    porNecesidad,
    resuelveImprescindibles: resueltas(imprescindibles),
    deImprescindibles: imprescindibles.length,
    resuelveDeseables: resueltas(deseables),
    deDeseables: deseables.length,
    leFaltan: imprescindibles.filter((n) => n.ajuste.comoSePresenta === "le_falta_algo").length,
    sinComprobar: imprescindibles.filter((n) => n.ajuste.comoSePresenta === "sin_comprobar").length,
    traeAdemas: [...new Set(porNecesidad.flatMap((a) => a.aporta))].sort(),
  };
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
