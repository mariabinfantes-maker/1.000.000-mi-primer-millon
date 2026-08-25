import { NextResponse } from "next/server";
import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/** Exporta todas las EstrategiaAfiliacion tal cual, para respaldo o edición externa antes de reimportar. */
export async function GET(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  const estrategias = getTodasLasEstrategiasAfiliacion();
  return NextResponse.json(estrategias, {
    headers: { "Content-Disposition": `attachment; filename="estrategia-afiliacion-${Date.now()}.json"` },
  });
}
