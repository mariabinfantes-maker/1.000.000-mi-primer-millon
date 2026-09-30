import type { RangoEmpleados } from "@/lib/cuestionario";

/**
 * Esquema de la base de conocimiento de Atlas.
 *
 * Esto define la FORMA de los datos, no los datos en sí. El contenido real
 * vive en archivos `.json` sueltos dentro de `data/herramientas/`, uno por
 * herramienta — nunca como objetos escritos directamente en código TypeScript.
 *
 * Por qué así: con cientos o miles de herramientas, un único archivo de
 * código se vuelve inmanejable (conflictos de fusión, difícil de validar,
 * imposible de editar sin tocar lógica). Con archivos JSON sueltos:
 *  - añadir una herramienta nueva es crear un archivo, no tocar código;
 *  - cada archivo se puede validar de forma independiente;
 *  - el día de mañana, migrar a una base de datos real (Postgres, Supabase,
 *    un CMS headless...) solo implica reescribir `data/repositorio.ts` — el
 *    resto de la aplicación sigue llamando a las mismas funciones
 *    (`getHerramientas`, `getHerramienta`, `getHerramientasPorCategoria`)
 *    sin enterarse del cambio.
 *
 * Deliberadamente NO incluye ningún dato de afiliación (programa, comisión,
 * plataforma de gestión...): eso vive en `data/esquemaInterno.ts` /
 * `data/afiliados/`, de uso exclusivo de los agentes internos de Atlas, y
 * nunca debe mezclarse con esta ficha pública.
 */

/** Escala 1-10 usada en todas las puntuaciones editoriales. */
export type Puntuacion1a10 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ModeloDePrecio =
  | "freemium"
  | "suscripcion_mensual"
  | "suscripcion_anual"
  | "pago_unico"
  | "por_usuario"
  | "a_medida";

export type EstadoHerramienta = "activo" | "descontinuado" | "en_revision";

/**
 * Añadido: módulos funcionales que una herramienta incluye de verdad,
 * pensado sobre todo para "plataformas-todo-en-uno" (una suite puede cubrir
 * CRM + proyectos + facturación a la vez) pero sin atarlo a esa categoría —
 * cualquier herramienta que combine varias funciones puede declararlos.
 * Vocabulario fijo y deliberadamente más amplio que `Categoria.id`: incluye
 * módulos (ej. "facturacion", "email_marketing") para los que Atlas todavía
 * no tiene una categoría propia, así queda representado el dato aunque el
 * catálogo aún no tenga una categoría dedicada para monetizarlo.
 */
/**
 * Añadido: condición de producto, eje independiente de la categoría
 * funcional (`Herramienta.categoriaId`).
 *
 *  - "suite": cubre de verdad varias funciones bajo un mismo producto y
 *    una misma base de datos. Se evalúa por integración, centralización,
 *    cobertura ÚTIL, calidad conjunta de sus módulos, administración,
 *    coste total y dependencia de un solo proveedor.
 *  - "especializada": resuelve una función a fondo. Se evalúa por
 *    profundidad, calidad en esa tarea, encaje sectorial, integraciones
 *    con terceros y ventaja frente al módulo equivalente de una suite.
 *
 * Declararse "suite" NO es gratis: Curator comprueba que haya módulos
 * reales detrás (`modulosIncluidos`) y avisa de quien reclama amplitud
 * que no tiene.
 */
export type TipoProducto = "suite" | "especializada";

export type ModuloSuite =
  | "crm"
  | "gestion_proyectos"
  | "asistente_ia"
  | "facturacion"
  | "email_marketing"
  | "atencion_cliente"
  | "embudos_de_venta"
  | "comercio_electronico"
  | "creador_de_sitios_web"
  | "recursos_humanos";

/**
 * Añadido: curva de aprendizaje inicial, en una escala categórica pensada
 * para mostrarse directamente en UI (una etiqueta, no un número). Es un eje
 * distinto de `puntuaciones.facilidadDeUso` (qué tal se usa en el día a día
 * una vez aprendida) y de `puntuaciones.nivelTecnicoRequerido` (cuánto
 * conocimiento técnico exige implantarla). Una herramienta puede ser fácil
 * de usar día a día y aun así tener una curva de aprendizaje dura al
 * principio (por la cantidad de opciones que hay que configurar primero).
 */
