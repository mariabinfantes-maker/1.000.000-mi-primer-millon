/**
 * El catálogo cerrado de lo que Atlas Orchestrator puede ejecutar.
 *
 * ── Por qué esta lista está en el código y no en la base de datos ──────
 *
 * Es la pieza de seguridad de todo el agente. Una solicitud guardada en
 * Postgres lleva **sólo un `TareaId`**, nunca un comando. El ejecutor lo
 * busca aquí; si no está, no ejecuta nada. Así, el peor caso de una fila
 * manipulada —por un error, por un acceso indebido a la base— es que el
 * ejecutor la rechace, no que corra un comando arbitrario en la máquina de
 * la propietaria.
 *
 * Nada de lo que venga de Postgres llega nunca a un intérprete de
 * comandos: ni el nombre del proceso, ni sus argumentos.
 *
 * ── Los dos carriles ──────────────────────────────────────────────────
 *
 * `libre` — sólo lee y reporta. Orchestrator lo dispara solo.
 * `conPermiso` — gasta dinero o escribe datos. Se queda esperando firma.
 *
 * El carril y el motivo viven **sólo aquí**. Postgres no los guarda: tener
 * el mismo dato en dos sitios es tener dos verdades, y la de la base es la
 * que puede manipularse. Se derivan de esta tabla cada vez que se lee una
 * solicitud.
 *
 * ── Los argumentos ────────────────────────────────────────────────────
 *
 * Cada tarea declara qué admite: qué posicionales, en qué orden, y qué
 * banderas con qué clase de valor. Lo que no está declarado se rechaza.
 *
 * Esta tabla se escribió **leyendo el `process.argv` de los 26 módulos**,
 * no sus nombres. Al hacerlo aparecieron cinco clasificaciones erróneas de
 * la primera versión, anotadas abajo. Deducir del nombre es el error que
 * ya se cometió una vez con `convertir-verificacion`.
 */

export type Carril = "libre" | "conPermiso";

/** Por qué una tarea pide permiso. `ninguno` es el carril libre. */
export type MotivoDelCarril = "ninguno" | "gasta_dinero" | "escribe_datos";

/** Cada cuánto tiene sentido repetirla. `manual` = nunca se propone sola. */
export type Cadencia = "cada_ejecucion" | "semanal" | "mensual" | "manual";

/**
 * Qué clase de valor es un argumento. Decide qué caracteres se aceptan y,
 * en `ruta`, que no pueda salirse del repositorio.
 */
export type ClaseDeValor =
  /** Ruta relativa dentro del repositorio. Ni absoluta, ni con `..`. */
  | "ruta"
  /** Identificador de herramienta: minúsculas, dígitos y guiones. */
  | "id"
  /** Texto libre que la propietaria escribe (un motivo, una nota). Admite espacios y acentos. */
  | "texto"
  /** Dirección https. */
  | "url"
  /** Fecha AAAA-MM-DD. */
  | "fecha"
  /** Una contraseña que la propietaria teclea. Cualquier carácter visible, sin registrar en ningún sitio. */
  | "secreto";

export type Posicional = {
  clase: ClaseDeValor;
  descripcion: string;
  obligatorio: boolean;
  /** `true` si admite varios seguidos (p. ej. varios ids de borrador). */
  repetible?: boolean;
};

export type Bandera = {
  /** Sin los dos guiones. */
  nombre: string;
  /** `undefined` = interruptor: la bandera va sola, sin valor detrás. */
  clase?: ClaseDeValor;
  /** Lista cerrada de valores aceptados, cuando el CLI sólo admite unos pocos. */
  valores?: readonly string[];
  descripcion: string;
};

export type TipoDeArgumentos = {
  posicionales: readonly Posicional[];
  banderas: readonly Bandera[];
  /** `true` si ejecutar la tarea sin ningún argumento es un error del propio CLI. */
  exigeAlguno: boolean;
};

export const SIN_ARGUMENTOS: TipoDeArgumentos = { posicionales: [], banderas: [], exigeAlguno: false };

export type Tarea = {
  id: TareaId;
  /** El script de `package.json`. Sale de aquí, nunca de la base de datos. */
  script: string;
  /**
   * El fichero que ese script ejecuta con `tsx`. Está escrito aquí y no se
   * deduce de `package.json` en tiempo de ejecución: lo que se ejecuta se
   * lee en el código, línea a línea. Una prueba comprueba que coincide
   * exactamente con `npm run <script>`, para que no puedan separarse.
   */
  modulo: string;
  /** Qué hace, en una línea, para el listado y para la bitácora. */
  descripcion: string;
  carril: Carril;
  motivo: MotivoDelCarril;
  cadencia: Cadencia;
  argumentos: TipoDeArgumentos;
};

