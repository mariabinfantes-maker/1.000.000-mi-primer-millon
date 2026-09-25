import { NextResponse } from "next/server";
import {
  aclarar,
  aconsejar,
  entender,
  leerComprension,
  getOficios,
  loQueTraeUnOficio,
  necesidadesDeLaLista,
  conLaRespuesta,
  necesidadesQueSePuedenElegir,
  type PreguntaUtil,
} from "@/agents/atlas-advisor/asesor";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";

/**
 * La versión de PRUEBA del asesor. No toca la web actual.
 *
 * Condición de la propietaria (2026-09-24): «primero se conecta en una
 * versión de prueba, conservando la web actual. Tú recorres varios casos
 * distintos y ves cómo usa información de varias casas. La publicación se
 * decide después de ver el servicio completo funcionando, no porque haya
 * muchas pruebas técnicas en verde.»
 *
 * Esta ruta NO lee el vocabulario ni la verificación: entra todo por
 * `@/agents/atlas-advisor/asesor`, que es la única puerta. La IA sólo hace el
 * paso 1, entender; todo lo que se afirma de una herramienta sale de
 * `aconsejar`, que únicamente lee datos verificados.
 */

/**
 * Hay IA si hay clave... o si la pone el proxy, que es como funciona el
 * entorno remoto donde se lanzan los lotes (`GEMINI_CLAVE_INYECTADA_POR_PROXY`
 * en `agents/compartido/proveedores/gemini.ts`, con su motivo escrito allí).
 *
 * Faltaba esa segunda mitad, y por eso el asesor decía «todavía no sé leer tu
 * texto» en un entorno donde sí podía: se miraba sólo la variable de la clave.
 */
const HAY_IA =
  Boolean(process.env.GEMINI_API_KEY) || process.env.GEMINI_CLAVE_INYECTADA_POR_PROXY === "true";

/** Las casas: los oficios. Se piden sin cuerpo, para pintar la portada. */
export async function GET() {
  return NextResponse.json({ oficios: getOficios() });
}

export async function POST(peticion: Request) {
  const cuerpo = (await peticion.json()) as {
    texto?: string;
    necesidadIds?: string[];
    oficioId?: string;
    /** Lo que acaba de contestar a la pregunta anterior. */
    respondida?: { dimensionId?: string; respuestaId?: string };
    /** Lo que ya se sabía antes de contestar, para no volver a leer el texto. */
    necesidadesPrevias?: string[];
    /**
     * Las preguntas que ya ha contestado. No se repiten.
     *
     * Hace falta porque una respuesta puede no traer ninguna necesidad —«lo
     * asignamos nosotros»— y entonces el caso queda igual que antes: `aclarar`
     * la volvería a proponer y Molnip preguntaría lo mismo dos veces. Contestar
     * «no» también es contestar.
     */
    respondidas?: string[];
  };
  const yaContestadas = new Set(cuerpo.respondidas ?? []);
  const sinRepetir = (ps: ReturnType<typeof aclarar>) => ps.filter((p) => !yaContestadas.has(p.dimension.id));
  const texto = (cuerpo.texto ?? "").trim();

  // Contestó una pregunta: se continúa desde lo que ya se sabía, sin volver a
  // llamar al modelo ni pedirle que repita su historia.
  if (cuerpo.respondida?.respuestaId && cuerpo.necesidadesPrevias?.length) {
    const delCaso = conLaRespuesta(necesidadesDeLaLista(cuerpo.necesidadesPrevias), cuerpo.respondida);
    return NextResponse.json({
      comprension: { loQueDijo: texto, necesidades: delCaso, noEntendido: [], circunstancias: [] },
      preguntas: sinRepetir(aclarar(delCaso)).map(resumir),
      consejo: aconsejar(delCaso),
      leyoLaIA: false,
      yaRespondio: true,
    });
  }

  // La puerta principal: entrar diciendo QUÉ ERES. Un oficio trae sus
  // necesidades y el asesor hace el resto, sin que ella escriba una palabra.
  if (cuerpo.oficioId) {
    const delCaso = loQueTraeUnOficio(cuerpo.oficioId);
    if (delCaso.length) {
      return NextResponse.json({
        comprension: { loQueDijo: "", necesidades: delCaso, noEntendido: [], circunstancias: [] },
        preguntas: aclarar(delCaso).map(resumir),
        consejo: aconsejar(delCaso),
        leyoLaIA: false,
        porOficio: true,
      });
    }
  }

  // Camino sin IA: ella elige lo que le pasa y el asesor sigue desde ahí. Se
  // dice en voz alta que el paso de entender no ha corrido; callarlo sería
  // enseñar una comprensión que no ha existido.
  if (cuerpo.necesidadIds?.length) {
    const delCaso = necesidadesDeLaLista(cuerpo.necesidadIds);
    return NextResponse.json({
      comprension: { loQueDijo: texto, necesidades: delCaso, noEntendido: [], circunstancias: [] },
      preguntas: aclarar(delCaso).map(resumir),
      consejo: aconsejar(delCaso),
      leyoLaIA: false,
    });
  }

  if (!texto) return NextResponse.json({ error: "Cuéntame algo primero." }, { status: 400 });
  if (!HAY_IA) return NextResponse.json({ sinIA: true, necesidades: necesidadesQueSePuedenElegir() });

  const proveedor = crearProveedorGemini();
  const comprension = await entender(texto, (prompt) => proveedor.generarJson(prompt)).catch(() =>
    leerComprension(texto, {})
  );
  return NextResponse.json({
    comprension,
    preguntas: aclarar(comprension.necesidades).map(resumir),
    consejo: aconsejar(comprension.necesidades),
    leyoLaIA: true,
  });
}

function resumir(p: PreguntaUtil) {
  return {
    id: p.dimension.id,
    pregunta: p.dimension.pregunta,
    porQuePreguntamos: p.dimension.porQuePreguntamos,
    respuestas: p.dimension.respuestas,
    candidatasQueSeMueven: p.candidatasQueSeMueven,
    cercaDeLoQueConto: p.cercaDeLoQueConto,
  };
}
