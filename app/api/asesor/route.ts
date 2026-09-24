import { NextResponse } from "next/server";
import {
  aclarar,
  aconsejar,
  entender,
  leerComprension,
  necesidadesDeLaLista,
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

const HAY_IA = Boolean(process.env.GEMINI_API_KEY);

export async function POST(peticion: Request) {
  const cuerpo = (await peticion.json()) as { texto?: string; necesidadIds?: string[] };
  const texto = (cuerpo.texto ?? "").trim();

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
  };
}
