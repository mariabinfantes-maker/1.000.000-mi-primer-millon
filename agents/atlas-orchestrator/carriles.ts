import {
  TAREAS,
  type Bandera,
  type Carril,
  type ClaseDeValor,
  type MotivoDelCarril,
  type Tarea,
} from "./tareas";

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
 * ═══ Los argumentos: dos capas, y las dos obligatorias ═══════════════
 *
 * El identificador de la tarea se traduce a un script mirando `tareas.ts`,
 * así que de la base de datos nunca sale un comando. Los argumentos sí
 * salen de la base de datos, y acaban en el `argv` de un proceso.
 *
 * **El suelo** se aplica a todo argumento, siempre, venga de donde venga y
 * tenga la tarea tipo declarado o no. Es lo que protege a la tarea que
 * alguien añada mañana antes de acordarse de escribirle su tipo. Una lista
 * de permitidos sólo sirve mientras esté completa; el suelo sirve aunque
 * no lo esté.
 *
 * **El techo** es el tipo de cada tarea: qué posicionales, en qué orden,
 * qué banderas y con qué clase de valor. Lo que no esté declarado se
 * rechaza.
 *
 * Un argumento tiene que pasar las dos capas. Nunca una sola.
 */

export const LONGITUD_MAXIMA_ARGUMENTO = 200;
export const MAXIMO_ARGUMENTOS = 24;

/**
 * Caracteres de control y de formato invisible. Se rechazan en todas las
 * clases, incluida `secreto`: un salto de línea o una marca de dirección
 * dentro de un argumento no es un dato, es una forma de esconder algo en
 * un registro que después alguien leerá.
 */
const INVISIBLES = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u2064\uFEFF]/;

const FORMA: Record<ClaseDeValor, RegExp> = {
  ruta: /^[A-Za-z0-9._][A-Za-z0-9._/-]*$/,
  id: /^[a-z0-9][a-z0-9-]*$/,
  texto: /^[^\s][\s\S]*$/,
  url: /^https:\/\/[A-Za-z0-9.-]+(\.[A-Za-z]{2,})(\/[^\s]*)?$/,
  fecha: /^\d{4}-\d{2}-\d{2}$/,
  secreto: /^\S[\s\S]*$/,
};

export type Revision = { validos: true; argumentos: string[] } | { validos: false; explicacion: string };

function mal(explicacion: string): Revision {
  return { validos: false, explicacion };
}

/**
 * El suelo. Lo cumple todo argumento de toda tarea.
 *
 * `esBandera` afloja una sola cosa: que empiece por «-». Un argumento que
 * empieza por guion deja de ser un dato y pasa a ser una opción del
 * programa que lo recibe, así que sólo se permite cuando la tarea ha
 * declarado esa bandera por su nombre exacto.
 */
function revisarSuelo(valor: unknown, esBandera = false): string | undefined {
  if (typeof valor !== "string") return `un argumento no es texto: ${JSON.stringify(valor)}`;
  if (valor.length === 0) return "hay un argumento vacío";
  if (valor.length > LONGITUD_MAXIMA_ARGUMENTO) return `un argumento pasa de ${LONGITUD_MAXIMA_ARGUMENTO} caracteres`;
  if (INVISIBLES.test(valor)) return `el argumento ${JSON.stringify(valor)} lleva caracteres de control o invisibles`;
  if (!esBandera && valor.startsWith("-")) {
    return `el argumento ${JSON.stringify(valor)} empieza por «-»: sería una opción del programa, no un dato`;
  }
  return undefined;
}

/**
 * Una ruta no puede salirse del repositorio. Ni absoluta, ni con un
 * segmento `..`, ni en Windows (`C:/…`, `\\servidor\…`). Es la diferencia
 * entre pasarle `data/lote.json` a un programa y pasarle `/etc/shadow`.
 */
function rutaSeSale(valor: string): boolean {
  if (valor.startsWith("/") || valor.startsWith("\\")) return true;
  if (/^[A-Za-z]:/.test(valor)) return true;
  return valor.split(/[/\\]/).includes("..");
}

