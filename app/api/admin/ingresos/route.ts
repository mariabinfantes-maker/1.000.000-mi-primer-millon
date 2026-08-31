import { NextResponse } from "next/server";
import { verificarPeticionAdmin } from "@/lib/admin/verificarPeticion";
import { anotarIngreso, ESTADOS_INGRESO, type EstadoIngreso } from "@/agents/atlas-revenue/repositorio";
import { validarAsientoIngreso } from "@/agents/atlas-revenue/validarIngreso";

/**
 * Anota lo que ha comunicado un panel de afiliación.
 *
 * Es una entrada MANUAL a propósito: nadie conecta con las APIs de los
 * programas, así que la cifra que entra aquí es la que la propietaria ha
 * leído en su panel. Por eso queda registrada con su usuario y en una tabla
 * append-only — corregirla crea un asiento nuevo, nunca reescribe el anterior.
 *
 * Usa `verificarPeticionAdmin` como el resto de /api/admin, y no solo la
 * cookie de sesión: eso añade la comprobación del token CSRF. La cookie es
 * `sameSite: "strict"`, así que una petición desde otro sitio no la llevaría
 * y el agujero no era explotable — pero esta era la única ruta que dependía
 * de una sola capa, y sobre una tabla que no admite correcciones. Detectado
 * al revisar las protecciones antes de desplegar, con una prueba que recorre
 * el directorio en vez de una lista escrita a mano.
 */
export async function POST(request: Request) {
  const verificacion = verificarPeticionAdmin(request);
  if (!verificacion.ok) return NextResponse.json({ error: verificacion.motivo }, { status: 401 });

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const validacion = validarAsientoIngreso(cuerpo);
  if (!validacion.ok) return NextResponse.json({ error: validacion.error }, { status: 400 });

  try {
    await anotarIngreso(validacion.asiento, { usuario: verificacion.usuario });
  } catch {
    return NextResponse.json({ error: "No se ha podido guardar el apunte." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, estados: ESTADOS_INGRESO satisfies readonly EstadoIngreso[] });
}
