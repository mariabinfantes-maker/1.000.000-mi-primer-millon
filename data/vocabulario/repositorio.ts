import fs from "node:fs";
import path from "node:path";
import type { Capacidad, Dominio, Restriccion, Vocabulario } from "./esquema";

/**
 * Acceso al vocabulario. Igual que `data/repositorio.ts` con las fichas: hoy
 * lee un JSON en disco, y el día que esto crezca sólo cambia este archivo.
 *
 * Aquí vive también la validación de identificadores, porque las reglas y los
 * datos tienen que envejecer juntos. Están escritas como funciones puras para
 * que las pruebas las ejecuten sobre el vocabulario real, no sobre ejemplos.
 */

const RUTA = path.join(process.cwd(), "data", "vocabulario", "vocabulario.json");
const RUTA_MIGRACIONES = path.join(process.cwd(), "data", "vocabulario", "migraciones.json");

let cache: Vocabulario | null = null;

export function getVocabulario(): Vocabulario {
  if (!cache) cache = JSON.parse(fs.readFileSync(RUTA, "utf8")) as Vocabulario;
  return cache;
}

export function getCapacidades(): Capacidad[] {
  return getVocabulario().capacidades;
}

export function getCapacidad(id: string): Capacidad | undefined {
  return getCapacidades().find((c) => c.id === id);
}

export function getDominios(): Dominio[] {
  return getVocabulario().dominios;
}

export function getRestricciones(): Restriccion[] {
  return getVocabulario().restricciones;
}

export function getCapacidadesDeDominio(dominioId: string): Capacidad[] {
  return getCapacidades().filter((c) => c.dominioId === dominioId);
}

export function getMigraciones(): { version: string; nota: string; migraciones: unknown[] } {
  return JSON.parse(fs.readFileSync(RUTA_MIGRACIONES, "utf8"));
}

// ─────────────────────────────────────────────────────────────────────────
// Reglas de identificador. Seis, y todas se comprueban solas.
// ─────────────────────────────────────────────────────────────────────────

/** Regla 3 — forma. `cap.` o `req.` más minúsculas ASCII y guión bajo. */
export const FORMA_CAPACIDAD = /^cap\.[a-z][a-z0-9_]*$/;
export const FORMA_RESTRICCION = /^req\.[a-z][a-z0-9_]*$/;
export const LARGO_MAXIMO = 48;

/**
 * Regla 4 — sin cajones de sastre.
 *
 * Existe porque ya pasó: `ops.field_service` era un cajón que mezclaba el
 * trabajo, la asignación y la herramienta del técnico. Como capacidad única
 * no discriminaba nada, y hubo que escindirla en tres.
 */
export const PREFIJOS_VAGOS = ["otros_", "varios_", "general_", "generico_", "nuevo_", "misc_", "extra_"];

/**
 * Regla 2 — el nombre tiene que sostenerse sin su dominio.
 *
 * Estas palabras, solas, no dicen nada: `cap.reminders` no aclara si recuerda
 * al cliente, al técnico o una tarea. Usadas como nombre completo se rechazan;
 * acompañadas del objeto sobre el que actúan, se aceptan.
 */
export const PALABRAS_AMBIGUAS_SOLAS = [
  "reminders", "scheduling", "management", "tracking", "planning",
  "analytics", "records", "history", "portal", "orders", "billing",
  "reporting", "capture", "sync", "search", "templates", "alerts",
];

/** Palabras que no aportan a la comparación entre nombres. */
const PALABRAS_VACIAS = new Set(["and", "of", "to", "the", "or", "in", "for", "a"]);

export function palabrasDe(id: string): string[] {
  return id.replace(/^(cap|req)\./, "").split("_").filter((p) => !PALABRAS_VACIAS.has(p));
}

/** Regla 5 — casi-colisión: dos o más palabras en común exigen explicar la diferencia. */
export function paresCasiColisionantes(ids: string[]): [string, string][] {
  const pares: [string, string][] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = new Set(palabrasDe(ids[i]));
      const comunes = palabrasDe(ids[j]).filter((p) => a.has(p));
      if (comunes.length >= 2) pares.push([ids[i], ids[j]]);
    }
  }
  return pares;
}

/**
 * Un texto "reclama" un término reservado cuando lo usa como si fuera parte de
 * la capacidad, en vez de señalar dónde vive de verdad.
 *
 * `noEs` es justo el sitio donde hay que nombrar la restricción para trazar la
 * frontera, así que mencionarla ahí es legítimo — siempre que se diga a dónde
 * remite. Vale tanto la restricción misma como una capacidad que la lleve
 * declarada: decir «no es una historia clínica (cap.clinical_record)» es una
 * frontera correcta, porque esa capacidad ya arrastra el término.
 */
export function reclamaTerminoReservado(
  texto: string,
  termino: string,
  remitentesValidos: string[]
): boolean {
  const t = texto.toLowerCase();
  if (!t.includes(termino.toLowerCase())) return false;
  return !remitentesValidos.some((r) => t.includes(r.toLowerCase()));
}

/** A dónde puede remitir un texto para mencionar un término reservado sin apropiárselo. */
export function remitentesValidosDe(restriccionId: string): string[] {
  const portadoras = getCapacidades()
    .filter((c) => (c.restriccionesTipicas ?? []).includes(restriccionId))
    .map((c) => c.id);
  return [restriccionId, ...portadoras];
}
