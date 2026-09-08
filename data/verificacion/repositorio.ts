import fs from "node:fs";
import path from "node:path";
import { getCapacidades, getVocabulario } from "@/data/vocabulario/repositorio";
import { normalizarUrl } from "./convertir";
import { FUENTES_DE_PRIMERA_MANO, ROLES_DE_FUENTE } from "./esquema";
import type { PlanDeVerificacion, RegistroVerificacion, SeleccionPlausible, TipoFuente } from "./esquema";

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
    /**
     * Un rol que no existe no decía nada y colaba: la fuente entraba como si
     * no llevara rol, es decir, demostrando las dos cosas a la vez. Un
     * «plan_verificado» mal escrito pasaba por fuente de plan y de capacidad.
     */
    if (f.rol !== undefined && !ROLES_DE_FUENTE.includes(f.rol)) {
      e.push(`${donde}: rol de fuente "${f.rol}" desconocido`);
    }
    /**
     * «Dónde se miró» es un rastro, no una prueba: si lleva cita se lee como
     * si demostrara el plan, que es justo lo que no hizo.
     */
    if (f.rol === "plan_consultado" && f.cita !== undefined) {
      e.push(`${donde}: la fuente de dónde se consultó el plan no puede llevar cita`);
    }
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
    /**
     * LA CERTEZA DEL PLAN ES SUYA, NO DE LA CAPACIDAD.
     *
     * Una función que sólo existe en un plan superior conserva ese plan; pero
     * no saber el plan ya no tumba la capacidad. Lo que sí se exige es que las
     * dos cosas se digan por separado y que ninguna afirme de más.
     */
    const necesitaPlan =
      registro.profundidad === "nativa" || registro.profundidad === "modulo";
    if (necesitaPlan && !registro.planEstado) {
      e.push(`${donde}: no dice si el plan está verificado o es desconocido`);
    }
    // Un valor que no es ninguno de los dos no dice nada, y colaba.
    if (registro.planEstado && !["verificado", "desconocido"].includes(registro.planEstado)) {
      e.push(`${donde}: planEstado "${registro.planEstado}" no es ni verificado ni desconocido`);
    }
    if (registro.planEstado === "verificado" && !registro.planMinimo?.trim()) {
      e.push(`${donde}: el plan se da por verificado pero no dice cuál`);
    }

    /**
     * El estado del plan y las fuentes tienen que contar lo mismo.
     *
     * Sin esto, un registro podía decir «el plan es desconocido» y arrastrar
     * a la vez una fuente marcada como que lo demuestra. Una de las dos cosas
     * era mentira, y ninguna prueba lo miraba.
     */
    const fuentesDePlan = (registro.fuentes ?? []).filter((f) => f.rol === "plan");
    if (registro.planEstado === "desconocido" && fuentesDePlan.length) {
      e.push(`${donde}: el plan es desconocido pero trae una fuente que dice demostrarlo`);
    }
    /**
     * UN PLAN VERIFICADO SE APOYA EN EXACTAMENTE UNA FUENTE, NI MÁS NI MENOS.
     *
     * Lo demuestra la fuente marcada `plan`; y cuando ninguna declara rol, la
     * fuente sin rol —el caso corriente, una fila de la tarifa que nombra la
     * capacidad y está en la columna de su plan—.
     *
     * Impedir que hubiera dos no bastaba: cero también colaba. Un registro
     * podía afirmar «plan Growth, verificado» llevando sólo una fuente marcada
     * como de capacidad, sin nada que situara el plan, y ninguna regla lo
     * miraba.
     */
    const fuentesSinRol = (registro.fuentes ?? []).filter((f) => !f.rol);
    const demuestranElPlan = fuentesDePlan.length ? fuentesDePlan : fuentesSinRol;
    if (fuentesDePlan.length > 1) {
      e.push(`${donde}: ${fuentesDePlan.length} fuentes dicen demostrar el plan, y sólo puede haber una`);
    }
    if (registro.planEstado === "verificado" && !demuestranElPlan.length) {
      e.push(`${donde}: el plan se da por verificado y ninguna fuente lo demuestra`);
    }
    // «Dónde se miró» sólo tiene sentido cuando no se llegó a demostrar.
    if (
      registro.planEstado !== "desconocido" &&
      (registro.fuentes ?? []).some((f) => f.rol === "plan_consultado")
    ) {
      e.push(`${donde}: sólo un plan desconocido puede llevar la fuente de dónde se consultó`);
    }
    // Nombrar un plan que no se ha demostrado es afirmarlo. No se hace.
    if (registro.planEstado === "desconocido" && registro.planMinimo) {
      e.push(`${donde}: el plan es desconocido y aun así nombra "${registro.planMinimo}"`);
    }
    if (registro.profundidad === "no_disponible" && registro.planMinimo) {
      e.push(`${donde}: no disponible no puede tener plan`);
    }
  } else {
    if (registro.profundidad) e.push(`${donde}: ${registro.estado} no puede llevar profundidad`);
    if (registro.planEstado) e.push(`${donde}: ${registro.estado} no puede opinar sobre el plan`);
    if (registro.planMinimo) e.push(`${donde}: ${registro.estado} no puede nombrar un plan`);
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

/**
 * Una dirección oficial que demuestra que la herramienta TIENE la capacidad.
 *
 * Vive aparte de `sustituciones.json` a propósito. Aquello declara que una
 * dirección de la ficha lleva a otra —una redirección—, y esto declara una
 * prueba de capacidad. Mezclarlos hacía que el archivo de redirecciones
 * guardara cosas que no redirigen a ninguna parte.
 */
export type FuenteDeCapacidad = {
  herramientaId: string;
  capacidadId: string;
  url: string;
  /** Qué clase de fuente es. Decide si además puede sostener un plan. */
  tipo: TipoFuente;
  /** La frase literal que lo demuestra. Sin cita no hay prueba. */
  cita: string;
  /** Por qué se acepta. Sin motivo escrito, esto es una trampa silenciosa. */
  motivo: string;
  fecha: string;
  /**
   * Obligatoria cuando la dirección vive FUERA del dominio del fabricante.
   * No basta con que parezca suya: hace falta que una página oficial de la
   * herramienta enlace ahí expresamente, y se guarda dónde lo dice.
   */
  vinculacionOficial?: { url: string; cita: string };
};

export function getFuentesDeCapacidad(): FuenteDeCapacidad[] {
  const ruta = path.join(DIR, "fuentes-de-capacidad.json");
  return fs.existsSync(ruta) ? JSON.parse(fs.readFileSync(ruta, "utf8")) : [];
}

/** El dominio de una dirección, sin «www». */
export function dominioDe(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * ¿Esta dirección es del fabricante?
 *
 * Sí para su dominio y para CUALQUIER SUBDOMINIO suyo: la documentación casi
 * nunca vive en el dominio principal —`apidocs.teamwork.com`,
 * `developers.niftypm.com`, `api.scoro.com`— y rechazarla por eso tiraba
 * evidencia buena del propio fabricante.
 *
 * No para un dominio ajeno, por muy suyo que parezca. `github.com/loquesea`
 * lo puede abrir cualquiera.
 */
export function esDelDominioOficial(url: string, urlOficial: string): boolean {
  const host = dominioDe(url);
  const oficial = dominioDe(urlOficial);
  if (!host || !oficial) return false;
  return host === oficial || host.endsWith(`.${oficial}`);
}

/** Qué está mal en una fuente de capacidad declarada. */
export function erroresDeFuenteDeCapacidad(
  f: FuenteDeCapacidad,
  herramientaIds: readonly string[],
  capacidadIds: readonly string[],
  dominioOficialDe: (herramientaId: string) => string | undefined
): string[] {
  const e: string[] = [];
  const donde = `${f.herramientaId}/${f.capacidadId}`;
  if (!herramientaIds.includes(f.herramientaId)) e.push(`${donde}: la herramienta no existe`);
  if (!capacidadIds.includes(f.capacidadId)) e.push(`${donde}: la capacidad no existe`);
  if (!/^https?:\/\/\S+$/.test(f.url ?? "")) e.push(`${donde}: URL inválida "${f.url}"`);
  if (!f.cita?.trim()) e.push(`${donde}: sin cita que lo demuestre`);
  if (!f.motivo?.trim()) e.push(`${donde}: sin motivo escrito`);
  if (!esFecha(f.fecha)) e.push(`${donde}: fecha inválida "${f.fecha}"`);

  const oficial = dominioOficialDe(f.herramientaId);
  if (oficial && f.url) {
    if (!esDelDominioOficial(f.url, oficial)) {
      // Un dominio ajeno sólo entra con una vinculación oficial, explícita y
      // comprobable: una página DEL FABRICANTE que enlace ahí.
      const v = f.vinculacionOficial;
      if (!v) {
        e.push(`${donde}: "${f.url}" está fuera del dominio oficial y no declara vinculación`);
      } else {
        if (!/^https?:\/\/\S+$/.test(v.url ?? "")) e.push(`${donde}: la vinculación tiene URL inválida`);
        else if (!esDelDominioOficial(v.url, oficial)) {
          e.push(`${donde}: la vinculación no viene de una página del fabricante`);
        }
        if (!v.cita?.trim()) e.push(`${donde}: la vinculación no dice dónde lo pone`);
      }
    }
  }
  return e;
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
