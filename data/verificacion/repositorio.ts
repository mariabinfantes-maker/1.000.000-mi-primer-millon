import fs from "node:fs";
import path from "node:path";
import { getCapacidades, getVocabulario } from "@/data/vocabulario/repositorio";
import { normalizarUrl } from "./convertir";
import { FUENTES_DE_PRIMERA_MANO } from "./esquema";
import type { PlanDeVerificacion, RegistroVerificacion, SeleccionPlausible } from "./esquema";

/**
 * Acceso y validación de la verificación de F2.
 *
 * Las reglas viven aquí, junto a los datos, para que envejezcan juntos. Están
 * escritas como funciones puras para que las pruebas las ejecuten sobre los
 * datos reales, no sobre ejemplos inventados.
 *
 * Este módulo sí lee el vocabulario —comprueba que cada `capacidadId` exista—,
 * y es el único sitio autorizado a hacerlo fuera de `data/vocabulario/`. El
 * motor, la interfaz y las fichas siguen sin enterarse de que nada de esto
 * existe.
 */

const DIR = path.join(process.cwd(), "data", "verificacion");

export function getPlan(): PlanDeVerificacion {
  return JSON.parse(fs.readFileSync(path.join(DIR, "plan.json"), "utf8"));
}

/** Selecciones congeladas, si ya existen. Vacío mientras no se haya firmado ninguna. */
export function getSelecciones(): SeleccionPlausible[] {
  const ruta = path.join(DIR, "plausibles.json");
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
}

/** Registros de verificación, si ya existen. */
export function getRegistros(): RegistroVerificacion[] {
  const ruta = path.join(DIR, "registros.json");
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
}

