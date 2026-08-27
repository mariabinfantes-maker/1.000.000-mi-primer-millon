import type { Herramienta, ModuloSuite } from "@/data/esquema";
import { esSuite } from "@/data/taxonomia";
import type { DetalleCriterio, RespuestasUsuario } from "./tipos";
import { contieneTexto } from "./utilidades";

/**
 * Criterios PROPIOS de cada ruta — la corrección de fondo de este sprint.
 *
 * Antes, una suite y una especializada competían con la misma lista de
 * criterios, y eso producía dos injusticias simétricas:
 *  - la suite ganaba por acumulación: más funciones y más integraciones
 *    sumaban puntos aunque el usuario no necesitara ninguna de ellas;
 *  - la especializada perdía 8 puntos por el simple hecho de no ser una
 *    suite, sin que nada midiera si era mejor en su tarea.
 *
 * La solución no es inventar un criterio compensatorio, sino aceptar que
 * son dos preguntas distintas:
 *  - a una suite se le pregunta si merece la pena CENTRALIZAR;
 *  - a una especializada, si merece la pena ELEGIRLA para esa función.
 *
 * Cada ruta tiene sus criterios y su propio rango teórico, y el resultado
 * se normaliza a 0..1 antes de compararse (ver `motor.ts`). Así ninguna
 * ruta gana por tener más criterios o rangos más generosos: gana la que
 * mejor responde a su propia pregunta.
 */

export type ContextoEvaluacion = {
  respuestas: RespuestasUsuario;
  /** El conjunto de candidatas que se está evaluando: los criterios comparativos lo necesitan (una especializada solo puede demostrar superioridad frente a las suites contra las que compite). */
  catalogo: Herramienta[];
};

export type CriterioRuta = {
  /** Rango teórico de este criterio. Es lo que permite normalizar la ruta entera sin que un criterio con números más grandes pese más de lo previsto. */
  min: number;
  max: number;
  evaluar: (herramienta: Herramienta, contexto: ContextoEvaluacion) => DetalleCriterio;
};

const nada = (criterio: string, etiqueta: string): DetalleCriterio => ({ criterio, etiqueta, puntos: 0, explicacion: "" });

/** Escala 1-10 → 0..max, con 5 como punto neutro. Una puntuación de 5 no suma ni resta. */
function desdePuntuacion(valor: number | undefined, max: number): number {
  if (valor === undefined) return 0;
  return Math.round(((valor - 5) / 5) * max);
}

/**
 * Qué módulos le hacen falta de verdad a este usuario, deducidos de lo que
 * ha pedido. Es la pieza que impide que una suite gane por amplitud: solo
 * cuentan los módulos que responden a una necesidad declarada.
 */
const MODULOS_POR_CATEGORIA: Record<string, ModuloSuite[]> = {
  crm: ["crm"],
  "gestion-proyectos": ["gestion_proyectos"],
  "asistentes-ia": ["asistente_ia"],
  "facturacion-contabilidad": ["facturacion"],
  "marketing-email": ["email_marketing"],
  "atencion-cliente": ["atencion_cliente"],
  "comercio-electronico": ["comercio_electronico"],
  "creacion-web-hosting": ["creador_de_sitios_web"],
  "recursos-humanos": ["recursos_humanos"],
};

const MODULOS_POR_PROBLEMA: Record<string, ModuloSuite[]> = {
  "conseguir-clientes": ["crm", "email_marketing", "embudos_de_venta"],
  "atencion-cliente": ["atencion_cliente"],
  "organizar-empresa": ["gestion_proyectos", "crm"],
  "automatizar-tareas": ["asistente_ia"],
  "ahorrar-tiempo": ["asistente_ia"],
};

export function modulosQueNecesita(respuestas: RespuestasUsuario): ModuloSuite[] {
  const necesarios = new Set<ModuloSuite>();
  if (respuestas.categoriaId) {
    for (const modulo of MODULOS_POR_CATEGORIA[respuestas.categoriaId] ?? []) necesarios.add(modulo);
  }
  for (const problemaId of respuestas.problemaIdsCandidatos ?? []) {
    for (const modulo of MODULOS_POR_PROBLEMA[problemaId] ?? []) necesarios.add(modulo);
  }
  return [...necesarios];
}

