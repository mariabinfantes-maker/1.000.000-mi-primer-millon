import { SUBTIPOS_POR_CATEGORIA } from "@/data/taxonomia";

/**
 * Contenido editorial de cada subtipo — escrito a mano, nunca generado.
 *
 * Por qué existe este fichero en vez de derivar el texto del catálogo, como
 * hace el resto de este agente: una página de subtipo con una frase
 * plantilla ("Las mejores herramientas de X para tu empresa") y la lista de
 * fichas debajo es exactamente el contenido pobre que Google penaliza y que
 * a una persona no le resuelve nada. Seis páginas así serían seis copias
 * cambiando una palabra.
 *
 * Lo que de verdad distingue a un subtipo de otro no está en ningún campo
 * de `Herramienta`: es el EJE por el que se decide. En vídeo el eje es "¿ya
 * tienes metraje o partes de cero?"; en agenda es "¿quién decide a qué hora
 * haces cada cosa, tú o la herramienta?". Ese eje hay que escribirlo, y por
 * eso este contenido es editorial y se revisa a mano cuando cambia el
 * subtipo — igual que `data/blog/`, no como el sitemap.
 *
 * Regla de mantenimiento: si un subtipo nuevo entra en
 * `SUBTIPOS_POR_CATEGORIA` sin su entrada aquí, `subtiposConContenido()` no
 * lo publica y la prueba de cobertura falla. Antes no publicar una página
 * que publicar una vacía.
 */

export type ContenidoSubtipo = {
  /** Encabezado de la página. Distinto del nombre corto del selector. */
  titulo: string;
  /** `<title>` y base de la descripción social. */
  tituloSeo: string;
  descripcionSeo: string;
  /** Primer párrafo: qué es esto y por qué es un grupo aparte. */
  entradilla: string;
  /** El eje real de decisión del subtipo — lo que de verdad separa a unas de otras. */
  ejeDeDecision: { titulo: string; texto: string };
  /** Tres criterios concretos, en forma de pregunta que la persona pueda responderse. */
  comoElegir: { pregunta: string; explicacion: string }[];
  /** Un error caro y específico de este subtipo. Nunca genérico. */
  errorHabitual: string;
};

