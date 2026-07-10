import type { RangoEmpleados } from "./cuestionario";

/**
 * Fuente de datos del motor de recomendaciones V1.
 *
 * Esto hace de "base de datos" de recomendaciones mientras no exista una IA
 * o un backend real. El motor (`lib/recomendaciones.ts`) solo lee de aquí,
 * así que el día de mañana basta con sustituir esta función/fichero por una
 * llamada a una IA o a una base de datos, sin tocar quien la consume.
 */
export type HerramientaRecomendada = {
  id: string;
  nombre: string;
  categoria: string;
  descripcionCorta: string;
  precioInicial: string;
  /** Exactamente 3 ventajas, para la tarjeta de recomendación. */
  ventajas: [string, string, string];
  url: string;
  /** Tamaños de empresa para los que esta herramienta encaja mejor. */
  tamanosIdeales: RangoEmpleados[];
};

export type ProblemaRecomendaciones = {
  problemaId: string;
  categorias: string[];
  herramientas: HerramientaRecomendada[];
  /** 3 beneficios de negocio (no técnicos) al resolver este problema. */
  beneficios: [string, string, string];
  /** Frase de acción concreta, en minúscula, para completar "Empieza con [precio] de [herramienta] y ___". */
  accionSugerida: string;
};

export const recomendacionesPorProblema: ProblemaRecomendaciones[] = [
  {
    problemaId: "conseguir-clientes",
    categorias: ["CRM", "Email Marketing", "Automatización", "Publicidad"],
    beneficios: [
      "No perder clientes potenciales",
      "Hacer seguimiento de cada oportunidad",
      "Ahorrar tiempo en la gestión comercial",
    ],
    accionSugerida: "crea tu primer embudo de clientes",
    herramientas: [
      {
        id: "hubspot",
        nombre: "HubSpot",
        categoria: "CRM",
        descripcionCorta:
          "CRM gratuito con marketing, ventas y atención al cliente integrados.",
        precioInicial: "Gratis",
        ventajas: [
          "Plan gratuito muy completo",
          "Fácil de usar desde el primer día",
          "Gran ecosistema de integraciones",
        ],
        url: "https://www.hubspot.com/products/crm",
        tamanosIdeales: ["1-10", "11-50"],
      },
      {
        id: "pipedrive",
        nombre: "Pipedrive",
        categoria: "CRM",
        descripcionCorta:
          "CRM visual centrado en el pipeline de ventas para equipos comerciales.",
        precioInicial: "Desde 14€/mes",
        ventajas: [
          "Interfaz muy visual",
          "Automatizaciones sencillas",
          "Buen soporte al cliente",
        ],
        url: "https://www.pipedrive.com/",
        tamanosIdeales: ["1-10", "11-50", "51-200"],
      },
      {
        id: "brevo",
        nombre: "Brevo",
        categoria: "Email Marketing",
        descripcionCorta:
          "Marketing por email, SMS y chat con precios pensados para pymes.",
        precioInicial: "Gratis",
        ventajas: [
          "Precio basado en envíos, no en contactos",
          "Incluye SMS además de email",
          "Buen plan gratuito para empezar",
        ],
        url: "https://www.brevo.com/",
        tamanosIdeales: ["1-10", "11-50"],
      },
      {
        id: "activecampaign",
        nombre: "ActiveCampaign",
        categoria: "Automatización",
        descripcionCorta:
          "Automatización de marketing avanzada con CRM y segmentación potente.",
        precioInicial: "Desde 15€/mes",
        ventajas: [
          "Automatizaciones muy potentes",
          "Segmentación avanzada de clientes",
          "CRM incluido en el mismo plan",
        ],
        url: "https://www.activecampaign.com/",
        tamanosIdeales: ["11-50", "51-200", "200+"],
      },
    ],
  },
  {
    problemaId: "automatizar-tareas",
    categorias: [
      "Automatización de flujos",
      "Firma electrónica",
      "Integraciones",
      "Documentación",
    ],
    beneficios: [
      "Dejar de repetir tareas manuales cada semana",
      "Reducir errores humanos en procesos clave",
      "Liberar tiempo de tu equipo para tareas de valor",
    ],
    accionSugerida: "automatiza tu primera tarea repetitiva",
    herramientas: [
      {
        id: "zapier",
        nombre: "Zapier",
        categoria: "Automatización de flujos",
        descripcionCorta:
          "Conecta miles de aplicaciones y automatiza tareas repetitivas sin programar.",
        precioInicial: "Gratis",
        ventajas: [
          "Más de 6.000 integraciones",
          "Muy fácil de usar",
          "Plantillas listas para empezar",
        ],
        url: "https://zapier.com/",
        tamanosIdeales: ["1-10", "11-50"],
      },
      {
        id: "make",
        nombre: "Make",
        categoria: "Automatización de flujos",
        descripcionCorta:
          "Automatización visual de procesos con flujos avanzados y lógica condicional.",
        precioInicial: "Desde 9€/mes",
        ventajas: [
          "Muy flexible y potente",
          "Buena relación calidad-precio",
          "Editor visual claro",
        ],
        url: "https://www.make.com/",
        tamanosIdeales: ["11-50", "51-200"],
      },
      {
        id: "n8n",
        nombre: "n8n",
        categoria: "Integraciones",
        descripcionCorta:
          "Automatización open source, autoalojable o en la nube, con control total.",
        precioInicial: "Gratis (self-hosted)",
        ventajas: [
          "Open source",
          "Sin límite de operaciones si es self-hosted",
          "Muy personalizable",
        ],
        url: "https://n8n.io/",
        tamanosIdeales: ["51-200", "200+"],
      },
      {
        id: "docusign",
        nombre: "DocuSign",
        categoria: "Firma electrónica",
        descripcionCorta:
          "Firma electrónica líder del mercado con flujos de aprobación.",
        precioInicial: "Desde 10€/mes",
        ventajas: [
          "Validez legal reconocida globalmente",
          "Integraciones amplias",
          "Muy fiable a cualquier escala",
        ],
        url: "https://www.docusign.com/",
        tamanosIdeales: ["1-10", "11-50", "51-200", "200+"],
      },
    ],
  },
  {
    problemaId: "ahorrar-tiempo",
    categorias: [
      "Asistentes de IA",
      "Gestión del tiempo",
      "Calendarios",
      "Productividad",
    ],
    beneficios: [
      "Recuperar horas cada semana para lo importante",
      "Responder y decidir más rápido",
      "Reducir el trabajo administrativo del día a día",
    ],
    accionSugerida: "prueba tu primer caso de uso con una tarea real",
    herramientas: [
      {
        id: "claude",
        nombre: "Claude",
        categoria: "Asistentes de IA",
        descripcionCorta:
          "Asistente de IA de Anthropic para escribir, analizar documentos y programar.",
        precioInicial: "Gratis",
        ventajas: [
          "Excelente comprensión de contexto largo",
          "Muy fiable en tareas complejas",
          "Buena integración con herramientas de código",
        ],
        url: "https://claude.com/",
        tamanosIdeales: ["1-10", "11-50", "51-200", "200+"],
      },
      {
        id: "chatgpt",
        nombre: "ChatGPT",
        categoria: "Asistentes de IA",
        descripcionCorta:
          "Asistente de IA de OpenAI para redacción, análisis y automatización.",
        precioInicial: "Gratis",
        ventajas: [
          "Muy versátil",
          "Genera imágenes y voz",
          "Amplio ecosistema de plugins",
        ],
        url: "https://chatgpt.com/",
        tamanosIdeales: ["1-10", "11-50", "51-200", "200+"],
      },
      {
        id: "notion-ai",
        nombre: "Notion AI",
        categoria: "Productividad",
        descripcionCorta:
          "IA integrada directamente en tu espacio de notas y documentos.",
        precioInicial: "Desde 10€/usuario/mes",
        ventajas: [
          "Integrado en el flujo de trabajo diario",
          "Resúmenes y redacción rápida",
          "Colaborativo en tiempo real",
        ],
        url: "https://www.notion.so/product/ai",
        tamanosIdeales: ["11-50", "51-200"],
      },
      {
        id: "calendly",
        nombre: "Calendly",
        categoria: "Calendarios",
        descripcionCorta:
          "Automatiza la reserva de reuniones evitando el ida y vuelta de correos.",
        precioInicial: "Gratis",
        ventajas: [
          "Muy fácil de configurar",
          "Se integra con la mayoría de calendarios",
          "Reduce la fricción para el cliente",
        ],
        url: "https://calendly.com/",
        tamanosIdeales: ["1-10", "11-50"],
      },
    ],
  },
  {
    problemaId: "organizar-empresa",
    categorias: ["Gestión de proyectos", "Documentación", "Comunicación", "Tareas"],
    beneficios: [
      "Tener toda la información en un solo lugar",
      "Evitar que se pierdan tareas o decisiones",
      "Facilitar la colaboración de todo el equipo",
    ],
    accionSugerida: "crea tu primer proyecto o tablero",
    herramientas: [
      {
        id: "asana",
        nombre: "Asana",
        categoria: "Gestión de proyectos",
        descripcionCorta:
          "Organiza proyectos y tareas con vistas de lista, tablero y calendario.",
        precioInicial: "Gratis",
        ventajas: [
          "Interfaz muy intuitiva",
          "Múltiples vistas de trabajo",
          "Buenas automatizaciones",
        ],
        url: "https://asana.com/",
        tamanosIdeales: ["1-10", "11-50", "51-200"],
      },
      {
        id: "trello",
        nombre: "Trello",
        categoria: "Tareas",
        descripcionCorta:
          "Tableros Kanban simples y visuales para organizar cualquier tipo de trabajo.",
        precioInicial: "Gratis",
        ventajas: [
          "Muy fácil de aprender",
          "Ideal para Kanban",
          "Muchos power-ups disponibles",
        ],
        url: "https://trello.com/",
        tamanosIdeales: ["1-10", "11-50"],
      },
      {
        id: "monday",
        nombre: "monday.com",
        categoria: "Gestión de proyectos",
        descripcionCorta:
          "Plataforma de trabajo altamente personalizable para cualquier proceso.",
        precioInicial: "Desde 9€/usuario/mes",
        ventajas: [
          "Muy personalizable",
          "Automatizaciones potentes",
          "Buenas plantillas por sector",
        ],
        url: "https://monday.com/",
        tamanosIdeales: ["51-200", "200+"],
      },
      {
        id: "notion",
        nombre: "Notion",
        categoria: "Documentación",
        descripcionCorta:
          "Espacio de trabajo todo en uno para notas, wikis y bases de datos.",
        precioInicial: "Gratis",
        ventajas: [
          "Extremadamente flexible",
          "Buenas plantillas iniciales",
          "Colaboración en tiempo real",
        ],
        url: "https://www.notion.so/",
        tamanosIdeales: ["1-10", "11-50"],
      },
    ],
  },
  {
    problemaId: "atencion-cliente",
    categorias: [
      "Helpdesk",
      "Chat en vivo",
      "Chatbots",
      "Automatización de soporte",
    ],
    beneficios: [
      "Responder a tus clientes más rápido",
      "No dejar ninguna consulta sin respuesta",
      "Mejorar la experiencia y fidelidad del cliente",
    ],
    accionSugerida: "conecta tu primer canal de atención",
    herramientas: [
      {
        id: "zendesk",
        nombre: "Zendesk",
        categoria: "Helpdesk",
        descripcionCorta:
          "Plataforma de atención al cliente líder con tickets, chat y IA.",
        precioInicial: "Desde 19€/agente/mes",
        ventajas: [
          "Muy completo y escalable",
          "Buenas automatizaciones con IA",
          "Amplio marketplace de apps",
        ],
        url: "https://www.zendesk.com/",
        tamanosIdeales: ["51-200", "200+"],
      },
      {
        id: "freshdesk",
        nombre: "Freshdesk",
        categoria: "Helpdesk",
        descripcionCorta:
          "Software de atención al cliente fácil de implementar, con plan gratuito.",
        precioInicial: "Gratis",
        ventajas: [
          "Plan gratuito útil",
          "Fácil de configurar",
          "Buena relación calidad-precio",
        ],
        url: "https://www.freshworks.com/freshdesk/",
        tamanosIdeales: ["1-10", "11-50"],
      },
      {
        id: "intercom",
        nombre: "Intercom",
        categoria: "Chatbots",
        descripcionCorta:
          "Mensajería y soporte con chatbots de IA integrados para atención inmediata.",
        precioInicial: "Desde 29€/mes",
        ventajas: [
          "Chatbot de IA muy potente",
          "Excelente experiencia in-app",
          "Buena segmentación de usuarios",
        ],
        url: "https://www.intercom.com/",
        tamanosIdeales: ["11-50", "51-200"],
      },
      {
        id: "tidio",
        nombre: "Tidio",
        categoria: "Chat en vivo",
        descripcionCorta:
          "Chat en vivo y chatbots con IA fáciles de instalar en tu web.",
        precioInicial: "Gratis",
        ventajas: [
          "Muy fácil de instalar",
          "Plan gratuito generoso",
          "Chatbot con IA incluido",
        ],
        url: "https://www.tidio.com/",
        tamanosIdeales: ["1-10", "11-50"],
      },
    ],
  },
];

export function getRecomendacionesDeProblema(
  problemaId: string
): ProblemaRecomendaciones | undefined {
  return recomendacionesPorProblema.find((p) => p.problemaId === problemaId);
}
