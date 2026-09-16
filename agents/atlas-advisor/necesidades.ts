import { TEXTOS_NECESIDADES } from "./necesidades.textos.es";

/**
 * La pregunta de aclaración de la entrada por objetivo — la «opción B».
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 *
 * «Soy peluquera y pierdo citas» entra por «Ahorrar tiempo» y recibía
 * Grammarly, Canva y Reclaim.ai: un corrector, un diseñador y un agendador
 * de reuniones. La puerta de evidencia de F3 no corría por ese camino
 * porque `motor.ts` la condicionaba a que hubiera `categoriaId`, y un
 * objetivo no es una categoría: «ahorrar tiempo» son diecisiete
 * herramientas de siete ámbitos distintos, sin ninguna capacidad en común
 * que se pueda exigir.
 *
 * Así que se pregunta. Cada objetivo se abre en necesidades concretas, en
 * palabras de una persona, y la elegida se convierte en la fila que la
 * puerta exige: `capacidades` es «alguna de éstas», exactamente como
 * `exigeAlgunaDe` en las rutas congeladas. Un solo mecanismo.
 *
 * ── Cómo NO está hecho ──────────────────────────────────────────────
 *
 * Aquí no hay ni un identificador de herramienta ni una cobertura escrita a
 * mano. Cada fila declara capacidades del vocabulario y la puerta decide
 * quién las ha demostrado, sobre las 62 herramientas y no sobre las
 * etiquetadas con el objetivo — decisión de la propietaria del 2026-09-16:
 * Capsule, noCRM y Nutshell tienen bandeja compartida y ninguna estaba
 * etiquetada para «atención al cliente». Las etiquetas eran el problema,
 * no el catálogo.
 *
 * Tampoco se puntúa ni se reparten cuotas: la respuesta FILTRA el conjunto
 * comparable, y dentro de él gana quien gane por su ficha.
 *
 * ── Las reglas de redacción, que son de la propietaria ─────────────────
 *
 * Una fila puede agrupar capacidades distintas si CUALQUIERA de ellas
 * resuelve honestamente la necesidad; el texto lo señala con «o» y nunca
 * promete una combinación que `capacidades` no pueda garantizar. Por eso
 * «facturar y cobrar» son dos filas y no una. Y una fila con cobertura
 * cero se queda: decir «esto no lo cubrimos» es un resultado válido, y una
 * necesidad que existe no desaparece porque el catálogo no la tenga.
 *
 * Los textos viven aparte, en `necesidades.textos.es.ts`: el día que Molnip
 * hable inglés se añade un fichero, no se rehace esto.
 */

export type FilaDeNecesidad = {
  id: string;
  /** Basta con demostrar UNA. Nunca se exigen todas. */
  capacidades: string[];
  /**
   * Declarada a sabiendas sin ninguna herramienta que la demuestre hoy. No
   * es un dato que el motor use —él mide la cobertura real— sino una
   * afirmación que una prueba contrasta contra la verificación: si algún día
   * deja de ser cierta, la prueba lo dice y la marca se quita.
   */
  sinCobertura?: true;
};

export type FamiliaDeNecesidades = {
  /** «general» es la familia sin título: el objetivo no agrupa. */
  id: string;
  filas: FilaDeNecesidad[];
};

export type PreguntaDeNecesidad = {
  objetivoId: string;
  familias: FamiliaDeNecesidades[];
};

/** La opción que siempre está, en todos los objetivos, y que nunca devuelve nada genérico. */
export const NINGUNA_DE_ESTAS = "ninguna";

