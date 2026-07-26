import fs from "node:fs";
import path from "node:path";
import type { AffiliateData } from "./esquemaInterno";

/**
 * Capa de acceso a los datos INTERNOS de afiliación de Atlas.
 *
 * Deliberadamente independiente de `data/repositorio.ts` (el catálogo
 * público): nada de lo que hay aquí debe importarse desde componentes de
 * interfaz, el motor de recomendaciones (`lib/recommendationEngine`), ni
 * ninguna ruta que sirva contenido al usuario final. Es de uso exclusivo
 * de los agentes internos de Atlas — hoy, Atlas Researcher — y de futuras
 * herramientas de administración.
 *
 * Lee de `data/afiliados/{herramientaId}.json`, un directorio de datos
 * distinto de `data/herramientas/`, para que la separación sea estructural
 * y no dependa de que nadie recuerde "no leer ese campo".
 *
 * Solo debe importarse desde código de servidor: usa `node:fs`.
 */

const DIR_AFILIADOS = path.join(process.cwd(), "data", "afiliados");

/** Los datos de afiliación de una herramienta, o `undefined` si todavía no se han investigado. */
export function getAffiliateData(herramientaId: string): AffiliateData | undefined {
  const ruta = path.join(DIR_AFILIADOS, `${herramientaId}.json`);
  if (!fs.existsSync(ruta)) return undefined;
  const contenido = fs.readFileSync(ruta, "utf-8");
  return JSON.parse(contenido) as AffiliateData;
}

/** Todos los datos de afiliación disponibles. Para paneles internos o scripts de auditoría, nunca para servir contenido al usuario final. */
export function getTodosLosDatosDeAfiliados(): AffiliateData[] {
  if (!fs.existsSync(DIR_AFILIADOS)) return [];
  const archivos = fs.readdirSync(DIR_AFILIADOS).filter((archivo) => archivo.endsWith(".json"));
  return archivos.map(
    (archivo) => JSON.parse(fs.readFileSync(path.join(DIR_AFILIADOS, archivo), "utf-8")) as AffiliateData
  );
}
