import fs from "node:fs";
import path from "node:path";
import type { EstrategiaAfiliacion } from "./esquemaInterno";

/**
 * Capa de acceso a la ESTRATEGIA de afiliación de Atlas — la relación real
 * y propia de Atlas con cada programa de afiliados (ver el comentario de
 * `EstrategiaAfiliacion` en `esquemaInterno.ts` para la diferencia con
 * `AffiliateData`/`repositorioAfiliados.ts`).
 *
 * Lee y escribe `data/estrategia-afiliados/{herramientaId}.json` — un
 * directorio propio, hermano de `data/afiliados/` pero nunca el mismo:
 * ninguna re-investigación debe poder pisar este archivo.
 *
 * A diferencia de `repositorio.ts`/`repositorioAfiliados.ts` (solo
 * lectura, pensados para servir la app), este repositorio también
 * escribe: la estrategia de afiliación la actualiza un humano con el
 * tiempo (`agents/atlas-affiliate-manager/cli-actualizar-estrategia-afiliacion.ts`),
 * no una investigación puntual.
 *
 * `dirBase` es un parámetro de pruebas UNITARIAS (Vitest) — cada test lo
 * apunta a un directorio temporal propio.
 *
 * Protección fail-closed contra pruebas E2E/Playwright (que no pueden
 * pasar `dirBase` porque llaman a la API real por HTTP, no a esta función
 * directamente — ver `MOLNIP_E2E` más abajo): si `MOLNIP_E2E=true`,
 * `ESTRATEGIA_AFILIACION_DIR` es OBLIGATORIO y debe apuntar fuera del
 * directorio real — sin las dos condiciones, lanza en vez de escribir en
 * silencio sobre datos reales. Un incidente real de esta sesión (Sprint
 * 1B: un archivo de prueba escribió sobre `grammarly.json`/`monday-com.json`
 * reales) es la razón directa de esta protección.
 */

const DIR_REAL = path.join(process.cwd(), "data", "estrategia-afiliados");

function resolverDir(dirBaseExplicito?: string): string {
  if (dirBaseExplicito) return dirBaseExplicito;

  if (process.env.MOLNIP_E2E === "true") {
    const dirPrueba = process.env.ESTRATEGIA_AFILIACION_DIR;
    if (!dirPrueba) {
      throw new Error(
        "MOLNIP_E2E=true exige ESTRATEGIA_AFILIACION_DIR configurado — protección contra escribir en data/estrategia-afiliados real durante pruebas E2E."
      );
    }
    const resuelto = path.resolve(dirPrueba);
    if (resuelto === DIR_REAL) {
      throw new Error("ESTRATEGIA_AFILIACION_DIR no puede apuntar al directorio real de datos durante pruebas E2E.");
    }
    return resuelto;
  }

  return DIR_REAL;
}

/** La estrategia de afiliación de una herramienta, o `undefined` si todavía no se ha empezado a gestionar. */
export function getEstrategiaAfiliacion(
  herramientaId: string,
  opciones: { dirBase?: string } = {}
): EstrategiaAfiliacion | undefined {
  const dir = resolverDir(opciones.dirBase);
  const ruta = path.join(dir, `${herramientaId}.json`);
  if (!fs.existsSync(ruta)) return undefined;
  return JSON.parse(fs.readFileSync(ruta, "utf-8")) as EstrategiaAfiliacion;
}

/** Todas las estrategias de afiliación gestionadas hasta ahora. Para paneles internos o auditorías, nunca para el usuario final. */
export function getTodasLasEstrategiasAfiliacion(opciones: { dirBase?: string } = {}): EstrategiaAfiliacion[] {
  const dir = resolverDir(opciones.dirBase);
  if (!fs.existsSync(dir)) return [];
  const archivos = fs.readdirSync(dir).filter((archivo) => archivo.endsWith(".json"));
  return archivos.map(
    (archivo) => JSON.parse(fs.readFileSync(path.join(dir, archivo), "utf-8")) as EstrategiaAfiliacion
  );
}

/** Escribe (crea o sobrescribe por completo) la estrategia de afiliación de una herramienta. */
export function guardarEstrategiaAfiliacion(estrategia: EstrategiaAfiliacion, opciones: { dirBase?: string } = {}): void {
  const dir = resolverDir(opciones.dirBase);
  fs.mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, `${estrategia.herramientaId}.json`);
  fs.writeFileSync(ruta, `${JSON.stringify(estrategia, null, 2)}\n`, "utf-8");
}
