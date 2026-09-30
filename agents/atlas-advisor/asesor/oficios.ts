import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";
import { getPuertoDeEvidencia } from "@/data/verificacion/consulta";
import type { PuertoDeEvidencia } from "@/data/verificacion/puerto";

/**
 * LAS CASAS DE MOLNIP SON OFICIOS.
 *
 * Decisión de la propietaria, 2026-09-24: «yo quiero ser un asesor y asesorar
 * a pymes, clínicas, pequeñas empresas». Una peluquera no sabe que necesita un
 * CRM: sabe que es peluquera. Entrar por «qué eres» es asesorar; entrar por
 * «qué software buscas» es comparar, y comparar es lo que Molnip NO es.
 *
 * Las categorías de producto de `data/categorias.json` no se borran ni se
 * tocan: se quedan dentro, para que el motor sepa que Agiled es un todo en uno
 * y Paymo un gestor de proyectos. La clienta no tiene por qué verlas nunca.
 *
 * Aquí no hay puntuación ni orden por calidad. Un oficio trae SUS necesidades
 * y el asesor hace el resto, igual que cuando ella las escribe a mano.
 */

export type Oficio = {
  id: string;
  nombre: string;
  /** Las necesidades que trae este oficio, del vocabulario. */
  necesidades: string[];
  /**
   * Lo que se midió el día que se escribió el archivo. Se conserva como
   * fotografía, pero NO se usa para decidir nada: para eso está
   * `podemosServirA()`, que lee la evidencia de ahora.
   */
  cubiertasHoy: number;
  deCuantas: number;
};

/**
 * EL NÚCLEO DE UN OFICIO: lo que si falla le deja con el problema por el que
 * vino. Una peluquera sin agenda no tiene negocio.
 *
 * Vive como dato, no en un documento, por una razón que dijo la propietaria
 * el 2026-09-24: «lo que nos suele suceder es que hacemos una investigación y
 * la dejamos encerrada donde luego no se conecta con la inteligencia de
 * Molnip, y esa información queda perdida». Cada pasada de verificación
 * cuesta dinero de verdad; si el resultado no llega hasta aquí, ese dinero no
 * cambia nada.
 */
type Nucleos = { oficios: Record<string, { nucleo: string[]; porQue: string }> };

let nucleos: Nucleos | undefined;
function leerNucleos(): Nucleos {
  if (!nucleos) {
    nucleos = JSON.parse(readFileSync(join(process.cwd(), "data", "oficios", "nucleo.json"), "utf8")) as Nucleos;
  }
  return nucleos;
}

export type EstadoDeUnOficio = {
  oficio: Oficio;
  /** El porqué de su núcleo, escrito a mano y revisable. */
  porQue: string;
  /** Podemos hacernos cargo: TODO su núcleo está cubierto por alguien. */
  servido: boolean;
  /** Lo que le falta del núcleo, con sus palabras. Vacío si está servido. */
  leFalta: string[];
};

/**
 * ¿Podemos hacernos cargo de este oficio? Se calcula con la evidencia de
 * AHORA, no con el número que había el día que se escribió el archivo. Así,
 * cuando una pasada de verificación encuentra algo, esto cambia solo.
 */
export function estadoDeUnOficio(id: string, puerto: PuertoDeEvidencia = getPuertoDeEvidencia()): EstadoDeUnOficio | undefined {
  const oficio = getOficio(id);
  const nuc = leerNucleos().oficios[id];
  if (!oficio || !nuc) return undefined;

  const leFalta: string[] = [];
  for (const necesidadId of nuc.nucleo) {
    const n = getNecesidad(necesidadId);
    if (!n) continue;
    // La cubre quien demuestre TODOS sus imprescindibles.
    const quienes = n.imprescindibles.length
      ? puerto.herramientasQueDemuestran(n.imprescindibles[0])
          .filter((h) => n.imprescindibles.every((c) => puerto.estadoDe(h, c).estado === "demostrada"))
      : [];
    if (quienes.length === 0) leFalta.push(n.titulo);
  }
  return { oficio, porQue: nuc.porQue, servido: leFalta.length === 0, leFalta };
}

/** A quién podemos servir hoy. Sale del dato, no de un documento. */
export function aQuienServimos(puerto: PuertoDeEvidencia = getPuertoDeEvidencia()): EstadoDeUnOficio[] {
  return getOficios()
    .map((o) => estadoDeUnOficio(o.id, puerto))
    .filter((e): e is EstadoDeUnOficio => Boolean(e));
}

type Archivo = { version: string; fecha: string; porQue: string; oficios: Oficio[] };

let cache: Archivo | undefined;

function leer(): Archivo {
  if (!cache) {
    cache = JSON.parse(readFileSync(join(process.cwd(), "data", "oficios", "oficios.json"), "utf8")) as Archivo;
  }
  return cache;
}

export function getOficios(): Oficio[] {
  return leer().oficios;
}

export function getOficio(id: string): Oficio | undefined {
  return getOficios().find((o) => o.id === id);
}

/**
 * Lo que trae un oficio, listo para el asesor.
 *
 * Todo entra como IMPRESCINDIBLE porque es lo que define al oficio, no un
 * extra. Lo que sobre se quita preguntando, que es el paso 2; atribuirle menos
 * de entrada sería decidir por ella.
 */
export function loQueTraeUnOficio(id: string): NecesidadDelCaso[] {
  const oficio = getOficio(id);
  if (!oficio) return [];
  return oficio.necesidades
    .map((n) => getNecesidad(n))
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .map((necesidad) => ({ necesidad, importancia: "imprescindible" as const }));
}

/** Qué está mal en el archivo de oficios. Devuelve frases, no lanza. */
export function erroresDeOficios(): string[] {
  const e: string[] = [];
  const vistos = new Set<string>();
  for (const o of getOficios()) {
    if (vistos.has(o.id)) e.push(`${o.id}: repetido`);
    vistos.add(o.id);
    if (!o.nombre.trim()) e.push(`${o.id}: sin nombre`);
    if (o.necesidades.length === 0) e.push(`${o.id}: sin ninguna necesidad, y un oficio sin necesidades no es una puerta`);
    for (const n of o.necesidades) if (!getNecesidad(n)) e.push(`${o.id}: la necesidad "${n}" no existe`);
  }
  return e;
}
