import { NextResponse } from "next/server";
import { getHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { getAffiliateData } from "@/data/repositorioAfiliados";
import { fusionarEstrategiaAfiliacion } from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import { generarBorradorSolicitud } from "@/agents/atlas-affiliate-manager/borradorSolicitud";
import { crearProveedorGemini } from "@/agents/compartido/proveedores/gemini";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/** Dispara la redacción de IA del borrador de solicitud y lo guarda — nunca lo envía. */
export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: { herramientaId?: string; cuentaId?: string; nombrePrograma?: string; requisitosPrograma?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!cuerpo.herramientaId) return NextResponse.json({ error: "Falta herramientaId." }, { status: 400 });

  const herramienta = getHerramienta(cuerpo.herramientaId);
  if (!herramienta) return NextResponse.json({ error: "Herramienta no encontrada en el catálogo real." }, { status: 404 });

  const resultado = await generarBorradorSolicitud(
    {
      nombreHerramienta: herramienta.nombre,
      nombrePrograma: cuerpo.nombrePrograma,
      requisitosPrograma: cuerpo.requisitosPrograma,
    },
    crearProveedorGemini()
  );
  if (!resultado.ok) return NextResponse.json({ error: resultado.error }, { status: 502 });

  const cuentaId = cuerpo.cuentaId ?? "principal";
  const existente = getEstrategiaAfiliacion(cuerpo.herramientaId);
  const hoy = new Date().toISOString().slice(0, 10);

  // Misma siembra que en /requisitos: si la cuenta es nueva, conserva el
  // nombre real del programa en vez de dejar la columna "Programa" del
  // panel con el id de cuenta genérico.
  const cuentaYaExistia = existente?.cuentas.some((c) => c.id === cuentaId) ?? false;
  const datosAfiliados = cuentaYaExistia ? undefined : getAffiliateData(cuerpo.herramientaId);

  const actualizada = fusionarEstrategiaAfiliacion(
    cuerpo.herramientaId,
    cuentaId,
    existente,
    {
      borradorSolicitud: resultado.borrador,
      nombrePrograma: cuentaYaExistia ? undefined : (cuerpo.nombrePrograma ?? datosAfiliados?.affiliateProgramName),
      plataforma: cuentaYaExistia ? undefined : datosAfiliados?.affiliatePlatform,
    },
    hoy
  );
  guardarEstrategiaAfiliacion(actualizada);

  return NextResponse.json({ ok: true, borrador: resultado.borrador });
}
