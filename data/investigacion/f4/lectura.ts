import fs from "node:fs";
import path from "node:path";

/**
 * LA ÚNICA FORMA DE LEER EL LOTE F4 SIN LEERLO MAL.
 *
 * El lote de citas —15 candidatas, leídas el 11 y 12 de septiembre de 2026—
 * tiene catorce campos que dicen `si` y no lo sostienen. Su README avisaba de
 * parte de ellos, y ese aviso no bastó: **el dato seguía diciendo `si`**, y
 * quien abriera el JSON se lo creería.
 *
 * Regla de la propietaria (2026-09-22): «corregir los datos erróneos,
 * conservando las fuentes originales y el motivo del cambio. Una advertencia
 * en el README no basta si el dato sigue diciendo "sí".»
 *
 * POR QUÉ NO SE EDITAN LOS FICHEROS. El README del lote dice que las
 * respuestas se guardan tal cual salieron, sin retocar, y tiene razón: son la
 * prueba de qué contestó el modelo aquel día, con su `sha256` en el
 * manifiesto. Tocarlas destruiría eso. Así que la corrección vive aparte, en
 * `correcciones.json`, con el valor viejo, la cita vieja y el motivo — y se
 * aplica al leer. El original se conserva y la decisión queda a la vista.
 *
 * QUÉ SE CORRIGIÓ, Y POR QUÉ SON CATORCE Y NO CINCO:
 *
 *  - **Seis de `comisiones_o_propinas`** —SimplyBook.me, ViDay ×2, Turnito y
 *    Treatwell ×2—. El campo pregunta por la comisión al EMPLEADO o la propina
 *    al profesional, y las citas capturaron la comisión que el PROVEEDOR le
 *    cobra al negocio. Son cosas opuestas: una es un sueldo, la otra un coste.
 *  - **Una de `bonos_packs_sesiones`** en SimplyBook.me: la cita habla de
 *    «membresías», que no es un bono de sesiones.
 *  - **Siete de Fresha**, y ésta no estaba avisada. Toda su respuesta salió de
 *    `fresha.com/es`, que es la web de la CLIENTA FINAL, no el software para
 *    el salón. Las frases o se dirigen a quien reserva —«solo tienes que
 *    iniciar sesión para reservar»— o son testimonios de un negocio —«a mis
 *    clientes les encanta»—. Ninguna es el fabricante hablando de su producto.
 *    El 2026-09-22 se preguntó sobre `fresha.com/for-business` y los cinco
 *    pasos del recorrido salieron `no_consta`.
 *
 * El README contaba CINCO porque contaba por herramienta. Por fichero son
 * siete, y con Fresha, catorce.
 *
 * Todas corrigen `si` → `no_consta`. **Ninguna dice que la herramienta no lo
 * haga**: dicen que lo que teníamos no lo demostraba.
 */

export type Certeza = "si" | "no_consta";

export type Correccion = {
  fichero: string;
  herramienta: string;
  campo: string;
  valorOriginal: string;
  citaOriginal: string;
  valorCorregido: Certeza;
  motivo: string;
  fecha: string;
};

export type Campo = { v: string; cita: string; corregido?: Correccion };
export type Respuesta = { pedida?: string; leidas?: string[]; datos: Record<string, Campo | string> };

const DIR = path.join(process.cwd(), "data", "investigacion", "f4");

let cacheCorrecciones: Correccion[] | null = null;

export function getCorrecciones(): Correccion[] {
  cacheCorrecciones ??= (
    JSON.parse(fs.readFileSync(path.join(DIR, "correcciones.json"), "utf8")) as { correcciones: Correccion[] }
  ).correcciones;
  return cacheCorrecciones;
}

/**
 * Una respuesta del lote, ya corregida.
 *
 * El campo corregido conserva `corregido` con el valor viejo, la cita vieja y
 * el motivo: quien lo enseñe puede decir qué se creyó antes y por qué ya no.
 */
export function getRespuesta(nombre: string): Respuesta {
  const fichero = `respuestas/${nombre}.json`;
  const cruda = JSON.parse(fs.readFileSync(path.join(DIR, fichero), "utf8")) as Respuesta;
  const datos: Record<string, Campo | string> = { ...cruda.datos };

  for (const c of getCorrecciones()) {
    if (c.fichero !== fichero) continue;
    const actual = datos[c.campo];
    if (typeof actual !== "object") continue;
    datos[c.campo] = { v: c.valorCorregido, cita: "", corregido: c };
  }

  return { ...cruda, datos };
}

/** Qué sostiene de verdad una respuesta: sólo los campos que siguen en `si`. */
export function loQueDemuestra(nombre: string): string[] {
  const { datos } = getRespuesta(nombre);
  return Object.entries(datos)
    .filter(([, v]) => typeof v === "object" && v.v === "si")
    .map(([k]) => k)
    .sort();
}

/** Los ficheros de respuesta que existen, sin extensión. */
export function getNombresDeRespuesta(): string[] {
  return fs
    .readdirSync(path.join(DIR, "respuestas"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}
