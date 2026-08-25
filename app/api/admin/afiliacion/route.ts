import { NextResponse } from "next/server";
import { getTodasLasHerramientas } from "@/data/repositorio";
import { getTodasLasEstrategiasAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { getTodosLosDatosDeAfiliados } from "@/data/repositorioAfiliados";
import { construirFilasPanel } from "@/agents/atlas-affiliate-manager/panelDatos";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/** Lista completa de filas del panel — segunda verificación de sesión, no confía solo en `proxy.ts`. */
export async function GET(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  const herramientas = getTodasLasHerramientas();
  const estrategias = getTodasLasEstrategiasAfiliacion();
  const datosAfiliados = getTodosLosDatosDeAfiliados();
  const hoy = new Date().toISOString().slice(0, 10);

  const filas = construirFilasPanel(herramientas, estrategias, datosAfiliados, hoy);
  return NextResponse.json({ filas });
}
