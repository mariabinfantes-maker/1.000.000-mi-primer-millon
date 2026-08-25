import { NextResponse } from "next/server";
import { restaurarValorHistorial } from "@/data/repositorioEstrategiaAfiliacion";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Restaura el valor anterior de un evento de historial concreto. Nunca
 * modifica el evento original (la base de datos lo impide) — genera un
 * evento NUEVO documentando la restauración, ver
 * `data/repositorioEstrategiaAfiliacion.ts`.
 */
export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: { idEvento?: number };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (typeof cuerpo.idEvento !== "number") {
    return NextResponse.json({ error: "Falta idEvento (número)." }, { status: 400 });
  }

  try {
    const restaurada = await restaurarValorHistorial(cuerpo.idEvento, { usuario: verificacion.usuario });
    return NextResponse.json({ ok: true, estrategia: restaurada });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido." }, { status: 400 });
  }
}
