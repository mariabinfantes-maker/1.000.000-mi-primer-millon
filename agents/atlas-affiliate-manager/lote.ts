import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";
import {
  esEstadoAfiliacionValido,
  fusionarEstrategiaAfiliacion,
  generarIdCuenta,
  type CambiosCuentaAfiliado,
} from "./estrategiaAfiliacion";

/**
 * Actualización por lotes de `EstrategiaAfiliacion` — necesaria a partir de
 * que el catálogo crece hacia ~100 herramientas: actualizar una cuenta a la
 * vez por CLI deja de ser manejable a ese volumen. Lógica pura, separada
 * del CLI (`cli-actualizar-estrategia-afiliacion.ts`), mismo patrón que
 * `agents/atlas-researcher/lote.ts`/`cli-lote.ts`: cada fila se resuelve de
 * forma independiente y se reporta su propio éxito o fallo, un error en una
 * fila nunca aborta el resto del lote.
 *
 * Cada entrada refleja exactamente los mismos campos que ya acepta el CLI
 * de una cuenta a la vez — mismo vocabulario, para que una hoja de cálculo
 * exportada a JSON o un CLI de una sola cuenta produzcan filas
 * intercambiables.
 */

export type EntradaLoteEstrategia = {
  id: string;
  cuenta?: string;
  estado?: string;
  plataforma?: string;
  nombrePrograma?: string;
  urlSolicitud?: string;
  usuarioRegistro?: string;
  fechaSolicitud?: string;
  fechaAprobacion?: string;
  comision?: string;
  cookie?: string;
  metodoPago?: string;
  frecuenciaPago?: string;
  enlace?: string;
  segmento?: string;
  notas?: string;
  requisitos?: string;
  borrador?: string;
};

export type ResultadoFilaLote =
  | { fila: number; id: string; cuentaId: string; ok: true; estadoFinal: string }
  | { fila: number; id: string; ok: false; error: string };

/**
 * Traduce una `EntradaLoteEstrategia` (vocabulario del lote) a
 * `CambiosCuentaAfiliado` (vocabulario interno de `fusionarEstrategiaAfiliacion`)
 * — misma correspondencia de nombres que ya usa el CLI de una cuenta.
 */
function aCambios(entrada: EntradaLoteEstrategia): CambiosCuentaAfiliado {
  return {
    estado: entrada.estado as CambiosCuentaAfiliado["estado"],
    nombrePrograma: entrada.nombrePrograma,
    plataforma: entrada.plataforma,
    urlSolicitud: entrada.urlSolicitud,
    usuarioRegistro: entrada.usuarioRegistro,
    fechaSolicitud: entrada.fechaSolicitud,
    fechaAprobacion: entrada.fechaAprobacion,
    comision: entrada.comision,
    duracionCookie: entrada.cookie,
    metodoPago: entrada.metodoPago,
    frecuenciaPago: entrada.frecuenciaPago,
    enlaceUrl: entrada.enlace,
    segmentoEnlace: entrada.segmento,
    observaciones: entrada.notas,
    requisitosPrograma: entrada.requisitos,
    borradorSolicitud: entrada.borrador,
  };
}

/**
 * Aplica un lote de entradas, una por una y en orden (no en paralelo — cada
 * fila espera a que la anterior termine de escribir, para no saturar el
 * pool de conexiones a Postgres con ~100 escrituras simultáneas).
 * `obtenerExistente` y `guardar` se inyectan (mismo patrón de dependencias
 * que `investigarHerramienta` con `ProveedorIA`) para poder probar toda la
 * lógica sin tocar Postgres — el CLI real le pasa
 * `getEstrategiaAfiliacion`/`guardarEstrategiaAfiliacion`.
 */
export async function aplicarLoteEstrategia(
  entradas: EntradaLoteEstrategia[],
  obtenerExistente: (id: string) => Promise<EstrategiaAfiliacion | undefined>,
  guardar: (estrategia: EstrategiaAfiliacion) => Promise<void>,
  hoy: string
): Promise<ResultadoFilaLote[]> {
  const resultados: ResultadoFilaLote[] = [];

  for (const [indice, entrada] of entradas.entries()) {
    const fila = indice + 1;

    if (!entrada.id || entrada.id.trim() === "") {
      resultados.push({ fila, id: entrada.id ?? "", ok: false, error: "Falta 'id' (herramientaId) en esta fila." });
      continue;
    }

    if (entrada.estado !== undefined && !esEstadoAfiliacionValido(entrada.estado)) {
      resultados.push({
        fila,
        id: entrada.id,
        ok: false,
        error: `estado inválido: "${entrada.estado}". Debe ser uno de: no_solicitado, pendiente, aprobado, rechazado, activo.`,
      });
      continue;
    }

    try {
      const cuentaId = entrada.cuenta ?? (entrada.plataforma ? generarIdCuenta(entrada.plataforma) : "principal");
      const existente = await obtenerExistente(entrada.id);
      const actualizada = fusionarEstrategiaAfiliacion(entrada.id, cuentaId, existente, aCambios(entrada), hoy);
      await guardar(actualizada);

      const cuenta = actualizada.cuentas.find((c) => c.id === cuentaId)!;
      resultados.push({ fila, id: entrada.id, cuentaId, ok: true, estadoFinal: cuenta.estado });
    } catch (error) {
      resultados.push({ fila, id: entrada.id, ok: false, error: error instanceof Error ? error.message : "Error desconocido." });
    }
  }

  return resultados;
}