/** AAAA-MM-DD que además existe: «2026-02-30» no cuela. */
export function esFecha(f: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const d = new Date(`${f}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === f;
}

function mesesEntre(desde: string, hasta: string): number {
  const a = new Date(`${desde}T00:00:00Z`);
  const b = new Date(`${hasta}T00:00:00Z`);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

/**
 * Qué está mal en un registro de verificación.
 *
 * Cada regla existe para impedir un error concreto que la propietaria dejó por
 * escrito al autorizar F2, y ninguna se puede saltar «por esta vez».
 */
export function erroresDeRegistro(
  registro: RegistroVerificacion,
  herramientaIds: readonly string[],
  capacidadIds: readonly string[]
): string[] {
  const e: string[] = [];
  const donde = `${registro.herramientaId}/${registro.capacidadId}`;

  if (!herramientaIds.includes(registro.herramientaId)) e.push(`${donde}: la herramienta no existe`);
  if (!capacidadIds.includes(registro.capacidadId)) e.push(`${donde}: la capacidad no existe`);

  // Sin fuente no hay registro. Ni una afirmación sin quién la sostiene.
  if (!registro.fuentes?.length) e.push(`${donde}: no tiene ninguna fuente`);
  for (const f of registro.fuentes ?? []) {
    if (!/^https?:\/\/\S+$/.test(f.url ?? "")) e.push(`${donde}: URL inválida "${f.url}"`);
    if (!esFecha(f.fechaConsulta)) e.push(`${donde}: fechaConsulta inválida "${f.fechaConsulta}"`);
  }

  // Una reseña o comparativa nunca sostiene confianza alta, por buena que sea.
  const dePrimeraMano = (registro.fuentes ?? []).some((f) => FUENTES_DE_PRIMERA_MANO.includes(f.tipo));
  if (registro.confianza === "alta" && !dePrimeraMano) {
    e.push(`${donde}: confianza alta sin ninguna fuente de primera mano`);
  }

  // «No está documentado» significa «no sabemos», no «no disponible».
  if (registro.estado === "verificado") {
    if (!registro.profundidad) e.push(`${donde}: verificado sin profundidad`);
    if (registro.profundidad === "integracion" && !registro.integraCon?.trim()) {
      e.push(`${donde}: una integración tiene que decir con qué se integra`);
    }
    // Una función que sólo existe en un plan superior conserva ese plan.
    const necesitaPlan =
      registro.profundidad === "nativa" || registro.profundidad === "modulo";
    if (necesitaPlan && !registro.planMinimo?.trim()) {
      e.push(`${donde}: falta el plan mínimo real`);
    }
    if (registro.profundidad === "no_disponible" && registro.planMinimo) {
      e.push(`${donde}: no disponible no puede tener plan`);
    }
  } else {
    if (registro.profundidad) e.push(`${donde}: ${registro.estado} no puede llevar profundidad`);
    if (!registro.nota?.trim()) e.push(`${donde}: ${registro.estado} tiene que explicar por qué`);
  }

  if (!esFecha(registro.proximaRevision)) {
    e.push(`${donde}: proximaRevision inválida "${registro.proximaRevision}"`);
  } else {
    const ultima = (registro.fuentes ?? [])
      .map((f) => f.fechaConsulta)
      .filter(esFecha)
      .sort()
      .pop();
    if (ultima) {
      if (registro.proximaRevision <= ultima) {
        e.push(`${donde}: la próxima revisión no puede ser anterior a la consulta`);
      } else {
        // 6 meses para lo que depende de plan o precio, que es lo que más
        // cambia; 12 para el resto. Se admite un mes de holgura.
        const tope = registro.planMinimo ? 6 : 12;
        if (mesesEntre(ultima, registro.proximaRevision) > tope + 1) {
          e.push(`${donde}: la próxima revisión se va más allá de ${tope} meses`);
        }
      }
    }
  }
  return e;
}

/** Qué está mal en una selección congelada de capacidades plausibles. */
export function erroresDeSeleccion(
  seleccion: SeleccionPlausible,
  herramientaIds: readonly string[],
  capacidadIds: readonly string[]
): string[] {
  const e: string[] = [];
  const donde = seleccion.herramientaId;
  if (!herramientaIds.includes(seleccion.herramientaId)) e.push(`${donde}: la herramienta no existe`);
  if (!seleccion.criterio?.trim()) e.push(`${donde}: sin criterio escrito, la lista se puede estrechar luego`);
  if (!esFecha(seleccion.fecha)) e.push(`${donde}: fecha inválida "${seleccion.fecha}"`);
  if (!seleccion.capacidadIds.length) e.push(`${donde}: selección vacía`);
  const repetidas = seleccion.capacidadIds.filter((c, i) => seleccion.capacidadIds.indexOf(c) !== i);
  if (repetidas.length) e.push(`${donde}: capacidades repetidas: ${[...new Set(repetidas)].join(", ")}`);
  for (const c of seleccion.capacidadIds) {
    if (!capacidadIds.includes(c)) e.push(`${donde}: la capacidad "${c}" no existe`);
  }
  return e;
}

/** Los identificadores del vocabulario, para validar contra ellos. */
export function capacidadIdsDelVocabulario(): string[] {
  return getCapacidades().map((c) => c.id);
}

export function versionDelVocabulario(): string {
  return getVocabulario().version;
}

/**
 * Direcciones que sustituyen o completan a las de la ficha, sin tocarla.
 *
 * Las URLs del catálogo son datos de producto y no se cambian para arreglar una
 * verificación: si `urlPrecios` de una herramienta lleva a otro sitio, eso es
 * una incidencia del catálogo y la decide la propietaria. Aquí se declara,
 * sólo para verificar, qué se pidió realmente y por qué — y qué direcciones son
 * documentación oficial capaz de situar una capacidad en un plan.
 */
/**
 * Una redirección declarada: qué dirección se pidió y a cuál llevó de verdad.
 *
 * Se guardan LAS DOS a propósito. La prueba de la equivalencia es el par: con
 * sólo la resuelta no se puede comprobar de dónde salía, y quien lea esto
 * dentro de seis meses no sabrá si la dirección de la ficha sigue llevando
 * ahí o si alguien la cambió por conveniencia.
 */
export type Redirigida = {
  /** La dirección de la ficha, tal cual está en el catálogo. */
  solicitada: string;
  /** La que se leyó de verdad, con evidencia técnica escrita en el motivo. */
  resuelta: string;
};

export type Sustitucion = {
  herramientaId: string;
  urlPrecios?: string;
  /**
   * La portada de la ficha redirige. Sin esto, Gemini lee la dirección final
   * y cita la que se le pidió, y la afirmación cae por la regla de
   * redirecciones aunque la equivalencia sea real — que es exactamente lo que
   * pasó con los ocho pares de Zenkit.
   */
  paginaOficial?: Redirigida;
  documentacion?: string[];
  /** Por qué. Sin motivo escrito, una sustitución es una trampa silenciosa. */
  motivo: string;
  fecha: string;
};

export function getSustituciones(): Sustitucion[] {
  const ruta = path.join(DIR, "sustituciones.json");
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
}

/** Qué está mal en una sustitución declarada. */
export function erroresDeSustitucion(s: Sustitucion, herramientaIds: readonly string[]): string[] {
  const e: string[] = [];
  if (!herramientaIds.includes(s.herramientaId)) e.push(`${s.herramientaId}: la herramienta no existe`);
  if (!s.motivo?.trim()) e.push(`${s.herramientaId}: sin motivo escrito`);
  if (!esFecha(s.fecha)) e.push(`${s.herramientaId}: fecha inválida "${s.fecha}"`);
  if (!s.urlPrecios && !s.documentacion?.length && !s.paginaOficial) {
    e.push(`${s.herramientaId}: no sustituye ni añade nada`);
  }

  const urls = [
    s.urlPrecios,
    ...(s.documentacion ?? []),
    s.paginaOficial?.solicitada,
    s.paginaOficial?.resuelta,
  ].filter(Boolean) as string[];
  for (const u of urls) {
    if (!/^https?:\/\/\S+$/.test(u)) e.push(`${s.herramientaId}: URL inválida "${u}"`);
  }

  if (s.paginaOficial) {
    const { solicitada, resuelta } = s.paginaOficial;
    if (!solicitada?.trim()) e.push(`${s.herramientaId}: la redirección no dice qué dirección se pidió`);
    if (!resuelta?.trim()) e.push(`${s.herramientaId}: la redirección no dice a dónde llevó`);
    // Declarar que algo redirige a sí mismo no declara nada, y deja escrito
    // como comprobado algo que no se ha comprobado.
    if (solicitada && resuelta && normalizarUrl(solicitada) === normalizarUrl(resuelta)) {
      e.push(`${s.herramientaId}: la paginaOficial declarada no redirige a ninguna parte`);
    }
  }
  return e;
}
