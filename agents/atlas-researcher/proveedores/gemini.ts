import { ErrorProveedorIA, type ProveedorIA } from "../proveedorIA";

const NOMBRE = "gemini";
/** Se puede sobrescribir con GEMINI_MODEL sin tocar código, por si hace falta cambiar de modelo más adelante. */
const MODELO_POR_DEFECTO = "gemini-2.5-flash";
const URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

type RespuestaGemini = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

/**
 * Adaptador de Gemini para Atlas Researcher.
 *
 * Implementa el contrato `ProveedorIA` (ver proveedorIA.ts) llamando a la
 * API de generación de contenido de Gemini. La clave se lee de
 * `GEMINI_API_KEY` en tiempo de ejecución — nunca se escribe en el código —
 * y se pide la respuesta ya en JSON (`responseMimeType: "application/json"`)
 * para no tener que quitar bloques de markdown a mano.
 *
 * Mismo estilo de manejo de errores que `app/api/generar-imagen/route.ts`
 * para la API de OpenAI: `fetch` envuelto en try/catch, comprobación de
 * `respuesta.ok`, y un `ErrorProveedorIA` con mensaje legible en cada caso
 * — nunca un error genérico sin contexto.
 */
export function crearProveedorGemini(): ProveedorIA {
  return {
    nombre: NOMBRE,
    async generarJson(prompt: string): Promise<unknown> {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new ErrorProveedorIA(NOMBRE, "GEMINI_API_KEY no está configurada en el entorno del servidor.");
      }

      const modelo = process.env.GEMINI_MODEL?.trim() || MODELO_POR_DEFECTO;

      let respuesta: Response;
      try {
        respuesta = await fetch(`${URL_BASE}/${modelo}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          }),
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

      const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!texto) {
        throw new ErrorProveedorIA(NOMBRE, "Gemini no ha devuelto ningún contenido en la respuesta.");
      }

      try {
        return JSON.parse(texto);
      } catch {
        throw new ErrorProveedorIA(NOMBRE, "La respuesta de Gemini no es un JSON válido.");
      }
    },
  };
}
