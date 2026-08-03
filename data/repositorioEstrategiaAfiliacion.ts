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
 * tiempo (`agents/atlas-researcher/cli-actualizar-estrategia-afiliacion.ts`),
 * no una investigación puntual.
 *
 * `dirBase` es un parámetro de pruebas: en producción siempre es
 * `data/estrategia-afiliados`, pero los tests lo apuntan a un directorio
 * temporal para no escribir en el repositorio real al verificar este
 * módulo.
 */

const DIR_POR_DEFECTO = path.join(process.cwd(), "data", "estrategia-afiliados");

/** La estrategia de afiliación de una herramienta, o `undefined` si todavía no se ha empezado a gestionar. */
export function getEstrategiaAfiliacion(
  herramientaId: string,
  opciones: { dirBase?: string } = {}
): EstrategiaAfiliacion | undefined {
  const dir = opciones.dirBase ?? DIR_POR_DEFECTO;
  const ruta = path.join(dir, `${herramientaId}.json`);
  if (!fs.existsSync(ruta)) return undefined;
  return JSON.parse(fs.readFileSync(ruta, "utf-8")) as EstrategiaAfiliacion;
}

/** Todas las estrategias de afiliación gestionadas hasta ahora. Para paneles internos o auditorías, nunca para el usuario final. */
export function getTodasLasEstrategiasAfiliacion(opciones: { dirBase?: string } = {}): EstrategiaAfiliacion[] {
  const dir = opciones.dirBase ?? DIR_POR_DEFECTO;
  if (!fs.existsSync(dir)) return [];
  const archivos = fs.readdirSync(dir).filter((archivo) => archivo.endsWith(".json"));
  return archivos.map(
    (archivo) => JSON.parse(fs.readFileSync(path.join(dir, archivo), "utf-8")) as EstrategiaAfiliacion
  );
}

/** Escribe (crea o sobrescribe por completo) la estrategia de afiliación de una herramienta. */
export function guardarEstrategiaAfiliacion(estrategia: EstrategiaAfiliacion, opciones: { dirBase?: string } = {}): void {
  const dir = opciones.dirBase ?? DIR_POR_DEFECTO;
  fs.mkdirSync(dir, { recursive: true });
  const ruta = path.join(dir, `${estrategia.herramientaId}.json`);
  fs.writeFileSync(ruta, `${JSON.stringify(estrategia, null, 2)}\n`, "utf-8");
}
