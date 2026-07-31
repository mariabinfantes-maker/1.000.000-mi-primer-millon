import fs from "node:fs";
import path from "node:path";
import type { AffiliateData } from "@/data/esquemaInterno";
import type { Herramienta } from "@/data/esquema";
import type { HerramientaPropuesta } from "./tipos";

/**
 * Zona de borradores (etapa 5 del pipeline por lotes).
 *
 * Escribe la propuesta ya investigada como dos archivos JSON en
 * `data/borradores/`, con la MISMA separación público/interno que el
 * catálogo real (`herramientas/` vs `afiliados/`) — pero nunca en
 * `data/herramientas/` ni `data/afiliados/` directamente. Pasar un borrador
 * al catálogo real es responsabilidad exclusiva de `promover.ts`, un paso
 * aparte y explícito (ver Sheet 02 del documento de arquitectura).
 *
 * `dirBase` es un parámetro de pruebas: en producción siempre es
 * `data/borradores`, pero los tests lo apuntan a un directorio temporal
 * para no escribir en el repositorio real al verificar este módulo.
 */

const DIR_BORRADORES_POR_DEFECTO = path.join(process.cwd(), "data", "borradores");

function rutasBorrador(dirBase: string) {
  return {
    dirHerramientas: path.join(dirBase, "herramientas"),
    dirAfiliados: path.join(dirBase, "afiliados"),
  };
}

export type BorradorEscrito = {
  id: string;
  rutaHerramienta: string;
  rutaAfiliados: string;
};

/**
 * Escribe el borrador de una propuesta ya aceptada (ha pasado el
 * prechequeo y la investigación completa) bajo el `id` indicado.
 *
 * Estampa aquí los campos que gestiona Atlas y que la investigación nunca
 * rellena (`id`, `estado`, `fechaAltaEnAtlas`, `fechaUltimaRevision` en el
 * lado público; `herramientaId` en el lado de afiliación) — el resto de la
 * propuesta se escribe tal cual la devolvió `validarPropuesta`, huecos
 * incluidos: un borrador incompleto es exactamente lo que debe revisar un
 * humano antes de promoverlo, no algo que este módulo deba rellenar.
 */
export function escribirBorrador(
  id: string,
  propuesta: HerramientaPropuesta,
  opciones: { dirBase?: string } = {}
): BorradorEscrito {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const { dirHerramientas, dirAfiliados } = rutasBorrador(dirBase);

  fs.mkdirSync(dirHerramientas, { recursive: true });
  fs.mkdirSync(dirAfiliados, { recursive: true });

  const hoy = new Date().toISOString().slice(0, 10);

  const datos: Partial<Herramienta> = {
    ...propuesta.datos,
    id,
    estado: "en_revision",
    fechaAltaEnAtlas: propuesta.datos.fechaAltaEnAtlas ?? hoy,
    fechaUltimaRevision: hoy,
  };

  const datosAfiliados: Partial<AffiliateData> = {
    ...propuesta.datosAfiliados,
    herramientaId: id,
  };

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);

  fs.writeFileSync(rutaHerramienta, `${JSON.stringify(datos, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaAfiliados, `${JSON.stringify(datosAfiliados, null, 2)}\n`, "utf-8");

  return { id, rutaHerramienta, rutaAfiliados };
}

/** ¿Ya hay un borrador escrito con este id? Para que `lote.ts` decida si sobrescribirlo o saltarlo. */
export function borradorYaExiste(id: string, opciones: { dirBase?: string } = {}): boolean {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const { dirHerramientas } = rutasBorrador(dirBase);
  return fs.existsSync(path.join(dirHerramientas, `${id}.json`));
}

/** Todos los ids con borrador pendiente de revisión. Para `promover.ts` y para paneles internos futuros. */
export function listarIdsBorradores(opciones: { dirBase?: string } = {}): string[] {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const { dirHerramientas } = rutasBorrador(dirBase);
  if (!fs.existsSync(dirHerramientas)) return [];
  return fs
    .readdirSync(dirHerramientas)
    .filter((archivo) => archivo.endsWith(".json"))
    .map((archivo) => archivo.replace(/\.json$/, ""));
}

/** Lee un borrador ya escrito. Sin validar contra el esquema: eso es trabajo de `promover.ts` al intentar darlo de alta en el catálogo real. */
export function leerBorrador(
  id: string,
  opciones: { dirBase?: string } = {}
): { datos: unknown; datosAfiliados: unknown } | undefined {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const { dirHerramientas, dirAfiliados } = rutasBorrador(dirBase);

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  if (!fs.existsSync(rutaHerramienta)) return undefined;

  const datos = JSON.parse(fs.readFileSync(rutaHerramienta, "utf-8"));
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);
  const datosAfiliados = fs.existsSync(rutaAfiliados) ? JSON.parse(fs.readFileSync(rutaAfiliados, "utf-8")) : {};

  return { datos, datosAfiliados };
}
