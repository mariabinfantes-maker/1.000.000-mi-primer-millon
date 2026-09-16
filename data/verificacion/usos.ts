/**
 * Los usos concretos y los recorridos que F2 puede comprobar — lista cerrada.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────
 *
 * F2 demuestra CAPACIDADES: «reserva online por la propia persona»,
 * «automatización de marketing», «cobrar». Y el motor filtra por capacidad.
 * Ninguna de las dos cosas sabe si esa reserva sirve para un corte de pelo,
 * si esa automatización manda un segundo mensaje cuando el cliente calla, o
 * si ese cobro entrega el curso solo. La regla de «uso sin confirmar» del
 * 2026-09-16 lo reconoce, pero es una marca FIJA de la fila: igual para
 * todas las herramientas, sin que ninguna pueda demostrar lo contrario.
 *
 * Aquí está el cambio mínimo autorizado el 2026-09-16 (tercera ronda): una
 * lista cerrada de usos, cada uno colgando de UNA capacidad del vocabulario.
 * Un registro de F2 puede llevar, además de la capacidad, los usos
 * comprobados con su fuente y su cita. Y un recorrido dice que varias
 * piezas funcionan conectadas en el mismo plan, con sus límites.
 *
 * ── Lo que NO es ───────────────────────────────────────────────────────
 *
 * No es vocabulario. F1 está congelado en 3.0.0 y no lo lee nadie más que
 * la puerta; un uso no es una capacidad nueva sino una pregunta más precisa
 * sobre una que ya existe. Por eso cuelga de `capacidadId` y no puede
 * existir sin ella: hay una prueba que lo comprueba contra el vocabulario.
 *
 * Tampoco es un dato de producto: no se cambia ninguna ficha, y ninguna
 * herramienta lleva nada de esto hasta que un lote lo verifique con cita.
 *
 * ── La regla de lectura ─────────────────────────────────────────────────
 *
 * Igual que con las capacidades: «no consta» nunca se convierte en «no lo
 * hace». Un uso tiene tres estados en el registro —demostrado, no_consta,
 * no_lo_hace— y sólo el primero se afirma en voz alta. El tercero exige cita
 * oficial que lo diga, exactamente como `no_disponible` en una capacidad.
 *
 * Los ids son permanentes: no se renombran ni se reutilizan.
 */

export type Uso = {
  /** `uso.` + nombre semántico. Permanente. */
  id: string;
  /** La capacidad del vocabulario de la que cuelga. Sin ella, el uso no existe. */
  capacidadId: string;
  /** En palabras de una persona. Se enseña en la tarjeta. */
  etiqueta: string;
  /** Lo que hay que leer en la página oficial para darlo por demostrado. */
  definicion: string;
  /** Qué NO cuenta, para que el verificador no lo confunda con la capacidad general. */
  noEs?: string;
};

export type Recorrido = {
  /** `rec.` + nombre semántico. Permanente. */
  id: string;
  etiqueta: string;
  definicion: string;
  /**
   * Las piezas que tienen que ir juntas. Cada pieza es «alguna de estas
   * capacidades», igual que `exigeAlgunaDe`: «página» la cubre la web o una
   * página de captación.
   */
  piezas: string[][];
};

export const USOS: Uso[] = [
  // ── Citas de servicios (las dos filas de «uso sin confirmar» de la opción B) ──
  {
    id: "uso.reserva_de_servicio",
    capacidadId: "cap.online_self_service_booking",
    etiqueta: "reservar un servicio con su duración y su precio",
    definicion:
      "La persona elige un servicio concreto (un corte de pelo, una sesión) con duración y precio propios y coge hora sola.",
    noEs: "No es reservar una reunión o una llamada con alguien del equipo.",
  },
  {
    id: "uso.recordatorio_de_cita_de_servicio",
    capacidadId: "cap.customer_appointment_reminders",
    etiqueta: "recordar al cliente una cita de servicio",
    definicion: "El recordatorio se envía al cliente final por una cita de servicio, no a un asistente de una reunión.",
    noEs: "No es recordar una reunión o una llamada a quien la aceptó.",
  },
  {
    id: "uso.recordatorio_por_whatsapp",
    capacidadId: "cap.customer_appointment_reminders",
    etiqueta: "que el recordatorio llegue por WhatsApp",
    definicion: "El recordatorio de la cita puede enviarse por WhatsApp, no sólo por correo o SMS.",
  },
  // ── Recorrido A: página, pago y entrega de cursos ──
  {
    id: "uso.acceso_al_curso_tras_el_pago",
    capacidadId: "cap.training_lms",
    etiqueta: "dar acceso al curso en cuanto se paga, sin intervención",
    definicion: "Tras el pago, el alumno recibe el acceso al curso automáticamente, sin que nadie envíe nada a mano.",
    noEs: "No es que exista un curso y aparte un cobro: la entrega tiene que dispararla el pago.",
  },
  {
    id: "uso.pago_unico_y_a_plazos",
    capacidadId: "cap.payment_collection",
    etiqueta: "cobrar de una vez o en varios plazos",
    definicion: "El mismo producto puede cobrarse con un pago único o dividido en varios plazos.",
  },
  // ── Recorrido B: oportunidades y seguimiento ──
  {
    id: "uso.aviso_interno_de_siguiente_paso",
    capacidadId: "cap.sales_pipeline",
    etiqueta: "que cada oportunidad tenga una fecha de siguiente paso y avise",
    definicion:
      "Cada oportunidad lleva una fecha o actividad de siguiente paso, y la herramienta avisa a quien la lleva cuando llega o cuando se pasa.",
    noEs: "No es ver la oportunidad en una etapa: tiene que haber aviso.",
  },
  {
    id: "uso.segundo_mensaje_si_no_responde",
    capacidadId: "cap.marketing_automation",
    etiqueta: "mandar solo un segundo mensaje si el cliente no responde",
    definicion:
      "Si la persona no responde o no abre en un plazo, sale automáticamente un segundo mensaje sin que nadie lo escriba.",
    noEs: "No es una secuencia fija de correos: la condición es que no haya respuesta.",
  },
];

export const RECORRIDOS: Recorrido[] = [
  {
    id: "rec.pagina_pago_y_acceso_al_curso",
    etiqueta: "página, cobro y entrega del curso en el mismo plan",
    definicion:
      "Una página donde se vende el curso, el cobro, y el acceso automático al curso, funcionando juntos dentro de un mismo plan.",
    piezas: [["cap.website_builder", "cap.landing_pages"], ["cap.payment_collection"], ["cap.training_lms"]],
  },
  {
    id: "rec.oportunidades_y_seguimientos",
    etiqueta: "oportunidades con aviso y seguimientos automáticos en el mismo plan",
    definicion:
      "El embudo de oportunidades y los seguimientos automáticos funcionan juntos dentro de un mismo plan, sin conectar otra herramienta.",
    piezas: [["cap.sales_pipeline"], ["cap.marketing_automation"]],
  },
];

const USO_POR_ID = new Map(USOS.map((u) => [u.id, u]));
const RECORRIDO_POR_ID = new Map(RECORRIDOS.map((r) => [r.id, r]));

export function getUso(id: string): Uso | undefined {
  return USO_POR_ID.get(id);
}

export function getRecorrido(id: string): Recorrido | undefined {
  return RECORRIDO_POR_ID.get(id);
}

/** Los usos que cuelgan de una capacidad, en el orden de la lista. */
export function usosDeCapacidad(capacidadId: string): Uso[] {
  return USOS.filter((u) => u.capacidadId === capacidadId);
}