// Las filas compartidas se definen una vez y se citan: la misma necesidad
// tiene el mismo texto y las mismas capacidades esté donde esté.
const CITAS_RESERVA: FilaDeNecesidad = { id: "citas-reserva", capacidades: ["cap.online_self_service_booking"] };
const RECORDATORIOS_CITAS: FilaDeNecesidad = {
  id: "recordatorios-citas",
  capacidades: ["cap.customer_appointment_reminders"],
};
const SEGUIMIENTOS_AUTOMATICOS: FilaDeNecesidad = {
  id: "seguimientos-automaticos",
  capacidades: ["cap.marketing_automation"],
};
const AGENTE_IA: FilaDeNecesidad = { id: "agente-ia", capacidades: ["cap.ai_task_agents"] };
const CONOCIMIENTO_EQUIPO: FilaDeNecesidad = {
  id: "conocimiento-equipo",
  capacidades: ["cap.internal_knowledge_workspace"],
};
const TAREAS_REPETIDAS: FilaDeNecesidad = { id: "tareas-repetidas", capacidades: ["cap.workflow_automation"] };

export const NECESIDADES: PreguntaDeNecesidad[] = [
  {
    objetivoId: "conseguir-clientes",
    // Familias aprobadas el 2026-09-16: la pregunta se hace en dos pasos
    // (familia y después necesidad) para no enseñar todas las opciones a la
    // vez. Sólo «Automatizar» cabe en una pantalla y sigue sin familias.
    familias: [
      {
        id: "atraer",
        filas: [
          { id: "web-o-captacion", capacidades: ["cap.website_builder", "cap.landing_pages"] },
          { id: "captar-datos", capacidades: ["cap.lead_capture"] },
          { id: "correos-lista", capacidades: ["cap.email_campaigns"] },
        ],
      },
      {
        id: "convertir",
        filas: [
          { id: "seguir-oportunidades", capacidades: ["cap.sales_pipeline"] },
          SEGUIMIENTOS_AUTOMATICOS,
          { id: "presupuestos", capacidades: ["cap.quotes_and_proposals"] },
          CITAS_RESERVA,
        ],
      },
    ],
  },
  {
    objetivoId: "automatizar-tareas",
    familias: [
      {
        id: "general",
        filas: [
          { id: "encadenar-acciones", capacidades: ["cap.workflow_automation"] },
          AGENTE_IA,
          // `email_campaigns` no sostiene esta fila: enviar una campaña no
          // demuestra automatización. Corrección de la propietaria.
          SEGUIMIENTOS_AUTOMATICOS,
          RECORDATORIOS_CITAS,
        ],
      },
    ],
  },
  {
    objetivoId: "ahorrar-tiempo",
    familias: [
      // La familia de la peluquera. Antes no existía y por eso recibía un
      // corrector de textos.
      { id: "citas", filas: [CITAS_RESERVA, RECORDATORIOS_CITAS] },
      {
        id: "escribir",
        filas: [
          { id: "redactar", capacidades: ["cap.text_generation"] },
          { id: "corregir", capacidades: ["cap.text_correction"] },
        ],
      },
      {
        id: "reuniones",
        filas: [
          { id: "transcribir", capacidades: ["cap.audio_transcription"] },
          { id: "actas", capacidades: ["cap.meeting_notes"] },
        ],
      },
      {
        id: "materiales",
        filas: [
          { id: "presentaciones", capacidades: ["cap.presentation_building"] },
          // Dos filas y no una: generar sin grabar y editar lo grabado son
          // capacidades distintas, y el vocabulario las separa en su `noEs`.
          { id: "video-ia", capacidades: ["cap.ai_video_generation"] },
          { id: "editar-video", capacidades: ["cap.video_editing"] },
          { id: "marca", capacidades: ["cap.brand_kit"] },
        ],
      },
      {
        id: "dia-y-equipo",
        filas: [{ id: "mi-dia", capacidades: ["cap.personal_calendar_planning"] }, AGENTE_IA, CONOCIMIENTO_EQUIPO],
      },
    ],
  },
  {
    objetivoId: "organizar-empresa",
    familias: [
      {
        id: "tareas-proyectos",
        filas: [
          { id: "tareas", capacidades: ["cap.task_management"] },
          { id: "proyectos", capacidades: ["cap.project_planning", "cap.gantt_and_dependencies"] },
          TAREAS_REPETIDAS,
        ],
      },
      {
        id: "equipo-tiempo",
        filas: [
          { id: "carga-equipo", capacidades: ["cap.team_workload_planning"] },
          { id: "tiempo-dedicado", capacidades: ["cap.time_tracking"] },
          { id: "fichaje", capacidades: ["cap.time_and_attendance"] },
        ],
      },
      {
        id: "dinero",
        filas: [
          { id: "margen-trabajo", capacidades: ["cap.job_costing"] },
          // Separadas a propósito: emitir la factura y cobrarla son dos
          // capacidades, y una sola fila prometería lo que no puede.
          { id: "facturas", capacidades: ["cap.invoicing"] },
          { id: "cobrar-online", capacidades: ["cap.payment_collection"] },
        ],
      },
      { id: "conocimiento", filas: [CONOCIMIENTO_EQUIPO] },
    ],
  },
  {
    objetivoId: "atencion-cliente",
    familias: [
      {
        id: "atender",
        filas: [
          { id: "bandeja-compartida", capacidades: ["cap.shared_inbox"] },
          // Las dos necesidades más obvias de este objetivo, y ninguna
          // herramienta las demuestra. Se quedan: llevan a «no lo cubrimos»,
          // que es más honesto que no preguntarlo.
          { id: "tickets", capacidades: ["cap.support_ticketing"], sinCobertura: true },
          { id: "chatbot", capacidades: ["cap.support_chatbot"], sinCobertura: true },
        ],
      },
      {
        id: "conocer-cliente",
        filas: [
          { id: "historial-cliente", capacidades: ["cap.customer_interaction_history"] },
          { id: "portal-cliente", capacidades: ["cap.client_portal"] },
        ],
      },
      { id: "citas", filas: [CITAS_RESERVA, RECORDATORIOS_CITAS] },
    ],
  },
];

