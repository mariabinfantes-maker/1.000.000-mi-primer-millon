import { NextResponse } from "next/server";
import { getTodasLasEstrategiasAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { fusionarEstrategiaAfiliacion } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import { verificarEnlacesActivos } from "@/agents/atlas-affiliate-manager/verificarEnlaces";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Comprueba todos los enlaces guardados y persiste el resultado
 * (`enlaceUltimaComprobacion`/`enlaceComprobacionOk`) en cada cuenta —
 * así el panel puede mostrar "Fecha de última comprobación" entre
 * sesiones, no solo mientras dura la comprobación en curso.
 */
export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  // Con `herramientaId` se comprueba una sola: hace falta para poder
  // comprobar el enlace recién pegado sin lanzar una ronda contra los
  // servidores de los 51 programas.
  const cuerpo = (await request.json().catch(() => ({}))) as { herramientaId?: unknown };
  const soloUna = typeof cuerpo.herramientaId === "string" ? cuerpo.herramientaId : undefined;

  const todas = await getTodasLasEstrategiasAfiliacion();
  const estrategias = soloUna ? todas.filter((e) => e.herramientaId === soloUna) : todas;
  const resultados = await verificarEnlacesActivos(estrategias);
  const hoy = new Date().toISOString().slice(0, 10);
  const ahoraIso = new Date().toISOString();

  // Map mutable en memoria, no una relectura de disco por fila: varias
  // cuentas de la misma herramienta en el mismo lote no deben pisarse
  // entre sí (fusionarEstrategiaAfiliacion siempre parte de la versión
  // más reciente que ya se escribió en esta misma ejecución).
  const estrategiasPorId = new Map(estrategias.map((e) => [e.herramientaId, e]));

  for (const resultado of resultados) {
    const existente = estrategiasPorId.get(resultado.herramientaId);
    const actualizada = fusionarEstrategiaAfiliacion(
      resultado.herramientaId,
      resultado.cuentaId,
      existente,
      { enlaceUltimaComprobacion: ahoraIso, enlaceComprobacionOk: resultado.ok },
      hoy
    );
    estrategiasPorId.set(resultado.herramientaId, actualizada);
    await guardarEstrategiaAfiliacion(actualizada, { usuario: verificacion.usuario, motivo: "Comprobación automática de enlaces" });
  }

  return NextResponse.json({ ok: true, resultados });
}