// ───────────────────────── RUTA SUITE ─────────────────────────

/**
 * Cobertura ÚTIL: cuántas de las necesidades declaradas por el usuario
 * cubre esta plataforma. No cuenta módulos totales a propósito — una
 * suite con diez módulos de los que el usuario necesita uno no vale más
 * que otra con dos que cubren ese mismo uno.
 */
const coberturaUtil: CriterioRuta = {
  min: 0,
  max: 14,
  evaluar: (herramienta, { respuestas }) => {
    const etiqueta = "Cobertura de tus necesidades";
    const necesarios = modulosQueNecesita(respuestas);
    const incluidos = new Set(herramienta.modulosIncluidos ?? []);

    if (necesarios.length === 0) {
      return nada("coberturaUtil", etiqueta);
    }

    const cubiertos = necesarios.filter((modulo) => incluidos.has(modulo));
    const proporcion = cubiertos.length / necesarios.length;
    const puntos = Math.round(proporcion * 14);

    if (cubiertos.length === 0) {
      return {
        criterio: "coberturaUtil",
        etiqueta,
        puntos: 0,
        explicacion: "No incluye ningún módulo para lo que nos has pedido, aunque cubra otras áreas.",
      };
    }

    return {
      criterio: "coberturaUtil",
      etiqueta,
      puntos,
      explicacion:
        cubiertos.length === necesarios.length
          ? "Cubre en un solo producto todo lo que nos has pedido."
          : `Cubre ${cubiertos.length} de las ${necesarios.length} áreas que nos has pedido.`,
    };
  },
};

/**
 * Calidad CONJUNTA: de nada sirve centralizarlo todo en una plataforma
 * cuyos módulos son flojos. Este criterio es el que impide que una suite
 * mediocre gane por amplitud — la amplitud ya la mide `coberturaUtil`, y
 * aquí se le pregunta si además está bien hecha.
 */
const calidadConjunta: CriterioRuta = {
  min: -12,
  max: 12,
  evaluar: (herramienta) => {
    const media = (herramienta.puntuaciones.calidad + herramienta.puntuaciones.fiabilidad) / 2;
    const puntos = desdePuntuacion(media, 12);
    return {
      criterio: "calidadConjunta",
      etiqueta: "Calidad conjunta de los módulos",
      puntos,
      explicacion:
        puntos > 0
          ? `Sus módulos mantienen buen nivel de calidad y fiabilidad (${media.toFixed(1)}/10 de media).`
          : puntos < 0
            ? `Cubre mucho, pero la calidad media de sus módulos se queda en ${media.toFixed(1)}/10.`
            : "",
    };
  },
};

/** Integración nativa y datos centralizados: que los módulos sean del mismo producto y no piezas pegadas con integraciones. */
const integracionNativa: CriterioRuta = {
  min: 0,
  max: 8,
  evaluar: (herramienta) => {
    const modulos = (herramienta.modulosIncluidos ?? []).length;
    if (modulos === 0) return nada("integracionNativa", "Integración entre módulos");
    // La fiabilidad es el mejor indicador disponible de que las piezas
    // funcionan juntas: una plataforma con módulos mal integrados falla.
    const puntos = Math.max(desdePuntuacion(herramienta.puntuaciones.fiabilidad, 8), 0);
    return {
      criterio: "integracionNativa",
      etiqueta: "Integración entre módulos",
      puntos,
      explicacion: puntos > 0 ? "Los módulos comparten los mismos datos, sin conectar nada por fuera." : "",
    };
  },
};

