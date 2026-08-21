import { NextResponse } from "next/server";
import { validarClic, type CuerpoClic } from "@/lib/analitica/validarClic";
import { obtenerProveedorAnalitica } from "@/lib/analitica/proveedorActivo";

/**
 * Recibe el seguimiento de clics salientes (ver `BotonIrAlProveedor.tsx`,
 * que envía aquí un `navigator.sendBeacon` justo antes de navegar). Capa
 * delgada, mismo patrón que `/api/suscribir`: valida, delega, responde.
 *
 * `sendBeacon` no lee la respuesta ni espera a que termine, así que el
 * cuerpo de la respuesta no importa — pero la ruta igualmente valida y
 * traduce errores a códigos HTTP correctos, por higiene y para que quede
 * auditable en los logs si algo llega mal formado.
 */
export async function POST(request: Request) {
  let cuerpo: CuerpoClic;
  try {
    cuerpo = (await request.json()) as CuerpoClic;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la petición no es un JSON válido." }, { status: 400 });
  }

  const validacion = validarClic(cuerpo);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }

  await obtenerProveedorAnalitica().registrarClic(validacion.evento);

  return NextResponse.json({ ok: true });
}
