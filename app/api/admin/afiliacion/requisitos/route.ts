import { NextResponse } from "next/server";
import { getHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { fusionarEstrategiaAfiliacion } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import { investigarRequisitosPrograma } from "@/agents/atlas-affiliate-manager/requisitos";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/** Dispara el prechequeo de IA de requisitos y guarda el resultado — nunca decide si el programa existe, eso ya lo hizo Researcher. */
export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: { herramientaId?: string; cuentaId?: string; nombrePrograma?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!cuerpo.herramientaId) return NextResponse.json({ error: "Falta herramientaId." }, { status: 400 });

  const herramienta = getHerramienta(cuerpo.herramientaId);
  if (!herramienta) return NextResponse.json({ error: "Herramienta no encontrada en el catálogo real." }, { status: 404 });

  const resultado = await investigarRequisitosPrograma(herramienta.nombre, cuerpo.nombrePrograma, crearProveedorGemini());
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 502 });

  const cuentaId = cuerpo.cuentaId ?? "principal";
  const existente = getEstrategiaAfiliacion(cuerpo.herramientaId);
  const hoy = new Date().toISOString().slice(0, 10);
  const actualizada = fusionarEstrategiaAfiliacion(
    cuerpo.herramientaId,
    cuentaId,
    existente,
    { requisitosPrograma: resultado.requisitos },
    hoy
  );
  guardarEstrategiaAfiliacion(actualizada);

  return NextResponse.json({ ok: true, requisitos: resultado.requisitos });
}
