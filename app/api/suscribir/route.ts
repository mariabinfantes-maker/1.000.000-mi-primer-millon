import { NextResponse } from "next/server";
import { procesarSuscripcion } from "@/lib/email/procesarSuscripcion";
import { obtenerProveedorEmail } from "@/lib/email/proveedorActivo";
import type { CuerpoSuscripcion } from "@/lib/email/validarSuscripcion";

/**
 * Puente HTTP hacia `procesarSuscripcion` — capa delgada, sin lógica propia,
 * mismo patrón que `/api/recomendaciones`: parsea el cuerpo, delega, y
 * traduce el resultado a una respuesta HTTP.
 */
export async function POST(request: Request) {
  let cuerpo: CuerpoSuscripcion;
  try {
    cuerpo = (await request.json()) as CuerpoSuscripcion;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const resultado = await procesarSuscripcion(cuerpo, obtenerProveedorEmail());

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
