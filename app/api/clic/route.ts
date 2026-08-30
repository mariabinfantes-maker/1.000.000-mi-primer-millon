import { NextResponse } from "next/server";
import { validarClic, type CuerpoClic } from "@/lib/analitica/validarClic";
import { getCategorias, getProblemas } from "@/data/repositorio";
import { SUBTIPOS_POR_CATEGORIA } from "@/data/taxonomia";
import { construirIdentificadoresValidos, esRutaConocida } from "@/agents/atlas-revenue/rutaOrigen";
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

  // La etiqueta de recorrido es el único texto libre que llega del navegador
  // hasta la tabla. Aquí se contrasta contra el catálogo real: solo se guarda
  // si su identificador existe de verdad. Una prueba demostró que la
  // comprobación de forma no bastaba — 32 caracteres hexadecimales, que es la
  // pinta de un identificador de sesión, encajaban perfectamente en el
  // formato de slug.
  const evento = { ...validacion.evento };
  if (evento.rutaOrigen && !esRutaConocida(evento.rutaOrigen, await identificadoresDelCatalogo())) {
    delete evento.rutaOrigen;
  }

  await obtenerProveedorAnalitica().registrarClic(evento);

  return NextResponse.json({ ok: true });
}

/** Qué identificadores pueden aparecer en una etiqueta de recorrido, según el catálogo de hoy. */
async function identificadoresDelCatalogo(): Promise<ReadonlySet<string>> {
  return construirIdentificadoresValidos({
    objetivos: (await getProblemas()).map((p) => p.id),
    categorias: (await getCategorias()).map((c) => c.id),
    subtipos: Object.values(SUBTIPOS_POR_CATEGORIA).flat().map((s) => s.id),
  });
}
