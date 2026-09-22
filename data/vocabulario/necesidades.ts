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
  /** Falso sólo si le falta algo imprescindible DEMOSTRADAMENTE. */
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
