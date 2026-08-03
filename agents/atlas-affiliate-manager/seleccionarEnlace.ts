import type { CuentaAfiliado } from "@/data/esquemaInterno";

/**
 * Único punto del sistema que decide qué enlace de afiliado propio de Atlas
 * se usa en producción. El redirect "Ir al proveedor" (y cualquier pieza
 * futura que necesite lo mismo) solo llama a esta función — nunca lee
 * `cuentas`/`enlaces` directamente. Así, añadir una cuenta, rotar un
 * enlace o abrir un segmento de país/idioma nuevo nunca exige tocar nada
 * más del sistema.
 *
 * Solo considera cuentas con `estado === "activo"`: una cuenta pendiente,
 * rechazada o no solicitada nunca debe generar tráfico de afiliado. Entre
 * las cuentas activas, busca primero un enlace para el segmento exacto
 * pedido y, si no lo hay, cae al segmento "global". Sin ninguna
 * coincidencia, devuelve `undefined` — quien llame decide el respaldo (hoy,
 * la URL pública oficial de la herramienta).
 */

export const SEGMENTO_GLOBAL = "global";

export function elegirEnlaceAfiliado(cuentas: CuentaAfiliado[], segmento: string): string | undefined {
  const activas = cuentas.filter((cuenta) => cuenta.estado === "activo");

  const porSegmento = buscarEnlacePorSegmento(activas, segmento);
  if (porSegmento) return porSegmento;

  if (segmento === SEGMENTO_GLOBAL) return undefined;
  return buscarEnlacePorSegmento(activas, SEGMENTO_GLOBAL);
}

function buscarEnlacePorSegmento(cuentas: CuentaAfiliado[], segmento: string): string | undefined {
  for (const cuenta of cuentas) {
    const enlace = cuenta.enlaces.find((e) => e.segmento === segmento);
    if (enlace) return enlace.url;
  }
  return undefined;
}
