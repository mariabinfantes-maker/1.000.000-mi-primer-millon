import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getNecesidad, type NecesidadDelCaso } from "@/data/vocabulario/necesidades";

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
  /** Cuántas de las suyas cubría alguien el día que se midió. Es un dato, no una nota. */
  cubiertasHoy: number;
  deCuantas: number;
};

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
