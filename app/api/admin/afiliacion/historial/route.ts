import { NextResponse } from "next/server";
import { getHistorialCambios, getHistorialGlobal } from "@/data/repositorioEstrategiaAfiliacion";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";

/**
 * Historial de cambios, más reciente primero — solo lectura.
 *
 * Sin parámetros devuelve el historial de todas las herramientas, con
 * búsqueda y paginación (lo que usa la pantalla de historial del panel).
 * Con `herramientaId` y `soloHerramienta=1` devuelve el historial completo
 * de esa herramienta sin paginar, que es como lo consultan las pruebas y
 * el detalle de una fila.
 */
export async function GET(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  const parametros = new URL(request.url).searchParams;
  const herramientaId = parametros.get("herramientaId") ?? undefined;

  if (herramientaId && parametros.get("soloHerramienta") === "1") {
    const historial = await getHistorialCambios(herramientaId);
    return NextResponse.json({ historial, total: historial.length });
  }

  const limiteCrudo = Number(parametros.get("limite"));
  const desplazamientoCrudo = Number(parametros.get("desplazamiento"));

  const { eventos, total } = await getHistorialGlobal({
    herramientaId,
    busqueda: parametros.get("busqueda") ?? undefined,
    limite: Number.isFinite(limiteCrudo) && limiteCrudo > 0 ? limiteCrudo : undefined,
    desplazamiento: Number.isFinite(desplazamientoCrudo) && desplazamientoCrudo > 0 ? desplazamientoCrudo : undefined,
  });

  // `historial` se mantiene como nombre del campo por compatibilidad con
  // quien ya consumía esta ruta antes de que existiera la paginación.
  return NextResponse.json({ historial: eventos, total });
}