const CONTENIDO: Record<string, ContenidoSubtipo> = {
  escritura: {
    titulo: "IA para escritura y contenido",
    tituloSeo: "IA para escribir y corregir textos: 3 herramientas comparadas",
    descripcionSeo:
      "Corregir lo que ya escribes no es lo mismo que generar textos desde cero. Comparamos las herramientas de escritura con IA según lo que necesitas de verdad, con precios y disponibilidad en español.",
    entradilla:
      "Bajo la etiqueta «IA para escribir» conviven dos productos que resuelven problemas opuestos. Uno vigila lo que tú escribes y lo mejora; el otro escribe por ti a partir de una instrucción. Confundirlos es la razón más común de acabar pagando por algo que no se usa.",
    ejeDeDecision: {
      titulo: "¿Corriges o creas?",
      texto:
        "Si el problema es que escribes bien pero despacio, o que el tono no siempre acierta, lo que necesitas es un corrector que viva donde ya escribes: el correo, el navegador, el documento. Si el problema es la página en blanco y el volumen —descripciones de producto, anuncios, correos de campaña—, necesitas un generador con plantillas y memoria de la voz de tu marca. Son categorías de compra distintas, y ninguna hace bien el trabajo de la otra.",
    },
    comoElegir: [
      {
        pregunta: "¿Escribes en español o traduces al inglés?",
        explicacion:
          "La calidad de estas herramientas en español es sensiblemente menor que en inglés, y varía mucho entre ellas. Antes de contratar nada, prueba con un texto real tuyo, no con el ejemplo de la web.",
      },
      {
        pregunta: "¿Lo va a usar una persona o un equipo?",
        explicacion:
          "En equipo importa poder fijar una voz de marca compartida y que todo el mundo escriba igual. En solitario eso es peso muerto que encarece la licencia.",
      },
      {
        pregunta: "¿Dónde escribes realmente?",
        explicacion:
          "Una herramienta que exige copiar y pegar en otra pestaña se abandona en dos semanas. Comprueba que se integre en el sitio donde ya trabajas antes que cualquier otra función.",
      },
    ],
    errorHabitual:
      "Contratar un generador de contenido caro cuando lo que fallaba era la revisión. Si tus textos salen bien pero tardan, un corrector cuesta una fracción y resuelve el problema real.",
  },

  video: {
    titulo: "IA para vídeo y audio",
    tituloSeo: "Crear vídeo con IA: 3 herramientas comparadas para empresas",
    descripcionSeo:
      "Editar tu propio metraje y generar vídeo sin cámara son cosas distintas. Comparamos las opciones de vídeo con IA según si ya grabas o partes de cero, con precios y soporte de español.",
    entradilla:
      "El vídeo con inteligencia artificial se ha partido en dos ramas que no compiten entre sí. Una acelera el montaje de material que tú ya has grabado. La otra genera el vídeo entero, con una persona que no existe, a partir de un guion escrito. La elección depende de si tienes cámara y tiempo, o no.",
    ejeDeDecision: {
      titulo: "¿Tienes metraje propio o partes de cero?",
      texto:
        "Si grabas —formaciones, pódcast, demostraciones—, lo que ahorra horas es editar el vídeo editando el texto de la transcripción: borras una frase y desaparece del vídeo. Si no vas a grabar nunca, porque no hay tiempo, equipo ni ganas de salir en cámara, lo que necesitas es un avatar que lea tu guion. La segunda rama además traduce: la misma pieza en varios idiomas sin volver a grabar.",
    },
    comoElegir: [
      {
        pregunta: "¿La credibilidad depende de que se vea a alguien real?",
        explicacion:
          "Para material comercial de marca, un avatar sintético puede restar confianza. Para formación interna, manuales de producto o procedimientos, nadie lo echa de menos y el ahorro es enorme.",
      },
      {
        pregunta: "¿Cuántos minutos al mes vas a producir?",
        explicacion:
          "Casi todas cobran por créditos o minutos, no por vídeos. Diez minutos mensuales de avatar pueden agotar un plan de gama media. Calcula minutos antes de comparar precios.",
      },
      {
        pregunta: "¿Vas a necesitar el mismo vídeo en varios idiomas?",
        explicacion:
          "Si vendes o formas fuera de España, la traducción con sincronización labial cambia por completo la economía del vídeo: una grabación sirve para todos los mercados.",
      },
    ],
    errorHabitual:
      "Pagar un plan anual de generación con avatares para descubrir que lo único que hacía falta era recortar los silencios de vídeos ya grabados. Son productos distintos con precios muy distintos.",
  },

  "reuniones-transcripcion": {
    titulo: "IA para reuniones y transcripción",
    tituloSeo: "Transcribir reuniones con IA: 4 herramientas comparadas",
    descripcionSeo:
      "Transcribir, resumir y extraer tareas de una reunión no es lo mismo que limpiar el ruido del audio. Comparamos las herramientas según el problema real, con integraciones y aviso sobre consentimiento.",
    entradilla:
      "Aquí caben dos necesidades que suenan parecidas y no lo son. Una es no volver a tomar notas: que alguien transcriba, resuma y saque los acuerdos. La otra es que la llamada se oiga bien: que no se cuele la obra de la calle ni el teclado. Algunas herramientas hacen las dos cosas, pero cada una nace de un lado.",
    ejeDeDecision: {
      titulo: "¿El problema es la memoria o el ruido?",
      texto:
        "Si al terminar una reunión nadie recuerda quién se comprometió a qué, necesitas transcripción con resumen y extracción de tareas, y que eso aterrice donde trabajas: el CRM, el gestor de proyectos, el canal del equipo. Si el problema es que te oyen mal desde casa o desde un espacio compartido, lo que necesitas es cancelación de ruido en tiempo real, que actúa durante la llamada y no después.",
    },
    comoElegir: [
      {
        pregunta: "¿Con qué tiene que hablar después?",
        explicacion:
          "Una transcripción que se queda en su propia aplicación se lee una vez y se olvida. El valor aparece cuando el resumen entra solo en el CRM o crea las tareas en el gestor de proyectos que ya usas.",
      },
      {
        pregunta: "¿Reuniones en español, y con qué acentos?",
        explicacion:
          "La precisión en español peninsular varía bastante entre proveedores y baja con audio malo o varias personas hablando a la vez. Pruébalo con una reunión real antes de contratar.",
      },
      {
        pregunta: "¿Has resuelto el consentimiento?",
        explicacion:
          "Grabar y transcribir una reunión con clientes o personal implica tratar datos personales. En España conviene avisar al principio de la llamada y dejar constancia. Es un requisito legal, no una cortesía.",
      },
    ],
    errorHabitual:
      "Implantar transcripción automática sin avisar a los asistentes. Además del problema legal, destruye la confianza de la reunión el día que alguien se entera por casualidad.",
  },

  "agenda-planificacion": {
    titulo: "IA para agenda y planificación",
    tituloSeo: "Organizar tu agenda con IA: 3 herramientas comparadas",
    descripcionSeo:
      "Desde una lista de tareas que recuerda hasta un calendario que se reorganiza solo. Comparamos las herramientas de planificación con IA según cuánto control quieras ceder, con precios y planes gratuitos.",
    entradilla:
      "Todas prometen que llegarás a todo, pero se diferencian en algo muy concreto: quién decide a qué hora haces cada cosa. En un extremo, tú planificas y la herramienta solo recuerda. En el otro, la herramienta mira tu calendario, tus prioridades y tus huecos, y coloca el trabajo por ti, moviéndolo cuando surge un imprevisto.",
    ejeDeDecision: {
      titulo: "¿Quieres ceder el control del calendario?",
      texto:
        "Ceder el control funciona muy bien si tu día se llena de reuniones ajenas y necesitas que alguien defienda los huecos de trabajo concentrado. Funciona mal si tu jornada es irregular o si te incomoda que el calendario cambie sin avisarte. Antes de pagar por reprogramación automática, pregúntate si el problema es la planificación o simplemente que las tareas no están escritas en ningún sitio.",
    },
    comoElegir: [
      {
        pregunta: "¿Es para ti o para coordinar a un equipo?",
        explicacion:
          "La planificación individual y la coordinación de varias agendas tienen precios muy distintos. Pagar licencias de equipo para uso personal multiplica el coste sin aportar nada.",
      },
      {
        pregunta: "¿Cuánto estás dispuesta a pagar al mes?",
        explicacion:
          "Este ámbito tiene el rango de precios más amplio de toda la categoría: hay opciones gratuitas perfectamente utilizables y opciones que cuestan varias veces más. La diferencia es automatización, no calidad.",
      },
      {
        pregunta: "¿Tu calendario es la fuente de la verdad?",
        explicacion:
          "Las herramientas que reorganizan el día necesitan ver tu calendario completo y real. Si tienes reuniones que no están apuntadas, tomarán decisiones sobre información falsa.",
      },
    ],
    errorHabitual:
      "Comprar reprogramación automática para arreglar un problema de captura. Si las tareas viven en tu cabeza y en post-its, ninguna IA puede planificarlas: primero hay que escribirlas.",
  },

  presentaciones: {
    titulo: "IA para presentaciones y documentos",
    tituloSeo: "Hacer presentaciones con IA: 3 herramientas comparadas",
    descripcionSeo:
      "Generar la presentación entera desde una instrucción no es lo mismo que automatizar el diseño de la tuya. Comparamos las opciones según qué parte del trabajo quieres delegar, con planes gratuitos y español.",
    entradilla:
      "Hacer una presentación son dos trabajos: decidir qué se cuenta y conseguir que se vea bien. Las herramientas de este grupo automatizan uno u otro, y saber cuál te sobra es toda la decisión. Delegar el contenido cuando ya lo tienes claro es perder el tiempo; pelearte con la maquetación cuando existe un motor que la resuelve, también.",
    ejeDeDecision: {
      titulo: "¿Qué parte quieres delegar: el contenido o el diseño?",
      texto:
        "Si partes de cero y lo que te bloquea es la estructura, hay herramientas que generan la presentación completa —guion, textos e imágenes— desde una sola instrucción, y luego tú corriges. Si ya sabes exactamente qué vas a decir y lo que te consume es cuadrar cajas, alinear títulos y que no se descoloque nada, lo que necesitas es un motor de maquetación que reajuste el diseño cada vez que editas.",
    },
    comoElegir: [
      {
        pregunta: "¿Tiene que exportar a PowerPoint?",
        explicacion:
          "En muchas empresas, y en casi cualquier proceso con administración pública o con un cliente grande, la presentación acaba viajando como archivo de PowerPoint. Comprueba la exportación antes que el catálogo de plantillas.",
      },
      {
        pregunta: "¿Necesitas que todo el equipo presente igual?",
        explicacion:
          "Las plantillas de marca bloqueadas —logotipo, colores y tipografías que nadie puede alterar— son lo que separa un plan individual de uno de equipo. Si presentáis varias personas a clientes, esto es lo que estás comprando.",
      },
      {
        pregunta: "¿La interfaz tiene que estar en español?",
        explicacion:
          "No todas están traducidas. Si la va a usar alguien que no trabaja en inglés con soltura, la falta de español descarta opciones que sobre el papel parecían mejores.",
      },
    ],
    errorHabitual:
      "Elegir por la belleza de las plantillas del escaparate y descubrir después que no hay plan gratuito para probar, que la interfaz solo está en inglés o que la exportación rompe el diseño.",
  },

  "espacio-trabajo": {
    titulo: "IA para tu espacio de trabajo",
    tituloSeo: "IA en tu espacio de trabajo: 3 opciones comparadas",
    descripcionSeo:
      "Una IA que responde sobre la información de tu propia empresa. Comparamos las opciones según dónde vive hoy tu documentación y cómo se factura cada complemento, con precios reales.",
    entradilla:
      "Estas herramientas no sirven para escribir mejor ni para hacer vídeos: sirven para preguntar en lenguaje natural sobre lo que tu empresa ya tiene escrito. «¿En qué estado está el proyecto de septiembre?», «resume lo que se acordó con este cliente». La respuesta sale de tus propias notas, tareas y documentos.",
    ejeDeDecision: {
      titulo: "¿Dónde vive hoy la información de tu empresa?",
      texto:
        "Esta es la única pregunta que importa, y responde por sí sola casi toda la decisión. Estas herramientas solo son útiles sobre la documentación que ya tienes dentro de esa plataforma concreta; fuera de ella no sirven de nada. Si tu equipo ya trabaja en una, el complemento de IA de esa plataforma es la opción natural. Si tu información está repartida entre correos, hojas de cálculo y carpetas, aún no tienes el problema que estas herramientas resuelven: primero hay que centralizarla.",
    },
    comoElegir: [
      {
        pregunta: "¿Cómo se factura el complemento?",
        explicacion:
          "Varios de estos complementos se cobran sobre TODAS las licencias de pago del espacio de trabajo, no solo sobre quienes vayan a usar la IA. En un equipo de diez personas eso puede duplicar la factura mensual aunque la usen dos.",
      },
      {
        pregunta: "¿Está tu documentación ordenada y al día?",
        explicacion:
          "La calidad de las respuestas depende por completo de lo ordenada que esté la información. Sobre una base desactualizada, la IA responde con seguridad cosas que ya no son ciertas, que es peor que no responder.",
      },
      {
        pregunta: "¿Estás dispuesta a migrar?",
        explicacion:
          "Si no usas ninguna de estas plataformas, existen opciones que traen el espacio de trabajo y la IA en el mismo producto y a un precio de entrada bajo. Es la vía razonable para empezar sin mover nada de lo que ya funciona.",
      },
    ],
    errorHabitual:
      "Contratar el complemento de IA de una plataforma que el equipo tiene abierta pero no usa de verdad. Si la documentación real sigue en el correo, la IA no tendrá nada que leer.",
  },
};

/** Contenido editorial de un subtipo, o `undefined` si todavía no se ha escrito. */
export function contenidoDeSubtipo(subtipoId: string): ContenidoSubtipo | undefined {
  return CONTENIDO[subtipoId];
}

/**
 * Subtipos publicables de una categoría: los que están en la taxonomía Y
 * tienen contenido editorial escrito. El orden es el de la taxonomía, que ya
 * agrupa los subtipos de forma deliberada.
 */
export function subtiposConContenido(categoriaId: string): { id: string; nombre: string }[] {
  return (SUBTIPOS_POR_CATEGORIA[categoriaId] ?? []).filter((subtipo) => Boolean(CONTENIDO[subtipo.id]));
}