export type CurvaDeAprendizaje = "muy_facil" | "facil" | "media" | "dificil";

/**
 * Añadido: una categoría nueva no se publica el día que se declara. Nace
 * "pendiente" (existe para el catálogo interno, para que Curator la mida y
 * para que Researcher sepa qué investigar) y solo pasa a "publica" cuando
 * de verdad tiene alternativas suficientes que ofrecer — publicar una
 * categoría con una sola herramienta no es un comparador, es un anuncio.
 * El paso de "pendiente" a "publica" lo propone Curator y lo decide una
 * persona; nunca ocurre solo.
 *
 * Opcional a propósito: las cuatro categorías históricas no lo declaraban,
 * y `undefined` se trata como "publica" para no romperlas.
 */
/**
 * En qué punto está una casa.
 *
 *  - `publica`    — tiene página, entra en el sitemap y se ofrece como puerta.
 *  - `pendiente`  — declarada y esperando: le falta algo para abrirse, casi
 *                   siempre herramientas. «Clínicas y salud» estuvo aquí hasta
 *                   que entraron las suyas.
 *  - `desconectada` — **ya no espera nada.** Se dejó de usar por una decisión
 *                   escrita y se queda donde está, con su porqué, por si vuelve
 *                   a hacer falta. No se borra: «lo que no debe usarse se apaga
 *                   y se queda donde está, con una nota de por qué».
 *
 * El tercero nace el 2026-09-30, por esto de la propietaria: «no tenemos que
 * mostrar algo que nadie decidió que debería existir y sin embargo molesta
 * porque parece algo pendiente». `software-sectorial` llevaba desconectada
 * desde el 24 de septiembre y el único estado que había para decirlo era
 * `pendiente`, que significa lo contrario: que hay trabajo esperando.
 */
export type EstadoCategoria = "publica" | "pendiente" | "desconectada";

export type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  estado?: EstadoCategoria;
};

/**
 * Uno de los "problemas iniciales" de Atlas (ver ATLAS.md) — la puerta de
 * entrada "por objetivo" del cuestionario, independiente de `Categoria`
 * (un problema puede resolverse con herramientas de varias categorías).
 * Vive en `data/` porque es contenido editorial real, igual que
 * `Categoria` — nunca en `lib/`, donde antes convivía con un catálogo de
 * herramientas de prueba que nunca llegó a usarse en producción.
 */
export type Problema = {
  id: string;
  titulo: string;
  descripcion: string;
  /** Pregunta del cuestionario sobre la herramienta que ya usa la empresa para esto. */
  preguntaHerramienta: string;
  /**
   * Frases editoriales que delatan este objetivo en texto libre (ver
   * `agents/atlas-advisor/deteccionProblema.ts`). Alimentan la puerta
   * "Cuéntanoslo": si el texto del usuario contiene alguna, el motor
   * prioriza el catálogo por este `Problema.id` antes de puntuar, igual que
   * ya hace `problemaIdPrefill` cuando el usuario entra por objetivo
   * explícito. Coincidencia por subcadena, nunca semántica — si ninguna
   * frase aparece, el motor no descarta nada por su cuenta.
   */
  palabrasClave?: string[];
};

/**
 * Un párrafo, subtítulo o lista dentro del cuerpo de un `Post`. Bloques
 * estructurados en vez de HTML libre a propósito: igual que el resto del
 * esquema, el contenido es datos planos que cualquier página puede
 * renderizar de forma segura (sin `dangerouslySetInnerHTML`) y validar con
 * la misma disciplina que un campo de texto normal.
 */
export type BloqueContenido =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; items: string[] }
  /**
   * Una frase copiada LITERALMENTE de una fuente, con su dirección y el día en
   * que se leyó. `fuente` y `fecha` no son opcionales a propósito: una cita sin
   * fuente es una afirmación disfrazada, y es exactamente lo que Molnip no
   * hace. Si no se puede enlazar y fechar, va como párrafo y se escribe con
   * las palabras de Molnip.
   */
  | { tipo: "cita"; texto: string; fuente: string; fecha: string };

