import {
  ErrorProveedorIA,
  type ProveedorIAQueLee,
  type RecuperacionUrl,
  type RespuestaConFuentes,
} from "../proveedorIA";

const NOMBRE = "gemini";
/**
 * Se puede sobrescribir con GEMINI_MODEL sin tocar código, por si hace
 * falta cambiar de modelo más adelante — como ya tuvimos que hacer una vez
 * (gemini-2.5-flash dejó de estar disponible para nuevos usuarios).
 * gemini-3.6-flash es, a fecha de este cambio, el modelo flash de la
 * familia Gemini 3 en disponibilidad general (GA).
 */
const MODELO_POR_DEFECTO = "gemini-3.6-flash";
const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * El único estado que cuenta como «la leyó». Cualquier otro —error, límite,
 * bloqueo del robots.txt— es «no la leyó», y se trata igual: sin evidencia.
 */
const ESTADO_RECUPERADA = "URL_RETRIEVAL_STATUS_SUCCESS";

/** Tope de direcciones por petición documentado por Google para url_context. */
const MAX_URLS = 20;

type MetadatoUrl = { retrievedUrl?: string; urlRetrievalStatus?: string };

type RespuestaGemini = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    urlContextMetadata?: { urlMetadata?: MetadatoUrl[] };
  }>;
  error?: { message?: string };
};

function clave(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ErrorProveedorIA(NOMBRE, "GEMINI_API_KEY no está configurada en el entorno del servidor.");
  }
  return apiKey;
}

async function pedir(cuerpo: unknown): Promise<RespuestaGemini> {
  const modelo = process.env.GEMINI_MODEL?.trim() || MODELO_POR_DEFECTO;
  /**
   * La clave se lee ANTES del try. Dentro, su error quedaría atrapado por el
   * catch y saldría como «no se ha podido contactar», que es mentira: no se
   * ha intentado. Las pruebas lo cazaron al refactorizar esto.
   */
  const url = `${URL_BASE}/${modelo}:generateContent?key=${clave()}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorProveedorIA(NOMBRE, "No se ha podido contactar con la API de Gemini.");
  }

  const datos = (await respuesta.json().catch(() => null)) as RespuestaGemini | null;

  if (!respuesta.ok) {
    throw new ErrorProveedorIA(
      NOMBRE,
      datos?.error?.message ?? `Error ${respuesta.status} desconocido al llamar a Gemini.`
    );
  }
  return datos ?? {};
}

function textoDelCandidato(datos: RespuestaGemini): string {
  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new ErrorProveedorIA(NOMBRE, "Gemini no ha devuelto ningún contenido en la respuesta.");
  }
  return texto;
}

/**
 * Quita la valla de markdown si viene.
 *
 * Con `responseMimeType: "application/json"` nunca hace falta, pero esa opción
 * no se puede usar junto a herramientas como url_context, y entonces el modelo
 * sí tiende a envolver el JSON en ```json. Quitarlo aquí evita que cada quien
 * se invente su propia limpieza.
 */
function comoJson(texto: string): unknown {
  const limpio = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(limpio);
  } catch {
    throw new ErrorProveedorIA(NOMBRE, "La respuesta de Gemini no es un JSON válido.");
  }
}

function urlsRecuperadas(datos: RespuestaGemini): RecuperacionUrl[] {
  const metadatos = datos?.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
  return metadatos.map((m) => ({
    url: m.retrievedUrl ?? "",
    estado: m.urlRetrievalStatus ?? "",
    recuperada: m.urlRetrievalStatus === ESTADO_RECUPERADA,
  }));
}

/**
 * Adaptador de Gemini, compartido por cualquier agente de Atlas que
 * necesite IA (Researcher, Recomendador, y los que vengan después).
 *
 * Implementa el contrato `ProveedorIA` (ver proveedorIA.ts) llamando a la
 * API de generación de contenido de Gemini. La clave se lee de
 * `GEMINI_API_KEY` en tiempo de ejecución — nunca se escribe en el código —
 * y se pide la respuesta ya en JSON (`responseMimeType: "application/json"`)
 * para no tener que quitar bloques de markdown a mano.
 *
 * Implementa además `ProveedorIAQueLee`: con `url_context` el modelo descarga
 * las páginas oficiales antes de responder y dice cuáles consiguió leer. Esa
 * segunda mitad es la que F2 necesita, y se probó de verdad contra la API el
 * 2026-09-07 —página real y página inexistente— antes de escribir esto. Ver
 * ATLAS.md, «Gemini sí puede leer la fuente oficial».
 *
 * Mismo estilo de manejo de errores que `app/api/generar-imagen/route.ts`
 * para la API de OpenAI: `fetch` envuelto en try/catch, comprobación de
 * `respuesta.ok`, y un `ErrorProveedorIA` con mensaje legible en cada caso
 * — nunca un error genérico sin contexto.
 */
export function crearProveedorGemini(): ProveedorIAQueLee {
  return {
    nombre: NOMBRE,

    async generarJson(prompt: string): Promise<unknown> {
      const datos = await pedir({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 8192,
        },
      });
      return comoJson(textoDelCandidato(datos));
    },

    async generarJsonLeyendoUrls(prompt: string, urls: string[]): Promise<RespuestaConFuentes> {
      if (!urls.length) {
        throw new ErrorProveedorIA(NOMBRE, "No se ha indicado ninguna dirección que leer.");
      }
      if (urls.length > MAX_URLS) {
        throw new ErrorProveedorIA(NOMBRE, `Gemini admite ${MAX_URLS} direcciones por petición como máximo.`);
      }

      /**
       * Las direcciones van dentro del texto porque así las toma url_context.
       * Se repiten aparte, en una lista, para que ninguna dependa de cómo esté
       * redactado el prompt de quien llama.
       */
      const texto = `${prompt}\n\nDirecciones que debes leer antes de responder:\n${urls
        .map((u) => `- ${u}`)
        .join("\n")}`;

      const datos = await pedir({
        contents: [{ parts: [{ text: texto }] }],
        tools: [{ url_context: {} }],
        // Sin responseMimeType: no se puede combinar con herramientas.
        generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
      });

      return { datos: comoJson(textoDelCandidato(datos)), urls: urlsRecuperadas(datos) };
    },
  };
}
