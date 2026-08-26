import { NextResponse } from "next/server";
import { getHerramienta } from "@/data/repositorio";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { getAffiliateData } from "@/data/repositorioAfiliados";
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
  const existente = await getEstrategiaAfiliacion(cuerpo.herramientaId);
  const hoy = new Date().toISOString().slice(0, 10);

  // Al crear la cuenta por primera vez (todavía no existía), se siembra
  // nombrePrograma/plataforma con lo que ya investigó Researcher — sin
  // esto, la columna "Programa" del panel pasaba de mostrar el nombre real
  // (leído de AffiliateData mientras no había cuenta) a mostrar el id de
  // cuenta genérico ("principal") en cuanto se guardaba cualquier campo.
  // Solo se siembra si la cuenta es nueva: no pisa un nombre ya corregido
  // a mano en una cuenta existente.
  const cuentaYaExistia = existente?.cuentas.some((c) => c.id === cuentaId) ?? false;
  const datosAfiliados = cuentaYaExistia ? undefined : getAffiliateData(cuerpo.herramientaId);

  const actualizada = fusionarEstrategiaAfiliacion(
    cuerpo.herramientaId,
    cuentaId,
    existente,
    {
      requisitosPrograma: resultado.requisitos,
      nombrePrograma: cuentaYaExistia ? undefined : (cuerpo.nombrePrograma ?? datosAfiliados?.affiliateProgramName),
      plataforma: cuentaYaExistia ? undefined : datosAfiliados?.affiliatePlatform,
    },
    hoy
  );
  await guardarEstrategiaAfiliacion(actualizada, { usuario: verificacion.usuario });

  return NextResponse.json({ ok: true, requisitos: resultado.requisitos });
}