/**
 * Un artículo del blog SEO (Fase 4 de lanzamiento — ver ATLAS.md). Vive en
 * `data/posts/`, un archivo por post, igual que `data/herramientas/`: crece
 * con el tiempo y cada uno se valida por separado, a diferencia de
 * `Categoria`/`Problema`, que son listas pequeñas y cerradas.
 *
 * `categoriaId`/`problemaId` son opcionales y sirven solo para enlazado
 * interno (mostrar herramientas relacionadas al final del post) — nunca
 * cambian qué post se muestra ni introducen una recomendación personalizada.
 */
export type Post = {
  id: string;
  titulo: string;
  resumen: string;
  cuerpo: BloqueContenido[];
  fechaPublicacion: string;
  fechaUltimaRevision?: string;
  autor?: string;
  categoriaId?: string;
  problemaId?: string;
};

/**
 * Nivel de confianza en un dato investigado. Lo reutiliza Atlas Researcher
 * (`agents/atlas-researcher`) para la confianza global de una propuesta —
 * definido aquí porque el esquema de datos es la capa base de la que
 * depende el agente, y no al revés.
 */
export type NivelConfianza = "baja" | "media" | "alta";

export type Puntuaciones = {
  facilidadDeUso: Puntuacion1a10;
  calidad: Puntuacion1a10;
  fiabilidad: Puntuacion1a10;
  atencionAlCliente: Puntuacion1a10;
  escalabilidad: Puntuacion1a10;
  /**
   * Campo añadido sobre lo solicitado: distingue "fácil de usar" (interfaz)
   * de "requiere conocimientos técnicos para sacarle partido" (implantación).
   * Dos herramientas pueden tener una interfaz sencilla y aun así necesitar
   * mucho conocimiento técnico para configurarse bien (p. ej. Odoo). Sin
   * este campo el motor no podría distinguir ambos casos.
   * 1 = apto sin conocimientos técnicos · 10 = requiere equipo técnico dedicado.
   */
  nivelTecnicoRequerido: Puntuacion1a10;
  /**
   * Añadido: qué tan fácil es poner en marcha la herramienta (configuración
   * inicial, migración de datos, puesta a punto), no cómo de fácil es
   * usarla ya en marcha (eso es `facilidadDeUso`) ni cuánto conocimiento
   * técnico exige (eso es `nivelTecnicoRequerido`). Opcional porque las 5
   * fichas ya existentes no lo tienen investigado todavía — no había que
   * romper esos datos para añadir esta pregunta a las futuras.
   */
  facilidadImplementacion?: Puntuacion1a10;
};

/** Reseña de una plataforma externa de reseñas que no sea G2 ni Capterra (TrustRadius, Product Hunt, App Store, etc.). */
export type ReputacionExterna = {
  fuente: string;
  puntuacion?: number;
  numeroResenas?: number;
  enlace?: string;
  /** Cuándo se abrió ese enlace. Ver `ComprobacionReputacion`. */
  fechaComprobacion?: string;
};

/**
 * Dónde y cuándo se leyó una cifra de reputación.
 *
 * Añadido el 2026-09-28 por orden de la propietaria. Antes no existía: el
 * esquema guardaba `g2Puntuacion: 4.2` y nada más, así que la cifra no se
 * podía demostrar ni se sabía de cuándo era. No fue un descuido de quien
 * investigó —el campo donde anotarlo no estaba—, y por eso la carencia se
 * confundió durante meses con que nadie hubiera investigado la reputación.
 *
 * Misma forma que `preciosComprobados` y `planesComprobados`: la dirección
 * que se abrió de verdad y el día que se abrió.
 */
export type ComprobacionReputacion = {
  fecha: string;
  url: string;
  /** Lo que decía la página, tal cual. Sin cita no se escribe la cifra. */
  cita?: string;
};

