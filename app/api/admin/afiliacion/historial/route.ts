import { NextResponse } from "next/server";
import { getHistorialCambios } from "@/data/repositorioEstrategiaAfiliacion";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/** Historial de cambios de una herramienta, más reciente primero — solo lectura. */
export async function GET(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  const herramientaId = new URL(request.url).searchParams.get("herramientaId");
  if (!herramientaId) return NextResponse.json({ error: "Falta herramientaId." }, { status: 400 });

  const historial = await getHistorialCambios(herramientaId);
  return NextResponse.json({ historial });
}