const POR_OBJETIVO = new Map(NECESIDADES.map((p) => [p.objetivoId, p]));

/** La pregunta de un objetivo, o `undefined` si el objetivo no la tiene (hoy la tienen los cinco). */
export function preguntaParaObjetivo(objetivoId: string | undefined): PreguntaDeNecesidad | undefined {
  return objetivoId ? POR_OBJETIVO.get(objetivoId) : undefined;
}

/**
 * Si la pregunta se hace en dos pasos (primero la familia, después la
 * necesidad). Decisión de la propietaria del 2026-09-16: nunca enseñar todas
 * las opciones juntas; con una sola familia no hay nada que elegir antes.
 */
export function sePreguntaPorFamilias(pregunta: PreguntaDeNecesidad): boolean {
  return pregunta.familias.length >= 2;
}

/** La fila elegida dentro de un objetivo. `undefined` si no existe ahí: un id de otro objetivo no vale. */
export function filaDeNecesidad(objetivoId: string | undefined, filaId: string | undefined): FilaDeNecesidad | undefined {
  if (!filaId) return undefined;
  return preguntaParaObjetivo(objetivoId)
    ?.familias.flatMap((f) => f.filas)
    .find((fila) => fila.id === filaId);
}

/** Todas las filas distintas, para las pruebas y los informes de huecos. */
export function todasLasFilas(): FilaDeNecesidad[] {
  const vistas = new Map<string, FilaDeNecesidad>();
  for (const pregunta of NECESIDADES) {
    for (const familia of pregunta.familias) for (const fila of familia.filas) vistas.set(fila.id, fila);
  }
  return [...vistas.values()];
}

/** El texto de una fila, en el idioma del sitio. Falla en voz alta si falta: una necesidad sin texto no se puede preguntar. */
export function textoDeFila(filaId: string): { etiqueta: string; descripcion: string } {
  const texto = TEXTOS_NECESIDADES.filas[filaId];
  if (!texto) throw new Error(`La necesidad "${filaId}" no tiene texto en necesidades.textos.es.ts.`);
  return texto;
}

export function tituloDeFamilia(familiaId: string): string {
  return TEXTOS_NECESIDADES.familias[familiaId] ?? "";
}

export function enunciadoDe(objetivoId: string): string {
  return TEXTOS_NECESIDADES.enunciados[objetivoId] ?? TEXTOS_NECESIDADES.enunciadoPorDefecto;
}
