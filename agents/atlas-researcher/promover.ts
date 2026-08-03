import fs from "node:fs";
import path from "node:path";
import type { Herramienta } from "@/data/esquema";
import type { AffiliateData } from "@/data/esquemaInterno";
import { getCategorias, getTodasLasHerramientas, validarHerramienta } from "@/data/repositorio";
import { leerBorrador } from "./borrador";
import { estaAprobado } from "./decision";

/**
 * Promoción (etapa final del flujo: investigar → informe → revisión →
 * aprobación → promoción).
 *
 * Es el ÚNICO módulo de esta fase que escribe en `data/herramientas/` y
 * `data/afiliados/` — el catálogo real. Todo lo demás (lote.ts, borrador.ts)
 * solo llega hasta `data/borradores/`. Antes de copiar nada, exige que
 * exista una decisión humana "aprobado" registrada (`decision.ts`) — Atlas
 * nunca promueve una herramienta sin esa aprobación manual explícita, sea
 * cual sea la calidad del borrador — y corre las mismas comprobaciones que
 * `data/verificar.ts` (esquema válido, categoría existente) más dos propias
 * de la promoción: que el id no colisione con uno ya promovido, y que la
 * regla obligatoria de afiliados se siga cumpliendo con lo que quedó
 * guardado en el borrador (cinturón y tirantes, igual que la doble
 * comprobación que ya hace `agente.ts`).
 */

export type ResultadoPromocion =
  | { ok: true; id: string; rutaHerramienta: string; rutaAfiliados: string }
  | { ok: false; id: string; errores: string[] };

export type OpcionesPromocion = {
  /** De dónde leer el borrador. Por defecto `data/borradores` — solo para pruebas. */
  dirBaseBorradores?: string;
  /** Dónde escribir el catálogo real (debe contener `herramientas/` y `afiliados/`). Por defecto `data`, la ruta real del proyecto — solo para pruebas. */
  dirDatos?: string;
};

function tieneProgramaDeAfiliadosFiable(datosAfiliados: Partial<AffiliateData>): boolean {
  if (datosAfiliados.hasAffiliateProgram !== true) return false;
  return datosAfiliados.confidenceLevel !== "low";
}

export function promoverBorrador(id: string, opciones: OpcionesPromocion = {}): ResultadoPromocion {
  const dirDatos = opciones.dirDatos ?? path.join(process.cwd(), "data");
  const dirBaseBorradores = opciones.dirBaseBorradores;

  const borrador = leerBorrador(id, { dirBase: dirBaseBorradores });
  if (!borrador) {
    return { ok: false, id, errores: [`No existe ningún borrador con id "${id}".`] };
  }

  const errores: string[] = [];

  if (!estaAprobado(id, { dirBase: dirBaseBorradores })) {
    errores.push(
      `"${id}" no tiene una decisión "aprobado" registrada. Revisa el informe y ejecuta primero: ` +
        `npm run aprobar-borrador -- ${id} --decision aprobado --notas "..."`
    );
  }

  let herramienta: Herramienta | undefined;
  try {
    herramienta = validarHerramienta(borrador.datos, `borradores/${id}.json`);
  } catch (error) {
    errores.push(error instanceof Error ? error.message : String(error));
  }

  if (herramienta) {
    const idsCategorias = new Set(getCategorias().map((c) => c.id));
    if (!idsCategorias.has(herramienta.categoriaId)) {
      errores.push(`"${id}" referencia una categoría inexistente: "${herramienta.categoriaId}".`);
    }
  }

  const idsExistentes = new Set(getTodasLasHerramientas().map((h) => h.id));
  if (idsExistentes.has(id)) {
    errores.push(`"${id}" ya existe en el catálogo real: promoverlo lo sobrescribiría. Revísalo a mano si es intencionado.`);
  }

  const datosAfiliados = borrador.datosAfiliados as Partial<AffiliateData>;
  if (!tieneProgramaDeAfiliadosFiable(datosAfiliados)) {
    errores.push(`"${id}" no cumple la regla obligatoria de afiliados (programa activo y fiable) en el borrador.`);
  }

  if (errores.length > 0 || !herramienta) {
    return { ok: false, id, errores };
  }

  const dirHerramientas = path.join(dirDatos, "herramientas");
  const dirAfiliados = path.join(dirDatos, "afiliados");
  fs.mkdirSync(dirHerramientas, { recursive: true });
  fs.mkdirSync(dirAfiliados, { recursive: true });

  const hoy = new Date().toISOString().slice(0, 10);
  const herramientaFinal: Herramienta = { ...herramienta, estado: "activo", fechaUltimaRevision: hoy };

  const rutaHerramienta = path.join(dirHerramientas, `${id}.json`);
  const rutaAfiliados = path.join(dirAfiliados, `${id}.json`);

  fs.writeFileSync(rutaHerramienta, `${JSON.stringify(herramientaFinal, null, 2)}\n`, "utf-8");
  fs.writeFileSync(rutaAfiliados, `${JSON.stringify(datosAfiliados, null, 2)}\n`, "utf-8");

  return { ok: true, id, rutaHerramienta, rutaAfiliados };
}
