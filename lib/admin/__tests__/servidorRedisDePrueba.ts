import net from "node:net";
import http from "node:http";
import { spawn, type ChildProcess } from "node:child_process";

/**
 * Puente para probar `limitadorRedis.ts` contra un Redis DE VERDAD, no
 * contra una imitación.
 *
 * El cliente de Upstash no habla el protocolo nativo de Redis, sino una API
 * HTTP propia: envía por POST el comando como un array JSON
 * (`["INCR","clave"]`) y espera `{"result": ...}`. Este módulo levanta dos
 * cosas y las conecta:
 *
 *   cliente de Upstash → servidor HTTP (aquí) → redis-server local
 *
 * Así las pruebas ejercitan el código real de la aplicación con el cliente
 * real, y comprueban de paso las suposiciones sobre el propio Redis: que
 * `INCR` devuelve un número, que `TTL` devuelve segundos, que una clave
 * caducada desaparece de verdad.
 *
 * Todo es local y temporal: no sale nada a la red, y nunca se toca la
 * instancia de Upstash real.
 */

const PUERTO_REDIS = 6399;
const PUERTO_HTTP = 6400;

let procesoRedis: ChildProcess | undefined;
let servidorHttp: http.Server | undefined;

const INCOMPLETO = Symbol("respuesta incompleta");
type Analizado = { valor: unknown; siguiente: number };

/**
 * Analizador del protocolo nativo de Redis (RESP), lo justo para los
 * comandos que usa el limitador: `+OK`, `:número`, `-error`, `$texto` y
 * `*lista` (que hace falta para `KEYS`). Devuelve `INCOMPLETO` mientras no
 * haya llegado la respuesta entera.
 */
function analizar(bufer: string, desde: number): Analizado | typeof INCOMPLETO {
  const fin = bufer.indexOf("\r\n", desde);
  if (fin === -1) return INCOMPLETO;

  const tipo = bufer[desde];
  const cuerpo = bufer.slice(desde + 1, fin);
  const trasLinea = fin + 2;

  if (tipo === "+") return { valor: cuerpo, siguiente: trasLinea };
  if (tipo === ":") return { valor: Number(cuerpo), siguiente: trasLinea };
  if (tipo === "-") return { valor: new Error(cuerpo), siguiente: trasLinea };

  if (tipo === "$") {
    const longitud = Number(cuerpo);
    if (longitud === -1) return { valor: null, siguiente: trasLinea };
    if (bufer.length < trasLinea + longitud + 2) return INCOMPLETO;
    return { valor: bufer.slice(trasLinea, trasLinea + longitud), siguiente: trasLinea + longitud + 2 };
  }

  if (tipo === "*") {
    const cuantos = Number(cuerpo);
    if (cuantos === -1) return { valor: null, siguiente: trasLinea };
    const elementos: unknown[] = [];
    let posicion = trasLinea;
    for (let i = 0; i < cuantos; i++) {
      const elemento = analizar(bufer, posicion);
      if (elemento === INCOMPLETO) return INCOMPLETO;
      elementos.push(elemento.valor);
      posicion = elemento.siguiente;
    }
    return { valor: elementos, siguiente: posicion };
  }

  return { valor: cuerpo, siguiente: trasLinea };
}

/** Cliente mínimo del protocolo nativo de Redis (RESP), suficiente para los comandos que usa el limitador. */
function ejecutarEnRedis(comando: unknown[]): Promise<unknown> {
  return new Promise((resolver, rechazar) => {
    const socket = net.createConnection({ host: "127.0.0.1", port: PUERTO_REDIS });
    const partes = comando.map((a) => String(a));
    const peticion = `*${partes.length}\r\n${partes.map((a) => `$${Buffer.byteLength(a)}\r\n${a}\r\n`).join("")}`;

    let bufer = "";
    socket.on("connect", () => socket.write(peticion));
    socket.on("data", (trozo) => {
      bufer += trozo.toString();
      const analizado = analizar(bufer, 0);
      if (analizado === INCOMPLETO) return; // faltan datos, se espera al siguiente trozo
      if (analizado.valor instanceof Error) return terminar(null, analizado.valor);
      terminar(analizado.valor);
    });
    socket.on("error", rechazar);

    function terminar(valor: unknown, error?: Error) {
      socket.end();
      if (error) rechazar(error);
      else resolver(valor);
    }
  });
}

