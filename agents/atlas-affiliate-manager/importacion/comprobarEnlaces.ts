import { destinoEsSeguro } from "./destinoSeguro";

/**
 * Comprueba que un enlace responde, sin descargarse la página.
 *
 * Lo que interesa saber es si el destino existe y contesta, no qué dice. Por
 * eso se intenta primero con HEAD, que pide solo las cabeceras, y solo se cae
 * a GET si el servidor no lo admite —muchas redirecciones de afiliación no lo
 * admiten—. En ese caso se corta la lectura en cuanto se sabe el código de
 * respuesta: descargar la portada entera de treinta proveedores para saber
 * que están vivos sería gastar su ancho de banda y el nuestro para nada.
 *
 * Las redirecciones se siguen A MANO, comprobando el destino de cada salto.
 * Automáticamente sería más corto y también inútil: un servidor legítimo
 * puede redirigir a una dirección interna, y esa segunda petición la haría el
 * servidor igual sin que nadie la hubiera mirado.
 */

export type ResultadoEnlace = {
  url: string;
  ok: boolean;
  estadoHttp?: number;
  /** La dirección final tras las redirecciones, si cambió. */
  destinoFinal?: string;
  motivo?: string;
};

export const TIEMPO_MAXIMO_MS = 8000;
export const REDIRECCIONES_MAXIMAS = 3;
export const CONCURRENCIA_MAXIMA = 6;
/** Tope de lectura cuando hay que caer a GET. Solo hacen falta las cabeceras. */
export const BYTES_MAXIMOS = 64 * 1024;

type Opciones = {
  fetchImpl?: typeof fetch;
  resolver?: (nombre: string) => Promise<string[]>;
  tiempoMaximoMs?: number;
  concurrencia?: number;
};

async function leerPocoYCortar(respuesta: Response): Promise<void> {
  // No se usa `respuesta.text()`: eso descarga el cuerpo entero. Se leen unos
  // pocos trozos y se cancela, que es todo lo que hace falta para liberar la
  // conexión.
  const cuerpo = respuesta.body;
  if (!cuerpo) return;
  const lector = cuerpo.getReader();
  let leidos = 0;
  try {
    while (leidos < BYTES_MAXIMOS) {
      const { done, value } = await lector.read();
      if (done) break;
      leidos += value?.byteLength ?? 0;
    }
  } catch {
    // Da igual: el cuerpo no se usa.
  } finally {
    await lector.cancel().catch(() => {});
  }
}

async function comprobarUna(url: string, opciones: Opciones): Promise<ResultadoEnlace> {
  const fetchImpl = opciones.fetchImpl ?? fetch;
  const tiempoMaximo = opciones.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS;

  let actual = url;
  let saltos = 0;

  // El tope de tiempo cubre TODA la cadena de redirecciones, no cada salto:
  // si no, tres saltos lentos multiplicarían la espera por tres.
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), tiempoMaximo);

  try {
    while (true) {
      const veredicto = await destinoEsSeguro(actual, opciones.resolver);
      if (!veredicto.permitido) {
        return {
          url,
          ok: false,
          motivo: saltos === 0 ? veredicto.motivo : `Redirige a un destino no permitido: ${veredicto.motivo}`,
          destinoFinal: saltos === 0 ? undefined : actual,
        };
      }

      let respuesta: Response;
      try {
        respuesta = await fetchImpl(actual, {
          method: "HEAD",
          redirect: "manual",
          signal: controlador.signal,
        });
        if (respuesta.status >= 400 || respuesta.status === 405) {
          respuesta = await fetchImpl(actual, { method: "GET", redirect: "manual", signal: controlador.signal });
          await leerPocoYCortar(respuesta);
        }
      } catch (error) {
        const mensaje = error instanceof Error ? error.message : "error de red";
        return { url, ok: false, motivo: controlador.signal.aborted ? "No respondió a tiempo." : mensaje };
      }

      const esRedireccion = respuesta.status >= 300 && respuesta.status < 400;
      if (!esRedireccion) {
        return {
          url,
          ok: respuesta.status < 400,
          estadoHttp: respuesta.status,
          destinoFinal: saltos > 0 ? actual : undefined,
          motivo: respuesta.status < 400 ? undefined : `Respondió ${respuesta.status}.`,
        };
      }

      const destino = respuesta.headers.get("location");
      if (!destino) {
        return { url, ok: false, estadoHttp: respuesta.status, motivo: `Redirige (${respuesta.status}) sin decir adónde.` };
      }

      saltos += 1;
      if (saltos > REDIRECCIONES_MAXIMAS) {
        return { url, ok: false, motivo: `Más de ${REDIRECCIONES_MAXIMAS} redirecciones seguidas.` };
      }

      try {
        actual = new URL(destino, actual).toString();
      } catch {
        return { url, ok: false, motivo: `Redirige a una dirección que no se entiende: ${destino}` };
      }
    }
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Comprueba varias direcciones con el paralelismo acotado.
 *
 * Sin tope, un archivo de cien filas abre cien conexiones a la vez: se agota
 * el pool del servidor y, sobre todo, se le hace a cada proveedor algo que se
 * parece bastante a un ataque. Seis a la vez basta para que treinta enlaces
 * tarden segundos, no minutos.
 */
export async function comprobarEnlaces(
  urls: readonly string[],
  opciones: Opciones = {}
): Promise<Map<string, ResultadoEnlace>> {
  const unicas = [...new Set(urls)];
  const resultados = new Map<string, ResultadoEnlace>();
  const limite = Math.max(1, opciones.concurrencia ?? CONCURRENCIA_MAXIMA);

  let siguiente = 0;
  async function trabajar(): Promise<void> {
    while (siguiente < unicas.length) {
      const url = unicas[siguiente++];
      resultados.set(url, await comprobarUna(url, opciones));
    }
  }

  await Promise.all(Array.from({ length: Math.min(limite, unicas.length) }, trabajar));
  return resultados;
}