/**
 * Añadido: reputación en plataformas externas de reseñas. Ninguno de estos
 * campos es obligatorio a nivel de esquema — muchas herramientas
 * (sobre todo las más nuevas o muy verticales) sencillamente no tienen
 * página en G2 o en Capterra, y eso no es un fallo de investigación, es un
 * hecho real que hay que poder representar sin forzar un dato inventado.
 */
export type Reputacion = {
  /** Escala habitual de G2: 1-5. */
  g2Puntuacion?: number;
  g2NumeroResenas?: number;
  /** Dónde y cuándo se leyó lo de G2. Sin esto la cifra no se puede demostrar. */
  g2Comprobado?: ComprobacionReputacion;
  /** Escala habitual de Capterra: 1-5. */
  capterraPuntuacion?: number;
  capterraNumeroResenas?: number;
  /** Dónde y cuándo se leyó lo de Capterra. */
  capterraComprobado?: ComprobacionReputacion;
  otrasFuentes?: ReputacionExterna[];
  /**
   * De dónde vienen estas cifras cuando no hay comprobación guardada.
   *
   * `redaccion-inicial` es el catálogo de la primera redacción: se investigó,
   * pero no se anotó dónde se miró, así que hoy no se puede demostrar ni se
   * sabe de cuándo es. No significa que sea falso; significa que no está
   * demostrado. Es la misma distinción que el resto del catálogo usa entre
   * «con fuente» y «sin fuente guardada».
   */
  origen?: "redaccion-inicial" | "comprobado";
};

/** Añadido: datos de la empresa que hay detrás de la herramienta (no de la herramienta en sí). `paginaOficial` ya vive en `Herramienta`, no se duplica aquí. */
export type InformacionEmpresa = {
  anioFundacion?: number;
  paisOrigen?: string;
  /** Texto libre a propósito: los tramos de tamaño de una empresa fabricante (ej. "501-1000 empleados") no tienen por qué coincidir con `RangoEmpleados`, que describe el tamaño ideal del CLIENTE, no del proveedor. */
  tamanoAproximado?: string;
};

/** A qué nivel de conocimiento técnico le conviene esta herramienta a quien la use — distinto de `puntuaciones.nivelTecnicoRequerido` (una puntuación 1-10 de exigencia) y de `curvaDeAprendizaje`: aquí se trata de una recomendación de perfil de usuario, en 3 escalones simples. */
export type NivelTecnicoRecomendado = "principiante" | "intermedio" | "avanzado";

/**
 * Añadido: el análisis propio de Atlas sobre la herramienta, pensado para
 * alimentar el futuro comparador inteligente.
 *
 * `puntuacion` y `motivosPuntuacion` los calcula Atlas automáticamente
 * (ver `lib/puntuacionAtlas.ts`) a partir del resto de datos investigados
 * — nunca los inventa el proveedor de IA. El resto de campos
 * (`competidoresDirectos`, `tipoNegocioIdeal`, `nivelTecnicoRecomendado`)
 * sí son investigación, igual que cualquier otro campo del esquema.
 */
export type AnalisisAtlas = {
  /** 0-100. Calculado, no investigado — ver el comentario del tipo. */
  puntuacion?: number;
  /** Motivos legibles de por qué se ha llegado a esa puntuación, generados junto con ella. */
  motivosPuntuacion?: string[];
  competidoresDirectos?: string[];
  /** Categoría breve de negocio al que más le conviene, ej. "Agencias de marketing". Complementa a `idealPara` (una frase) con una etiqueta corta pensada para filtrar/agrupar en el comparador. */
  tipoNegocioIdeal?: string;
  nivelTecnicoRecomendado?: NivelTecnicoRecomendado;
};

/**
 * Una comprobación de idioma de UNA pantalla concreta, con su recibo.
 *
 * `hayEspanol: false` es una comprobación tan válida como `true`: quiere decir
 * que se abrió la página y dice que español no hay. Lo que no existe es un
 * `ComprobacionDeIdioma` para algo que no se ha mirado — en ese caso el campo
 * no está.
 */
