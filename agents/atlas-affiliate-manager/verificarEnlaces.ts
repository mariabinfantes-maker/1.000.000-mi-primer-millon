import type { EstrategiaAfiliacion } from "@/data/esquemaInterno";

/**
 * Verificación de que los enlaces de afiliado guardados siguen respondiendo
 * — carencia identificada en la auditoría de Affiliate Manager: un enlace
 * se guarda una vez y nunca se vuelve a comprobar, así que una cuenta
 * suspendida por el proveedor o una URL rota pasa desapercibida
 * indefinidamente. Puramente informativo, igual que `consistencia.ts`:
 * nunca modifica ni desactiva nada por su cuenta.
 *
 * `fetchImpl` se inyecta (mismo patrón que `ProveedorIA`) para poder probar
 * la lógica sin hacer peticiones de red reales.
 */

export type ResultadoVerificacionEnlace = {
  herramientaId: string;
  cuentaId: string;
  segmento: string;
  url: string;
  ok: boolean;
  estadoHttp?: number;
  error?: string;
};

const TIMEOUT_MS = 8000;

async function comprobarUrl(url: string, fetchImpl: typeof fetch): Promise<{ ok: boolean; estadoHttp?: number; error?: string }> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);

  try {
    // HEAD primero (más barato); algunas plataformas de afiliados no lo
    // soportan en su redirect, así que se cae a GET si HEAD no da un
    // código usable.
    let respuesta = await fetchImpl(url, { method: "HEAD", redirect: "follow", signal: controlador.signal });
    if (respuesta.status >= 400) {
      respuesta = await fetchImpl(url, { method: "GET", redirect: "follow", signal: controlador.signal });
    }
    return { ok: respuesta.status < 400, estadoHttp: respuesta.status };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error de red desconocido." };
  } finally {
    clearTimeout(temporizador);
  }
}

/** Comprueba, en paralelo, todos los enlaces guardados en cualquier cuenta de cualquier herramienta. */
export async function verificarEnlacesActivos(
  estrategias: EstrategiaAfiliacion[],
  fetchImpl: typeof fetch = fetch
): Promise<ResultadoVerificacionEnlace[]> {
  const tareas: Promise<ResultadoVerificacionEnlace>[] = [];

  for (const estrategia of estrategias) {
    for (const cuenta of estrategia.cuentas) {
      for (const enlace of cuenta.enlaces) {
        tareas.push(
          comprobarUrl(enlace.url, fetchImpl).then((resultado) => ({
            herramientaId: estrategia.herramientaId,
            cuentaId: cuenta.id,
            segmento: enlace.segmento,
            url: enlace.url,
            ...resultado,
          }))
        );
      }
    }
  }

  return Promise.all(tareas);
}
