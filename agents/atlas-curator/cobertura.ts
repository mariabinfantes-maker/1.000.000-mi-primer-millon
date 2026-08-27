import type { Categoria, Herramienta } from "@/data/esquema";
import { MARCO_CATEGORIAS_MINIMO, cubreCategoria, esCategoriaPublica } from "@/data/taxonomia";
import { detectarIncoherenciasEnCatalogo } from "./coherencia";
import { detectarProblemasDeValidezEnCatalogo } from "./validez";

/**
 * Cobertura del catálogo — Capa 2 de Atlas Curator: determinista, sin IA,
 * sin coste. Solo detecta y explica; nunca crea, publica ni retira una
 * categoría. Publicar una categoría es una decisión de producto y la toma
 * una persona.
 *
 * `equilibrio.ts` ya responde a "¿está el catálogo repartido?". Este
 * módulo responde a la pregunta que faltaba, y que es la que de verdad
 * importa para un comparador: "¿tiene esta categoría suficientes
 * alternativas para que enseñarla sea honesto?".
 *
 * La diferencia no es teórica. Una categoría con UNA herramienta pasaba
 * todos los controles anteriores — el umbral de `equilibrio.ts` es cero —
 * y aun así publicarla convierte un comparador en un escaparate de una
 * sola marca. Y una categoría que NUNCA se declaró era invisible por
 * definición: sin `MARCO_CATEGORIAS_MINIMO` no hay forma de echar en falta
 * lo que no existe.
 */

/**
 * Alternativas verificadas mínimas para que una categoría pueda enseñarse
 * al público. Tres es el número más bajo con el que una comparación sigue
 * siendo una comparación: con dos solo hay un duelo, y con una no hay nada
 * que comparar. Configurable porque el número correcto puede subir cuando
 * el catálogo crezca.
 */
export const MINIMO_ALTERNATIVAS_POR_DEFECTO = 3;

/** Por encima de esta proporción del catálogo activo, una sola categoría acapara el catálogo. Mismo criterio que `equilibrio.ts`, reutilizado aquí para que el informe hable con una sola voz. */
export const PORCENTAJE_SOBRERREPRESENTACION_POR_DEFECTO = 0.5;

export type EstadoCobertura =
  /** Cumple el mínimo de alternativas: se puede enseñar. */
  | "preparada"
  /** Tiene herramientas, pero menos de las necesarias para comparar. */
  | "insuficiente"
  /** Declarada y sin ninguna herramienta activa. */
  | "vacia"
  /** Acapara más de la mitad del catálogo activo. */
  | "sobrerrepresentada";

export type CoberturaCategoria = {
  id: string;
  nombre: string;
  /** Si la categoría se está enseñando hoy al público. */
  publica: boolean;
  numeroHerramientas: number;
  estado: EstadoCobertura;
  mensaje: string;
  /** Cuántas herramientas faltan para alcanzar el mínimo. 0 si ya llega. */
  faltanParaElMinimo: number;
};

export type CategoriaAusente = {
  id: string;
  nombre: string;
  mensaje: string;
};

export type InformeCobertura = {
  categorias: CoberturaCategoria[];
  /** Categorías del marco mínimo que ni siquiera están declaradas en `categorias.json`. */
  ausentes: CategoriaAusente[];
  /** Pendientes que ya cumplen el mínimo: Curator PROPONE publicarlas, no las publica. */
  listasParaPublicar: CoberturaCategoria[];
  /** Públicas que se han quedado por debajo del mínimo: se están enseñando sin respaldo suficiente. */
  publicadasSinRespaldo: CoberturaCategoria[];
};

export type OpcionesCobertura = {
  minimoAlternativas?: number;
  porcentajeSobrerrepresentacion?: number;
};

/**
 * Cuenta las herramientas ACTIVAS que cubren una categoría, contando tanto
 * la categoría principal como las secundarias — si una herramienta compite
 * de verdad en una categoría, cuenta como alternativa en ella.
 */
function contarActivas(herramientas: Herramienta[], categoriaId: string): number {
  return herramientas.filter((h) => h.estado === "activo" && cubreCategoria(h, categoriaId)).length;
}

