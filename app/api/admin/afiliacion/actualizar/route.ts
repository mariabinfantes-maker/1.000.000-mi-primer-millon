import { NextResponse } from "next/server";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
import { getAffiliateData } from "@/data/repositorioAfiliados";
import {
  esEstadoAfiliacionValido,
  fusionarEstrategiaAfiliacion,
  generarIdCuenta,
  type CambiosCuentaAfiliado,
} from "@/agents/atlas-affiliate-manager/estrategiaAfiliacion";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Edición manual desde el panel: cambiar estado, guardar el enlace
 * aprobado, corregir requisitos/borrador generados por IA, o crear la
 * primera cuenta de una herramienta que hoy no tiene ninguna. Misma
 * función pura que ya usa el CLI (`fusionarEstrategiaAfiliacion`) — el
 * panel no reimplementa ninguna lógica, solo le da una interfaz visual.
 */

type CuerpoActualizar = {
  herramientaId: string;
  cuentaId?: string;
  plataforma?: string;
  estado?: string;
  nombrePrograma?: string;
  urlSolicitud?: string;
  usuarioRegistro?: string;
  fechaSolicitud?: string;
  fechaAprobacion?: string;
  comision?: string;
  duracionCookie?: string;
  metodoPago?: string;
  frecuenciaPago?: string;
  enlaceUrl?: string;
  segmentoEnlace?: string;
  requisitosPrograma?: string;
  borradorSolicitud?: string;
  observaciones?: string;
};

export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: CuerpoActualizar;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido." }, { status: 400 });
  }

  if (!cuerpo.herramientaId || cuerpo.herramientaId.trim() === "") {
    return NextResponse.json({ error: "Falta herramientaId." }, { status: 400 });
  }

  if (cuerpo.estado !== undefined && !esEstadoAfiliacionValido(cuerpo.estado)) {
    return NextResponse.json({ error: `estado inválido: "${cuerpo.estado}".` }, { status: 400 });
  }

  const cuentaId = cuerpo.cuentaId ?? (cuerpo.plataforma ? generarIdCuenta(cuerpo.plataforma) : "principal");

  // Al crear la cuenta por primera vez, sin plataforma/nombrePrograma
  // explícitos en la petición (el panel no siempre los manda — p. ej. al
  // editar solo el enlace o los requisitos), se siembran con lo que ya
  // investigó Researcher en vez de dejar la columna "Programa" del panel
  // con el id de cuenta genérico ("principal"). Nunca pisa un valor ya
  // guardado en una cuenta existente.
  const existente = getEstrategiaAfiliacion(cuerpo.herramientaId);
  const cuentaYaExistia = existente?.cuentas.some((c) => c.id === cuentaId) ?? false;
  const datosAfiliados = cuentaYaExistia || cuerpo.plataforma || cuerpo.nombrePrograma ? undefined : getAffiliateData(cuerpo.herramientaId);

  const cambios: CambiosCuentaAfiliado = {
    estado: cuerpo.estado as CambiosCuentaAfiliado["estado"],
    plataforma: cuerpo.plataforma ?? datosAfiliados?.affiliatePlatform,
    nombrePrograma: cuerpo.nombrePrograma ?? datosAfiliados?.affiliateProgramName,
    urlSolicitud: cuerpo.urlSolicitud,
    usuarioRegistro: cuerpo.usuarioRegistro,
    fechaSolicitud: cuerpo.fechaSolicitud,
    fechaAprobacion: cuerpo.fechaAprobacion,
    comision: cuerpo.comision,
    duracionCookie: cuerpo.duracionCookie,
    metodoPago: cuerpo.metodoPago,
    frecuenciaPago: cuerpo.frecuenciaPago,
    enlaceUrl: cuerpo.enlaceUrl,
    segmentoEnlace: cuerpo.segmentoEnlace,
    requisitosPrograma: cuerpo.requisitosPrograma,
    borradorSolicitud: cuerpo.borradorSolicitud,
    observaciones: cuerpo.observaciones,
  };

  const hoy = new Date().toISOString().slice(0, 10);
  const actualizada = fusionarEstrategiaAfiliacion(cuerpo.herramientaId, cuentaId, existente, cambios, hoy);
  guardarEstrategiaAfiliacion(actualizada);

  return NextResponse.json({ ok: true, cuentaId });
}
