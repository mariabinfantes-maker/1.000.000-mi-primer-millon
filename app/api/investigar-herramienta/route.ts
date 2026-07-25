import { NextResponse } from "next/server";
import { investigarHerramienta } from "@/agents/atlas-researcher/agente";
import { crearProveedorGemini } from "@/agents/atlas-researcher/proveedores/gemini";
import type { SolicitudInvestigacion } from "@/agents/atlas-researcher/tipos";

/**
 * Puente HTTP hacia Atlas Researcher, con el mismo motivo que
 * `app/api/recomendaciones/route.ts`: el agente en sí no sabe nada de HTTP
 * ni de Next.js (recibe la solicitud y el proveedor por parámetro), así
 * que esta ruta solo lee el body, arma la `SolicitudInvestigacion` y
 * delega en `investigarHerramienta` con el proveedor real de Gemini.
 *
 * La investigación puede tardar más de los 10s por defecto del plan Hobby
 * de Vercel, de ahí `maxDuration`.
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  let cuerpo: Partial<SolicitudInvestigacion>;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const nombreHerramienta = typeof cuerpo.nombreHerramienta === "string" ? cuerpo.nombreHerramienta.trim() : "";
  if (!nombreHerramienta) {
    return NextResponse.json(
      { error: 'Falta el campo "nombreHerramienta" (debe ser un texto no vacío).' },
      { status: 400 }
    );
  }

  const solicitud: SolicitudInvestigacion = {
    nombreHerramienta,
    categoriaId: typeof cuerpo.categoriaId === "string" ? cuerpo.categoriaId : undefined,
    contextoAdicional: typeof cuerpo.contextoAdicional === "string" ? cuerpo.contextoAdicional : undefined,
  };

  const resultado = await investigarHerramienta(solicitud, crearProveedorGemini());

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 502 });
  }

  return NextResponse.json({ propuesta: resultado.propuesta });
}
