import type { Herramienta } from "@/data/esquema";
import type { Problema } from "@/data/esquema";
import {
  CATEGORIA_TODO_EN_UNO,
  MINIMO_POR_SUBTIPO,
  SUBTIPOS_POR_CATEGORIA,
  categoriasDe,
  cubreCategoria,
  esSuite,
  subtiposDe,
} from "@/data/taxonomia";
/**
 * Integridad del catálogo — Capa 3 de Atlas Curator.
 *
 * Igual que el resto de Curator: detecta y explica, nunca corrige. Nació de
 * la auditoría del 2026-08-27, que encontró tres agujeros que ninguna
 * comprobación anterior podía ver porque todas miraban una ficha a la vez y
 * estos solo se ven mirando el catálogo entero:
 *
 *  - 38 de 56 fichas sin ningún objetivo, en la puerta que viene activa por
 *    defecto y que filtra de forma estricta: dos tercios del catálogo eran
 *    invisibles para quien entraba por ahí;
 *  - una única herramienta usando el mecanismo de categorías secundarias,
 *    compitiendo en tres categorías mientras suites con más módulos
 *    competían en una;
 *  - una categoría que mezclaba productos que no se sustituyen entre sí, de
 *    modo que una sola herramienta ganaba el 100% de los perfiles.
 */
export type HallazgoIntegridad = {
  tipo:
    | "sin_objetivo"
    | "objetivo_contradictorio"
    | "categorias_secundarias_desiguales"
    | "subtipo_sin_declarar"
    | "objetivo_sin_competencia"
    | "subtipo_sin_competencia";
  herramientaId?: string;
  motivo: string;
};
/** Mínimo de alternativas para que un objetivo ofrezca una elección real. */
export const MINIMO_POR_OBJETIVO = 3;
/**
 * Reglas CURADAS de incompatibilidad entre un objetivo y una limitación
 * central documentada.
 *
 * Curadas a mano y no por coincidencia de palabras a propósito: la
 * detección automática por palabras clave que se probó el 2026-08-27 daba
 * falsos positivos —marcaba "el CRM es menos potente que el de HubSpot"
 * como incompatible con "conseguir clientes"—, y un falso positivo aquí
 * empuja a retirar un objetivo que sí estaba bien.
 *
 * Cada regla dice: para este objetivo, esta capacidad es el núcleo; si la
 * ficha la registra como carencia entre sus inconvenientes, la asignación
 * no se sostiene.
 */
export const REGLAS_INCOMPATIBILIDAD: {
  objetivoId: string;
  capacidadNuclear: string;
  senal: RegExp;
}[] = [
  {
    objetivoId: "automatizar-tareas",
    capacidadNuclear: "conectarse con las demás herramientas que ya usa la persona",
    // "pocas integraciones", "integraciones limitadas", "depende de Zapier"
    senal: /(pocas|escasas|limitad[ao]s?)\s+integraciones|integraciones\s+(nativas\s+)?(muy\s+)?(pocas|escasas|limitad)|depend(e|iendo)\s+de\s+zapier/i,
  },
  {
    objetivoId: "atencion-cliente",
    capacidadNuclear: "atender a los clientes por los canales donde escriben",
    senal: /no\s+(tiene|dispone\s+de|incluye)\s+(mesa\s+de\s+ayuda|helpdesk|ticket)/i,
  },
];
/** Garantía 1: nadie se queda sin objetivo por descuido. */
export function detectarSinObjetivo(herramientas: Herramienta[]): HallazgoIntegridad[] {
  return herramientas
    .filter((h) => (h.problemasIds ?? []).length === 0 && !h.objetivoPendienteDeInvestigacion)
    .map((h) => ({
      tipo: "sin_objetivo" as const,
      herramientaId: h.id,
      motivo: `"${h.nombre}" no tiene ningún objetivo asignado ni está marcada como pendiente de investigación. La puerta "por objetivo" filtra de forma estricta, así que hoy es invisible para quien entre por ahí.`,
    }));
}
/** Garantía 2: ningún objetivo contradice una limitación central documentada. */
export function detectarObjetivosContradictorios(herramientas: Herramienta[]): HallazgoIntegridad[] {
  const hallazgos: HallazgoIntegridad[] = [];
  for (const herramienta of herramientas) {
    for (const regla of REGLAS_INCOMPATIBILIDAD) {
      if (!(herramienta.problemasIds ?? []).includes(regla.objetivoId)) continue;
      const choca = (herramienta.inconvenientes ?? []).find((inconveniente) => regla.senal.test(inconveniente));
      if (!choca) continue;
      hallazgos.push({
        tipo: "objetivo_contradictorio",
        herramientaId: herramienta.id,
        motivo: `"${herramienta.nombre}" está asignada al objetivo "${regla.objetivoId}", cuya capacidad nuclear es ${regla.capacidadNuclear}. Su propia ficha registra lo contrario entre sus inconvenientes: "${choca}".`,
      });
    }
  }
  return hallazgos;
}
/**
 * Garantía 4: el mecanismo de categorías secundarias se aplica igual a
 * todas las suites. Detecta la asimetría concreta que se encontró: una
 * suite con secundarias mientras otra comparable no tiene ninguna.
 */