async function esperarA(condicion: () => Promise<boolean>, intentos = 50): Promise<boolean> {
  for (let i = 0; i < intentos; i++) {
    try {
      if (await condicion()) return true;
    } catch {
      // todavía no está listo
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

export function redisDisponible(): boolean {
  return Boolean(process.env.REDIS_PRUEBA_LISTO);
}

export async function arrancarRedisDePrueba(): Promise<boolean> {
  procesoRedis = spawn("redis-server", ["--port", String(PUERTO_REDIS), "--save", "", "--appendonly", "no"], {
    stdio: "ignore",
  });

  const listo = await esperarA(async () => (await ejecutarEnRedis(["PING"])) === "PONG");
  if (!listo) return false;

  servidorHttp = http.createServer((peticion, respuesta) => {
    let cuerpo = "";
    peticion.on("data", (t) => (cuerpo += t));
    peticion.on("end", async () => {
      try {
        const recibido = JSON.parse(cuerpo || "[]");

        // El cliente de Upstash agrupa comandos automáticamente, así que el
        // cuerpo puede llegar como un único comando (`["INCR","clave"]`) o
        // como un lote de varios (`[["INCR","a"],["TTL","b"]]`). La
        // respuesta debe tener la forma correspondiente: un objeto suelto
        // para un comando, o un array de objetos para un lote.
        const esLote = Array.isArray(recibido) && recibido.every((c) => Array.isArray(c));

        if (esLote) {
          const resultados = [];
          for (const comando of recibido as unknown[][]) {
            resultados.push({ result: await ejecutarEnRedis(comando) });
          }
          respuesta.writeHead(200, { "content-type": "application/json" });
          respuesta.end(JSON.stringify(resultados));
          return;
        }

        const resultado = await ejecutarEnRedis(Array.isArray(recibido) ? recibido : [recibido]);
        respuesta.writeHead(200, { "content-type": "application/json" });
        respuesta.end(JSON.stringify({ result: resultado }));
      } catch (error) {
        respuesta.writeHead(400, { "content-type": "application/json" });
        respuesta.end(JSON.stringify({ error: error instanceof Error ? error.message : "error" }));
      }
    });
  });

  await new Promise<void>((r) => servidorHttp!.listen(PUERTO_HTTP, "127.0.0.1", r));

  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${PUERTO_HTTP}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "token-de-prueba-local";
  process.env.REDIS_PRUEBA_LISTO = "true";
  return true;
}

export async function pararRedisDePrueba(): Promise<void> {
  if (servidorHttp) await new Promise<void>((r) => servidorHttp!.close(() => r()));
  procesoRedis?.kill("SIGKILL");
  servidorHttp = undefined;
  procesoRedis = undefined;
  delete process.env.REDIS_PRUEBA_LISTO;
}

/** Vacía la base entre pruebas. */
export async function limpiarRedis(): Promise<void> {
  await ejecutarEnRedis(["FLUSHDB"]);
}

/** Fuerza la caducidad inmediata de las claves que empiecen por el prefijo, para probar la expiración sin esperar 15 minutos. */
export async function caducarClaves(prefijo: string): Promise<number> {
  const claves = (await ejecutarEnRedis(["KEYS", `${prefijo}*`])) as unknown;
  const lista = Array.isArray(claves) ? claves : [];
  for (const clave of lista) await ejecutarEnRedis(["DEL", String(clave)]);
  return lista.length;
}

/** Cuántos segundos de vida le quedan a una clave — para comprobar que el bloqueo caduca solo. */
export async function vidaRestante(clave: string): Promise<number> {
  return (await ejecutarEnRedis(["TTL", clave])) as number;
}

/** Todas las claves que ha creado el limitador, para inspeccionarlas en las pruebas. */
export async function clavesDelLimitador(): Promise<string[]> {
  const claves = (await ejecutarEnRedis(["KEYS", "molnip:login*"])) as unknown;
  return Array.isArray(claves) ? claves.map(String) : [];
}