function revisarValor(valor: string, clase: ClaseDeValor, donde: string): string | undefined {
  if (!FORMA[clase].test(valor)) {
    return `${donde}: ${JSON.stringify(valor)} no tiene la forma de ${clase}`;
  }
  if (clase === "ruta" && rutaSeSale(valor)) {
    return `${donde}: ${JSON.stringify(valor)} apunta fuera del repositorio`;
  }
  return undefined;
}

/**
 * Revisa unos argumentos contra el tipo de su tarea.
 *
 * Recorre el `argv` como lo recorrería el propio CLI: una bandera se
 * reconoce por su nombre exacto y consume el valor de detrás si lo lleva;
 * todo lo demás va llenando los posicionales en orden.
 */
export function revisarArgumentos(tarea: Tarea, argumentos: readonly unknown[]): Revision {
  if (argumentos.length > MAXIMO_ARGUMENTOS) {
    return mal(`demasiados argumentos (${argumentos.length}, el máximo es ${MAXIMO_ARGUMENTOS})`);
  }

  const tipo = tarea.argumentos;
  if (tipo.exigeAlguno && argumentos.length === 0) {
    return mal(`la tarea "${tarea.id}" necesita argumentos y no se le han dado`);
  }
  if (!tipo.posicionales.length && !tipo.banderas.length && argumentos.length > 0) {
    return mal(`la tarea "${tarea.id}" no admite ningún argumento`);
  }

  const banderaPorNombre = new Map<string, Bandera>(tipo.banderas.map((b) => [b.nombre, b]));
  const limpios: string[] = [];
  let posicionalesUsados = 0;

  for (let i = 0; i < argumentos.length; i++) {
    const bruto = argumentos[i];
    const pareceBandera = typeof bruto === "string" && bruto.startsWith("--");

    const problemaSuelo = revisarSuelo(bruto, pareceBandera);
    if (problemaSuelo) return mal(problemaSuelo);
    const valor = bruto as string;

    if (pareceBandera) {
      const bandera = banderaPorNombre.get(valor.slice(2));
      if (!bandera) return mal(`la tarea "${tarea.id}" no admite la opción ${JSON.stringify(valor)}`);
      limpios.push(valor);

      const llevaValor = Boolean(bandera.clase || bandera.valores);
      if (!llevaValor) continue;

      const siguiente = argumentos[++i];
      const problema = revisarSuelo(siguiente);
      if (problema) return mal(`${valor}: ${problema}`);
      const texto = siguiente as string;

      if (bandera.valores && !bandera.valores.includes(texto)) {
        return mal(`${valor} sólo admite: ${bandera.valores.join(", ")} — llegó ${JSON.stringify(texto)}`);
      }
      if (bandera.clase) {
        const problemaValor = revisarValor(texto, bandera.clase, valor);
        if (problemaValor) return mal(problemaValor);
      }
      limpios.push(texto);
      continue;
    }

    const indice = Math.min(posicionalesUsados, tipo.posicionales.length - 1);
    const posicional = tipo.posicionales[indice];
    if (!posicional || (posicionalesUsados >= tipo.posicionales.length && !posicional.repetible)) {
      return mal(`la tarea "${tarea.id}" no admite tantos argumentos sueltos`);
    }
    const problemaValor = revisarValor(valor, posicional.clase, `${tarea.id} (${posicional.descripcion})`);
    if (problemaValor) return mal(problemaValor);
    limpios.push(valor);
    posicionalesUsados++;
  }

  const obligatorios = tipo.posicionales.filter((p) => p.obligatorio).length;
  if (posicionalesUsados < obligatorios) {
    return mal(`a la tarea "${tarea.id}" le faltan argumentos obligatorios`);
  }

  return { validos: true, argumentos: limpios };
}

/** Lanza si los argumentos no pasan las dos capas. Para quien no puede seguir sin ellos. */
export function exigirArgumentosValidos(tarea: Tarea, argumentos: readonly unknown[]): string[] {
  const revision = revisarArgumentos(tarea, argumentos);
  if (!revision.validos) throw new Error(`Argumentos rechazados: ${revision.explicacion}`);
  return revision.argumentos;
}
