/**
 * Lo que ve la persona en la pregunta de aclaración, en español.
 *
 * Separado de `necesidades.ts` a propósito: la lógica no sabe qué idioma
 * habla. Cuando Molnip hable inglés, será otro fichero con las mismas
 * claves, y una prueba comprobará que ninguna clave falte en ninguno.
 *
 * Reglas de redacción, que son de la propietaria:
 *  - Sin lenguaje técnico: si la frase sólo la entiende quien ya sabía, no
 *    ha servido. Ningún texto lleva un `cap.`.
 *  - La descripción dice QUÉ NO BASTA: la función parecida que no resuelve
 *    la necesidad. Es lo que evita que un calendario interno pase por una
 *    reserva online.
 *  - Una fila que agrupa capacidades lleva «o» en el texto.
 */
export const TEXTOS_NECESIDADES = {
  enunciadoPorDefecto: "¿Qué es lo que más te ayudaría?",
  enunciados: {
    "conseguir-clientes": "¿Qué es lo que más te ayudaría para conseguir clientes?",
    "automatizar-tareas": "¿Qué es lo que quieres que salga solo?",
    "ahorrar-tiempo": "¿En qué se te va el tiempo?",
    "organizar-empresa": "¿Qué es lo que más te cuesta tener organizado?",
    "atencion-cliente": "¿Qué es lo que más te ayudaría con tus clientes?",
  } as Record<string, string>,
  familias: {
    general: "",
    citas: "Citas",
    escribir: "Escribir",
    reuniones: "Reuniones",
    materiales: "Materiales",
    "dia-y-equipo": "Mi día y mi equipo",
  } as Record<string, string>,
  ninguna: {
    etiqueta: "Ninguna de éstas",
    descripcion: "Lo que necesito no está aquí.",
  },
  filas: {
    "captar-datos": {
      etiqueta: "Recoger los datos de quien se interesa",
      descripcion: "Que entren solos desde un formulario, la web o una campaña. Tener una web no basta.",
    },
    "seguir-oportunidades": {
      etiqueta: "Seguir cada oportunidad hasta cerrarla",
      descripcion: "Por etapas, sabiendo qué hay en marcha. La ficha del cliente, que es fija, no basta.",
    },
    "web-o-captacion": {
      etiqueta: "Tener una web o páginas de captación",
      descripcion: "Construir el sitio, o páginas sueltas para que dejen sus datos. Recoger el dato es la primera opción.",
    },
    "correos-lista": {
      etiqueta: "Enviar correos a mi lista",
      descripcion: "A mucha gente a la vez, por grupos, sabiendo quién lo abrió. Escribir a un cliente suelto no basta.",
    },
    "seguimientos-automaticos": {
      etiqueta: "Que los seguimientos salgan según lo que haga el cliente",
      descripcion: "Si abre esto, mándale aquello; si no compra, recuérdaselo. Una campaña puntual no basta.",
    },
    "citas-reserva": {
      etiqueta: "Que cojan cita ellos mismos",
      descripcion: "Que reserve el cliente, solo y a cualquier hora. Un calendario interno no basta.",
    },
    presupuestos: {
      etiqueta: "Mandar presupuestos y saber si los aceptan",
      descripcion: "A un cliente concreto. Una lista de precios no basta.",
    },
    "encadenar-acciones": {
      etiqueta: "Encadenar acciones entre mis herramientas",
      descripcion: "Si pasa esto, que haga aquello. Automatizar el marketing es otra cosa.",
    },
    "agente-ia": {
      etiqueta: "Que un agente haga tareas de varios pasos",
      descripcion: "Por su cuenta y con criterio. Un chatbot que conversa, o una regla fija, no bastan.",
    },
    "recordatorios-citas": {
      etiqueta: "Recordar las citas a los clientes sin llamar",
      descripcion: "Avisar al cliente antes de su cita. Recordar una tarea al equipo no basta.",
    },
    redactar: {
      etiqueta: "Redactar textos nuevos",
      descripcion: "Anuncios, descripciones, correos, artículos. Corregir o traducir es otra cosa.",
    },
    corregir: {
      etiqueta: "Corregir y pulir lo que ya escribí",
      descripcion: "Ortografía, gramática, claridad y tono sobre un texto que ya existe.",
    },
    transcribir: {
      etiqueta: "Pasar a texto lo que se dice",
      descripcion: "Voz a texto, sabiendo quién habla. Resumir es el paso siguiente.",
    },
    actas: {
      etiqueta: "Sacar el acta y los acuerdos de una reunión",
      descripcion: "Resumen, acuerdos y tareas. Transcribir palabra por palabra no basta.",
    },
    presentaciones: {
      etiqueta: "Montar una presentación",
      descripcion: "Con diseño coherente, sin partir de una diapositiva en blanco.",
    },
    "video-ia": {
      etiqueta: "Generar un vídeo sin grabar",
      descripcion: "Avatares, voz sintética, escenas a partir de un guion. Editar lo grabado es otra cosa.",
    },
    "editar-video": {
      etiqueta: "Editar un vídeo que ya grabé",
      descripcion: "Cortar, montar y ajustar hasta dejarlo publicable.",
    },
    marca: {
      etiqueta: "Mantener el mismo aspecto de marca",
      descripcion: "Colores, tipografías y logotipo para que todo salga con la misma cara.",
    },
    "mi-dia": {
      etiqueta: "Organizar mi propio día",
      descripcion: "Calendario, bloques de trabajo, reuniones. La agenda de citas con clientes es otra cosa.",
    },
    "conocimiento-equipo": {
      etiqueta: "Que el equipo encuentre cómo se hacen las cosas",
      descripcion: "Procedimientos, decisiones, el «cómo lo hacemos aquí». Un centro de ayuda para clientes no basta.",
    },
    tareas: {
      etiqueta: "Saber qué hay que hacer y quién lo hace",
      descripcion: "Qué, quién y para cuándo, y qué queda pendiente.",
    },
    proyectos: {
      etiqueta: "Llevar proyectos con fases o con dependencias",
      descripcion: "Principio, fin, hitos y responsables. Un expediente sin fecha de fin es otra cosa.",
    },
    "tareas-repetidas": {
      etiqueta: "Que las tareas repetidas salgan solas",
      descripcion: "Si pasa esto, que haga aquello, incluidas las aprobaciones.",
    },
    "carga-equipo": {
      etiqueta: "Ver quién está saturado",
      descripcion: "Y repartir el trabajo en consecuencia. Cuadrar turnos es otra cosa.",
    },
    "tiempo-dedicado": {
      etiqueta: "Medir el tiempo dedicado a cada trabajo",
      descripcion: "Por persona y por trabajo, para saber qué cuesta. Fichar la jornada es otra cosa.",
    },
    fichaje: {
      etiqueta: "Fichar la jornada",
      descripcion: "Fichajes, presencia, horas extra: lo que exige la ley. Medir el tiempo de un trabajo no basta.",
    },
    "margen-trabajo": {
      etiqueta: "Saber cuánto deja cada trabajo",
      descripcion: "Coste y margen de esta obra, este encargo. El informe de la empresa entera no basta.",
    },
    facturas: {
      etiqueta: "Emitir facturas",
      descripcion: "Correctas, numeradas y con su estado. Cobrarlas es la siguiente opción.",
    },
    "cobrar-online": {
      etiqueta: "Cobrar online",
      descripcion: "Pasarela, enlace de pago, domiciliación. Emitir la factura es la opción anterior.",
    },
    "bandeja-compartida": {
      etiqueta: "Reunir los mensajes del equipo en una bandeja compartida",
      descripcion: "Un buzón que ve todo el equipo. Un sistema de tickets es otra cosa.",
    },
    "historial-cliente": {
      etiqueta: "Ver todo el historial de un cliente",
      descripcion: "Llamadas, correos, compras, en orden. La ficha fija no basta.",
    },
    "portal-cliente": {
      etiqueta: "Dar al cliente un sitio donde ver lo suyo",
      descripcion: "Sus documentos, sus facturas, el estado de su encargo. Una web pública no basta.",
    },
    tickets: {
      etiqueta: "Convertir cada petición en un ticket con estado",
      descripcion: "Prioridad, responsable y tiempo de respuesta. Un buzón compartido no basta.",
    },
    chatbot: {
      etiqueta: "Que un asistente responda lo repetitivo y derive el resto",
      descripcion: "Un asistente que conversa. Un agente que ejecuta tareas es otra cosa.",
    },
  } as Record<string, { etiqueta: string; descripcion: string }>,
};
