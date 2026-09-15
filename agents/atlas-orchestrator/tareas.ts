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
 * El motivo se guarda junto a la tarea y no se deduce: saber POR QUÉ algo
 * pide permiso es lo que permite revisarlo dentro de seis meses.
 */

export type Carril = "libre" | "conPermiso";

/** Por qué una tarea pide permiso. `ninguno` es el carril libre. */
export type MotivoDelCarril = "ninguno" | "gasta_dinero" | "escribe_datos";

/** Cada cuánto tiene sentido repetirla. `manual` = nunca se propone sola. */
export type Cadencia = "cada_ejecucion" | "semanal" | "mensual" | "manual";

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
  /** `true` si el script necesita argumentos que la propietaria aporta (ruta de un lote, id de herramienta). */
  exigeArgumentos?: boolean;
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
  },
  {
    id: "informe-mantenimiento",
    script: "informe-mantenimiento",
    modulo: "agents/atlas-mantenimiento/cli-informe-mantenimiento.ts",
    descripcion: "Frescura del catálogo: qué lleva mucho sin revisarse",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
  },
  {
    id: "informe-curador",
    script: "informe-curador",
    modulo: "agents/atlas-curator/cli-informe-curador.ts",
    descripcion: "Equilibrio del catálogo y huecos editoriales",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "mensual",
  },
  {
    id: "informe-historial",
    script: "informe-historial",
    modulo: "agents/atlas-researcher/cli-informe-historial.ts",
    descripcion: "Historial de aprobaciones del Researcher",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "mensual",
  },
  {
    id: "generar-informe",
    script: "generar-informe",
    modulo: "agents/atlas-researcher/cli-generar-informe.ts",
    descripcion: "Informe de un borrador del Researcher",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "verificar-datos",
    script: "verificar-datos",
    modulo: "data/verificar.ts",
    descripcion: "Integridad del catálogo y las categorías",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
  },
  {
    id: "verificar-revenue",
    script: "verificar-revenue",
    modulo: "scripts/verificar-revenue.ts",
    descripcion: "Comprobación de Atlas Revenue",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
  },
  {
    id: "verificar-neon",
    script: "verificar-neon",
    modulo: "scripts/verificar-neon.ts",
    descripcion: "Conexión y esquema de Postgres",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "cada_ejecucion",
  },
  {
    id: "verificar-despliegue",
    script: "verificar-despliegue",
    modulo: "scripts/verificar-despliegue.ts",
    descripcion: "Comprobaciones previas al despliegue",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "manual",
  },
  {
    id: "verificar-enlaces-afiliados",
    script: "verificar-enlaces-afiliados",
    modulo: "agents/atlas-affiliate-manager/cli-verificar-enlaces.ts",
    descripcion: "Comprueba que los enlaces de afiliado siguen vivos",
    carril: "libre",
    motivo: "ninguno",
    cadencia: "semanal",
  },
  {
    id: "investigar-lote",
    script: "investigar-lote",
    modulo: "agents/atlas-researcher/cli-lote.ts",
    descripcion: "Investiga una lista de herramientas candidatas",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "investigar-herramienta",
    script: "investigar-herramienta",
    modulo: "agents/atlas-researcher/cli.ts",
    descripcion: "Investiga una herramienta suelta",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "investigar-pendiente",
    script: "investigar-pendiente",
    modulo: "agents/atlas-researcher/cli-investigar-pendiente.ts",
    descripcion: "Investiga una candidata que esperaba autorización",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "repesca-verificacion",
    script: "repesca-verificacion",
    modulo: "data/verificacion/cli-repesca.ts",
    descripcion: "Repesca capacidades sin verificar",
    carril: "conPermiso",
    motivo: "gasta_dinero",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "convertir-verificacion",
    script: "convertir-verificacion",
    modulo: "data/verificacion/cli-convertir.ts",
    descripcion: "Convierte la salida de un lote en registros de verificación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "promover-borrador",
    script: "promover-borrador",
    modulo: "agents/atlas-researcher/cli-promover.ts",
    descripcion: "Promueve un borrador al catálogo real",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "aprobar-borrador",
    script: "aprobar-borrador",
    modulo: "agents/atlas-researcher/cli-aprobar-borrador.ts",
    descripcion: "Registra la decisión editorial sobre un borrador",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "autorizar-afiliacion",
    script: "autorizar-afiliacion",
    modulo: "agents/atlas-researcher/cli-autorizar-afiliacion.ts",
    descripcion: "Autoriza la excepción de afiliación de una herramienta",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "actualizar-estrategia-afiliacion",
    script: "actualizar-estrategia-afiliacion",
    modulo: "agents/atlas-affiliate-manager/cli-actualizar-estrategia-afiliacion.ts",
    descripcion: "Actualiza la estrategia de afiliación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "copia-seguridad-afiliacion",
    script: "copia-seguridad-afiliacion",
    modulo: "scripts/copia-seguridad-afiliacion.ts",
    descripcion: "Copia de seguridad de la estrategia de afiliación",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
  },
  {
    id: "migrar-json-a-postgres",
    script: "migrar-json-a-postgres",
    modulo: "scripts/migrar-json-a-postgres.ts",
    descripcion: "Migra los JSON de afiliación a Postgres",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
  },
  {
    id: "migrar-a-neon",
    script: "migrar-a-neon",
    modulo: "scripts/migrar-a-neon.ts",
    descripcion: "Migra los datos a Neon",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
  },
  {
    id: "migrar-taxonomia",
    script: "migrar-taxonomia",
    modulo: "scripts/migrar-taxonomia.ts",
    descripcion: "Migra la taxonomía del catálogo",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
  },
  {
    id: "aprovisionar-esquema-postgres",
    script: "aprovisionar-esquema-postgres",
    modulo: "scripts/aprovisionar-esquema-postgres.ts",
    descripcion: "Crea o actualiza las tablas en Postgres",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
  },
  {
    id: "generar-hash-admin",
    script: "generar-hash-admin",
    modulo: "lib/admin/cli-generar-hash-admin.ts",
    descripcion: "Genera el hash de la contraseña de administración",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
    exigeArgumentos: true,
  },
  {
    id: "generar-secreto-admin",
    script: "generar-secreto-admin",
    modulo: "lib/admin/cli-generar-secreto-admin.ts",
    descripcion: "Genera el secreto de sesión de administración",
    carril: "conPermiso",
    motivo: "escribe_datos",
    cadencia: "manual",
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