/** Facilidad de administrar la plataforma entera: el argumento real de centralizar es que la lleve una sola persona. */
const facilidadAdministracion: CriterioRuta = {
  min: -10,
  max: 10,
  evaluar: (herramienta) => {
    const facilidad = herramienta.puntuaciones.facilidadImplementacion ?? herramienta.puntuaciones.facilidadDeUso;
    // `nivelTecnicoRequerido` es inverso: 10 = necesita equipo técnico.
    const exigencia = 11 - herramienta.puntuaciones.nivelTecnicoRequerido;
    const puntos = desdePuntuacion((facilidad + exigencia) / 2, 10);
    return {
      criterio: "facilidadAdministracion",
      etiqueta: "Facilidad de administración",
      puntos,
      explicacion:
        puntos > 0
          ? "Se administra entera sin necesitar un perfil técnico dedicado."
          : puntos < 0
            ? "Centralizarlo todo aquí exige a alguien que sepa administrarla."
            : "",
    };
  },
};

/** Coste total frente a contratar varias herramientas por separado. Solo puntúa si de verdad sustituye a más de una. */
const costeTotalFrenteAVarias: CriterioRuta = {
  min: 0,
  max: 10,
  evaluar: (herramienta, { respuestas }) => {
    const etiqueta = "Coste frente a contratar varias";
    const necesarios = modulosQueNecesita(respuestas);
    const incluidos = new Set(herramienta.modulosIncluidos ?? []);
    const cubiertos = necesarios.filter((modulo) => incluidos.has(modulo)).length;

    if (cubiertos < 2) return nada("costeTotalFrenteAVarias", etiqueta);

    const puntos = herramienta.tienePlanGratuito ? 10 : 6;
    return {
      criterio: "costeTotalFrenteAVarias",
      etiqueta,
      puntos,
      explicacion: `Sustituye a ${cubiertos} herramientas distintas con una sola suscripción${herramienta.tienePlanGratuito ? ", y tiene plan gratuito para empezar" : ""}.`,
    };
  },
};

const escalabilidadSuite: CriterioRuta = {
  min: -8,
  max: 8,
  evaluar: (herramienta) => {
    const puntos = desdePuntuacion(herramienta.puntuaciones.escalabilidad, 8);
    return {
      criterio: "escalabilidadSuite",
      etiqueta: "Escalabilidad",
      puntos,
      explicacion:
        puntos > 0
          ? "Aguanta el crecimiento sin obligarte a cambiar de plataforma."
          : puntos < 0
            ? "Se queda corta cuando la empresa crece."
            : "",
    };
  },
};

/**
 * Riesgo de dependencia de un único proveedor. Es el contrapeso honesto de
 * la amplitud: cuanto más de tu negocio vive dentro de una sola
 * plataforma, más caro es salir de ella. Siempre resta — nunca suma — y
 * crece con los módulos que de verdad usarías.
 */
const riesgoDependencia: CriterioRuta = {
  min: -10,
  max: 0,
  evaluar: (herramienta, { respuestas }) => {
    const etiqueta = "Dependencia de un solo proveedor";
    const necesarios = modulosQueNecesita(respuestas);
    const incluidos = new Set(herramienta.modulosIncluidos ?? []);
    const cubiertos = necesarios.filter((modulo) => incluidos.has(modulo)).length;

    if (cubiertos < 2) return nada("riesgoDependencia", etiqueta);

    // Sin API pública, sacar tus datos de aquí el día de mañana es mucho
    // más caro: ese es el riesgo concreto, no una idea abstracta.
    const penalizacionBase = Math.min(cubiertos * 2, 6);
    const penalizacionSalida = herramienta.tieneApiPublica === false ? 4 : 0;
    const puntos = -(penalizacionBase + penalizacionSalida);

    return {
      criterio: "riesgoDependencia",
      etiqueta,
      puntos,
      explicacion:
        penalizacionSalida > 0
          ? "Concentrar aquí varias áreas ata tu negocio a un solo proveedor, y no ofrece API pública para llevarte tus datos."
          : "Concentrar aquí varias áreas ata tu negocio a un solo proveedor.",
    };
  },
};

export const CRITERIOS_SUITE: CriterioRuta[] = [
  coberturaUtil,
  calidadConjunta,
  integracionNativa,
  facilidadAdministracion,
  costeTotalFrenteAVarias,
  escalabilidadSuite,
  riesgoDependencia,
];

