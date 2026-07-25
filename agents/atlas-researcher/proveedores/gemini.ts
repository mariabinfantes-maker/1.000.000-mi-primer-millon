import { ErrorProveedorIA, type ProveedorIA } from "../proveedorIA";

const NOMBRE = "gemini";

/**
 * Adaptador de Gemini para Atlas Researcher — TODAVÍA NO CONECTADO.
 *
 * Esta tarea era solo dejar lista la arquitectura del agente: el contrato
 * `ProveedorIA` que ya usan `agente.ts` y el resto del pipeline es
 * exactamente el mismo que usará Gemini el día que se conecte de verdad, de
 * ahí que este archivo exista y compile, pero no llame a ningún servicio
 * todavía. Es la pieza pendiente de una tarea futura.
 *
 * Para conectar Gemini de verdad, sustituir el cuerpo de `generarJson` por
 * algo como:
 *
 *   const modelo = "gemini-2.0-flash"; // confirmar el modelo definitivo al conectar
 *   const respuesta = await fetch(
 *     `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
 *     {
 *       method: "POST",
 *       headers: { "Content-Type": "application/json" },
 *       body: JSON.stringify({
 *         contents: [{ parts: [{ text: prompt }] }],
 *         generationConfig: { responseMimeType: "application/json" },
 *       }),
 *     }
 *   );
 *   const datos = await respuesta.json();
 *   const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
 *   return JSON.parse(texto);
 *
 * (con el mismo estilo de manejo de errores que ya usa
 * `app/api/generar-imagen/route.ts` para la API de OpenAI: comprobar
 * `respuesta.ok`, envolver el `fetch` en un try/catch, y lanzar
 * `ErrorProveedorIA` con un mensaje legible en cada caso.)
 */
export function crearProveedorGemini(): ProveedorIA {
  return {
    nombre: NOMBRE,
    async generarJson(): Promise<unknown> {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new ErrorProveedorIA(
          NOMBRE,
          "GEMINI_API_KEY no está configurada. Este proveedor es un placeholder: la llamada real a la API de Gemini todavía no está implementada (ver comentario en agents/atlas-researcher/proveedores/gemini.ts)."
        );
      }

      throw new ErrorProveedorIA(
        NOMBRE,
        "La conexión con la API de Gemini todavía no está implementada. Es la siguiente tarea pendiente de Atlas Researcher."
      );
    },
  };
}
