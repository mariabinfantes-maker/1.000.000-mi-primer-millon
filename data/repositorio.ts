import fs from "node:fs";
import path from "node:path";
import type { Categoria, Herramienta } from "./esquema";

/**
 * Capa de acceso a la base de conocimiento de Atlas.
 *
 * Hoy lee de archivos JSON en disco. El resto de la aplicación (y el futuro
 * motor de recomendaciones / comparador) solo debe hablar con las funciones
 * de este archivo, nunca leer los JSON directamente. Así, cuando la base de
 * conocimiento crezca lo suficiente como para migrar a una base de datos
 * real, solo hay que reescribir estas funciones — nadie más se entera.
 *
 * Solo debe importarse desde código de servidor (Server Components, route
 * handlers, scripts): usa `node:fs`, que no existe en el navegador.
 */

const DIR_DATOS = path.join(process.cwd(), "data");
const DIR_HERRAMIENTAS = path.join(DIR_DATOS, "herramientas");
const RUTA_CATEGORIAS = path.join(DIR_DATOS, "categorias.json");

const CAMPOS_TEXTO_OBLIGATORIOS: (keyof Herramienta)[] = [
  "id",
  "nombre",
  "paginaOficial",
  "categoriaId",
  "descripcion",
  "idealPara",
  "noRecomendadaPara",
  "precioInicial",
  "metodologiaValoracion",
  "estado",
  "fechaAltaEnAtlas",
  "fechaUltimaRevision",
];

const CAMPOS_LISTA_OBLIGATORIOS: (keyof Herramienta)[] = [
  "problemasQueResuelve",
  "casosDeUso",
  "segmentosIdeales",
  "industriasIdeales",
  "funcionesPrincipales",
  "integraciones",
  "modeloDePrecio",
  "idiomasDisponibles",
  "ventajas",
  "inconvenientes",
];

const CAMPOS_PUNTUACION: (keyof Herramienta["puntuaciones"])[] = [
  "facilidadDeUso",
  "calidad",
  "fiabilidad",
  "atencionAlCliente",
  "escalabilidad",
  "nivelTecnicoRequerido",
];

/**
 * Valida que un JSON tenga la forma mínima de una Herramienta antes de
 * dejarlo entrar en el catálogo. No es un validador de esquema completo
 * (no añadimos una librería como zod solo para 5 archivos), pero sí evita
 * el error más probable al escalar a cientos de fichas: un campo obligatorio
 * olvidado o mal escrito que rompería el motor de recomendaciones en
 * silencio más adelante.
 */
function validarHerramienta(datos: unknown, nombreArchivo: string): Herramienta {
  const errores: string[] = [];

  if (typeof datos !== "object" || datos === null) {
    throw new Error(`[data/herramientas/${nombreArchivo}] no contiene un objeto JSON válido.`);
  }

  const h = datos as Record<string, unknown>;

  for (const campo of CAMPOS_TEXTO_OBLIGATORIOS) {
    if (typeof h[campo] !== "string" || (h[campo] as string).trim() === "") {
      errores.push(`falta el campo de texto "${campo}"`);
    }
  }

  for (const campo of CAMPOS_LISTA_OBLIGATORIOS) {
    if (!Array.isArray(h[campo]) || (h[campo] as unknown[]).length === 0) {
      errores.push(`falta el campo de lista "${campo}" (debe ser un array no vacío)`);
    }
  }

  if (typeof h.tienePlanGratuito !== "boolean") {
    errores.push('falta el campo booleano "tienePlanGratuito"');
  }

  const puntuaciones = h.puntuaciones as Record<string, unknown> | undefined;
  if (typeof puntuaciones !== "object" || puntuaciones === null) {
    errores.push('falta el objeto "puntuaciones"');
  } else {
    for (const campo of CAMPOS_PUNTUACION) {
      const valor = puntuaciones[campo];
      if (typeof valor !== "number" || valor < 1 || valor > 10) {
        errores.push(`"puntuaciones.${campo}" debe ser un número entre 1 y 10`);
      }
    }
  }

  const programaAfiliados = h.programaAfiliados as Record<string, unknown> | undefined;
  if (typeof programaAfiliados !== "object" || programaAfiliados === null) {
    errores.push('falta el objeto "programaAfiliados"');
  } else if (typeof programaAfiliados.disponible !== "boolean") {
    errores.push('falta el campo booleano "programaAfiliados.disponible"');
  }

  if (errores.length > 0) {
    throw new Error(
      `[data/herramientas/${nombreArchivo}] no es una Herramienta válida:\n  - ${errores.join("\n  - ")}`
    );
  }

  return datos as Herramienta;
}

let cacheHerramientas: Herramienta[] | null = null;

/** Todas las herramientas activas del catálogo. Lanza un error claro si algún archivo está mal formado. */
export function getHerramientas(): Herramienta[] {
  if (cacheHerramientas) return cacheHerramientas;

  const archivos = fs.readdirSync(DIR_HERRAMIENTAS).filter((archivo) => archivo.endsWith(".json"));

  const herramientas = archivos.map((archivo) => {
    const contenido = fs.readFileSync(path.join(DIR_HERRAMIENTAS, archivo), "utf-8");
    const datos = JSON.parse(contenido);
    return validarHerramienta(datos, archivo);
  });

  cacheHerramientas = herramientas.filter((h) => h.estado === "activo");
  return cacheHerramientas;
}

/** Incluye también herramientas descontinuadas o en revisión — para paneles internos, no para el usuario final. */
export function getTodasLasHerramientas(): Herramienta[] {
  const archivos = fs.readdirSync(DIR_HERRAMIENTAS).filter((archivo) => archivo.endsWith(".json"));
  return archivos.map((archivo) => {
    const contenido = fs.readFileSync(path.join(DIR_HERRAMIENTAS, archivo), "utf-8");
    return validarHerramienta(JSON.parse(contenido), archivo);
  });
}

export function getHerramienta(id: string): Herramienta | undefined {
  return getHerramientas().find((h) => h.id === id);
}

export function getHerramientasPorCategoria(categoriaId: string): Herramienta[] {
  return getHerramientas().filter((h) => h.categoriaId === categoriaId);
}

export function getCategorias(): Categoria[] {
  const contenido = fs.readFileSync(RUTA_CATEGORIAS, "utf-8");
  return JSON.parse(contenido) as Categoria[];
}

export function getCategoria(id: string): Categoria | undefined {
  return getCategorias().find((c) => c.id === id);
}
