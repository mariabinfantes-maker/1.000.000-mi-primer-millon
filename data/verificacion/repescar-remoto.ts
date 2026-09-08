import fs from "node:fs";
import { writeFile, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getCapacidades } from "@/data/vocabulario/repositorio";
import type { Capacidad } from "@/data/vocabulario/esquema";
import {
  capacidadIdsDelVocabulario,
  erroresDeRegistro,
  erroresDeSustitucion,
  getSustituciones,
} from "./repositorio";
import {
  convertirSalida,
  getCitasRevisadas,
  type FuentesDeHerramienta,
  type RespuestaCruda,
  type SalidaHerramienta,
  type SalidaLote,
} from "./convertir";
import type { RegistroVerificacion } from "./esquema";

/**
 * La repesca de F2 ejecutada desde el entorno remoto, sin PowerShell y sin
 * pasar por el ordenador de la propietaria. La clave de Gemini la inyecta el
 * proxy de red: no vive en este archivo, ni en el repositorio, ni en ninguna
 * variable de entorno visible desde aquí.
 *
 * Con esto se remataron los 280 pares que dejó abiertos el lote 1 —133 sin
 * respuesta, 106 de sólo-plan y 41 de redirección—, y queda como el camino
 * para los lotes 2 y 3.
 *
 * NO DECIDE NADA. Reutiliza `convertirSalida` sin tocarla, así que el
 * resultado pasa por las mismas reglas y las mismas pruebas que
 * `convertir-verificacion`. Lo único que hace de más es fusionar sólo los
 * pares preguntados, para no tirar la evidencia buena que ya estaba.
 *
 * DOS COSAS QUE APRENDIÓ A LA FUERZA, y por las que está escrito así:
 *
 *  - Un bloque que falla NO puede tumbar el lote. La primera versión murió
 *    entera cuando un error transitorio del proxy agotó los tres reintentos, y
 *    se llevó por delante lo ya hecho porque la fusión sólo ocurre al final.
 *    Es el mismo agujero que tiene `repescar.ps1`, y la explicación más
 *    probable de que aquella repesca aplicara 3 cambios de 765.
 *  - Hay páginas cuya respuesta completa tarda más de lo que el proxy aguanta.
 *    Para ésas el tamaño de bloque se baja por argumento; con teamwork.com no
 *    hubo otra forma de traerla entera.
 */

const DIR = path.join(process.cwd(), "data", "verificacion");
const MODELO = "gemini-3.6-flash";

/**
 * completo    — pregunta los tres buckets desde cero (saltando lo que ya esté
 *               en el checkpoint) y luego convierte y fusiona.
 * rescatar    — no abre buckets nuevos: vuelve a preguntar SÓLO las capacidades
 *               que quedaron en `sinRespuesta` dentro del checkpoint, que son
 *               las que perdió un fallo transitorio del gateway.
 * reconvertir — no llama a Gemini ni una vez: reconvierte el checkpoint que ya
 *               existe. Es lo que hace falta cuando cambian las reglas de
 *               conversión y no los datos — por ejemplo al revisar citas breves.
 */
const MODO = (process.argv[2] ?? "completo") as "completo" | "rescatar" | "reconvertir";
const PAUSA_MS = 4000;
/**
 * Cinco por llamada es el tamaño que evitó los cortes de la primera vuelta.
 * Se puede bajar por argumento: hay páginas —teamwork.com— cuya respuesta
 * completa tarda tanto que el proxy corta la conexión antes de terminarla, y
 * partirla en trozos más pequeños es lo único que la trae entera.
 */
const POR_LLAMADA = Number(process.argv[3] ?? 5);
const HOY = "2026-09-07";