export const TAREA_IDS = [
  // ── Carril libre: informes y verificaciones ──────────────────────
  "informe-afiliacion",
  "informe-mantenimiento",
  "informe-curador",
  "informe-historial",
  "generar-informe",
  "verificar-datos",
  "verificar-revenue",
  "verificar-neon",
  "verificar-despliegue",
  "verificar-enlaces-afiliados",
  // ── Con permiso: gastan dinero ───────────────────────────────────
  "investigar-lote",
  "investigar-herramienta",
  "investigar-pendiente",
  "repesca-verificacion",
  // ── Con permiso: escriben datos o catálogo ───────────────────────
  "convertir-verificacion",
  "promover-borrador",
  "aprobar-borrador",
  "autorizar-afiliacion",
  "actualizar-estrategia-afiliacion",
  "copia-seguridad-afiliacion",
  "migrar-json-a-postgres",
  "migrar-a-neon",
  "migrar-taxonomia",
  "aprovisionar-esquema-postgres",
  "generar-hash-admin",
  "generar-secreto-admin",
] as const;

export type TareaId = (typeof TAREA_IDS)[number];

/** La bandera `--env ruta/al/.env`, que comparten los tres scripts de Neon. */
const BANDERA_ENV: Bandera = {
  nombre: "env",
  clase: "ruta",
  descripcion: "fichero de entorno a cargar (por defecto .env.neon.local)",
};

/**
 * Las 26 tareas.
 *
 * `verificar-enlaces-afiliados` está en el carril libre por decisión de la
 * propietaria (2026-09-15): sale a la red a comprobar enlaces de terceros,
 * pero ni gasta ni modifica datos.
 *
 * `convertir-verificacion` NO gasta dinero —no llama a ningún proveedor de
 * IA, sólo lee ficheros locales— pero escribe `registros.json`, que es lo
 * que el motor cree en F3. Por eso pide permiso: por escritura, no por
 * gasto. La primera clasificación se hizo mal y se corrigió al leer el
 * código.
 *
 * ── Las cinco correcciones al leer el `argv` de los 26 módulos ─────────
 *
 * 1. `repesca-verificacion` NO acepta ningún argumento: lee `descartes.json`
 *    directamente. Estaba marcada como si exigiera uno.
 * 2. `verificar-despliegue` EXIGE `--url`, y además acepta `--comparar-con`
 *    y `--probar-bloqueo`. Estaba marcada como si no aceptara nada.
 * 3. `verificar-neon` acepta `--env`. Estaba marcada como si no.
 * 4. `copia-seguridad-afiliacion` acepta `--env`. Igual.
 * 5. `migrar-a-neon` acepta `--env` y `--forzar`. Igual.
 */
