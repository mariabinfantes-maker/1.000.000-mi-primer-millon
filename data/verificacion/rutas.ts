/**
 * Qué capacidad exige cada ruta — F3, bloque 3.
 *
 * Es la correspondencia que el piloto del Lote 1 dejó escrita como requisito 1:
 * «hoy ninguna ruta declara qué capacidad exige; hay que decidirlo antes de
 * filtrar por evidencia». Sin ella, filtrar por evidencia sería que la sesión
 * decidiera a quién deja de recomendarse Molnip.
 *
 * NO ES CÓDIGO DEL MOTOR Y NADIE LA LEE TODAVÍA. Conectarla es el bloque 5, y
 * antes hay que mirar qué mide la simulación del bloque 4.
 *
 * ── Cómo se lee una fila ────────────────────────────────────────────────
 *
 * `exigeAlgunaDe` es siempre «alguna de éstas», también cuando lleva una sola.
 * Un único mecanismo para las seis filas: dos formas de exigir serían dos
 * formas de equivocarse.
 *
 * Y lo que NO significa que una herramienta no pase la fila: no significa que
 * no sirva. Significa que no lo ha demostrado. F2 hizo 1.544 comprobaciones y
 * obtuvo cero ausencias demostradas; quien use esto tiene que contarlo así.
 */

export type FilaDeRuta = {
  /** «<categoriaId>» o «<categoriaId>/<subtipoId>». Fuera de él, la fila no existe. */
  ambito: string;
  categoriaId: string;
  subtipoId?: string;
  /** Basta con demostrar UNA. Nunca se exigen todas. */
  exigeAlgunaDe: string[];
  /** Por qué ésta y no otra. Se lee en la revisión del diff, que es donde se decide de verdad. */
  motivo: string;
};

/**
 * Las seis filas aprobadas por la propietaria el 2026-09-09.
 *
 * Sólo cubren categorías con herramientas: el catálogo tiene fichas en 4 de
 * las 15 categorías, así que una fila para «reservas y citas» sería una regla
 * sobre un conjunto vacío.
 */
export const RUTAS_CONGELADAS: FilaDeRuta[] = [
  {
    ambito: "gestion-proyectos",
    categoriaId: "gestion-proyectos",
    exigeAlgunaDe: ["cap.project_planning", "cap.task_management", "cap.gantt_and_dependencies"],
    motivo:
      "Quien busca gestión de proyectos quiere planificar o repartir trabajo. Exigir planificación Y tareas a la vez dejaría 12 de 29 candidatas; con una basta y quedan 17. El Gantt se añadió el 2026-09-10 al verlo en la simulación: monday.com tiene «gantt_and_dependencies», «kanban_boards» y «team_workload_planning» verificadas y quedaba fuera por dos nombres que no le preguntaron así. La fila medía la evidencia, no el producto. Ninguna de las once que siguen fuera ha demostrado que no planifique: no lo sabemos.",
  },
  {
    ambito: "asistentes-ia/espacio-trabajo",
    categoriaId: "asistentes-ia",
    subtipoId: "espacio-trabajo",
    exigeAlgunaDe: [
      "cap.internal_knowledge_workspace",
      "cap.collaborative_document_editing",
      "cap.workspace_wide_search",
      "cap.document_version_history",
    ],
    motivo:
      "«Espacio de trabajo» no es una capacidad, es un sitio donde conviven varias. Los tres candidatos demostraron una distinta cada uno, así que exigir una concreta dejaría fuera a dos por falta de evidencia, no de producto.",
  },
  {
    ambito: "asistentes-ia/escritura",
    categoriaId: "asistentes-ia",
    subtipoId: "escritura",
    exigeAlgunaDe: ["cap.text_generation"],
    motivo: "Es lo que se le pide a un asistente de escritura. Hoy la demuestran los tres candidatos.",
  },
  {
    ambito: "asistentes-ia/reuniones-transcripcion",
    categoriaId: "asistentes-ia",
    subtipoId: "reuniones-transcripcion",
    exigeAlgunaDe: ["cap.audio_transcription"],
    motivo: "Sin transcribir no hay nada que resumir después. Hoy la demuestran los tres candidatos.",
  },
  {
    ambito: "asistentes-ia/agenda-planificacion",
    categoriaId: "asistentes-ia",
    subtipoId: "agenda-planificacion",
    exigeAlgunaDe: ["cap.personal_calendar_planning"],
    motivo: "Es la función del subtipo: colocar el trabajo en el calendario. Hoy la demuestran los tres candidatos.",
  },
  {
    ambito: "asistentes-ia/presentaciones",
    categoriaId: "asistentes-ia",
    subtipoId: "presentaciones",
    exigeAlgunaDe: ["cap.presentation_building"],
    motivo: "Es la función del subtipo. Hoy la demuestran los tres candidatos.",
  },
  {
    ambito: "asistentes-ia/video",
    categoriaId: "asistentes-ia",
    subtipoId: "video",
    exigeAlgunaDe: ["cap.ai_video_generation"],
    motivo:
      "Es lo que distingue a este subtipo de la edición de vídeo corriente. Hoy la demuestran los tres candidatos; exigir «cap.video_editing» dejaría uno.",
  },
];

/**
 * Ámbitos que NO tienen fila, y por qué.
 *
 * Están escritos porque «no tiene fila» y «se decidió no ponerle fila» son
 * cosas distintas, y la diferencia se pierde en cuanto nadie la anota. Una
 * prueba comprueba que ninguno de éstos aparezca en `RUTAS_CONGELADAS`: así
 * un pendiente no se resuelve por descuido con una regla vacía.
 */
export const RUTAS_PENDIENTES: { ambito: string; porque: string }[] = [
  {
    ambito: "crm",
    porque:
      "Sus cuatro opciones de diferenciación —vivir dentro del correo, capturar los datos solo, ser sencillo, telefonía integrada— no tienen equivalente en el vocabulario de 146 capacidades. Dos exigirían emitir capacidades nuevas, que es F1; «sencillo» es un atributo ya puntuado y ordena, no filtra.",
  },
  {
    ambito: "plataformas-todo-en-uno",
    porque:
      "Una suite no promete una capacidad, promete cubrir varias áreas a la vez. La regla correcta compara lo que cubre con lo que la persona necesita, y el cuestionario todavía no pregunta eso. Tres de las catorce no demuestran ninguna de las cuatro áreas típicas, así que cualquier umbral hoy mediría la evidencia, no el producto.",
  },
];

/** La fila de un ámbito, si la tiene. */
export function filaDeRuta(categoriaId: string | undefined, subtipoId?: string): FilaDeRuta | undefined {
  if (!categoriaId) return undefined;
  return RUTAS_CONGELADAS.find(
    (f) => f.categoriaId === categoriaId && (f.subtipoId ?? undefined) === (subtipoId ?? undefined)
  );
}

/** ¿Este ámbito está pendiente de decidir? No es lo mismo que no tener fila por olvido. */
export function estaPendiente(ambito: string): boolean {
  return RUTAS_PENDIENTES.some((p) => p.ambito === ambito);
}

/**
 * ¿La herramienta cumple la fila?
 *
 * Recibe cómo consultar la evidencia en vez de consultarla ella: así se prueba
 * con seis registros inventados y, en el bloque 5, se le pasará el puerto real.
 */
export function cumpleLaRuta(
  fila: FilaDeRuta,
  herramientaId: string,
  loDemuestra: (herramientaId: string, capacidadId: string) => boolean
): boolean {
  return fila.exigeAlgunaDe.some((capacidadId) => loDemuestra(herramientaId, capacidadId));
}