export type ComprobacionDeIdioma = {
  /** Si esa pantalla se puede usar en español, según lo que dice la cita. */
  hayEspanol: boolean;
  /** Los idiomas que la página enumera, tal cual. Puede estar vacío. */
  idiomas: string[];
  /** La página que se abrió. Del fabricante o de su ayuda, nunca de terceros. */
  url: string;
  /** Lo que dice, textual. Sin traducir ni resumir. */
  cita: string;
  /** Cuándo se abrió. Un idioma sin fecha no vale, igual que un precio. */
  fecha: string;
  /** Lo que el recibo matiza y la cita sola no cuenta. */
  nota?: string;
};

export type Herramienta = {
  /** Slug único y estable, ej. "hubspot". Nunca cambia aunque cambie el nombre mostrado. */
  id: string;
  nombre: string;
  paginaOficial: string;
  /** Añadido: la página de precios casi nunca coincide con la home; el motor la necesitará para enlazar directo. */
  urlPrecios?: string;
  /** Añadido: para cuando exista comparador visual; vacío por ahora, no bloquea nada. */
  logoUrl?: string;

  /**
   * Categoría funcional PRINCIPAL (referencia a `Categoria.id`): qué hace
   * esta herramienta, no de qué tipo de producto es. Son dos ejes
   * distintos y mezclarlos fue el error de la taxonomía original: había
   * que clasificar una herramienta como "plataformas-todo-en-uno" —
   * perdiendo su función real — para reconocer que era una suite. Desde
   * ahora la condición de suite vive en `tipoProducto`.
   */
  categoriaId: string;
  /**
   * Añadido: categorías funcionales ADICIONALES que la herramienta cubre
   * de verdad. Existe para que una suite pueda aparecer donde
   * legítimamente compite sin tener que falsear su categoría principal —
   * y para que ninguna herramienta se declare "todo en uno" solo para
   * salir en más sitios. Opcional: la inmensa mayoría del catálogo tiene
   * una única categoría real.
   */
  categoriasSecundarias?: string[];
  /**
   * Añadido: eje FINO dentro de la categoría. Existe porque
   * "Asistentes de IA y productividad" mete en la misma bolsa un corrector
   * de textos, un generador de vídeo, un transcriptor de reuniones y un
   * planificador de agenda — productos que no se sustituyen entre sí. El
   * 2026-08-27 se midió el efecto: Grammarly ganaba el 100% de los perfiles
   * de esa categoría, así que quien buscaba generar vídeo con IA recibía un
   * corrector ortográfico.
   *
   * El motor solo compara herramientas del mismo subtipo (ver
   * `agents/atlas-advisor/motor.ts`). Opcional: la mayoría de categorías
   * agrupan productos que sí son alternativas reales y no lo necesitan.
   */
  subtipoId?: string;
  /** Subtipos ADICIONALES que la herramienta cubre de verdad, con la misma exigencia de evidencia que `categoriasSecundarias`. */
  subtiposSecundarios?: string[];
  /**
   * Añadido: eje independiente de la categoría funcional. Una suite y una
   * especializada se evalúan con reglas distintas (ver
   * `agents/atlas-advisor/criteriosSuite.ts` y `criteriosEspecializada.ts`),
   * así que el motor necesita saberlo sin deducirlo de `categoriaId`.
   *
   * Opcional por compatibilidad con las fichas anteriores a este campo:
   * cuando falta, `esSuite()` lo deduce de la categoría histórica
   * "plataformas-todo-en-uno". Declararlo siempre es lo correcto — Curator
   * avisa de las fichas que aún no lo hacen.
   */
  tipoProducto?: TipoProducto;

  descripcion: string;
  problemasQueResuelve: string[];
  /**
   * Añadido: referencias estructuradas a Problema.id (a diferencia de
   * `problemasQueResuelve`, texto libre editorial) — permite a
   * `getHerramientasPorProblema` filtrar el catálogo real sin adivinar por
   * coincidencia de texto. Opcional: no forma parte de las 5 fichas
   * históricas originales del esquema, así que no puede ser obligatorio sin
   * romperlas; se va completando herramienta a herramienta.
   */
  problemasIds?: string[];
  /**
   * Añadido: marca explícita de que esta herramienta NO tiene objetivo
   * asignado a propósito, porque ninguno de los objetivos del marco actual
   * describe su función central sin forzarla — no por descuido.
   *
   * Existe porque el silencio es indistinguible del olvido: el 2026-08-27
   * se descubrió que 38 de 56 fichas no tenían objetivo, y como la puerta
   * "por objetivo" filtra de forma estricta, ese 68% del catálogo era
   * invisible para quien entraba por ahí. Sin este campo no había forma de
   * medir la diferencia entre "aún no investigado" y "no encaja".
   *
   * Quien lo tenga a `true` debe estar en la cola de Researcher.
   */
  objetivoPendienteDeInvestigacion?: boolean;
  /** Añadido: ejemplos concretos de uso real, más fáciles de reconocer para el usuario que "problemas" en abstracto. */
  casosDeUso: string[];

  /** Texto libre, para mostrar tal cual al usuario. */
  idealPara: string;
  /**
   * Añadido: la misma idea que `idealPara` pero en formato estructurado
   * (mismos valores que la pregunta "¿Cuántos empleados tiene?" del
   * cuestionario). Sin esto, el motor no puede filtrar ni puntuar por
   * tamaño de empresa de forma fiable — tendría que interpretar texto libre.
   */
  segmentosIdeales: RangoEmpleados[];
  /** Añadido: sectores/industrias en formato de etiquetas, para cruzar con el sector que el usuario escribe en el cuestionario. */
  industriasIdeales: string[];

  noRecomendadaPara: string;
  /**
   * Añadido: la misma idea que `noRecomendadaPara` pero en formato de lista.
   * El motor puede necesitar recorrer casos concretos de descarte uno a uno
   * (por ejemplo, para mostrarlos como viñetas) en vez de interpretar una
   * frase libre.
   */
  casosNoRecomendados: string[];

  funcionesPrincipales: string[];
  /**
   * Añadido: qué módulos funcionales incluye de verdad la herramienta (ver
   * el comentario del tipo `ModuloSuite`). Opcional porque solo aporta valor
   * real en suites que combinan varias funciones — para una herramienta de
   * un único propósito (ej. un CRM puro) sería redundante con `categoriaId`.
   */
  modulosIncluidos?: ModuloSuite[];
  integraciones: string[];
  /**
   * Añadido: subconjunto curado (3-4) de `integraciones`, con las que de
   * verdad definen a la herramienta. Pensado para tarjetas o vistas
   * resumidas donde listar todas las integraciones sería demasiado ruido.
   */
  integracionesPrincipales: string[];
  /**
   * Añadido: curva de aprendizaje inicial. Ver el comentario en el tipo
   * `CurvaDeAprendizaje` para la diferencia con las puntuaciones numéricas.
   */
  curvaDeAprendizaje: CurvaDeAprendizaje;

  /** Texto libre para mostrar, ej. "Desde 15€/usuario/mes". */
  precioInicial: string;
  /** Añadido: versión estructurada del precio, para poder filtrar/ordenar (ej. "solo freemium") sin parsear texto. */
  modeloDePrecio: ModeloDePrecio[];
  /** Añadido: bandera rápida — es la primera pregunta que se hace un usuario con presupuesto ajustado. */
  tienePlanGratuito: boolean;
  /**
   * Qué clase de plan gratuito es. Decisión de la propietaria (2026-09-17):
   * **una prueba de una semana también es un plan gratuito**; lo que no vale
   * es callar cuál de las dos cosas es.
   *
   * - `indefinido` — gratis mientras quieras, normalmente con algún límite
   *   (Bitrix24 con 1-2 usuarios, Capsule con 250 contactos).
   * - `prueba` — gratis un tiempo y después se paga.
   *
   * Ausente en las fichas que todavía no se han comprobado contra la página
   * oficial: entonces se dice «con plan gratuito» a secas, como hasta ahora,
   * en vez de inventarse cuál es.
   */
  tipoPlanGratuito?: "indefinido" | "prueba";
  /**
   * Cuántos días dura la prueba, cuando `tipoPlanGratuito` es `prueba` y la
   * página lo dice. Ausente cuando el fabricante no lo publica: hay webs que
   * ofrecen «free trial» sin decir de cuánto, y ahí no se rellena a ojo.
   */
  pruebaGratuitaDias?: number;
  /**
   * Cuándo alguien abrió de verdad la página de precios del fabricante y leyó
   * lo que dice, y **qué dirección abrió**.
   *
   * ── Por qué existe, aparte de `fechaUltimaRevision` ────────────────────
   *
   * No son lo mismo y confundirlas nos costó medio catálogo. `fechaUltimaRevision`
   * dice cuándo TOCAMOS la ficha; esto dice cuándo COMPROBAMOS que es verdad.
   * Una ficha escrita ayer con un precio inventado parece fresquísima por la
   * primera y no lo está por la segunda: el 2026-09-17, con las 65 fichas
   * dentro del umbral de frescura —cero desactualizadas— resultó que la mitad
   * de los precios estaban mal desde el primer día.
   *
   * `url` es la que se abrió DE VERDAD, no la que creíamos. Capsule CRM lleva
   * su enlace «Pricing» a `/signup/`, y en `urlPrecios` teníamos `/pricing/`,
   * que no abre. Guardar la que funcionó es lo que evita repetir el fallo en
   * la siguiente ronda.
   *
   * Ausente = **nunca se ha comprobado**. No es lo mismo que comprobado hace
   * mucho, y Atlas Mantenimiento los cuenta por separado.
   */
  preciosComprobados?: { fecha: string; url: string };

  /**
   * El precio de CADA ESCALÓN, no sólo el de entrada.
   *
   * F2 guardó en qué plan vive cada capacidad —el nombre que le da el
   * fabricante: «Growth», «Pro»—, pero no cuánto cuesta ese plan. Sin eso,
   * decirle a alguien «lo que buscas está en Growth» no le dice nada: lo cazó
   * la propietaria preguntando qué significaba Growth.
   *
   * MONEDA. Se guarda la del precio que vería un cliente español, y por eso
   * se prefiere el euro cuando alguna lectura lo consiguió. No es cosmética:
   * las mismas páginas sirven tarifas distintas según desde dónde se entre, y
   * no son una conversión —monday Basic son 9 $ o 9 €, Smartsheet Pro 12 $ u
   * 8 €—. Decisión de la propietaria, 2026-09-21.
   *
   * LOS DOS PRECIOS. Mensual y anual se guardan por separado siempre que la
   * página publique los dos, porque la diferencia es enorme: Close Solo son
   * 19 $ al mes o 9 $ pagando el año entero. Enseñar sólo uno es enseñar un
   * precio que no puede pagar como quiere.
   *
   * `fuente` es la dirección que se abrió DE VERDAD, que no siempre coincide
   * con `preciosComprobados.url`: alguna tarifa sólo aparece en la versión
   * española de la página.
   */
  planesComprobados?: {
    fecha: string;
    url: string;
    /** «EUR», «USD». La del precio guardado, no la del fabricante. */
    moneda: string;
    planes: {
      /** Tal como lo llama el fabricante. Es lo que la persona va a leer en su tarifa. */
      nombre: string;
      /** Ausente cuando la página no publica esa modalidad. Nunca se calcula a partir de la otra. */
      mensual?: string;
      anual?: string;
      /** Lo que la página dice literalmente. Sin cita no se escribe el precio. */
      cita: string;
    }[];
  };
  /** Añadido: no siempre el precio de entrada (`precioInicial`) es el plan que de verdad le conviene a una pyme — a veces hace falta un plan intermedio para desbloquear lo esencial. Texto libre, ej. "Plan Professional a 45€/usuario/mes". */
  precioRecomendadoPymes?: string;

  /**
   * Añadido: dónde se puede CONTRATAR y usar de verdad la herramienta —
   * no dónde está la empresa fabricante (eso es `informacionEmpresa.pais`).
   * Importa porque Molnip recomienda a pymes españolas: una herramienta
   * excelente que no factura en la UE, no cumple el RGPD o no acepta
   * pagos desde España no le sirve a quien la lee.
   *
   * Códigos ISO 3166-1 alfa-2 en mayúsculas ("ES", "MX"), o el valor
   * "GLOBAL" cuando no hay restricción territorial. Opcional porque
   * ninguna ficha del catálogo actual lo tiene investigado todavía:
   * Curator lo reporta como pendiente de investigación, nunca lo inventa.
   */
  disponibilidadGeografica?: string[];

  idiomasDisponibles: string[];
  /** Añadido: derivado de `idiomasDisponibles`, pero como booleano explícito — ese array a veces es texto ambiguo (ej. "más de 40 idiomas"), y comprobar "¿hay español?" a mano no es fiable. */
  disponibleEnEspanol?: boolean;
  /**
   * EL ESPAÑOL, PARTIDO EN DOS Y CON RECIBO.
   *
   * `disponibleEnEspanol` es un sí/no y no da para más: no distingue «no está
   * en español» de «no lo hemos mirado», y sobre todo no distingue las DOS
   * pantallas, que no tienen por qué estar en el mismo idioma.
   *
   *  - `panel`: el programa de gestión, donde trabaja quien contrata.
   *  - `paginaDeCliente`: lo que ve su cliente al reservar o al pagar.
   *
   * El caso que obligó a partirlo es Schedulista: su propia ayuda dice que el
   * panel «will remain in English», y la página donde reservan sus clientes sí
   * se puede poner en español. Con un solo booleano, `true` mentía sobre el
   * panel y `false` mentía sobre la página; las dos respuestas eran falsas.
   *
   * AUSENTE SIGNIFICA «SIN CONFIRMAR», Y ESO NO ES «NO». Nunca se rellena
   * deduciendo: ni del idioma de la web comercial, ni de `idiomasDisponibles`,
   * ni de una parte a la otra. Sin `url`, `cita` y `fecha` de la página que se
   * abrió, este campo se queda vacío.
   *
   * *(Propietaria, 2026-09-30: «un dato desconocido no puede convertirse en
   * "no"».)*
   */
  idiomaComprobado?: {
    panel?: ComprobacionDeIdioma;
    paginaDeCliente?: ComprobacionDeIdioma;
  };
  /** Añadido: si existe una app móvil oficial (iOS/Android), no solo una web adaptada a móvil. */
  tieneAppMovil?: boolean;
  /** Añadido: si ofrece una API pública documentada para desarrolladores. */
  tieneApiPublica?: boolean;

  puntuaciones: Puntuaciones;
  /**
   * Añadido: de dónde salen las puntuaciones de arriba. Atlas promete
   * "recomendaciones objetivas" en su propia web — sin declarar la
   * metodología, esas puntuaciones serían números inventados sin respaldo.
   */
  metodologiaValoracion: string;

  ventajas: string[];
  inconvenientes: string[];

  /** Añadido: reputación en plataformas externas de reseñas (G2, Capterra...). Opcional: no todas las herramientas tienen presencia en estas plataformas. */
  reputacion?: Reputacion;
  /** Añadido: datos de la empresa fabricante (fundación, país, tamaño). */
  informacionEmpresa?: InformacionEmpresa;
  /** Añadido: el análisis propio de Atlas — ver el comentario del tipo `AnalisisAtlas`. */
  analisisAtlas?: AnalisisAtlas;

  /** Añadido: con cientos/miles de herramientas, algunas se descontinuarán o cambiarán de nombre. Sin este campo no hay forma de retirarlas sin borrar el histórico. */
  estado: EstadoHerramienta;
  /** ISO 8601 (YYYY-MM-DD). Añadido: fecha en que se documentó por primera vez, distinta de la última revisión. */
  fechaAltaEnAtlas: string;
  /** ISO 8601 (YYYY-MM-DD). Pedido explícitamente por el usuario. */
  fechaUltimaRevision: string;
};
