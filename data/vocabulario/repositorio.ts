import fs from "node:fs";
import path from "node:path";
import type {
  Capacidad,
  Dominio,
  Migracion,
  RegistroDeMigraciones,
  Restriccion,
  TipoMigracion,
  Vocabulario,
} from "./esquema";

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

export function getMigraciones(): RegistroDeMigraciones {
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
 * ¿Este texto se apropia de un término que pertenece a una restricción?
 *
 * En `definicion` la respuesta es siempre sí: ahí describiría la restricción
 * como si fuera parte de la función. En `noEs` es más sutil, porque `noEs` es
 * justo donde hay que trazar fronteras, y trazar una frontera legítima exige
 * poder nombrar el término.
 *
 * La primera versión de esta comprobación admitía la mención si el texto citaba
 * la restricción O CUALQUIER capacidad que la llevara declarada. Eso abría una
 * puerta trasera que encontró la revisión independiente: bastaba con nombrar de
 * pasada al TPV —que declara `req.offline_capable`— para poder escribir
 * «Funciona offline, a diferencia del TPV (cap.point_of_sale)» y pasar el
 * control. Peor aún, el conjunto de coartadas crecía solo cada vez que alguien
 * añadía una `restriccionesTipicas`.
 *
 * Ahora la mención se juzga FRASE A FRASE, y sólo se admite por dos vías:
 *
 *  a) la frase nombra la restricción misma — es la forma canónica de decir
 *     «esto vive fuera de mí»; o
 *  b) la frase nombra otra capacidad Y el término aparece DESPUÉS de esa
 *     mención Y hay una negación antes del término. Es decir: el término se le
 *     atribuye a lo que se acaba de nombrar, y se está negando, no afirmando.
 *
 * «Tampoco es una historia clínica (cap.clinical_record): esto es trato
 * comercial, no datos de salud» pasa. «Funciona offline, a diferencia del TPV
 * (cap.point_of_sale)» no pasa, porque el término va ANTES de la referencia:
 * se lo está quedando quien escribe, no atribuyéndoselo a otro.
 */

/** Marcas de negación en español que valen para desmentir. */
const NEGACIONES = /\b(no|ni|tampoco|nunca|jamas|jamás)\b/i;

/** Corta por punto seguido, sin partir los identificadores (`cap.` no lleva espacio detrás). */
export function frasesDe(texto: string): string[] {
  return texto.split(/(?<=\.)\s+/).filter((f) => f.trim().length > 0);
}

export function seApropiaDelTermino(
  noEs: string,
  termino: string,
  restriccionId: string
): boolean {
  for (const frase of frasesDe(noEs)) {
    const bajo = frase.toLowerCase();
    const posTermino = bajo.indexOf(termino.toLowerCase());
    if (posTermino === -1) continue;

    // (a) la frase nombra la restricción: frontera canónica.
    if (bajo.includes(restriccionId.toLowerCase())) continue;

    // (b) la frase se lo atribuye a otra capacidad, negándolo.
    const referencias = [...frase.matchAll(/cap\.[a-z0-9_]+/g)];
    const negacion = frase.search(NEGACIONES);
    const atribuido = referencias.some((m) => m.index !== undefined && m.index < posTermino);
    const negadoAntes = negacion !== -1 && negacion < posTermino;
    if (atribuido && negadoAntes) continue;

    return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────
// Detección de accesos al vocabulario desde fuera. Ver `aislamiento.test.ts`.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Todas las formas plausibles de llegar al vocabulario desde otro archivo.
 *
 * La primera versión sólo miraba `import ... from`, y se le escapaba justo la
 * más probable por accidente: leer el JSON con `fs.readFileSync` y `path.join`,
 * que es exactamente como lee sus datos `data/repositorio.ts`.
 */
const ACCESOS = [
  /** Alias, ruta absoluta del proyecto o literal en cualquier posición. */
  /data\/vocabulario/,
  /** Ruta relativa: ../vocabulario/…, ./vocabulario/… */
  /["'`](?:\.{1,2}\/)+vocabulario\//,
  /** Ruta construida por trozos: path.join(..., "data", "vocabulario", ...) */
  /["'`]data["'`]\s*,\s*["'`]vocabulario["'`]/,
  /** Los archivos por su nombre, con o sin ruta delante. */
  /vocabulario\.json|migraciones\.json/,
  /** Los módulos por su nombre. */
  /vocabulario\/(?:repositorio|esquema)/,
];

/** true si este código accede al vocabulario de alguna forma. */
export function accedeAlVocabulario(codigo: string): boolean {
  return ACCESOS.some((r) => r.test(codigo));
}

// ─────────────────────────────────────────────────────────────────────────
// Validación de una migración. Ver `migraciones.test.ts`.
// ─────────────────────────────────────────────────────────────────────────

/** Cuántos destinos admite cada tipo de migración. */
const DESTINOS: Record<TipoMigracion, (n: number) => boolean> = {
  fusion: (n) => n === 1,
  escision: (n) => n >= 2,
  reclasificacion: (n) => n === 1,
  baja: (n) => n === 0,
};

/**
 * Qué está mal en una migración, si algo lo está.
 *
 * Se valida contra la lista de identificadores YA EMITIDOS, no contra los
 * activos: migrar algo que nunca existió es un error, y migrar algo que ya se
 * dio de baja también tiene que poder describirse.
 */
export function erroresDeMigracion(
  m: Migracion,
  emitidos: readonly string[],
  destinosValidos: readonly string[]
): string[] {
  const errores: string[] = [];
  if (!emitidos.includes(m.de)) errores.push(`"${m.de}" no figura entre los identificadores emitidos`);
  if (!(m.tipo in DESTINOS)) errores.push(`tipo de migración desconocido: "${m.tipo}"`);
  else if (!DESTINOS[m.tipo](m.a.length))
    errores.push(`una ${m.tipo} no puede tener ${m.a.length} destino(s)`);
  for (const destino of m.a) {
    if (!destinosValidos.includes(destino)) errores.push(`el destino "${destino}" no existe`);
    if (destino === m.de) errores.push(`"${m.de}" no puede migrar a sí mismo`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) errores.push(`fecha inválida: "${m.fecha}"`);
  if (!m.motivo?.trim()) errores.push("una migración sin motivo no se puede revisar después");
  return errores;
}
