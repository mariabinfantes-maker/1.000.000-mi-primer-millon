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
 * uno existente.
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
