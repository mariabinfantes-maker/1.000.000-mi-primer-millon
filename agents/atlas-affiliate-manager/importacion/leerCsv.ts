/**
 * Lector de CSV para la importación en bloque.
 *
 * Se escribe a mano en vez de traer una dependencia porque el problema real
 * no es analizar CSV —eso son treinta líneas— sino tolerar lo que de verdad
 * sale de un Excel en español: punto y coma en vez de coma, BOM al principio
 * del archivo, saltos de línea de Windows y encabezados con tildes. Una
 * librería genérica resuelve lo primero y deja lo demás igual de roto.
 *
 * Un CSV mal leído no da error: desplaza una columna y escribe el enlace de
 * una herramienta en el campo de otra. Por eso aquí se prefiere fallar
 * ruidosamente —filas con distinto número de columnas que el encabezado— a
 * seguir adelante adivinando.
 */

export type FilaCsv = Record<string, string>;

export type ResultadoLectura = {
  filas: FilaCsv[];
  encabezados: string[];
  delimitador: string;
  avisos: string[];
};

const DELIMITADORES = [",", ";", "\t"] as const;

/** Quita el BOM que Excel escribe al guardar en UTF-8; si no, el primer encabezado nunca coincide. */
function quitarBom(texto: string): string {
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/**
 * Adivina el delimitador contando cuál aparece más veces FUERA de comillas
 * en la primera línea. Contar dentro de comillas es lo que hace fallar a las
 * heurísticas ingenuas: una descripción con comas entrecomilladas basta para
 * que un archivo separado por punto y coma parezca separado por comas.
 */
export function detectarDelimitador(texto: string): string {
  const primeraLinea = leerPrimeraLineaLogica(texto);
  let mejor = ",";
  let maximo = -1;
  for (const candidato of DELIMITADORES) {
    const cuenta = contarFuraDeComillas(primeraLinea, candidato);
    if (cuenta > maximo) {
      maximo = cuenta;
      mejor = candidato;
    }
  }
  return mejor;
}

/** La primera línea "lógica": un salto dentro de comillas no la termina. */
function leerPrimeraLineaLogica(texto: string): string {
  let dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      if (dentro && texto[i + 1] === '"') i++;
      else dentro = !dentro;
    } else if ((c === "\n" || c === "\r") && !dentro) {
      return texto.slice(0, i);
    }
  }
  return texto;
}

function contarFuraDeComillas(linea: string, delimitador: string): number {
  let dentro = false;
  let total = 0;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (dentro && linea[i + 1] === '"') i++;
      else dentro = !dentro;
    } else if (c === delimitador && !dentro) {
      total++;
    }
  }
  return total;
}

/** Trocea el texto completo en celdas, respetando comillas, comillas dobladas y saltos dentro de campo. */
function trocear(texto: string, delimitador: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = "";
  let dentro = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (dentro) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i++;
        } else {
          dentro = false;
        }
      } else {
        celda += c;
      }
      continue;
    }

    if (c === '"') {
      dentro = true;
    } else if (c === delimitador) {
      fila.push(celda);
      celda = "";
    } else if (c === "\r") {
      // Se ignora: el \n que viene detrás cierra la fila (finales de Windows).
    } else if (c === "\n") {
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = "";
    } else {
      celda += c;
    }
  }

  // Última fila sin salto final.
  if (celda !== "" || fila.length > 0) {
    fila.push(celda);
    filas.push(fila);
  }

  return filas;
}

/**
 * Normaliza un encabezado para poder emparejarlo: minúsculas, sin tildes, sin
 * espacios ni guiones. Así "Duración de la cookie", "duracion_de_la_cookie" y
 * "DURACIONDELACOOKIE" son el mismo encabezado, que es lo que una persona
 * espera y lo que un archivo real trae.
 */
export function normalizarEncabezado(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_\-.]/g, "");
}

export function leerCsv(texto: string): ResultadoLectura {
  const limpio = quitarBom(texto);
  const avisos: string[] = [];

  if (limpio.trim() === "") {
    return { filas: [], encabezados: [], delimitador: ",", avisos: ["El archivo está vacío."] };
  }

  const delimitador = detectarDelimitador(limpio);
  const bruto = trocear(limpio, delimitador).filter(
    // Fila totalmente vacía: Excel deja una al final casi siempre.
    (fila) => fila.some((celda) => celda.trim() !== "")
  );

  if (bruto.length === 0) {
    return { filas: [], encabezados: [], delimitador, avisos: ["El archivo no tiene ninguna fila."] };
  }

  const encabezados = bruto[0].map((e) => e.trim());
  const vistos = new Set<string>();
  for (const encabezado of encabezados) {
    const clave = normalizarEncabezado(encabezado);
    if (clave && vistos.has(clave)) avisos.push(`La columna "${encabezado}" aparece más de una vez.`);
    vistos.add(clave);
  }

  const filas: FilaCsv[] = [];
  for (const [indice, celdas] of bruto.slice(1).entries()) {
    if (celdas.length !== encabezados.length) {
      // No se rellena ni se recorta: una fila descuadrada casi siempre
      // significa una comilla sin cerrar, y adivinar movería los valores de
      // columna en silencio.
      avisos.push(
        `Fila ${indice + 2}: tiene ${celdas.length} columna(s) y el encabezado tiene ${encabezados.length}. Se ha omitido.`
      );
      continue;
    }
    const fila: FilaCsv = {};
    for (const [posicion, encabezado] of encabezados.entries()) {
      fila[normalizarEncabezado(encabezado)] = celdas[posicion].trim();
    }
    filas.push(fila);
  }

  return { filas, encabezados, delimitador, avisos };
}