function describir(
  categoria: Categoria,
  numeroHerramientas: number,
  estado: EstadoCobertura,
  minimo: number,
  totalActivas: number
): string {
  const publica = esCategoriaPublica(categoria);
  switch (estado) {
    case "vacia":
      return publica
        ? `"${categoria.nombre}" está publicada y no tiene ninguna herramienta activa — su página no muestra nada.`
        : `"${categoria.nombre}" está declarada pero vacía: no hay nada que investigar todavía.`;
    case "insuficiente":
      return (
        `"${categoria.nombre}" tiene ${numeroHerramientas} de las ${minimo} alternativas mínimas. ` +
        (publica
          ? "Se está enseñando sin opciones suficientes para que la comparación sea honesta."
          : "Sigue interna hasta completar el mínimo.")
      );
    case "sobrerrepresentada": {
      const porcentaje = Math.round((numeroHerramientas / totalActivas) * 100);
      return `"${categoria.nombre}" concentra ${numeroHerramientas} de ${totalActivas} herramientas activas (${porcentaje}%) — el resto del catálogo puede estar quedando desatendido.`;
    }
    case "preparada":
      return publica
        ? `"${categoria.nombre}" cumple el mínimo de ${minimo} alternativas.`
        : `"${categoria.nombre}" ya cumple el mínimo de ${minimo} alternativas: puede proponerse para publicar.`;
  }
}

/**
 * Evalúa la cobertura de TODAS las categorías declaradas (públicas y
 * pendientes) y detecta además las que faltan por declarar según
 * `MARCO_CATEGORIAS_MINIMO`.
 */
export function evaluarCobertura(
  categorias: Categoria[],
  herramientas: Herramienta[],
  opciones: OpcionesCobertura = {}
): InformeCobertura {
  const minimo = opciones.minimoAlternativas ?? MINIMO_ALTERNATIVAS_POR_DEFECTO;
  const porcentaje = opciones.porcentajeSobrerrepresentacion ?? PORCENTAJE_SOBRERREPRESENTACION_POR_DEFECTO;
  const totalActivas = herramientas.filter((h) => h.estado === "activo").length;

  const evaluadas: CoberturaCategoria[] = categorias.map((categoria) => {
    const numeroHerramientas = contarActivas(herramientas, categoria.id);

    // El orden importa: primero lo que impide enseñar la categoría
    // (vacía, insuficiente) y solo después el desequilibrio, que es un
    // problema del reparto global, no de esta categoría en concreto.
    let estado: EstadoCobertura;
    if (numeroHerramientas === 0) {
      estado = "vacia";
    } else if (numeroHerramientas < minimo) {
      estado = "insuficiente";
    } else if (totalActivas > 0 && numeroHerramientas / totalActivas > porcentaje) {
      estado = "sobrerrepresentada";
    } else {
      estado = "preparada";
    }

    return {
      id: categoria.id,
      nombre: categoria.nombre,
      publica: esCategoriaPublica(categoria),
      numeroHerramientas,
      estado,
      mensaje: describir(categoria, numeroHerramientas, estado, minimo, totalActivas),
      faltanParaElMinimo: Math.max(minimo - numeroHerramientas, 0),
    };
  });

  const idsDeclarados = new Set(categorias.map((c) => c.id));
  const ausentes: CategoriaAusente[] = MARCO_CATEGORIAS_MINIMO.filter((c) => !idsDeclarados.has(c.id)).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    mensaje: `"${c.nombre}" forma parte del marco mínimo de Molnip y todavía no está declarada en el catálogo.`,
  }));

  return {
    categorias: evaluadas,
    ausentes,
    // Una categoría sobrerrepresentada también supera el mínimo, así que
    // cuenta como lista para publicar: su problema es de reparto global,
    // no de falta de alternativas.
    listasParaPublicar: evaluadas.filter(
      (c) => !c.publica && (c.estado === "preparada" || c.estado === "sobrerrepresentada")
    ),
    publicadasSinRespaldo: evaluadas.filter((c) => c.publica && (c.estado === "vacia" || c.estado === "insuficiente")),
  };
}

export type TareaInvestigacion = {
  categoriaId: string;
  nombre: string;
  herramientasQueFaltan: number;
  motivo: string;
};

/**
 * Tarea de investigación sobre una FICHA concreta, no sobre una categoría.
 * Sale de lo que ya detectan `validez.ts` (datos que faltan) y
 * `coherencia.ts` (contradicciones internas), y las convierte en trabajo
 * priorizado y contable en vez de en un listado que se lee y se olvida.
 *
 * Curator no investiga ni rellena nada: solo dice qué hay que averiguar,
 * de qué ficha, y qué preguntas concretas hay que responder.
 */
export type TareaInvestigacionFicha = {
  herramientaId: string;
  campo: string;
  prioridad: PrioridadInvestigacion;
  motivo: string;
  /** Qué hay que comprobar exactamente. Sin esto, "investigar la disponibilidad" es una tarea que nadie sabe cuándo está terminada. */
  comprobaciones: string[];
};

export type PrioridadInvestigacion = "alta" | "media";

