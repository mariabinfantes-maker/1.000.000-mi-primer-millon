import { TAREAS, type Carril, type MotivoDelCarril, type Tarea } from "./tareas";

/**
 * Las reglas que deciden si algo puede dispararse solo, y con qué.
 *
 * Están aquí, en un módulo sin dependencias, porque las usan los dos
 * extremos: el que crea la solicitud y el que la ejecuta. Si la
 * comprobación viviera solo en uno de los dos, bastaría con entrar por el
 * otro para saltársela.
 *
 * ── La regla de fondo ─────────────────────────────────────────────────
 *
 * El carril no se deduce de nada: está escrito tarea por tarea en
 * `tareas.ts`. Una tarea nueva sin clasificar no cae en el carril libre
 * «por no estar en la lista de las peligrosas» — es que no existe, y lo
 * que no existe no se ejecuta. Esa es la diferencia entre una lista de
 * permitidos y una de prohibidos, y es deliberada.
 */

export type Clasificacion = { carril: Carril; motivo: MotivoDelCarril };

export function clasificar(tarea: Tarea): Clasificacion {
  return { carril: tarea.carril, motivo: tarea.motivo };
}

/** `true` si la tarea necesita la firma de la propietaria antes de ejecutarse. */
export function exigeAutorizacion(tarea: Tarea): boolean {
  return tarea.carril === "conPermiso";
}

export function tareasDelCarril(carril: Carril): Tarea[] {
  return TAREAS.filter((t) => t.carril === carril);
}

/**
 * Explica en una línea por qué algo espera. Es lo que verá la propietaria,
 * así que no dice «conPermiso»: dice qué hace la tarea que obliga a pedirlo.
 */
export function explicarMotivo(motivo: MotivoDelCarril): string {
  switch (motivo) {
    case "gasta_dinero":
      return "gasta dinero (llama a un proveedor de IA que se factura por uso)";
    case "escribe_datos":
      return "escribe datos que el resto de Molnip da por buenos";
    case "ninguno":
      return "no necesita permiso: sólo lee e informa";
  }
}

/**
 * ── Los argumentos ────────────────────────────────────────────────────
 *
 * El identificador de la tarea se traduce a un script mirando `tareas.ts`,
 * así que de la base de datos nunca sale un comando. Los argumentos sí
 * salen de la base de datos, y acaban en el `argv` de un proceso.
 *
 * No hay intérprete de comandos de por medio —`execFile` sin `shell`, ver
 * `ejecutor.ts`—, así que un `; rm -rf` no es un riesgo aquí. El riesgo
 * real es otro y más discreto: un argumento que empiece por `-` deja de
 * ser un dato y pasa a ser una opción del programa que lo recibe. Por eso
 * se rechaza, y por eso se rechaza también todo lo que no sea una cadena
 * corta y previsible.
 *
 * Lo que se acepta es una ruta, un identificador de herramienta o una
 * fecha. Nada más. Si algún día una tarea necesita algo distinto, se
 * amplía esto a conciencia, no se deja abierto por comodidad.
 */

export const LONGITUD_MAXIMA_ARGUMENTO = 200;
export const MAXIMO_ARGUMENTOS = 8;

const ARGUMENTO_ACEPTABLE = /^[A-Za-z0-9._/@=-]+$/;

export type RevisionArgumentos = { validos: true } | { validos: false; explicacion: string };

export function revisarArgumentos(argumentos: readonly unknown[]): RevisionArgumentos {
  if (argumentos.length > MAXIMO_ARGUMENTOS) {
    return { validos: false, explicacion: `demasiados argumentos (${argumentos.length}, el máximo es ${MAXIMO_ARGUMENTOS})` };
  }
  for (const argumento of argumentos) {
    if (typeof argumento !== "string") {
      return { validos: false, explicacion: `un argumento no es texto: ${JSON.stringify(argumento)}` };
    }
    if (argumento.length === 0 || argumento.length > LONGITUD_MAXIMA_ARGUMENTO) {
      return { validos: false, explicacion: `un argumento está vacío o pasa de ${LONGITUD_MAXIMA_ARGUMENTO} caracteres` };
    }
    if (argumento.startsWith("-")) {
      return {
        validos: false,
        explicacion: `el argumento ${JSON.stringify(argumento)} empieza por «-»: sería una opción del programa, no un dato`,
      };
    }
    if (!ARGUMENTO_ACEPTABLE.test(argumento)) {
      return { validos: false, explicacion: `el argumento ${JSON.stringify(argumento)} tiene caracteres que no se aceptan` };
    }
  }
  return { validos: true };
}

/** Lanza si los argumentos no pasan la revisión. Para quien no puede seguir sin ellos. */
export function exigirArgumentosValidos(argumentos: readonly unknown[]): string[] {
  const revision = revisarArgumentos(argumentos);
  if (!revision.validos) throw new Error(`Argumentos rechazados: ${revision.explicacion}`);
  return argumentos as string[];
}