// ────────────────────── RUTA ESPECIALIZADA ──────────────────────

/**
 * Profundidad funcional, medida SIEMPRE contra sus iguales: cuántas
 * funciones declara frente a la media de su propia categoría. Comparar
 * contra el catálogo entero castigaría a las especializadas por no ser
 * suites, que es justo lo que este sprint viene a corregir.
 */
const profundidadFuncional: CriterioRuta = {
  min: -14,
  max: 14,
  evaluar: (herramienta, { catalogo }) => {
    const etiqueta = "Profundidad en su especialidad";
    const iguales = catalogo.filter((h) => !esSuite(h) && h.categoriaId === herramienta.categoriaId);
    if (iguales.length < 2) return nada("profundidadFuncional", etiqueta);

    const media = iguales.reduce((total, h) => total + h.funcionesPrincipales.length, 0) / iguales.length;
    if (media === 0) return nada("profundidadFuncional", etiqueta);

    const diferencia = (herramienta.funcionesPrincipales.length - media) / media;
    const puntos = Math.max(Math.min(Math.round(diferencia * 14), 14), -14);

    return {
      criterio: "profundidadFuncional",
      etiqueta,
      puntos,
      explicacion:
        puntos > 0
          ? "Llega más a fondo en su especialidad que la media de sus alternativas directas."
          : puntos < 0
            ? "Cubre su especialidad de forma más básica que otras alternativas de su categoría."
            : "",
    };
  },
};

const calidadEnLaTarea: CriterioRuta = {
  min: -12,
  max: 12,
  evaluar: (herramienta) => {
    const puntos = desdePuntuacion(herramienta.puntuaciones.calidad, 12);
    return {
      criterio: "calidadEnLaTarea",
      etiqueta: "Calidad en su especialidad",
      puntos,
      explicacion:
        puntos > 0
          ? `Hace muy bien aquello para lo que está pensada (${herramienta.puntuaciones.calidad}/10).`
          : puntos < 0
            ? `Su calidad se queda por debajo de la media (${herramienta.puntuaciones.calidad}/10).`
            : "",
    };
  },
};

const adaptacionAlSector: CriterioRuta = {
  min: 0,
  max: 8,
  evaluar: (herramienta, { respuestas }) => {
    const etiqueta = "Encaje con tu sector";
    if (!respuestas.industria) return nada("adaptacionAlSector", etiqueta);

    const encaja = herramienta.industriasIdeales.some(
      (sector) => contieneTexto(sector, respuestas.industria!) || contieneTexto(respuestas.industria!, sector)
    );
    if (!encaja) return nada("adaptacionAlSector", etiqueta);

    return {
      criterio: "adaptacionAlSector",
      etiqueta,
      puntos: 8,
      explicacion: `Está pensada específicamente para empresas de tu sector.`,
    };
  },
};

const funcionesAvanzadas: CriterioRuta = {
  min: 0,
  max: 8,
  evaluar: (herramienta) => {
    // En una especializada, una API pública no es un extra técnico: es lo
    // que permite encajarla en el resto de tu montaje sin rehacerlo.
    if (herramienta.tieneApiPublica !== true) return nada("funcionesAvanzadas", "Funciones avanzadas");
    return {
      criterio: "funcionesAvanzadas",
      etiqueta: "Funciones avanzadas",
      puntos: 8,
      explicacion: "Ofrece API pública para llevarla más allá de lo que trae de serie.",
    };
  },
};

/**
 * Integraciones con terceros. Aquí SÍ cuenta la cantidad, al revés que en
 * la ruta suite: una especializada solo puede convivir con el resto de tu
 * montaje si se conecta bien con él. Es su forma legítima de cubrir lo que
 * una suite cubre por dentro.
 */
