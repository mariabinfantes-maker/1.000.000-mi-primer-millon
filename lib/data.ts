export type Tool = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  valoracion: number; // 0-5
  idealPara: string;
  pros: string[];
  contras: string[];
  url: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  herramientas: Tool[];
};

export type Problema = {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  categorias: Categoria[];
};

export const problemas: Problema[] = [
  {
    id: "conseguir-clientes",
    titulo: "Conseguir más clientes",
    descripcion: "Atrae y convierte más leads en ventas.",
    icono: "🎯",
    categorias: [
      {
        id: "crm",
        nombre: "CRM y gestión de ventas",
        descripcion:
          "Organiza tus contactos, oportunidades y el pipeline de ventas en un solo lugar.",
        herramientas: [
          {
            id: "hubspot",
            nombre: "HubSpot CRM",
            descripcion:
              "CRM gratuito con herramientas de marketing, ventas y atención al cliente integradas.",
            precio: "Gratis / desde 20€ mes",
            valoracion: 4.6,
            idealPara: "Pymes que quieren empezar sin coste inicial",
            pros: ["Plan gratuito muy completo", "Fácil de usar", "Gran ecosistema de integraciones"],
            contras: ["Se encarece rápido al escalar", "Funciones avanzadas de pago"],
            url: "https://www.hubspot.com/products/crm",
          },
          {
            id: "pipedrive",
            nombre: "Pipedrive",
            descripcion:
              "CRM visual centrado en el pipeline de ventas, pensado para equipos comerciales.",
            precio: "Desde 14€ / usuario / mes",
            valoracion: 4.5,
            idealPara: "Equipos de ventas pequeños y medianos",
            pros: ["Interfaz muy visual", "Automatizaciones sencillas", "Buen soporte"],
            contras: ["Marketing limitado", "Requiere apps adicionales para email marketing"],
            url: "https://www.pipedrive.com/",
          },
          {
            id: "salesforce",
            nombre: "Salesforce Sales Cloud",
            descripcion:
              "La plataforma CRM más completa del mercado, altamente personalizable.",
            precio: "Desde 25€ / usuario / mes",
            valoracion: 4.4,
            idealPara: "Empresas medianas y grandes con procesos complejos",
            pros: ["Extremadamente personalizable", "Escala sin límites", "Ecosistema enorme"],
            contras: ["Curva de aprendizaje alta", "Puede ser caro para pymes"],
            url: "https://www.salesforce.com/",
          },
        ],
      },
      {
        id: "email-marketing",
        nombre: "Email marketing",
        descripcion:
          "Capta leads y nutre a tus clientes potenciales con campañas automatizadas.",
        herramientas: [
          {
            id: "mailchimp",
            nombre: "Mailchimp",
            descripcion:
              "Plataforma de email marketing todo en uno con automatizaciones y plantillas.",
            precio: "Gratis / desde 13€ mes",
            valoracion: 4.3,
            idealPara: "Pymes y ecommerce que empiezan con email marketing",
            pros: ["Plan gratuito", "Plantillas listas para usar", "Fácil integración con ecommerce"],
            contras: ["Precio sube rápido con la lista de contactos", "Automatizaciones básicas limitadas"],
            url: "https://mailchimp.com/",
          },
          {
            id: "activecampaign",
            nombre: "ActiveCampaign",
            descripcion:
              "Automatización de marketing avanzada con CRM integrado y segmentación potente.",
            precio: "Desde 15€ mes",
            valoracion: 4.5,
            idealPara: "Empresas que buscan automatizaciones avanzadas",
            pros: ["Automatizaciones muy potentes", "Buena segmentación", "CRM incluido"],
            contras: ["Interfaz algo compleja al inicio", "Soporte en español limitado"],
            url: "https://www.activecampaign.com/",
          },
          {
            id: "brevo",
            nombre: "Brevo (Sendinblue)",
            descripcion:
              "Marketing por email, SMS y chat con precios pensados para pymes.",
            precio: "Gratis / desde 9€ mes",
            valoracion: 4.4,
            idealPara: "Pymes con presupuesto ajustado",
            pros: ["Precio basado en envíos, no en contactos", "Incluye SMS", "Buen plan gratuito"],
            contras: ["Menos plantillas que la competencia", "Automatizaciones más simples"],
            url: "https://www.brevo.com/",
          },
        ],
      },
    ],
  },
  {
    id: "automatizar-tareas",
    titulo: "Automatizar tareas",
    descripcion: "Elimina trabajo manual y repetitivo conectando tus herramientas.",
    icono: "⚙️",
    categorias: [
      {
        id: "automatizacion-workflows",
        nombre: "Automatización de flujos de trabajo",
        descripcion:
          "Conecta tus apps para que se pasen información automáticamente sin código.",
        herramientas: [
          {
            id: "zapier",
            nombre: "Zapier",
            descripcion:
              "Conecta miles de aplicaciones y automatiza tareas repetitivas sin programar.",
            precio: "Gratis / desde 19,99€ mes",
            valoracion: 4.5,
            idealPara: "Equipos que quieren automatizar rápido sin IT",
            pros: ["Más de 6.000 integraciones", "Muy fácil de usar", "Plantillas predefinidas"],
            contras: ["Se encarece con el volumen de tareas", "Flujos complejos pueden ser lentos"],
            url: "https://zapier.com/",
          },
          {
            id: "make",
            nombre: "Make",
            descripcion:
              "Automatización visual de procesos con flujos avanzados y lógica condicional.",
            precio: "Gratis / desde 9€ mes",
            valoracion: 4.6,
            idealPara: "Equipos técnicos que necesitan flujos complejos",
            pros: ["Muy flexible y potente", "Buena relación calidad-precio", "Editor visual claro"],
            contras: ["Curva de aprendizaje mayor que Zapier", "Menos integraciones nativas"],
            url: "https://www.make.com/",
          },
          {
            id: "n8n",
            nombre: "n8n",
            descripcion:
              "Herramienta de automatización open source, autoalojable o en la nube.",
            precio: "Gratis (self-hosted) / desde 20€ mes",
            valoracion: 4.5,
            idealPara: "Empresas con equipo técnico que buscan control total",
            pros: ["Open source", "Sin límite de operaciones si es self-hosted", "Muy personalizable"],
            contras: ["Requiere conocimientos técnicos", "Mantenimiento propio si es self-hosted"],
            url: "https://n8n.io/",
          },
        ],
      },
      {
        id: "gestion-documentos",
        nombre: "Firma y gestión documental",
        descripcion: "Automatiza la firma, envío y archivo de documentos.",
        herramientas: [
          {
            id: "docusign",
            nombre: "DocuSign",
            descripcion: "Firma electrónica líder del mercado con flujos de aprobación.",
            precio: "Desde 10€ mes",
            valoracion: 4.5,
            idealPara: "Empresas de cualquier tamaño que gestionan contratos",
            pros: ["Validez legal reconocida globalmente", "Integraciones amplias", "Muy fiable"],
            contras: ["Precio elevado en planes avanzados", "Interfaz algo anticuada"],
            url: "https://www.docusign.com/",
          },
          {
            id: "signaturit",
            nombre: "Signaturit",
            descripcion: "Firma electrónica europea con foco en cumplimiento normativo.",
            precio: "Desde 24€ mes",
            valoracion: 4.4,
            idealPara: "Empresas europeas que priorizan RGPD",
            pros: ["Cumplimiento normativo europeo", "Soporte en español", "API sencilla"],
            contras: ["Menos conocida internacionalmente", "Planes con límite de envíos"],
            url: "https://www.signaturit.com/",
          },
          {
            id: "pandadoc",
            nombre: "PandaDoc",
            descripcion: "Creación, envío y firma de propuestas y contratos en un solo flujo.",
            precio: "Desde 19€ / usuario / mes",
            valoracion: 4.3,
            idealPara: "Equipos comerciales que envían propuestas",
            pros: ["Editor de documentos integrado", "Plantillas de propuestas", "Seguimiento de apertura"],
            contras: ["Plan gratuito muy limitado", "Precio por usuario puede sumar rápido"],
            url: "https://www.pandadoc.com/",
          },
        ],
      },
    ],
  },
  {
    id: "ahorrar-tiempo",
    titulo: "Ahorrar tiempo",
    descripcion: "Recupera horas de trabajo con IA y herramientas de productividad.",
    icono: "⏱️",
    categorias: [
      {
        id: "asistentes-ia",
        nombre: "Asistentes de IA",
        descripcion: "Genera contenido, resume información y responde dudas al instante.",
        herramientas: [
          {
            id: "claude",
            nombre: "Claude",
            descripcion:
              "Asistente de IA de Anthropic para escribir, analizar documentos y programar.",
            precio: "Gratis / desde 18€ mes",
            valoracion: 4.8,
            idealPara: "Equipos que necesitan analizar documentos largos y programar",
            pros: ["Excelente comprensión de contexto largo", "Muy fiable en tareas complejas", "Buena integración con herramientas de código"],
            contras: ["Sin generación de imágenes nativa", "Disponibilidad de voz limitada"],
            url: "https://claude.com/",
          },
          {
            id: "chatgpt",
            nombre: "ChatGPT",
            descripcion:
              "Asistente de IA de OpenAI para redacción, análisis y automatización de tareas.",
            precio: "Gratis / desde 20€ mes",
            valoracion: 4.7,
            idealPara: "Uso general y creación de contenido multimedia",
            pros: ["Muy versátil", "Genera imágenes y voz", "Amplio ecosistema de plugins"],
            contras: ["Puede perder precisión en contextos muy largos", "Límites de uso en plan gratuito"],
            url: "https://chatgpt.com/",
          },
          {
            id: "notion-ai",
            nombre: "Notion AI",
            descripcion: "IA integrada directamente en tu espacio de notas y documentos.",
            precio: "Desde 10€ / usuario / mes",
            valoracion: 4.3,
            idealPara: "Equipos que ya usan Notion para organizarse",
            pros: ["Integrado en el flujo de trabajo diario", "Resúmenes y redacción rápida", "Colaborativo"],
            contras: ["Requiere usar Notion como base", "Menos potente que asistentes dedicados"],
            url: "https://www.notion.so/product/ai",
          },
        ],
      },
      {
        id: "gestion-tiempo",
        nombre: "Gestión del tiempo y calendarios",
        descripcion: "Optimiza reuniones y planificación diaria automáticamente.",
        herramientas: [
          {
            id: "calendly",
            nombre: "Calendly",
            descripcion: "Automatiza la reserva de reuniones evitando el ida y vuelta de correos.",
            precio: "Gratis / desde 10€ mes",
            valoracion: 4.6,
            idealPara: "Cualquier empresa que agenda reuniones con clientes",
            pros: ["Muy fácil de configurar", "Se integra con la mayoría de calendarios", "Reduce fricción para el cliente"],
            contras: ["Funciones de equipo solo en planes de pago", "Personalización limitada en plan gratuito"],
            url: "https://calendly.com/",
          },
          {
            id: "reclaim",
            nombre: "Reclaim.ai",
            descripcion: "Planifica automáticamente tu semana priorizando tareas y hábitos.",
            precio: "Gratis / desde 8€ mes",
            valoracion: 4.5,
            idealPara: "Equipos que quieren proteger tiempo de trabajo profundo",
            pros: ["Reordena el calendario automáticamente", "Protege bloques de foco", "Se integra con Google Calendar"],
            contras: ["Solo funciona con Google Calendar", "Menos útil para equipos grandes"],
            url: "https://reclaim.ai/",
          },
          {
            id: "clockwise",
            nombre: "Clockwise",
            descripcion: "Optimiza el calendario de todo el equipo para minimizar interrupciones.",
            precio: "Gratis / desde 6,75€ / usuario / mes",
            valoracion: 4.3,
            idealPara: "Equipos con muchas reuniones internas",
            pros: ["Optimización a nivel de equipo", "Detecta conflictos automáticamente", "Buena analítica de tiempo"],
            contras: ["Menos útil para autónomos", "Requiere adopción de todo el equipo"],
            url: "https://www.getclockwise.com/",
          },
        ],
      },
    ],
  },
  {
    id: "organizar-empresa",
    titulo: "Organizar la empresa",
    descripcion: "Centraliza proyectos, tareas y documentación de tu equipo.",
    icono: "🗂️",
    categorias: [
      {
        id: "gestion-proyectos",
        nombre: "Gestión de proyectos",
        descripcion: "Planifica, asigna y sigue el avance de tareas y proyectos.",
        herramientas: [
          {
            id: "asana",
            nombre: "Asana",
            descripcion: "Organiza proyectos y tareas con vistas de lista, tablero y calendario.",
            precio: "Gratis / desde 10,99€ / usuario / mes",
            valoracion: 4.5,
            idealPara: "Equipos de cualquier tamaño que gestionan proyectos",
            pros: ["Interfaz muy intuitiva", "Múltiples vistas de trabajo", "Buenas automatizaciones"],
            contras: ["Reportes avanzados solo en planes altos", "Puede saturarse con muchos proyectos"],
            url: "https://asana.com/",
          },
          {
            id: "trello",
            nombre: "Trello",
            descripcion: "Tableros Kanban simples y visuales para organizar cualquier tipo de trabajo.",
            precio: "Gratis / desde 5€ / usuario / mes",
            valoracion: 4.4,
            idealPara: "Equipos pequeños o proyectos sencillos",
            pros: ["Muy fácil de aprender", "Ideal para Kanban", "Muchos power-ups"],
            contras: ["Limitado para proyectos complejos", "Sin diagrama de Gantt nativo"],
            url: "https://trello.com/",
          },
          {
            id: "monday",
            nombre: "monday.com",
            descripcion: "Plataforma de trabajo altamente personalizable para gestionar cualquier proceso.",
            precio: "Desde 9€ / usuario / mes",
            valoracion: 4.5,
            idealPara: "Empresas que necesitan flujos de trabajo a medida",
            pros: ["Muy personalizable", "Automatizaciones potentes", "Buenas plantillas por sector"],
            contras: ["Precio mínimo de usuarios elevado", "Puede requerir configuración inicial larga"],
            url: "https://monday.com/",
          },
        ],
      },
      {
        id: "documentacion-interna",
        nombre: "Documentación y conocimiento interno",
        descripcion: "Centraliza procesos, wikis y documentación del equipo.",
        herramientas: [
          {
            id: "notion",
            nombre: "Notion",
            descripcion: "Espacio de trabajo todo en uno para notas, wikis y bases de datos.",
            precio: "Gratis / desde 8€ / usuario / mes",
            valoracion: 4.6,
            idealPara: "Equipos que quieren centralizar toda su información",
            pros: ["Extremadamente flexible", "Buena plantilla inicial", "Colaboración en tiempo real"],
            contras: ["Puede volverse desorganizado sin disciplina", "Rendimiento lento en bases grandes"],
            url: "https://www.notion.so/",
          },
          {
            id: "confluence",
            nombre: "Confluence",
            descripcion: "Wiki corporativa de Atlassian, integrada con Jira.",
            precio: "Gratis / desde 5,16€ / usuario / mes",
            valoracion: 4.2,
            idealPara: "Empresas que ya usan el ecosistema Atlassian",
            pros: ["Gran integración con Jira", "Control de permisos robusto", "Buen historial de versiones"],
            contras: ["Interfaz menos moderna", "Curva de aprendizaje para equipos no técnicos"],
            url: "https://www.atlassian.com/software/confluence",
          },
          {
            id: "clickup",
            nombre: "ClickUp",
            descripcion: "Combina documentos, tareas y objetivos en una sola plataforma.",
            precio: "Gratis / desde 7€ / usuario / mes",
            valoracion: 4.4,
            idealPara: "Empresas que quieren sustituir varias herramientas por una",
            pros: ["Todo en uno: docs, tareas, objetivos", "Muy completo por el precio", "Alta personalización"],
            contras: ["Exceso de opciones puede abrumar", "Algo de curva de aprendizaje"],
            url: "https://clickup.com/",
          },
        ],
      },
    ],
  },
  {
    id: "atencion-cliente",
    titulo: "Mejorar la atención al cliente",
    descripcion: "Responde más rápido y con mayor calidad a tus clientes.",
    icono: "💬",
    categorias: [
      {
        id: "helpdesk",
        nombre: "Soporte y helpdesk",
        descripcion: "Centraliza y organiza las consultas de tus clientes por múltiples canales.",
        herramientas: [
          {
            id: "zendesk",
            nombre: "Zendesk",
            descripcion: "Plataforma de atención al cliente líder con tickets, chat y IA.",
            precio: "Desde 19€ / agente / mes",
            valoracion: 4.5,
            idealPara: "Empresas medianas y grandes con soporte multicanal",
            pros: ["Muy completo y escalable", "Buenas automatizaciones con IA", "Amplio marketplace de apps"],
            contras: ["Precio elevado para equipos pequeños", "Configuración inicial compleja"],
            url: "https://www.zendesk.com/",
          },
          {
            id: "freshdesk",
            nombre: "Freshdesk",
            descripcion: "Software de atención al cliente fácil de implementar, con plan gratuito.",
            precio: "Gratis / desde 15€ / agente / mes",
            valoracion: 4.4,
            idealPara: "Pymes que empiezan a estructurar su soporte",
            pros: ["Plan gratuito útil", "Fácil de configurar", "Buena relación calidad-precio"],
            contras: ["Funciones de IA solo en planes altos", "Reportes básicos limitados"],
            url: "https://www.freshworks.com/freshdesk/",
          },
          {
            id: "intercom",
            nombre: "Intercom",
            descripcion: "Mensajería y soporte con chatbots de IA integrados para atención inmediata.",
            precio: "Desde 29€ / mes",
            valoracion: 4.4,
            idealPara: "Empresas SaaS que priorizan el chat en producto",
            pros: ["Chatbot de IA muy potente", "Excelente experiencia in-app", "Buena segmentación de usuarios"],
            contras: ["Precio puede escalar rápido", "Menos orientado a soporte telefónico"],
            url: "https://www.intercom.com/",
          },
        ],
      },
      {
        id: "chatbots",
        nombre: "Chatbots y respuesta automática",
        descripcion: "Atiende consultas frecuentes al instante, 24/7.",
        herramientas: [
          {
            id: "tidio",
            nombre: "Tidio",
            descripcion: "Chat en vivo y chatbots con IA fáciles de instalar en tu web.",
            precio: "Gratis / desde 29€ mes",
            valoracion: 4.5,
            idealPara: "Pequeños ecommerce y webs de servicios",
            pros: ["Muy fácil de instalar", "Plan gratuito generoso", "Chatbot con IA incluido"],
            contras: ["Personalización avanzada limitada", "Precio sube con el volumen de conversaciones"],
            url: "https://www.tidio.com/",
          },
          {
            id: "crisp",
            nombre: "Crisp",
            descripcion: "Chat multicanal (web, email, redes) con bandeja de entrada unificada.",
            precio: "Gratis / desde 25€ mes",
            valoracion: 4.5,
            idealPara: "Pymes que atienden por varios canales a la vez",
            pros: ["Bandeja de entrada unificada", "Buen plan gratuito", "Interfaz muy cuidada"],
            contras: ["Menos integraciones que competidores grandes", "Chatbot con IA en planes de pago"],
            url: "https://crisp.chat/",
          },
          {
            id: "drift",
            nombre: "Drift",
            descripcion: "Chat conversacional enfocado en cualificar leads y agendar reuniones.",
            precio: "Bajo consulta",
            valoracion: 4.2,
            idealPara: "Equipos de ventas B2B con tráfico web relevante",
            pros: ["Muy orientado a conversión de leads", "Buenas integraciones con CRMs", "Enrutamiento inteligente de conversaciones"],
            contras: ["Precio no público, requiere contacto comercial", "Menos pensado para soporte postventa"],
            url: "https://www.drift.com/",
          },
        ],
      },
    ],
  },
];

export function getProblema(id: string): Problema | undefined {
  return problemas.find((p) => p.id === id);
}

export function getCategoria(
  problemaId: string,
  categoriaId: string
): { problema: Problema; categoria: Categoria } | undefined {
  const problema = getProblema(problemaId);
  const categoria = problema?.categorias.find((c) => c.id === categoriaId);
  if (!problema || !categoria) return undefined;
  return { problema, categoria };
}
