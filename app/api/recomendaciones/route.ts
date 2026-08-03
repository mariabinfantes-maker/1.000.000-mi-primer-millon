import { NextResponse } from "next/server";
import { getHerramientas } from "@/data/repositorio";
import { recomendarHerramientas, type RespuestasUsuario } from "@/agents/atlas-advisor";

/**
 * Puente HTTP hacia el motor de recomendación.
 *
 * `data/repositorio.ts` usa `node:fs`, así que solo puede ejecutarse en el
 * servidor: el cuestionario (componente cliente) no puede llamar al motor
 * directamente y pasa por aquí. La ruta no añade lógica propia — solo lee el
 * catálogo y delega en `recomendarHerramientas` — para que sea la misma
 * puerta de entrada que usaría cualquier otro cliente futuro (una app
 * móvil, un backend externo, etc.).
 */
export async function POST(request: Request) {
  let respuestas: RespuestasUsuario;
  try {
    respuestas = (await request.json()) as RespuestasUsuario;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const resultado = recomendarHerramientas(respuestas, getHerramientas());

  // `totalEvaluadas` es real (el tamaño del catálogo filtrado que puntuó el
  // motor), no una cifra decorativa: se lo enseña Atlas al usuario en P-02
  // como prueba de que hay un cálculo de verdad detrás, no un top-3 fijo.
  return NextResponse.json({ top: resultado.top, totalEvaluadas: resultado.todas.length });
}
