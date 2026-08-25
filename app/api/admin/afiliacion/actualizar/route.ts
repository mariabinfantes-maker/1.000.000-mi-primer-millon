import { NextResponse } from "next/server";
import { getEstrategiaAfiliacion, guardarEstrategiaAfiliacion } from "@/data/repositorioEstrategiaAfiliacion";
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

  const cambios: CambiosCuentaAfiliado = {
    estado: cuerpo.estado as CambiosCuentaAfiliado["estado"],
    plataforma: cuerpo.plataforma,
    nombrePrograma: cuerpo.nombrePrograma,
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

  const existente = getEstrategiaAfiliacion(cuerpo.herramientaId);
  const hoy = new Date().toISOString().slice(0, 10);
  const actualizada = fusionarEstrategiaAfiliacion(cuerpo.herramientaId, cuentaId, existente, cambios, hoy);
  guardarEstrategiaAfiliacion(actualizada);

  return NextResponse.json({ ok: true, cuentaId });
}