export const TAREAS: readonly Tarea[] = [
  {
    id: "informe-afiliacion",
    script: "informe-afiliacion",
    modulo: "agents/atlas-affiliate-manager/cli-informe-afiliacion.ts",
    descripcion: "Estado de la estrategia de afiliación",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "informe-mantenimiento",
    script: "informe-mantenimiento",
    modulo: "agents/atlas-mantenimiento/cli-informe-mantenimiento.ts",
    descripcion: "Frescura del catálogo: qué lleva mucho sin revisarse",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "informe-curador",
    script: "informe-curador",
    modulo: "agents/atlas-curator/cli-informe-curador.ts",
    descripcion: "Equilibrio del catálogo y huecos editoriales",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "mensual",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "informe-historial",
    script: "informe-historial",
    modulo: "agents/atlas-researcher/cli-informe-historial.ts",
    descripcion: "Historial de aprobaciones del Researcher",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "mensual",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "generar-informe",
    script: "generar-informe",
    modulo: "agents/atlas-researcher/cli-generar-informe.ts",
    descripcion: "Informe de un borrador del Researcher",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id de borrador", obligatorio: false, repetible: true }],
      banderas: [{ nombre: "todos", descripcion: "todos los borradores pendientes, en vez de una lista de ids" }],
      exigeAlguno: true,
    },
  },
  {
    id: "verificar-datos",
    script: "verificar-datos",
    modulo: "data/verificar.ts",
    descripcion: "Integridad del catálogo y las categorías",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "verificar-revenue",
    script: "verificar-revenue",
    modulo: "scripts/verificar-revenue.ts",
    descripcion: "Comprobación de Atlas Revenue",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "verificar-neon",
    script: "verificar-neon",
    modulo: "scripts/verificar-neon.ts",
    descripcion: "Conexión y esquema de Postgres",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
    argumentos: { posicionales: [], banderas: [BANDERA_ENV], exigeAlguno: false },
  },
  {
    id: "verificar-despliegue",
    script: "verificar-despliegue",
    modulo: "scripts/verificar-despliegue.ts",
    descripcion: "Comprobaciones previas al despliegue",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "manual",
    argumentos: {
      posicionales: [],
      banderas: [
        { nombre: "url", clase: "url", descripcion: "la vista previa que se comprueba (obligatoria)" },
        { nombre: "comparar-con", clase: "url", descripcion: "dirección con la que comparar el texto visible" },
        { nombre: "probar-bloqueo", descripcion: "prueba el bloqueo tras 5 intentos fallidos (bloquea tu IP 15 minutos)" },
      ],
      exigeAlguno: true,
    },
  },
  {
    id: "verificar-enlaces-afiliados",
    script: "verificar-enlaces-afiliados",
    modulo: "agents/atlas-affiliate-manager/cli-verificar-enlaces.ts",
    descripcion: "Comprueba que los enlaces de afiliado siguen vivos",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "investigar-lote",
    script: "investigar-lote",
    modulo: "agents/atlas-researcher/cli-lote.ts",
    descripcion: "Investiga una lista de herramientas candidatas",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "ruta", descripcion: "fichero JSON con la lista de candidatas", obligatorio: true }],
      banderas: [],
      exigeAlguno: true,
    },
  },
  {
    id: "investigar-herramienta",
    script: "investigar-herramienta",
    modulo: "agents/atlas-researcher/cli.ts",
    descripcion: "Investiga una herramienta suelta",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    // El CLI une todos los argumentos con espacios: "Notion" "AI" → "Notion AI".
    argumentos: {
      posicionales: [{ clase: "texto", descripcion: "nombre de la herramienta", obligatorio: true, repetible: true }],
      banderas: [],
      exigeAlguno: true,
    },
  },
  {
    id: "investigar-pendiente",
    script: "investigar-pendiente",
    modulo: "agents/atlas-researcher/cli-investigar-pendiente.ts",
    descripcion: "Investiga una candidata que esperaba autorización",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id de la candidata pendiente", obligatorio: true }],
      banderas: [],
      exigeAlguno: true,
    },
  },
  {
    id: "repesca-verificacion",
    script: "repesca-verificacion",
    modulo: "data/verificacion/cli-repesca.ts",
    descripcion: "Repesca capacidades sin verificar",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    // Corrección 1: no lee `argv`. Trabaja sobre `descartes.json` tal cual.
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "convertir-verificacion",
    script: "convertir-verificacion",
    modulo: "data/verificacion/cli-convertir.ts",
    descripcion: "Convierte la salida de un lote en registros de verificación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "ruta", descripcion: "salida cruda del lote", obligatorio: true }],
      banderas: [],
      exigeAlguno: true,
    },
  },
  {
    id: "promover-borrador",
    script: "promover-borrador",
    modulo: "agents/atlas-researcher/cli-promover.ts",
    descripcion: "Promueve un borrador al catálogo real",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id de la herramienta", obligatorio: true }],
      banderas: [
        { nombre: "ignorar-duplicado", descripcion: "sigue adelante pese al aviso de duplicado" },
        { nombre: "justificacion", clase: "texto", descripcion: "por qué se ignora el aviso" },
      ],
      exigeAlguno: true,
    },
  },
  {
    id: "aprobar-borrador",
    script: "aprobar-borrador",
    modulo: "agents/atlas-researcher/cli-aprobar-borrador.ts",
    descripcion: "Registra la decisión editorial sobre un borrador",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id del borrador", obligatorio: true }],
      banderas: [
        { nombre: "decision", valores: ["aprobado", "rechazado"], descripcion: "la decisión (obligatoria)" },
        { nombre: "notas", clase: "texto", descripcion: "motivo, para que quede auditable (obligatorio)" },
      ],
      exigeAlguno: true,
    },
  },
  {
    id: "autorizar-afiliacion",
    script: "autorizar-afiliacion",
    modulo: "agents/atlas-researcher/cli-autorizar-afiliacion.ts",
    descripcion: "Autoriza la excepción de afiliación de una herramienta",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id de la herramienta", obligatorio: true }],
      banderas: [{ nombre: "motivo", clase: "texto", descripcion: "por qué entra pese a su afiliación (obligatorio)" }],
      exigeAlguno: true,
    },
  },
  {
    id: "actualizar-estrategia-afiliacion",
    script: "actualizar-estrategia-afiliacion",
    modulo: "agents/atlas-affiliate-manager/cli-actualizar-estrategia-afiliacion.ts",
    descripcion: "Actualiza la estrategia de afiliación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "id", descripcion: "id de la herramienta (salvo con --lote)", obligatorio: false }],
      banderas: [
        { nombre: "lote", clase: "ruta", descripcion: "fichero JSON con varias cuentas" },
        { nombre: "cuenta", clase: "id", descripcion: "id de la cuenta dentro de la herramienta" },
        {
          nombre: "estado",
          valores: ["no_solicitado", "pendiente", "aprobado", "rechazado", "activo"],
          descripcion: "estado de la solicitud de afiliación",
        },
        { nombre: "nombre-programa", clase: "texto", descripcion: "nombre del programa" },
        { nombre: "plataforma", clase: "texto", descripcion: "plataforma de afiliación" },
        { nombre: "url-solicitud", clase: "url", descripcion: "dirección donde se solicitó" },
        { nombre: "usuario-registro", clase: "texto", descripcion: "con qué usuario se registró" },
        { nombre: "fecha-solicitud", clase: "fecha", descripcion: "AAAA-MM-DD" },
        { nombre: "fecha-aprobacion", clase: "fecha", descripcion: "AAAA-MM-DD" },
        { nombre: "comision", clase: "texto", descripcion: "comisión acordada" },
        { nombre: "cookie", clase: "texto", descripcion: "duración de la cookie" },
        { nombre: "metodo-pago", clase: "texto", descripcion: "cómo se cobra" },
        { nombre: "frecuencia-pago", clase: "texto", descripcion: "cada cuánto se cobra" },
        { nombre: "enlace", clase: "url", descripcion: "enlace de afiliado" },
        { nombre: "segmento", clase: "texto", descripcion: "país o idioma" },
        { nombre: "requisitos", clase: "texto", descripcion: "requisitos del programa" },
        { nombre: "borrador", clase: "texto", descripcion: "notas de borrador" },
        { nombre: "notas", clase: "texto", descripcion: "notas" },
        { nombre: "usuario", clase: "texto", descripcion: "quién queda registrado en el historial" },
      ],
      exigeAlguno: true,
    },
  },
  {
    id: "copia-seguridad-afiliacion",
    script: "copia-seguridad-afiliacion",
    modulo: "scripts/copia-seguridad-afiliacion.ts",
    descripcion: "Copia de seguridad de la estrategia de afiliación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: { posicionales: [], banderas: [BANDERA_ENV], exigeAlguno: false },
  },
  {
    id: "migrar-json-a-postgres",
    script: "migrar-json-a-postgres",
    modulo: "scripts/migrar-json-a-postgres.ts",
    descripcion: "Migra los JSON de afiliación a Postgres",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "migrar-a-neon",
    script: "migrar-a-neon",
    modulo: "scripts/migrar-a-neon.ts",
    descripcion: "Migra los datos a Neon",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [],
      banderas: [BANDERA_ENV, { nombre: "forzar", descripcion: "sigue adelante pese a los avisos" }],
      exigeAlguno: false,
    },
  },
  {
    id: "migrar-taxonomia",
    script: "migrar-taxonomia",
    modulo: "scripts/migrar-taxonomia.ts",
    descripcion: "Migra la taxonomía del catálogo",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "aprovisionar-esquema-postgres",
    script: "aprovisionar-esquema-postgres",
    modulo: "scripts/aprovisionar-esquema-postgres.ts",
    descripcion: "Crea o actualiza las tablas en Postgres",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: SIN_ARGUMENTOS,
  },
  {
    id: "generar-hash-admin",
    script: "generar-hash-admin",
    modulo: "lib/admin/cli-generar-hash-admin.ts",
    descripcion: "Genera el hash de la contraseña de administración",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: {
      posicionales: [{ clase: "secreto", descripcion: "la contraseña del panel", obligatorio: true }],
      banderas: [],
      exigeAlguno: true,
    },
  },
  {
    id: "generar-secreto-admin",
    script: "generar-secreto-admin",
    modulo: "lib/admin/cli-generar-secreto-admin.ts",
    descripcion: "Genera el secreto de sesión de administración",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    argumentos: SIN_ARGUMENTOS,
  },
];

const POR_ID = new Map<string, Tarea>(TAREAS.map((t) => [t.id, t]));

/**
 * Traduce un identificador —que puede venir de la base de datos— a la
 * tarea que le corresponde. Devuelve `undefined` si no está en la lista:
 * quien llame debe tratarlo como un rechazo, nunca como un comando.
 */
export function tareaDe(id: string): Tarea | undefined {
  return POR_ID.get(id);
}

export function esTareaId(id: string): id is TareaId {
  return POR_ID.has(id);
}
