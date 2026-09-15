/**
 * Fuente única del esquema Postgres de estrategia de afiliación — la usan
 * tanto el script de aprovisionamiento real (`scripts/aprovisionar-esquema-postgres.ts`,
 * contra Neon) como las pruebas locales contra un Postgres temporal. Cada
 * elemento es una sentencia DDL independiente, en el orden en que deben
 * ejecutarse.
 *
 * `estrategias_afiliacion` guarda el mismo objeto `EstrategiaAfiliacion`
 * (ver `data/esquemaInterno.ts`) completo como JSONB, una fila por
 * herramienta — mismo modelo que los JSON actuales (un archivo por
 * herramienta), para no tener que tocar los contratos de
 * `fusionarEstrategiaAfiliacion`/`panelDatos.ts`/rutas API/CLI.
 *
 * `historial_cambios_afiliacion` es estrictamente de solo-inserción: el
 * trigger `historial_solo_insertar` rechaza cualquier UPDATE o DELETE a
 * nivel de base de datos, no solo por disciplina de la aplicación —
 * restaurar un valor anterior debe crear un evento nuevo, nunca modificar
 * uno existente. Lo mismo vale para `bitacora_orquestador`, que es la
 * única prueba de qué se ejecutó sin nadie delante.
 */
export const SENTENCIAS_ESQUEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS estrategias_afiliacion (
    herramienta_id text PRIMARY KEY,
    datos jsonb NOT NULL,
    actualizado_en timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS historial_cambios_afiliacion (
    id bigserial PRIMARY KEY,
    herramienta_id text NOT NULL,
    campo text NOT NULL,
    valor_anterior jsonb,
    valor_nuevo jsonb,
    motivo text,
    usuario text NOT NULL,
    fecha timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_historial_herramienta_fecha
   ON historial_cambios_afiliacion (herramienta_id, fecha DESC)`,
  // ── Atlas Revenue ────────────────────────────────────────────────
  // Medición mínima y anónima del clic saliente. Lo que NO hay aquí es
  // tan importante como lo que hay: ni IP, ni cookie, ni identificador de
  // sesión, ni user-agent, ni referer. No es una promesa de no usarlos —
  // es que el dato no se guarda, así que no hay nada que reidentificar ni
  // con qué enlazar dos clics entre sí. Una prueba lo comprueba contra
  // esta misma declaración.
  `CREATE TABLE IF NOT EXISTS clics_salientes (
    id bigserial PRIMARY KEY,
    herramienta_id text NOT NULL,
    categoria_id text NOT NULL,
    tipo_enlace text NOT NULL,
    origen text NOT NULL,
    ruta_origen text,
    fecha timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_clics_herramienta_fecha
   ON clics_salientes (herramienta_id, fecha DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_clics_fecha ON clics_salientes (fecha DESC)`,

  // Lo que comunican los paneles de afiliación, anotado a mano. Append-only
  // con el mismo criterio que el historial: corregir una cifra crea un
  // asiento nuevo, nunca modifica el anterior — las comisiones se revierten
  // por reembolsos y el rastro de esa reversión es parte de la contabilidad.
  `CREATE TABLE IF NOT EXISTS ingresos_afiliacion (
    id bigserial PRIMARY KEY,
    herramienta_id text NOT NULL,
    periodo text NOT NULL,
    conversiones integer NOT NULL DEFAULT 0,
    importe_centimos bigint NOT NULL DEFAULT 0,
    moneda text NOT NULL DEFAULT 'EUR',
    estado text NOT NULL,
    fuente text,
    nota text,
    usuario text NOT NULL,
    fecha timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_ingresos_herramienta_periodo
   ON ingresos_afiliacion (herramienta_id, periodo)`,
  `CREATE OR REPLACE FUNCTION prohibir_modificar_ingresos()
   RETURNS trigger AS $fn$
   BEGIN
     RAISE EXCEPTION 'ingresos_afiliacion es append-only: % no permitido en esta tabla', TG_OP;
   END;
   $fn$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS ingresos_solo_insertar ON ingresos_afiliacion`,
  `CREATE TRIGGER ingresos_solo_insertar
   BEFORE UPDATE OR DELETE ON ingresos_afiliacion
   FOR EACH ROW EXECUTE FUNCTION prohibir_modificar_ingresos()`,

  // ── Atlas Orchestrator ───────────────────────────────────────────
  // Dos tablas y ninguna más. `solicitudes_orquestador` es el buzón: lo
  // que el Orchestrator propone hacer y en qué punto está. Lo que NO hay
  // aquí es lo importante — no hay ninguna columna con un comando, ni con
  // una ruta de ejecutable, ni con nada que un intérprete pueda leer.
  // `tarea_id` es un identificador que el ejecutor busca en
  // `agents/atlas-orchestrator/tareas.ts`; si no está en esa lista, no se
  // ejecuta nada. Una fila manipulada no consigue ejecutar un comando
  // arbitrario: consigue que la rechacen.
  //
  // Tampoco están aquí el carril ni el motivo, y es deliberado: guardarlos
  // sería tener el mismo dato en dos sitios, y el de la base es el que
  // puede manipularse. Se derivan de `tareas.ts` cada vez que se lee una
  // fila. Dos fuentes de verdad son dos formas de equivocarse.
  //
  // El estado `esperando_autorizacion` es el que sostiene la regla de la
  // propietaria: el silencio nunca es permiso. Una solicitud que nadie
  // firma se queda ahí indefinidamente, y no hay nada que la mueva sola.
  // `reclamada_en` sin `terminada_en` es, literalmente, una ejecución que
  // se cortó a mitad: queda registrada y nadie la vuelve a coger, porque
  // sólo se reclaman las que están en `lista` o `autorizada`.
  // Una base donde ya se hubiera aplicado una versión anterior de esta
  // tabla conservaría `carril` y `motivo` como NOT NULL, porque
  // `CREATE TABLE IF NOT EXISTS` no quita columnas: el INSERT de abajo
  // fallaría por restricción, y `verificarEsquema` no lo vería —sólo busca
  // columnas que falten, nunca de más—. Esto lo deja al día y no hace nada
  // en una base limpia.
  `ALTER TABLE IF EXISTS solicitudes_orquestador
   DROP COLUMN IF EXISTS carril,
   DROP COLUMN IF EXISTS motivo`,
  `CREATE TABLE IF NOT EXISTS solicitudes_orquestador (
    id bigserial PRIMARY KEY,
    tarea_id text NOT NULL,
    argumentos jsonb NOT NULL DEFAULT '[]'::jsonb,
    estado text NOT NULL CHECK (estado IN ('lista', 'esperando_autorizacion', 'autorizada', 'en_curso', 'completada', 'fallida', 'rechazada')),
    por_que text,
    creada_en timestamptz NOT NULL DEFAULT now(),
    autorizada_en timestamptz,
    autorizada_por text,
    reclamada_en timestamptz,
    reclamada_por text,
    terminada_en timestamptz,
    resultado text
  )`,
  `CREATE INDEX IF NOT EXISTS idx_solicitudes_estado_id
   ON solicitudes_orquestador (estado, id)`,
  `CREATE INDEX IF NOT EXISTS idx_solicitudes_tarea_creada
   ON solicitudes_orquestador (tarea_id, creada_en DESC)`,

  // La bitácora, con el mismo criterio append-only que el historial de
  // afiliación: corregir lo que pasó crea un asiento nuevo, nunca borra el
  // anterior. Aquí importa el doble, porque es la única prueba de qué se
  // ejecutó sin que hubiera nadie delante mirando.
  `CREATE TABLE IF NOT EXISTS bitacora_orquestador (
    id bigserial PRIMARY KEY,
    solicitud_id bigint,
    tarea_id text NOT NULL,
    evento text NOT NULL,
    detalle text,
    ejecucion_id text,
    fecha timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_bitacora_tarea_fecha
   ON bitacora_orquestador (tarea_id, fecha DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_bitacora_solicitud
   ON bitacora_orquestador (solicitud_id, fecha DESC)`,
  `CREATE OR REPLACE FUNCTION prohibir_modificar_bitacora_orquestador()
   RETURNS trigger AS $fn$
   BEGIN
     RAISE EXCEPTION 'bitacora_orquestador es append-only: % no permitido en esta tabla', TG_OP;
   END;
   $fn$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS bitacora_orquestador_solo_insertar ON bitacora_orquestador`,
  `CREATE TRIGGER bitacora_orquestador_solo_insertar
   BEFORE UPDATE OR DELETE ON bitacora_orquestador
   FOR EACH ROW EXECUTE FUNCTION prohibir_modificar_bitacora_orquestador()`,

  `CREATE OR REPLACE FUNCTION prohibir_modificar_historial()
   RETURNS trigger AS $fn$
   BEGIN
     RAISE EXCEPTION 'historial_cambios_afiliacion es append-only: % no permitido en esta tabla', TG_OP;
   END;
   $fn$ LANGUAGE plpgsql`,
  `DROP TRIGGER IF EXISTS historial_solo_insertar ON historial_cambios_afiliacion`,
  `CREATE TRIGGER historial_solo_insertar
   BEFORE UPDATE OR DELETE ON historial_cambios_afiliacion
   FOR EACH ROW EXECUTE FUNCTION prohibir_modificar_historial()`,
];
