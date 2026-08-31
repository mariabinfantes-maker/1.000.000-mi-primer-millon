import { SENTENCIAS_ESQUEMA } from "./esquema";

/**
 * Comprueba que la base de datos tiene realmente la forma que describe
 * `SENTENCIAS_ESQUEMA`.
 *
 * Lo que se espera NO se escribe a mano aquí: se deduce de las propias
 * sentencias del esquema. La lista escrita a mano que había antes en el
 * script de aprovisionamiento nombraba dos tablas de cuatro, así que daba
 * por bueno un aprovisionamiento a medias. Una lista escrita a mano se
 * queda vieja; una deducida no puede.
 *
 * Se comprueban tres cosas, porque las tres pueden faltar por separado:
 * la tabla, sus columnas y el trigger que la protege. Que exista la tabla
 * `historial_cambios_afiliacion` no dice nada sobre si sigue siendo de
 * solo-inserción.
 */

/** Trocea el interior de un `CREATE TABLE (...)` por comas de primer nivel. */
function partirPorComasDeNivelCero(cuerpo: string): string[] {
  const partes: string[] = [];
  let profundidad = 0;
  let actual = "";
  for (const caracter of cuerpo) {
    if (caracter === "(") profundidad++;
    if (caracter === ")") profundidad--;
    if (caracter === "," && profundidad === 0) {
      partes.push(actual);
      actual = "";
      continue;
    }
    actual += caracter;
  }
  if (actual.trim()) partes.push(actual);
  return partes;
}

/** Extrae el paréntesis equilibrado que abre en `desde`. */
function cuerpoEntreParentesis(texto: string, desde: number): string {
  let profundidad = 0;
  for (let i = desde; i < texto.length; i++) {
    if (texto[i] === "(") profundidad++;
    else if (texto[i] === ")") {
      profundidad--;
      if (profundidad === 0) return texto.slice(desde + 1, i);
    }
  }
  throw new Error("paréntesis sin cerrar en una sentencia del esquema");
}

export type TablaEsperada = { tabla: string; columnas: string[] };
export type TriggerEsperado = { trigger: string; tabla: string };

export function tablasEsperadas(sentencias: readonly string[] = SENTENCIAS_ESQUEMA): TablaEsperada[] {
  const salida: TablaEsperada[] = [];
  for (const sentencia of sentencias) {
    const cabecera = /CREATE TABLE(?: IF NOT EXISTS)?\s+([a-z_][a-z0-9_]*)\s*\(/i.exec(sentencia);
    if (!cabecera) continue;
    const cuerpo = cuerpoEntreParentesis(sentencia, sentencia.indexOf("(", cabecera.index));
    const columnas = partirPorComasDeNivelCero(cuerpo)
      .map((linea) => linea.trim().split(/\s+/)[0])
      // PRIMARY KEY (...) / UNIQUE (...) a nivel de tabla no son columnas.
      .filter((nombre) => nombre && !/^(primary|unique|foreign|constraint|check)$/i.test(nombre));
    salida.push({ tabla: cabecera[1], columnas });
  }
  return salida;
}

export function triggersEsperados(sentencias: readonly string[] = SENTENCIAS_ESQUEMA): TriggerEsperado[] {
  const salida: TriggerEsperado[] = [];
  for (const sentencia of sentencias) {
    const encaje = /CREATE TRIGGER\s+([a-z_][a-z0-9_]*)[\s\S]*?\sON\s+([a-z_][a-z0-9_]*)/i.exec(sentencia);
    if (encaje) salida.push({ trigger: encaje[1], tabla: encaje[2] });
  }
  return salida;
}

type Consultador = { query: (texto: string) => Promise<{ rows: Record<string, unknown>[] }> };

/** Devuelve la lista de problemas encontrados. Vacía significa que todo está en su sitio. */
export async function verificarEsquema(pool: Consultador): Promise<string[]> {
  const problemas: string[] = [];

  const { rows: filasColumnas } = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`
  );
  const porTabla = new Map<string, Set<string>>();
  for (const fila of filasColumnas) {
    const tabla = String(fila.table_name);
    if (!porTabla.has(tabla)) porTabla.set(tabla, new Set());
    porTabla.get(tabla)!.add(String(fila.column_name));
  }

  for (const { tabla, columnas } of tablasEsperadas()) {
    const presentes = porTabla.get(tabla);
    if (!presentes) {
      problemas.push(`falta la tabla ${tabla}`);
      continue;
    }
    const ausentes = columnas.filter((c) => !presentes.has(c));
    if (ausentes.length) problemas.push(`a ${tabla} le faltan columnas: ${ausentes.join(", ")}`);
  }

  const { rows: filasTriggers } = await pool.query(
    `SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public'`
  );
  const triggers = new Set(filasTriggers.map((f) => `${f.trigger_name}@${f.event_object_table}`));
  for (const { trigger, tabla } of triggersEsperados()) {
    if (!triggers.has(`${trigger}@${tabla}`)) {
      problemas.push(`falta el trigger ${trigger} sobre ${tabla} (la tabla quedaría modificable)`);
    }
  }

  return problemas;
}