/**
 * Cola de investigación para Atlas Researcher: qué categorías necesitan
 * herramientas y cuántas, ordenadas por lo cerca que están de poder
 * publicarse — terminar una categoría que ya tiene dos herramientas aporta
 * más que empezar una desde cero.
 *
 * Curator dice QUÉ falta; Researcher decide QUÉ herramienta concreta
 * investigar y con qué evidencia. Esta función no nombra ninguna
 * herramienta a propósito: inventar candidatas sería inventar datos.
 */
export function construirColaInvestigacion(
  informe: InformeCobertura,
  opciones: OpcionesCobertura = {}
): TareaInvestigacion[] {
  const minimo = opciones.minimoAlternativas ?? MINIMO_ALTERNATIVAS_POR_DEFECTO;

  const desdeDeclaradas: TareaInvestigacion[] = informe.categorias
    .filter((c) => c.faltanParaElMinimo > 0)
    .map((c) => ({
      categoriaId: c.id,
      nombre: c.nombre,
      herramientasQueFaltan: c.faltanParaElMinimo,
      motivo: c.publica
        ? "Categoría publicada por debajo del mínimo de alternativas."
        : "Categoría declarada pendiente de completar antes de poder publicarse.",
    }));

  const desdeAusentes: TareaInvestigacion[] = informe.ausentes.map((c) => ({
    categoriaId: c.id,
    nombre: c.nombre,
    herramientasQueFaltan: minimo,
    motivo: "Categoría del marco mínimo que ni siquiera está declarada.",
  }));

  return [...desdeDeclaradas, ...desdeAusentes].sort(
    (a, b) => a.herramientasQueFaltan - b.herramientasQueFaltan || a.nombre.localeCompare(b.nombre, "es")
  );
}


/**
 * Qué hay que comprobar, como mínimo, para dar por investigada la
 * disponibilidad geográfica de una herramienta. Se declara aquí y no en el
 * texto de un aviso para que la tarea tenga un criterio de terminación
 * comprobable: sin esta lista, "investigar dónde está disponible" es una
 * tarea que nadie sabe cuándo está hecha.
 */
export const COMPROBACIONES_DISPONIBILIDAD_GEOGRAFICA = [
  "¿Se puede contratar y usar desde España?",
  "¿Tiene interfaz y soporte en español?",
  "¿Factura desde España o desde la UE, y admite medios de pago españoles?",
  "¿Dónde trata los datos y qué documentación de RGPD publica (DPA, cláusulas tipo)?",
  "¿Tiene limitaciones geográficas conocidas (funciones, precios o pagos por país)?",
];

/**
 * Cola de investigación a nivel de FICHA: datos que faltan y
 * contradicciones internas, priorizados.
 *
 * "alta" para lo que afecta a una decisión de compra o tiene consecuencias
 * legales (disponibilidad geográfica, contradicciones de clasificación);
 * "media" para lo que mejora la ficha sin bloquear nada.
 *
 * Igual que la cola de categorías, no nombra ninguna herramienta candidata
 * ni propone ningún valor: solo señala qué hay que averiguar.
 */
export function construirColaInvestigacionDeFichas(
  herramientas: Herramienta[],
  categorias: Categoria[]
): TareaInvestigacionFicha[] {
  const tareas: TareaInvestigacionFicha[] = [];

  for (const aviso of detectarProblemasDeValidezEnCatalogo(herramientas)) {
    const esGeografia = aviso.campo === "disponibilidadGeografica";
    // Un valor inválido es un error de datos y va antes que un dato que
    // simplemente falta — salvo la disponibilidad geográfica, que aunque
    // "solo falte" condiciona si la herramienta le sirve a quien la lee.
    const prioridad: PrioridadInvestigacion =
      aviso.gravedad === "invalido" || esGeografia ? "alta" : "media";

    tareas.push({
      herramientaId: aviso.herramientaId,
      campo: aviso.campo,
      prioridad,
      motivo: aviso.mensaje,
      comprobaciones: esGeografia ? COMPROBACIONES_DISPONIBILIDAD_GEOGRAFICA : [],
    });
  }

  for (const aviso of detectarIncoherenciasEnCatalogo(herramientas, categorias)) {
    tareas.push({
      herramientaId: aviso.herramientaId,
      campo: "clasificacion",
      prioridad: "alta",
      motivo: aviso.motivo,
      comprobaciones: [
        "¿Qué funciones respaldan cada módulo declarado en `modulosIncluidos`?",
        "¿Debe corregirse la lista de módulos, el `tipoProducto`, o ninguno de los dos?",
      ],
    });
  }

  const orden: Record<PrioridadInvestigacion, number> = { alta: 0, media: 1 };
  return tareas.sort(
    (a, b) =>
      orden[a.prioridad] - orden[b.prioridad] ||
      a.herramientaId.localeCompare(b.herramientaId, "es") ||
      a.campo.localeCompare(b.campo, "es")
  );
}