export function detectarCategoriasSecundariasDesiguales(herramientas: Herramienta[]): HallazgoIntegridad[] {
  const suites = herramientas.filter((h) => esSuite(h));
  const hallazgos: HallazgoIntegridad[] = [];
  for (const suite of suites) {
    if (suite.categoriaId !== CATEGORIA_TODO_EN_UNO && !cubreCategoria(suite, CATEGORIA_TODO_EN_UNO)) {
      hallazgos.push({
        tipo: "categorias_secundarias_desiguales",
        herramientaId: suite.id,
        motivo: `"${suite.nombre}" es una suite pero no compite en "${CATEGORIA_TODO_EN_UNO}", que es donde se buscan las suites. Otras suites sí lo hacen: el criterio no se está aplicando por igual.`,
      });
    }
    const modulos = suite.modulosIncluidos ?? [];
    const comparables = suites.filter(
      (otra) => otra.id !== suite.id && (otra.modulosIncluidos ?? []).length >= modulos.length
    );
    const conMasCategorias = comparables.filter(
      (otra) => categoriasDe(otra).length > categoriasDe(suite).length
    );
    if (categoriasDe(suite).length === 1 && conMasCategorias.length > 0 && modulos.length >= 3) {
      hallazgos.push({
        tipo: "categorias_secundarias_desiguales",
        herramientaId: suite.id,
        motivo: `"${suite.nombre}" declara ${modulos.length} módulos y compite en una sola categoría, mientras ${conMasCategorias.length} suite(s) con módulos comparables compiten en varias. O le faltan categorías secundarias justificadas, o a las otras les sobran.`,
      });
    }
  }
  return hallazgos;
}
/** Garantía 6a: un objetivo con menos alternativas que el mínimo no ofrece una elección real. */
export function detectarObjetivosSinCompetencia(
  herramientas: Herramienta[],
  problemas: Problema[]
): HallazgoIntegridad[] {
  return problemas
    .map((problema) => ({
      problema,
      cuantas: herramientas.filter((h) => (h.problemasIds ?? []).includes(problema.id)).length,
    }))
    .filter(({ cuantas }) => cuantas < MINIMO_POR_OBJETIVO)
    .map(({ problema, cuantas }) => ({
      tipo: "objetivo_sin_competencia" as const,
      motivo: `El objetivo "${problema.titulo}" solo tiene ${cuantas} herramienta(s): por debajo de ${MINIMO_POR_OBJETIVO} no hay comparación posible, solo una lista.`,
    }));
}
/** Garantía 6b: lo mismo para los subtipos, más el aviso de fichas sin subtipo declarar. */
export function detectarSubtiposIncompletos(herramientas: Herramienta[]): HallazgoIntegridad[] {
  const hallazgos: HallazgoIntegridad[] = [];
  for (const [categoriaId, subtipos] of Object.entries(SUBTIPOS_POR_CATEGORIA)) {
    const deLaCategoria = herramientas.filter((h) => cubreCategoria(h, categoriaId));
    for (const herramienta of deLaCategoria) {
      if (subtiposDe(herramienta).length === 0 && herramienta.categoriaId === categoriaId) {
        hallazgos.push({
          tipo: "subtipo_sin_declarar",
          herramientaId: herramienta.id,
          motivo: `"${herramienta.nombre}" está en "${categoriaId}", que distingue subtipos, pero no declara ninguno. Mientras falte, el motor la compara con todas — que es justo lo que los subtipos evitan.`,
        });
      }
    }
    for (const subtipo of subtipos) {
      const cuantas = deLaCategoria.filter((h) => subtiposDe(h).includes(subtipo.id)).length;
      if (cuantas < MINIMO_POR_SUBTIPO) {
        hallazgos.push({
          tipo: "subtipo_sin_competencia",
          motivo: `El subtipo "${subtipo.nombre}" tiene ${cuantas} herramienta(s): por debajo de ${MINIMO_POR_SUBTIPO} no se puede comparar nada dentro de él.`,
        });
      }
    }
  }
  return hallazgos;
}
/** Todos los hallazgos de integridad del catálogo, en un solo sitio. */
export function auditarIntegridad(
  herramientas: Herramienta[],
  problemas: Problema[]
): HallazgoIntegridad[] {
  return [
    ...detectarSinObjetivo(herramientas),
    ...detectarObjetivosContradictorios(herramientas),
    ...detectarCategoriasSecundariasDesiguales(herramientas),
    ...detectarObjetivosSinCompetencia(herramientas, problemas),
    ...detectarSubtiposIncompletos(herramientas),
  ];
}
/**
 * Garantía 3: aviso de concentración.
 *
 * Si una sola herramienta gana casi todos los perfiles de una categoría o
 * subtipo, la señal no es que sea buenísima: es que los criterios no están
 * distinguiendo nada ahí dentro. Avisa; no toca ningún dato ni cambia
 * ninguna puntuación — corregirlo automáticamente sería empeorar una
 * recomendación para repartir visibilidad.
 */
export const UMBRAL_CONCENTRACION = 0.9;
export function detectarConcentracion(
  ganadores: { ambito: string; herramientaId: string }[]
): { ambito: string; herramientaId: string; proporcion: number; motivo: string }[] {
  const porAmbito = new Map<string, string[]>();
  for (const { ambito, herramientaId } of ganadores) {
    porAmbito.set(ambito, [...(porAmbito.get(ambito) ?? []), herramientaId]);
  }
  const avisos = [];
  for (const [ambito, ids] of porAmbito) {
    if (ids.length === 0) continue;
    const cuenta = new Map<string, number>();
    for (const id of ids) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    for (const [herramientaId, veces] of cuenta) {
      const proporcion = veces / ids.length;
      if (proporcion < UMBRAL_CONCENTRACION) continue;
      avisos.push({
        ambito,
        herramientaId,
        proporcion,
        motivo: `"${herramientaId}" gana el ${Math.round(proporcion * 100)}% de los perfiles de "${ambito}". Con esa concentración, los criterios no están distinguiendo entre las alternativas de ese ámbito: o sobran herramientas que no son alternativas reales, o falta un eje que las separe.`,
      });
    }
  }
  return avisos;
}
