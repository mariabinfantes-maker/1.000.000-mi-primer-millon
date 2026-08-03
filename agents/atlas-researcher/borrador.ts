import fs from "node:fs";
import path from "node:path";
import type { AffiliateData } from "@/data/esquemaInterno";
import type { Herramienta, NivelConfianza } from "@/data/esquema";
import type { HerramientaPropuesta } from "./tipos";

/**
 * Zona de borradores (etapa 5 del pipeline por lotes).
 *
 * Escribe la propuesta ya investigada como tres archivos JSON en
 * `data/borradores/`: `herramientas/` (público) y `afiliados/` (interno),
 * con la MISMA separación que el catálogo real — más `metadatos/`, propio
 * de esta zona de revisión, con la confianza y las fuentes de la
 * investigación para que Atlas sea auditable. Nada de esto se escribe nunca
 * en `data/herramientas/` ni `data/afiliados/` directamente: pasar un
 * borrador al catálogo real es responsabilidad exclusiva de `promover.ts`,
 * un paso aparte y explícito (ver Sheet 02 del documento de arquitectura).
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
    dirMetadatos: path.join(dirBase, "metadatos"),
  };
}

/**
 * Confianza global, fuentes citadas y advertencias de la investigación
 * original -- en un directorio propio, separado de `datos`/`datosAfiliados`,
 * porque no pertenecen ni al esquema público ni al interno de afiliados:
 * son metadatos DE LA REVISIÓN, para que Atlas sea auditable (qué fuentes
 * usó, qué tan fiable se consideró la propuesta), y `promover.ts` nunca los
 * copia al catálogo real.
 */
export type MetadatosBorrador = {
  confianza: NivelConfianza;
  fuentes: string[];
  advertencias: string[];
};

export type BorradorEscrito = {
  id: string;
  rutaHerramienta: string;
  rutaAfiliados: string;
  rutaMetadatos: string;
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
  const { dirHerramientas, dirAfiliados, dirMetadatos } = rutasBorrador(dirBase);

  fs.mkdirSync(dirHerramientas, { recursive: true });
  fs.mkdirSync(dirAfiliados, { recursive: true });
  fs.mkdirSync(dirMetadatos, { recursive: true });

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

  const metadatos: MetadatosBorrador = {
    confianza: propuesta.confianza,
    fuentes: propuesta.fuentes,
    advertencias: propuesta.advertencias,
  };

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);
  const rutaMetadatos = path.join(dirMetadatos, `${id}.json`);

  fs.writeFileSync(rutaHerramienta, `${JSON.stringify(datos, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaAfiliados, `${JSON.stringify(datosAfiliados, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaMetadatos, `${JSON.stringify(metadatos, null, 2)}\n`, "utf-8");

  return { id, rutaHerramienta, rutaAfiliados, rutaMetadatos };
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

/**
 * Lee un borrador ya escrito. Sin validar contra el esquema: eso es trabajo
 * de `promover.ts` al intentar darlo de alta en el catálogo real.
 *
 * `metadatos` es `undefined` para borradores escritos antes de que este
 * módulo empezara a guardar confianza/fuentes/advertencias -- no se pueden
 * recuperar retroactivamente, solo están disponibles para lotes ejecutados
 * a partir de ahora.
 */
export function leerBorrador(
  id: string,
  opciones: { dirBase?: string } = {}
): { datos: unknown; datosAfiliados: unknown; metadatos?: MetadatosBorrador } | undefined {
  const dirBase = opciones.dirBase ?? DIR_BORRADORES_POR_DEFECTO;
  const { dirHerramientas, dirAfiliados, dirMetadatos } = rutasBorrador(dirBase);

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  if (!fs.existsSync(rutaHerramienta)) return undefined;

  const datos = JSON.parse(fs.readFileSync(rutaHerramienta, "utf-8"));
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);
  const datosAfiliados = fs.existsSync(rutaAfiliados) ? JSON.parse(fs.readFileSync(rutaAfiliados, "utf-8")) : {};

  const rutaMetadatos = path.join(dirMetadatos, `${id}.json`);
  const metadatos = fs.existsSync(rutaMetadatos)
    ? (JSON.parse(fs.readFileSync(rutaMetadatos, "utf-8")) as MetadatosBorrador)
    : undefined;

  return { datos, datosAfiliados, metadatos };
}
