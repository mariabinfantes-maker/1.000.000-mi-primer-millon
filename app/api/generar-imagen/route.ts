import { NextResponse } from "next/server";

/**
 * Genera una imagen a partir de un prompt usando la API de imágenes de
 * OpenAI (`gpt-image-1`). Primera ruta de backend real del proyecto: hasta
 * ahora todo era estático, así que esta función se despliega en Vercel
 * como serverless function (Node.js runtime, que es el valor por defecto
 * de los Route Handlers — no hace falta declarar `runtime` a mano, y
 * `next.config.ts` no tiene activado `output: "export"`, así que la ruta
 * se sirve dinámicamente sin más cambios de configuración).
 *
 * La generación de imágenes puede tardar más de los 10s por defecto que
 * permite el plan Hobby de Vercel, de ahí `maxDuration`.
 */
export const maxDuration = 60;

const URL_OPENAI_IMAGENES = "https://api.openai.com/v1/images/generations";
const MODELO = "gpt-image-1";

type CuerpoPeticion = {
  prompt?: unknown;
};

type ImagenGenerada = {
  url?: string;
  b64_json?: string;
};

type RespuestaOpenAI = {
  data?: ImagenGenerada[];
  error?: { message?: string };
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar OPENAI_API_KEY en las variables de entorno del servidor." },
      { status: 500 }
    );
  }

  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const prompt = typeof cuerpo.prompt === "string" ? cuerpo.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      { error: 'Falta el campo "prompt" (debe ser un texto no vacío).' },
      { status: 400 }
    );
  }

  let respuestaOpenAI: Response;
  try {
    respuestaOpenAI = await fetch(URL_OPENAI_IMAGENES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        prompt,
        n: 1,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "No se ha podido contactar con la API de OpenAI." },
      { status: 502 }
    );
  }

  const datos = (await respuestaOpenAI.json().catch(() => null)) as RespuestaOpenAI | null;

  if (!respuestaOpenAI.ok) {
    return NextResponse.json(
      { error: datos?.error?.message ?? "Error desconocido al generar la imagen." },
      { status: respuestaOpenAI.status }
    );
  }

  const imagen = datos?.data?.[0];
  if (!imagen || (!imagen.url && !imagen.b64_json)) {
    return NextResponse.json(
      { error: "La API de OpenAI no ha devuelto ninguna imagen." },
      { status: 502 }
    );
  }

  // Se devuelve tal cual venga de OpenAI: hoy gpt-image-1 responde en
  // b64_json, pero no forzamos `response_format` para no depender de un
  // detalle de la API que puede cambiar entre modelos o versiones.
  return NextResponse.json({
    url: imagen.url ?? null,
    b64_json: imagen.b64_json ?? null,
  });
}
