import fs from "node:fs";
import path from "node:path";
import { getCapacidades } from "./repositorio";

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
export type AjusteConLaNecesidad = {
  necesidadId: string;
  /** Imprescindibles que sí demuestra. */
  resuelve: string[];
  /** Imprescindibles que se comprobó que NO hace. Lo único que descalifica. */
  leFalta: string[];
  /** De las que ayudan, las que demuestra. Suma; no tenerlas no resta. */
  aporta: string[];
  /** Ni demostradas ni descartadas. Se dice, no se castiga. */
  sinComprobar: string[];
  /**
   * Falso sólo si le falta algo imprescindible DEMOSTRADAMENTE.
   *
   * NO es un permiso de entrada. Sigue apareciendo en el desplegable, porque
   * ahí salen todas las que hemos verificado; lo que cambia es dónde queda y
   * qué se dice de ella. `leFalta` lleva el motivo para poder decirlo sin
   * juzgarla: no está pensada para esto.
   */
  sirve: boolean;
};

export function ajusteConLaNecesidad(
  necesidad: Necesidad,
  demostradas: ReadonlySet<string>,
  descartadas: ReadonlySet<string>
): AjusteConLaNecesidad {
  const resuelve: string[] = [];
  const leFalta: string[] = [];
  const aporta: string[] = [];
  const sinComprobar: string[] = [];

  for (const cap of necesidad.imprescindibles) {
    if (demostradas.has(cap)) resuelve.push(cap);
    else if (descartadas.has(cap)) leFalta.push(cap);
    else sinComprobar.push(cap);
  }
  for (const cap of necesidad.ayudan) {
    if (demostradas.has(cap)) aporta.push(cap);
    else if (!descartadas.has(cap)) sinComprobar.push(cap);
  }

  return { necesidadId: necesidad.id, resuelve, leFalta, aporta, sinComprobar, sirve: leFalta.length === 0 };
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
 * `sinComprobar` no se reparte entre los otros dos. Es la parte que no sabemos
 * y que hay que enseñar tal cual, porque si se callara, la herramienta que más
 * hemos mirado parecería la que más cubre.
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
  /** De las suyas, en cuántas hay algo que no hemos comprobado. */
  conAlgoSinComprobar: number;
  /** Capacidades que trae de más y que ella no pidió. Suma, nunca resta. */
  aportaDeMas: number;
};

export function ajusteConLoQuePidio(
  necesidades: readonly Necesidad[],
  demostradas: ReadonlySet<string>,
  descartadas: ReadonlySet<string>
): AjusteConLoQuePidio {
  const porNecesidad = necesidades.map((n) => ajusteConLaNecesidad(n, demostradas, descartadas));
  const pedidas = new Set(necesidades.flatMap((n) => [...n.imprescindibles, ...n.ayudan]));

  /**
   * Una necesidad está cubierta cuando están demostradas TODAS sus
   * imprescindibles. Que una AYUDA esté sin comprobar no la descubre: sería la
   * asimetría al revés —castigar por lo que no sabemos de un extra—, y lo no
   * comprobado ya se cuenta aparte en `conAlgoSinComprobar`.
   */
  const cubre = necesidades.filter(
    (n, i) => porNecesidad[i].resuelve.length === n.imprescindibles.length
  ).length;

  return {
    porNecesidad,
    cubre,
    deCuantas: necesidades.length,
    leFaltan: porNecesidad.filter((a) => !a.sirve).length,
    conAlgoSinComprobar: porNecesidad.filter((a) => a.sinComprobar.length > 0).length,
    aportaDeMas: [...demostradas].filter((c) => !pedidas.has(c)).length,
  };
}