function leerJson<T>(ruta: string): T {
  return JSON.parse(fs.readFileSync(ruta, "utf8"));
}
function escribirJson(ruta: string, obj: unknown) {
  fs.writeFileSync(ruta, `${JSON.stringify(obj, null, 2)}\n`);
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type Descarte = {
  herramientaId: string;
  capacidadId: string;
  motivo: string;
  cita?: string;
  urlCitada?: string;
};

/**
 * Se usa curl y no fetch: el fetch nativo de Node no respeta HTTPS_PROXY del
 * entorno (curl sí), y es justo el proxy quien inyecta la clave de Gemini
 * hacia generativelanguage.googleapis.com. Comprobado con una llamada de
 * prueba antes de lanzar el resto: fetch da 403 "unregistered caller", curl
 * responde 200 con la clave inyectada.
 */
async function invocarGemini(prompt: string, urls: string[]): Promise<any> {
  const texto = `${prompt}\n\nDirecciones que debes leer antes de responder:\n${urls.map((u) => `- ${u}`).join("\n")}`;
  const cuerpo = {
    contents: [{ parts: [{ text: texto }] }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
  };
  const uri = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;

  for (let intento = 1; intento <= 3; intento++) {
    const tmp = path.join(tmpdir(), `gemini-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    try {
      await writeFile(tmp, JSON.stringify(cuerpo), "utf8");
      const stdout = await new Promise<string>((resolve, reject) => {
        execFile(
          "curl",
          ["-sS", "-X", "POST", uri, "-H", "Content-Type: application/json; charset=utf-8", "--data", `@${tmp}`],
          { maxBuffer: 1024 * 1024 * 20, timeout: 180_000 },
          (err, stdout, stderr) => {
            if (err) reject(new Error(`curl falló: ${err.message} ${stderr}`));
            else resolve(stdout);
          }
        );
      });
      const parsed = JSON.parse(stdout);
      if (parsed.error) throw new Error(`API error ${parsed.error.code}: ${parsed.error.message}`);
      return parsed;
    } catch (e) {
      if (intento === 3) throw e;
      const espera = 2 ** intento * 3000;
      console.log(`      reintento ${intento} tras ${espera}ms (${(e as Error).message})`);
      await sleep(espera);
    } finally {
      await unlink(tmp).catch(() => {});
    }
  }
}

/**
 * El modelo a veces devuelve `integraCon` como array en vez de string (visto
 * en el ensayo con clickup). erroresDeRegistro exige un string no vacío, así
 * que se normaliza aquí en vez de dejar que reviente más adelante.
 */
function aTextoONull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.length ? v.join(", ") : null;
  if (typeof v === "string") return v.trim() || null;
  return String(v);
}

function extraerTexto(respuesta: any): string {
  const t = respuesta?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!t) return "";
  return t
    .replace(/^\s*```(?:json)?\s*/, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function extraerUrls(respuesta: any): Array<{ url?: string; estado?: string; recuperada?: boolean }> {
  const metadatos = respuesta?.candidates?.[0]?.urlContextMetadata?.urlMetadata;
  if (!metadatos) return [];
  return metadatos.map((m: any) => ({
    url: m.retrievedUrl,
    estado: m.urlRetrievalStatus,
    recuperada: m.urlRetrievalStatus === "URL_RETRIEVAL_STATUS_SUCCESS",
  }));
}

function listaDeCapacidades(capacidades: Capacidad[]): string {
  return capacidades
    .map((c) => `- ${c.id} | ${c.etiqueta}: ${c.definicion}${c.noEs ? ` FRONTERA: ${c.noEs}` : ""}`)
    .join("\n");
}

function promptCapacidad(nombre: string, capacidades: Capacidad[]): string {
  return [
    "Eres un verificador. Tu trabajo NO es describir la herramienta ni venderla: es",
    "comprobar, leyendo únicamente las páginas oficiales que te doy, qué se puede",
    "afirmar de ella con una frase de esas páginas delante.",
    "",
    `HERRAMIENTA: ${nombre}`,
    "",
    "REGLAS, y son innegociables:",
    "1. Usa SOLO el contenido de las direcciones que te doy. No uses lo que sepas de",
    "   antes sobre esta herramienta. Si no lo has leído en esas páginas, no lo sabes.",
    '2. "no_documentado" es una respuesta correcta y frecuente. No es un hueco que',
    '   rellenar. Prefiero cincuenta "no_documentado" honestos a una sola afirmación',
    "   que no puedas sostener con una cita.",
    '3. Para responder "si" necesitas copiar una cita LITERAL de la página, palabra',
    "   por palabra, que lo demuestre por sí sola.",
    "4. Que sea una herramienta famosa, grande o completa no prueba nada.",
    "5. Respeta la FRONTERA de cada capacidad: si lo que has leído es la capacidad",
    '   vecina y no ésta, responde "no_documentado".',
    "6. Responde ÚNICAMENTE con un array JSON. Sin texto antes ni después.",
    '7. Sé breve en "nota": la respuesta entera debe caber sin cortarse.',
    "",
    "CAPACIDADES A COMPROBAR:",
    listaDeCapacidades(capacidades),
    "",
    "FORMATO DE CADA ELEMENTO DEL ARRAY:",
    "{",
    '  "capacidadId": "el identificador exacto de la lista",',
    '  "veredicto": "si" | "no" | "no_documentado",',
    '  "profundidad": "nativa" | "modulo" | "integracion" | null,',
    '  "integraCon": "obligatorio si profundidad es integracion; si no, null",',
    '  "planMinimo": "nombre exacto del plan más barato donde existe, tal y como lo escribe el fabricante; null si la página no lo dice",',
    '  "urlFuente": "la dirección concreta de la que sacas la cita",',
    '  "cita": "la frase literal, copiada tal cual de esa página",',
    '  "nota": "breve: si es no_documentado, qué buscaste"',
    "}",
  ].join("\n");
}

/**
 * Repesca de sólo-plan, adaptada a que aquí NO existe el todo-lote1.json
 * original: el veredicto y la profundidad de la primera vuelta no se
 * conservaron en ningún archivo del repositorio (registros.json sólo guarda
 * un "desconocido" genérico para estos pares; la cita se conserva como
 * pista). Así que, además del plan, hace falta que Gemini diga CÓMO la
 * tiene (profundidad) para poder escribir un registro válido — pero NO se le
 * pide que vuelva a juzgar SI la tiene: eso ya está dado por bueno con la
 * cita ya guardada, que se le entrega como evidencia ya aceptada.
 */
function promptPlan(
  nombre: string,
  capacidades: Array<Capacidad & { citaPrevia?: string }>
): string {
  const lista = capacidades
    .map((c) => {
      const cita = c.citaPrevia ? ` — YA CONFIRMADA con esta cita de una verificación anterior: "${c.citaPrevia}"` : "";
      return `- ${c.id} | ${c.etiqueta}: ${c.definicion}${c.noEs ? ` FRONTERA: ${c.noEs}` : ""}${cita}`;
    })
    .join("\n");
  return [
    "Ya está comprobado que la herramienta TIENE cada una de estas capacidades: no",
    "vuelvas a juzgar SI la tiene, esa parte ya está resuelta con la cita que se te da.",
    "",
    `HERRAMIENTA: ${nombre}`,
    "",
    "Tu única tarea, leyendo SOLO las páginas oficiales que te doy, es decir DOS cosas",
    "por cada capacidad:",
    "",
    "(a) CÓMO la tiene: profundidad = \"nativa\" (es el producto o parte central),",
    '    "modulo" (existe dentro de una suite, a veces como módulo aparte) o',
    '    "integracion" (sólo funciona conectando otra herramienta; si es así, di',
    "    con cuál en integraCon).",
    "(b) EN QUÉ PLAN está disponible, con el nombre exacto que usa el fabricante.",
    "    La fuente tiene que ser la tabla de precios o documentación oficial que",
    "    vincule expresamente capacidad y plan — una portada o un eslogan NO vale.",
    "    Si las páginas no lo dicen, responde planMinimo null: es una respuesta",
    "    correcta, y prefiero eso a un plan inventado.",
    "",
    "REGLAS:",
    "1. Usa SOLO el contenido de las direcciones que te doy.",
    "2. Copia una cita LITERAL de esa fuente que sostenga tu respuesta de (a) y (b).",
    "3. Responde ÚNICAMENTE con un array JSON. Sin texto antes ni después.",
    "",
    "CAPACIDADES:",
    lista,
    "",
    "FORMATO DE CADA ELEMENTO DEL ARRAY:",
    "{",
    '  "capacidadId": "el identificador exacto de la lista",',
    '  "profundidad": "nativa" | "modulo" | "integracion",',
    '  "integraCon": "obligatorio si profundidad es integracion; si no, null",',
    '  "planMinimo": "nombre exacto del plan más barato que la incluye, o null",',
    '  "urlFuente": "la dirección de la que sacas la cita",',
    '  "cita": "la frase literal que sostiene profundidad y/o plan"',
    "}",
  ].join("\n");
}

async function procesarCapacidad(
  herramientaId: string,
  nombre: string,
  urls: string[],
  ids: string[],
  capacidadPorId: Map<string, Capacidad>
): Promise<SalidaHerramienta> {
  const bloques = Math.ceil(ids.length / POR_LLAMADA);
  const respuestas: RespuestaCruda[] = [];
  const urlsVistas: Array<{ url?: string; estado?: string; recuperada?: boolean }> = [];

  for (let b = 0; b < bloques; b++) {
    const trozo = ids.slice(b * POR_LLAMADA, (b + 1) * POR_LLAMADA);
    const caps = trozo.map((id) => capacidadPorId.get(id)!);
    const prompt = promptCapacidad(nombre, caps);
    const t0 = Date.now();
    try {
      const resp = await invocarGemini(prompt, urls);
      const ms = Date.now() - t0;
      urlsVistas.push(...extraerUrls(resp));
      const texto = extraerTexto(resp);
      const parseado = JSON.parse(texto) as RespuestaCruda[];
      const filtrado = parseado
        .filter((r) => trozo.includes(r.capacidadId ?? ""))
        .map((r) => ({
          ...r,
          integraCon: aTextoONull(r.integraCon),
          planMinimo: aTextoONull(r.planMinimo),
          urlFuente: aTextoONull(r.urlFuente),
          cita: aTextoONull(r.cita),
          nota: aTextoONull(r.nota),
        }));
      respuestas.push(...filtrado);
      console.log(`    bloque ${b + 1}/${bloques} — ${trozo.length} capacidades, ${ms}ms, ${filtrado.length} respondidas`);
    } catch (e) {
      /**
       * Que un bloque falle (incluso tras los 3 reintentos de invocarGemini)
       * NO puede tumbar el resto del lote: ésa fue, reproducida en vivo, la
       * causa más probable de que la repesca original sólo aplicara 3 de 765
       * cambios. Las capacidades de este bloque quedan en sinRespuesta —un
       * resultado honesto, no un hueco tapado— y se repescan en otra pasada.
       */
      console.log(`    bloque ${b + 1}/${bloques} — FALLÓ, queda sin respuesta: ${(e as Error).message.slice(0, 200)}`);
    }
    if (b < bloques - 1) await sleep(PAUSA_MS);
  }

  const porId = new Map<string, RespuestaCruda>();
  for (const r of respuestas) if (r.capacidadId && ids.includes(r.capacidadId)) porId.set(r.capacidadId, r);
  const sinRespuesta = ids.filter((id) => !porId.has(id));

  return {
    herramientaId,
    nombre,
    fechaConsulta: HOY,
    urlsSolicitadas: urls,
    urlsRecuperadas: urlsVistas,
    capacidadesPedidas: ids,
    respuestas: [...porId.values()],
    sinRespuesta,
  };
}

async function procesarPlan(
  herramientaId: string,
  nombre: string,
  urls: string[],
  ids: string[],
  capacidadPorId: Map<string, Capacidad>,
  citaPreviaDe: Map<string, string>
): Promise<SalidaHerramienta> {
  const bloques = Math.ceil(ids.length / POR_LLAMADA);
  const respuestas: RespuestaCruda[] = [];
  const urlsVistas: Array<{ url?: string; estado?: string; recuperada?: boolean }> = [];

  for (let b = 0; b < bloques; b++) {
    const trozo = ids.slice(b * POR_LLAMADA, (b + 1) * POR_LLAMADA);
    const caps = trozo.map((id) => ({ ...capacidadPorId.get(id)!, citaPrevia: citaPreviaDe.get(id) }));
    const prompt = promptPlan(nombre, caps);
    const t0 = Date.now();
    try {
      const resp = await invocarGemini(prompt, urls);
      const ms = Date.now() - t0;
      urlsVistas.push(...extraerUrls(resp));
      const texto = extraerTexto(resp);
      const parseado = JSON.parse(texto) as Array<{
        capacidadId?: string;
        profundidad?: string | null;
        integraCon?: string | null;
        planMinimo?: string | null;
        urlFuente?: string | null;
        cita?: string | null;
      }>;
      const filtrado = parseado.filter((r) => trozo.includes(r.capacidadId ?? ""));
      for (const r of filtrado) {
        respuestas.push({
          capacidadId: r.capacidadId,
          veredicto: "si",
          profundidad: aTextoONull(r.profundidad),
          integraCon: aTextoONull(r.integraCon),
          planMinimo: aTextoONull(r.planMinimo),
          urlFuente: aTextoONull(r.urlFuente),
          cita: aTextoONull(r.cita),
          nota: null,
        });
      }
      console.log(`    bloque ${b + 1}/${bloques} — ${trozo.length} capacidades, ${ms}ms, ${filtrado.length} respondidas`);
    } catch (e) {
      console.log(`    bloque ${b + 1}/${bloques} — FALLÓ, queda sin respuesta: ${(e as Error).message.slice(0, 200)}`);
    }
    if (b < bloques - 1) await sleep(PAUSA_MS);
  }

  const porId = new Map<string, RespuestaCruda>();
  for (const r of respuestas) if (r.capacidadId && ids.includes(r.capacidadId)) porId.set(r.capacidadId, r);
  const sinRespuesta = ids.filter((id) => !porId.has(id));

  return {
    herramientaId,
    nombre,
    fechaConsulta: HOY,
    urlsSolicitadas: urls,
    urlsRecuperadas: urlsVistas,
    capacidadesPedidas: ids,
    respuestas: [...porId.values()],
    sinRespuesta,
  };
}

async function main() {
  const herramientas = getTodasLasHerramientas();
  const herramientaPorId = new Map(herramientas.map((h) => [h.id, h]));
  const capacidades = getCapacidades();
  const capacidadPorId = new Map(capacidades.map((c) => [c.id, c]));
  const sustituciones = getSustituciones();
  const sustitucionPorId = new Map(sustituciones.map((s) => [s.herramientaId, s]));

  const descartes = leerJson<Descarte[]>(path.join(DIR, "descartes.json"));
  const bucketCapacidad = descartes.filter((d) => d.motivo === "sin respuesta");
  const bucketPlan = descartes.filter(
    (d) => d.motivo === "sin plan mínimo" || d.motivo === "el plan no viene de una fuente que lo demuestre"
  );
  const bucketRedireccion = descartes.filter((d) => d.motivo === "la dirección citada no consta como leída");

  function agrupar(arr: Descarte[]): Map<string, string[]> {
    const m = new Map<string, string[]>();
    for (const d of arr) {
      if (!m.has(d.herramientaId)) m.set(d.herramientaId, []);
      if (!m.get(d.herramientaId)!.includes(d.capacidadId)) m.get(d.herramientaId)!.push(d.capacidadId);
    }
    return m;
  }
  function citaPorCapacidad(arr: Descarte[], herramientaId: string): Map<string, string> {
    const m = new Map<string, string>();
    for (const d of arr) if (d.herramientaId === herramientaId && d.cita) m.set(d.capacidadId, d.cita);
    return m;
  }

  const gCap = agrupar(bucketCapacidad);
  const gPlan = agrupar(bucketPlan);
  const gRed = agrupar(bucketRedireccion);

  /**
   * Qué direcciones se piden de verdad. Una sustitución declarada manda sobre
   * la ficha —sólo para verificar, nunca tocando el catálogo—: si la de la
   * ficha redirige, se pide la resuelta, porque si no Gemini lee una y cita
   * otra y la afirmación cae por la regla de redirecciones.
   */
  function urlsDe(herramientaId: string): string[] {
    const ficha = herramientaPorId.get(herramientaId)!;
    const sust = sustitucionPorId.get(herramientaId);
    const urlPrecios = sust?.urlPrecios ?? ficha.urlPrecios;
    const paginaOficial = sust?.paginaOficial?.resuelta ?? ficha.paginaOficial;
    const urls = [urlPrecios, paginaOficial].filter((u): u is string => Boolean(u));
    return [...new Set(urls)];
  }

  /**
   * Checkpoint incremental: si el proceso muere a mitad (como ya pasó una
   * vez, con exactamente este tipo de fallo), la siguiente ejecución
   * retoma donde se quedó en vez de repetir —y volver a pagar— lo que ya
   * está bien hecho.
   */
  const RUTA_CHECKPOINT = path.join(DIR, "_checkpoint-repesca-remota.json");
  const checkpoint: Record<string, SalidaHerramienta> = fs.existsSync(RUTA_CHECKPOINT)
    ? leerJson<Record<string, SalidaHerramienta>>(RUTA_CHECKPOINT)
    : {};

  async function procesarConCheckpoint(
    clave: string,
    id: string,
    ids: string[],
    tipo: "capacidad" | "plan",
    citaPrevia?: Map<string, string>
  ): Promise<void> {
    if (checkpoint[clave]) {
      console.log(`· ${clave} — ya estaba en el checkpoint, se salta`);
      return;
    }
    const ficha = herramientaPorId.get(id)!;
    console.log(`· ${ficha.nombre} (${id}) — ${ids.length} capacidades [${tipo}]`);
    const salida =
      tipo === "capacidad"
        ? await procesarCapacidad(id, ficha.nombre, urlsDe(id), ids, capacidadPorId)
        : await procesarPlan(id, ficha.nombre, urlsDe(id), ids, capacidadPorId, citaPrevia!);
    checkpoint[clave] = salida;
    escribirJson(RUTA_CHECKPOINT, checkpoint);
    await sleep(PAUSA_MS);
  }

  if (MODO === "completo") {
    console.log("\n=== Bucket redirección (41 pares, 5 tools) ===");
    for (const [id, ids] of gRed) await procesarConCheckpoint(`redireccion:${id}`, id, ids, "capacidad");

    console.log("\n=== Bucket capacidad (133 pares) ===");
    for (const [id, ids] of gCap) await procesarConCheckpoint(`capacidad:${id}`, id, ids, "capacidad");

    console.log("\n=== Bucket plan (106 pares) ===");
    for (const [id, ids] of gPlan) {
      const citaPrevia = citaPorCapacidad(bucketPlan, id);
      await procesarConCheckpoint(`plan:${id}`, id, ids, "plan", citaPrevia);
    }
  }

  if (MODO === "rescatar") {
    /**
     * Las citas que sostenían estos pares están en el descartes de ANTES de la
     * primera fusión: al fusionar, el par pasó a «sin respuesta» y su cita se
     * fue con él. Se recupera de la copia para no volver a preguntar la
     * capacidad entera de algo que ya estaba afirmado.
     */
    const rutaOriginales = path.join(DIR, "_descartes-originales.json");
    const originales: Descarte[] = fs.existsSync(rutaOriginales)
      ? leerJson<Descarte[]>(rutaOriginales)
      : descartes;

    console.log("\n=== Rescate de los pares que perdió un fallo del gateway ===");
    for (const [clave, s] of Object.entries(checkpoint)) {
      const pendientes = s.sinRespuesta ?? [];
      if (!pendientes.length) continue;

      const id = s.herramientaId;
      const tipo: "capacidad" | "plan" = clave.startsWith("plan:") ? "plan" : "capacidad";
      const ficha = herramientaPorId.get(id)!;
      console.log(`· ${ficha.nombre} (${id}) — ${pendientes.length} pendientes [${tipo}]`);

      const citaPrevia = citaPorCapacidad(originales, id);
      const rescatada =
        tipo === "capacidad"
          ? await procesarCapacidad(id, ficha.nombre, urlsDe(id), pendientes, capacidadPorId)
          : await procesarPlan(id, ficha.nombre, urlsDe(id), pendientes, capacidadPorId, citaPrevia);

      // Fusionar, no reemplazar: lo que ya estaba respondido sigue valiendo.
      const respuestas = [...(s.respuestas ?? []), ...(rescatada.respuestas ?? [])];
      const respondidas = new Set(respuestas.map((r) => r.capacidadId));
      checkpoint[clave] = {
        ...s,
        respuestas,
        urlsRecuperadas: [...(s.urlsRecuperadas ?? []), ...(rescatada.urlsRecuperadas ?? [])],
        sinRespuesta: (s.capacidadesPedidas ?? []).filter((c) => !respondidas.has(c)),
      };
      escribirJson(RUTA_CHECKPOINT, checkpoint);
      console.log(`    recuperadas ${rescatada.respuestas?.length ?? 0} de ${pendientes.length}`);
      await sleep(PAUSA_MS);
    }
  }

  const salidas: SalidaHerramienta[] = Object.values(checkpoint);

  escribirJson(path.join(DIR, "_salida-repesca-remota.json"), {
    fecha: HOY,
    modelo: MODELO,
    herramientas: salidas,
  });

  // --- Conversión: reutiliza las mismas reglas que convertir-verificacion ---
  const fuentesPorHerramienta: Record<string, FuentesDeHerramienta> = {};
  for (const h of herramientas) fuentesPorHerramienta[h.id] = { urlPrecios: h.urlPrecios };
  for (const s of sustituciones) {
    fuentesPorHerramienta[s.herramientaId] = {
      ...fuentesPorHerramienta[s.herramientaId],
      ...(s.urlPrecios ? { urlPrecios: s.urlPrecios } : {}),
      ...(s.documentacion?.length ? { documentacion: s.documentacion } : {}),
    };
  }

  const salidaLote: SalidaLote = {
    lote: 1,
    fecha: HOY,
    modelo: MODELO,
    herramientas: salidas,
  };

  const { registros: nuevosRegistros, descartes: nuevosDescartes, resumen } = convertirSalida(
    salidaLote,
    fuentesPorHerramienta,
    getCitasRevisadas()
  );

  const herramientaIds = herramientas.map((h) => h.id);
  const capacidadIds = capacidadIdsDelVocabulario();
  const erroresValidacion = nuevosRegistros.flatMap((r) => erroresDeRegistro(r, herramientaIds, capacidadIds));
  if (erroresValidacion.length) {
    console.error(`${erroresValidacion.length} registro(s) nuevos no pasan el validador. No se escribe nada:`);
    for (const e of erroresValidacion.slice(0, 30)) console.error(`  · ${e}`);
    process.exit(1);
  }

  // --- Fusión: sustituir SOLO los pares tocados, conservar el resto intacto ---
  const registrosViejos = leerJson<RegistroVerificacion[]>(path.join(DIR, "registros.json"));
  const descartesViejos = leerJson<Descarte[]>(path.join(DIR, "descartes.json"));

  const clavePar = (h: string, c: string) => `${h}::${c}`;
  const paresPedidos = new Set(salidas.flatMap((s) => (s.capacidadesPedidas ?? []).map((c) => clavePar(s.herramientaId, c))));

  const registrosFinal = [
    ...registrosViejos.filter((r) => !paresPedidos.has(clavePar(r.herramientaId, r.capacidadId))),
    ...nuevosRegistros,
  ];
  const descartesFinal = [
    ...descartesViejos.filter((d) => !paresPedidos.has(clavePar(d.herramientaId, d.capacidadId))),
    ...nuevosDescartes,
  ];

  const erroresFinal = registrosFinal.flatMap((r) => erroresDeRegistro(r, herramientaIds, capacidadIds));
  if (erroresFinal.length) {
    console.error(`${erroresFinal.length} registro(s) en el archivo fusionado no pasan el validador. No se escribe nada:`);
    for (const e of erroresFinal.slice(0, 30)) console.error(`  · ${e}`);
    process.exit(1);
  }

  escribirJson(path.join(DIR, "registros.json"), registrosFinal);
  escribirJson(path.join(DIR, "descartes.json"), descartesFinal);

  console.log("\n=== Resumen de la conversión de este run ===");
  console.log(`Pares pedidos:      ${paresPedidos.size}`);
  console.log(`Registros nuevos:   ${nuevosRegistros.length}`);
  console.log(`  verificados:      ${resumen.verificados}`);
  console.log(`  no disponibles:   ${resumen.noDisponibles}`);
  console.log(`  desconocidos:     ${resumen.desconocidos}`);
  console.log(`Degradados:         ${resumen.degradados}`);
  console.log(`Sin respuesta:      ${resumen.sinRespuesta}`);
  console.log(`\nregistros.json total: ${registrosFinal.length} (antes ${registrosViejos.length})`);
  console.log(`descartes.json total: ${descartesFinal.length} (antes ${descartesViejos.length})`);
}

main().catch((e) => {
  console.error("FALLO:", e);
  process.exit(1);
});
