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
 * Separadores que la vista ignora pero `includes` no.
 *
 * Espacios de cualquier clase, saltos de línea, tabuladores, el espacio duro,
 * los de ancho cero, y los guiones y barras que sustituyen a un espacio
 * («off-line», «sin-cobertura»).
 */
const SEPARADORES = /[\s\u00a0\u1680\u2000-\u200d\u202f\u205f\u2060\u3000\-\u2010-\u2015_/\\]+/g;

/** Sin tildes, en minúsculas y con los espacios colapsados a uno solo. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(SEPARADORES, " ")
    .trim();
}

/**
 * Lo mismo, pero SIN separadores en absoluto. Es lo que se usa para cotejar
 * términos.
 *
 * Existe porque colapsar a un espacio no basta: la revisión independiente
 * encontró siete formas de apagar la guarda metiendo algo entre las palabras
 * —doble espacio, salto de línea, tabulador, espacio duro, ancho cero, guion,
 * «off-line»— y las dos primeras se producen tecleando, sin mala intención.
 * Quitándolos todos, «sin  cobertura», «sin\ncobertura» y «sin-cobertura» son
 * la misma cadena que «sin cobertura».
 */
export function compactar(texto: string): string {
  return normalizar(texto).replace(/ /g, "");
}

/**
 * Quita los identificadores del texto antes de buscar términos.
 *
 * Sin esto, `req.offline_capable` contiene literalmente «offline» y cualquier
 * frontera bien escrita se acusaría a sí misma.
 */
export function sinIdentificadores(texto: string): string {
  return texto.replace(/\b(?:cap|req)\.[a-z0-9_]+/g, " ");
}

/**
 * Qué está mal en cómo esta capacidad usa los términos reservados.
 *
 * La regla es corta: en `definicion` no puede aparecer ninguno, nunca. En
 * `noEs` puede aparecer sólo si está DECLARADO, y la declaración tiene que
 * apuntar a algo que exista y que además se nombre en el propio texto.
 *
 * La versión anterior intentaba deducir el permiso de la redacción —negaciones,
 * orden de las palabras— y dos frases con la negación desplazada seguían
 * pasando. Ninguna regla léxica separaba limpiamente «no es X, que tiene Y» de
 * «no es X y tiene Y». Ahora no hay nada que deducir: o está declarado, o no
 * vale, y la declaración se revisa en el diff como cualquier otro dato.
 */
export function erroresDeMenciones(
  capacidad: Capacidad,
  restricciones: readonly Restriccion[],
  identificadoresValidos: readonly string[]
): string[] {
  const errores: string[] = [];
  const declaradas = capacidad.mencionesDeclaradas ?? [];
  const definicion = compactar(sinIdentificadores(capacidad.definicion));
  const noEs = compactar(sinIdentificadores(capacidad.noEs));

  // 1 · Ninguna declaración puede repetir término. Antes se buscaba con `find`,
  // que devuelve la primera y deja las siguientes sin comprobar: una segunda
  // declaración del mismo término pasaba entera aunque apuntara a algo
  // inexistente, ausente del texto o a la propia capacidad.
  const vistos = new Map<string, number>();
  for (const declarada of declaradas) {
    const clave = compactar(declarada.termino);
    vistos.set(clave, (vistos.get(clave) ?? 0) + 1);
  }
  for (const [clave, veces] of vistos) {
    if (veces > 1) {
      errores.push(
        `declara ${veces} veces el término «${clave}»: sólo puede declararse una vez`
      );
    }
  }

  // 2 · TODA declaración se valida, esté donde esté en la lista.
  for (const declarada of declaradas) {
    const donde = `la mención de «${declarada.termino}»`;
    if (!declarada.termino?.trim()) {
      errores.push("hay una mención declarada sin término");
    }
    if (!identificadoresValidos.includes(declarada.remiteA)) {
      errores.push(`${donde} remite a "${declarada.remiteA}", que no existe`);
    }
    if (declarada.remiteA === capacidad.id) {
      errores.push(`${donde} no puede remitir a la propia capacidad`);
    }
    // El destino tiene que estar escrito en el texto: si no, la declaración
    // dice una cosa y quien lee ve otra.
    if (!capacidad.noEs.includes(declarada.remiteA)) {
      errores.push(`${donde} remite a ${declarada.remiteA}, que no aparece en noEs`);
    }
  }

  // 3 · Todo término reservado que aparezca tiene que estar declarado.
  const usados = new Set<string>();
  for (const restriccion of restricciones) {
    for (const termino of restriccion.terminosReservados) {
      const t = compactar(termino);
      if (definicion.includes(t)) {
        errores.push(`definicion usa «${termino}», que pertenece a ${restriccion.id}`);
      }
      if (!noEs.includes(t)) continue;
      usados.add(t);
      if (!declaradas.some((d) => compactar(d.termino) === t)) {
        errores.push(
          `noEs menciona «${termino}» (${restriccion.id}) sin declararlo en mencionesDeclaradas`
        );
      }
    }
  }

  // 4 · Y ninguna declaración puede sobrar.
  for (const declarada of declaradas) {
    if (!usados.has(compactar(declarada.termino))) {
      errores.push(`declara la mención de «${declarada.termino}» y no la usa: bórrala`);
    }
  }
  return errores;
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

/**
 * ¿Es una fecha que existe de verdad?
 *
 * El formato solo no basta: "2026-13-45" pasa cualquier expresión regular
 * razonable y no es ninguna fecha. Se comprueba dando la vuelta —construir la
 * fecha y ver si vuelve a escribirse igual—, que además descarta el 30 de
 * febrero y acierta con los años bisiestos sin tener que saber cuáles son.
 */
export function esFechaReal(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(`${fecha}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === fecha;
}

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
  const repetidos = m.a.filter((d, i) => m.a.indexOf(d) !== i);
  if (repetidos.length) {
    // Una escisión hacia el mismo sitio dos veces no es una escisión: es una
    // fusión mal escrita, y contaría el destino dos veces al repartir.
    errores.push(`destino repetido: ${[...new Set(repetidos)].join(", ")}`);
  }
  if (!esFechaReal(m.fecha)) errores.push(`fecha inválida: "${m.fecha}"`);
  if (!m.motivo?.trim()) errores.push("una migración sin motivo no se puede revisar después");
  return errores;
}