const integracionesConTerceros: CriterioRuta = {
  min: 0,
  max: 10,
  evaluar: (herramienta, { catalogo }) => {
    const etiqueta = "Se conecta con tus otras herramientas";
    const iguales = catalogo.filter((h) => !esSuite(h));
    if (iguales.length < 2) return nada("integracionesConTerceros", etiqueta);

    const media = iguales.reduce((total, h) => total + h.integraciones.length, 0) / iguales.length;
    if (media === 0 || herramienta.integraciones.length <= media) {
      return nada("integracionesConTerceros", etiqueta);
    }

    const puntos = Math.min(Math.round(((herramienta.integraciones.length - media) / media) * 10), 10);
    return {
      criterio: "integracionesConTerceros",
      etiqueta,
      puntos,
      explicacion: "Se conecta con más herramientas que la mayoría de sus alternativas.",
    };
  },
};

const facilidadEnSuEspecialidad: CriterioRuta = {
  min: -10,
  max: 10,
  evaluar: (herramienta) => {
    const puntos = desdePuntuacion(herramienta.puntuaciones.facilidadDeUso, 10);
    return {
      criterio: "facilidadEnSuEspecialidad",
      etiqueta: "Facilidad de uso",
      puntos,
      explicacion:
        puntos > 0
          ? `Fácil de usar en el día a día (${herramienta.puntuaciones.facilidadDeUso}/10).`
          : puntos < 0
            ? `Su manejo diario es más árido de lo habitual (${herramienta.puntuaciones.facilidadDeUso}/10).`
            : "",
    };
  },
};

const precioFrenteAlValor: CriterioRuta = {
  min: 0,
  max: 8,
  evaluar: (herramienta) => {
    const etiqueta = "Precio para lo que ofrece";
    if (!herramienta.tienePlanGratuito) return nada("precioFrenteAlValor", etiqueta);
    return {
      criterio: "precioFrenteAlValor",
      etiqueta,
      puntos: 8,
      explicacion: "Puedes probarla a fondo con su plan gratuito antes de pagar nada.",
    };
  },
};

/**
 * Superioridad frente al módulo equivalente de una suite — el criterio que
 * de verdad justifica elegir una especializada. Compara su calidad con la
 * media de las suites del conjunto candidato: si no es mejor que el módulo
 * genérico, no hay razón para añadir otra suscripción.
 *
 * Nunca resta: una especializada que empata con las suites no merece
 * puntos extra, pero tampoco un castigo — ya compite por sus otros
 * criterios.
 */
const superioridadFrenteAlModulo: CriterioRuta = {
  min: 0,
  max: 10,
  evaluar: (herramienta, { catalogo }) => {
    const etiqueta = "Frente al módulo de una plataforma";
    const suites = catalogo.filter((h) => esSuite(h));
    if (suites.length === 0) return nada("superioridadFrenteAlModulo", etiqueta);

    const mediaSuites = suites.reduce((total, h) => total + h.puntuaciones.calidad, 0) / suites.length;
    const ventaja = herramienta.puntuaciones.calidad - mediaSuites;
    if (ventaja <= 0) return nada("superioridadFrenteAlModulo", etiqueta);

    const puntos = Math.min(Math.round(ventaja * 3), 10);
    return {
      criterio: "superioridadFrenteAlModulo",
      etiqueta,
      puntos,
      explicacion:
        "Hace esta función mejor que el módulo equivalente de las plataformas todo en uno con las que compite.",
    };
  },
};

export const CRITERIOS_ESPECIALIZADA: CriterioRuta[] = [
  profundidadFuncional,
  calidadEnLaTarea,
  adaptacionAlSector,
  funcionesAvanzadas,
  integracionesConTerceros,
  facilidadEnSuEspecialidad,
  precioFrenteAlValor,
  superioridadFrenteAlModulo,
];

/** Los criterios que le tocan a una herramienta según lo que es, no según lo que el usuario prefiera. */
export function criteriosDeRuta(herramienta: Herramienta): CriterioRuta[] {
  return esSuite(herramienta) ? CRITERIOS_SUITE : CRITERIOS_ESPECIALIZADA;
}

export function rangoDeRuta(criterios: CriterioRuta[]): { min: number; max: number } {
  return criterios.reduce(
    (acumulado, criterio) => ({ min: acumulado.min + criterio.min, max: acumulado.max + criterio.max }),
    { min: 0, max: 0 }
  );
}
