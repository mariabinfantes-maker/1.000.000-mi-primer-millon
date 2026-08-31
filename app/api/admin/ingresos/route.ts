import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_SESION } from "@/lib/admin/cookies";
import { verificarTokenSesion } from "@/lib/admin/sesion";
import { anotarIngreso, ESTADOS_INGRESO, type EstadoIngreso } from "@/agents/atlas-revenue/repositorio";
import { validarAsientoIngreso } from "@/agents/atlas-revenue/validarIngreso";

/**
 * Anota lo que ha comunicado un panel de afiliación.
 *
 * Es una entrada MANUAL a propósito: nadie conecta con las APIs de los
 * programas, así que la cifra que entra aquí es la que la propietaria ha
 * leído en su panel. Por eso queda registrada con su usuario y en una tabla
 * append-only — corregirla crea un asiento nuevo, nunca reescribe el anterior.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sesion = verificarTokenSesion(cookieStore.get(COOKIE_SESION)?.value);
  if (!sesion) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const validacion = validarAsientoIngreso(cuerpo);
  if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });

  try {
    await anotarIngreso(validacion.asiento, { usuario: sesion.usuario });
  } catch {
    return NextResponse.json({ error: "No se ha podido guardar el apunte." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estados: ESTADOS_INGRESO satisfies readonly EstadoIngreso[] });
}
