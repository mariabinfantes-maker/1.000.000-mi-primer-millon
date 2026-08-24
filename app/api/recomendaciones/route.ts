import { NextResponse } from "next/server";
import { getHerramientas, getProblemas } from "@/data/repositorio";
import {
  detectarProblemasPorTexto,
  recomendarHerramientas,
  type HerramientaEvaluada,
  type RespuestasUsuario,
} from "@/agents/atlas-advisor";
import { personalizarRecomendaciones } from "@/agents/atlas-recomendador";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";
import type { TipoOrigenDiagnostico } from "@/lib/origenDiagnostico";
import { generarTokenResultado } from "@/lib/resultadoToken";

type CuerpoPeticion = {
  respuestas: RespuestasUsuario;
  origenTipo: TipoOrigenDiagnostico;
  origenId: string;
};

/**
 * Interruptor de Atlas Recomendador (Capa 2 de Advisor): a diferencia de
 * Researcher, donde tú decides cuándo lanzar un lote, esta capa llamaría a
 * la IA en cada cuestionario completado — un coste continuo, no puntual.
 * Por eso vive detrás de una variable de entorno explícita, apagada por
 * defecto, en vez de activarse solo con que `GEMINI_API_KEY` exista (esa
 * clave también la usa Researcher, con un patrón de coste muy distinto).
 */
const IA_ACTIVA = process.env.ATLAS_RECOMENDADOR_IA_ACTIVA === "true";

/**
 * Puente HTTP hacia el motor de recomendación.
 *
 * `data/repositorio.ts` usa `node:fs`, así que solo puede ejecutarse en el
 * servidor: el cuestionario (componente cliente) no puede llamar al motor
 * directamente y pasa por aquí. La ruta calcula siempre la Capa 1
 * determinista (`recomendarHerramientas`) y, solo si `IA_ACTIVA`, intenta
 * enriquecerla con la Capa 2 (`personalizarRecomendaciones`) — que ya trae
 * su propio respaldo: si la IA falla, cada herramienta se queda con la
 * explicación determinista tal cual, nunca sin ninguna.
 *
 * La respuesta lleva un `token` (ver `lib/resultadoToken.ts`) en vez del
 * array `top` completo: el cliente solo necesita navegar a
 * `/resultado/[token]`, que rehidrata el resultado por su cuenta — así el
 * enlace es lo único que hace falta para recuperar exactamente esta
 * recomendación más tarde, desde cualquier dispositivo.
 */
export async function POST(request: Request) {
  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = (await request.json()) as CuerpoPeticion;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const { origenTipo, origenId } = cuerpo;
  if (!origenTipo || !origenId) {
    return NextResponse.json({ error: "Falta origenTipo u origenId." }, { status: 400 });
  }

  let respuestas: RespuestasUsuario = cuerpo.respuestas ?? {};

  // Puerta "Cuéntanoslo": a diferencia de "por categoría" y "por objetivo",
  // aquí no llega ninguna elección explícita — solo texto libre. `getProblemas()`
  // usa `node:fs`, así que esta detección solo puede vivir aquí (el
  // servidor), nunca en el cuestionario (componente cliente). Si el usuario
  // ya trae `categoriaId` o `problemaIdsCandidatos` (entró por categoría o
  // por objetivo), no se toca nada: el texto libre nunca sustituye una
  // elección explícita, solo rellena el hueco cuando no la hay.
  if (!respuestas.categoriaId && !respuestas.problemaIdsCandidatos?.length && respuestas.notasAdicionales) {
    const problemasDetectados = detectarProblemasPorTexto(respuestas.notasAdicionales, getProblemas());
    if (problemasDetectados.length > 0) {
      respuestas = { ...respuestas, problemaIdsCandidatos: problemasDetectados };
    }
  }

  const resultado = recomendarHerramientas(respuestas, getHerramientas());

  let top: HerramientaEvaluada[] = resultado.top;
  if (IA_ACTIVA) {
    top = await personalizarRecomendaciones(resultado.top, respuestas, crearProveedorGemini());
  }

  const token = generarTokenResultado({
    origenTipo,
    origenId,
    items: top.map((evaluada) => ({
      id: evaluada.herramienta.id,
      puntuacion: evaluada.puntuacionTotal,
      explicacion: evaluada.explicacion,
      advertencia: evaluada.tieneAdvertencia,
    })),
    generadoEn: new Date().toISOString(),
  });

  // `totalEvaluadas` es real (el tamaño del catálogo filtrado que puntuó el
  // motor), no una cifra decorativa: se lo enseña Atlas al usuario en P-02
  // como prueba de que hay un cálculo de verdad detrás, no un top-3 fijo.
  return NextResponse.json({ token, totalEvaluadas: resultado.todas.length });
}
